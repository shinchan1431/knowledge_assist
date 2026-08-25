import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { DEFAULT_DOCUMENTS } from "./src/data/defaultKnowledge.ts";
import { EnterpriseDocument, DocumentChunk, Citation, SopStep, Department, SupportedLanguage } from "./src/types.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// In-Memory Enterprise Vector & Document Store
let documentsStore: EnterpriseDocument[] = [...DEFAULT_DOCUMENTS];
let chunksStore: DocumentChunk[] = [];

// Helper: Split text into semantic chunks
function chunkDocument(doc: EnterpriseDocument): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const lines = doc.content.split("\n");
  let currentSection = doc.title;
  let currentParagraphs: string[] = [];
  let chunkIdx = 1;

  for (const line of lines) {
    if (line.startsWith("# ") || line.startsWith("## ") || line.startsWith("### ")) {
      if (currentParagraphs.join("\n").trim().length > 80) {
        chunks.push({
          id: `${doc.id}-chk-${chunkIdx++}`,
          docId: doc.id,
          docTitle: doc.title,
          department: doc.department,
          section: currentSection,
          content: currentParagraphs.join("\n").trim(),
          tags: doc.tags,
        });
        currentParagraphs = [];
      }
      currentSection = line.replace(/^#+\s*/, "").trim();
    } else {
      currentParagraphs.push(line);
    }
  }

  if (currentParagraphs.join("\n").trim().length > 0) {
    chunks.push({
      id: `${doc.id}-chk-${chunkIdx++}`,
      docId: doc.id,
      docTitle: doc.title,
      department: doc.department,
      section: currentSection,
      content: currentParagraphs.join("\n").trim(),
      tags: doc.tags,
    });
  }

  return chunks;
}

// Rebuild in-memory vector chunks store
function rebuildChunks() {
  chunksStore = [];
  for (const doc of documentsStore) {
    const docChunks = chunkDocument(doc);
    doc.chunksCount = docChunks.length;
    chunksStore.push(...docChunks);
  }
}

// Initialize on startup
rebuildChunks();

// Simple BM25 & Semantic Hybrid Token Scoring for instant RAG Retrieval
function calculateRelevanceScore(query: string, text: string, tags: string[], section: string): number {
  const queryTerms = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) return 0.1;

  const textLower = text.toLowerCase();
  const sectionLower = section.toLowerCase();
  let score = 0;
  let termMatches = 0;

  for (const term of queryTerms) {
    const termInText = (textLower.match(new RegExp(`\\b${term}`, "g")) || []).length;
    const termInTags = tags.some(tag => tag.toLowerCase().includes(term));
    const termInSection = sectionLower.includes(term);

    if (termInText > 0 || termInTags || termInSection) {
      termMatches++;
      score += Math.min(termInText * 0.15, 0.6);
      if (termInSection) score += 0.35;
      if (termInTags) score += 0.3;
    }
  }

  const coverage = termMatches / queryTerms.length;
  score = score * 0.4 + coverage * 0.6;
  return Math.min(Math.max(score, 0), 1);
}

function retrieveRelevantChunks(query: string, department?: Department, topK: number = 5): { chunk: DocumentChunk; score: number }[] {
  const filteredChunks = department && department !== "All"
    ? chunksStore.filter(c => c.department === department)
    : chunksStore;

  const scored = filteredChunks.map(chunk => ({
    chunk,
    score: calculateRelevanceScore(query, chunk.content, chunk.tags, chunk.section),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    documentsCount: documentsStore.length,
    chunksCount: chunksStore.length,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// List all indexed documents
app.get("/api/documents", (_req: Request, res: Response) => {
  const summary = documentsStore.map(doc => ({
    id: doc.id,
    title: doc.title,
    department: doc.department,
    category: doc.category,
    description: doc.description,
    fileType: doc.fileType,
    author: doc.author,
    lastUpdated: doc.lastUpdated,
    version: doc.version,
    chunksCount: doc.chunksCount,
    totalWords: doc.totalWords,
    tags: doc.tags,
    isCustom: !!doc.isCustom,
  }));
  res.json({ documents: summary });
});

// Get single document full content
app.get("/api/documents/:id", (req: Request, res: Response) => {
  const doc = documentsStore.find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }
  const chunks = chunksStore.filter(c => c.docId === doc.id);
  res.json({ document: doc, chunks });
});

// Delete a custom document
app.post("/api/documents/delete", (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing document id" });

  documentsStore = documentsStore.filter(d => d.id !== id);
  rebuildChunks();
  res.json({ success: true, remaining: documentsStore.length });
});

// Reset Knowledge Base to default
app.post("/api/documents/reset", (_req: Request, res: Response) => {
  documentsStore = [...DEFAULT_DOCUMENTS];
  rebuildChunks();
  res.json({ success: true, count: documentsStore.length });
});

// Document Upload & OCR Ingestion endpoint
app.post("/api/documents/upload", async (req: Request, res: Response) => {
  try {
    const { title, department, category, content, fileBase64, mimeType, filename, tags } = req.body;
    let extractedContent = content || "";
    const client = getAiClient();

    // If PDF or Image is provided, use Gemini 3.7 Flash for multimodal parsing & OCR
    if (fileBase64 && mimeType && client) {
      try {
        const ocrResponse = await client.models.generateContent({
          model: "gemini-3.7-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  data: fileBase64,
                  mimeType: mimeType,
                },
              },
              {
                text: "Extract all text, procedures, tables, code commands, and structural sections from this enterprise document. Format the output cleanly in standard Markdown with headers (##, ###) and preservation of technical details.",
              },
            ],
          },
        });
        if (ocrResponse.text) {
          extractedContent = ocrResponse.text;
        }
      } catch (ocrErr) {
        console.error("Gemini OCR parsing error:", ocrErr);
        if (!extractedContent) {
          extractedContent = `[Parsed from ${filename || 'Uploaded Document'}]\n\n` + (content || "Document parsed without OCR fallback.");
        }
      }
    }

    if (!extractedContent.trim()) {
      return res.status(400).json({ error: "No text content could be extracted from document." });
    }

    const docId = `doc-custom-${Date.now()}`;
    const wordCount = extractedContent.split(/\s+/).length;
    let detectedType: 'pdf' | 'doc' | 'md' | 'image' | 'slack' | 'jira' = 'md';
    if (mimeType?.includes('pdf')) detectedType = 'pdf';
    else if (mimeType?.includes('image')) detectedType = 'image';
    else if (mimeType?.includes('doc') || filename?.endsWith('.doc') || filename?.endsWith('.docx')) detectedType = 'doc';

    const newDoc: EnterpriseDocument = {
      id: docId,
      title: title || filename || `Document ${new Date().toLocaleDateString()}`,
      department: department || 'Engineering',
      category: category || 'SOP',
      description: `Uploaded ${new Date().toLocaleDateString()} - ${wordCount} words extracted.`,
      fileType: detectedType,
      author: 'Uploaded by Employee',
      lastUpdated: new Date().toISOString().split('T')[0],
      version: 'v1.0',
      chunksCount: 0,
      totalWords: wordCount,
      content: extractedContent,
      tags: Array.isArray(tags) ? tags : ['custom', 'uploaded'],
      isCustom: true,
    };

    documentsStore.unshift(newDoc);
    rebuildChunks();

    res.json({
      success: true,
      document: newDoc,
      chunksCreated: chunksStore.filter(c => c.docId === docId).length,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Failed to process and index document" });
  }
});

// Semantic & Keyword Search API
app.post("/api/search", (req: Request, res: Response) => {
  const { query, department, topK = 6 } = req.body;
  if (!query) return res.json({ results: [] });

  const retrieved = retrieveRelevantChunks(query, department, Number(topK));
  const queryTerms = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t: string) => t.length > 2);

  const results = retrieved.map(({ chunk, score }) => {
    // Generate snippet highlight
    const lines = chunk.content.split("\n");
    let bestLine = lines[0] || "";
    for (const line of lines) {
      if (queryTerms.some((t: string) => line.toLowerCase().includes(t))) {
        bestLine = line;
        break;
      }
    }

    return {
      chunk,
      score: Math.round(score * 100),
      matchedTerms: queryTerms.filter((t: string) => chunk.content.toLowerCase().includes(t)),
      highlights: [bestLine],
    };
  });

  res.json({ results });
});

// Q&A / RAG Ask Endpoint
app.post("/api/ask", async (req: Request, res: Response) => {
  try {
    const { query, department = 'All', language = 'en', conversationHistory = [] } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter" });
    }

    // Retrieve top 5 most relevant context chunks
    const retrieved = retrieveRelevantChunks(query, department, 5);
    const citations: Citation[] = retrieved.map(({ chunk, score }) => {
      // Extract a crisp 2-3 line excerpt
      const lines = chunk.content.split("\n").filter(l => l.trim().length > 0 && !l.startsWith("#"));
      const excerpt = lines.slice(0, 3).join(" ").slice(0, 240) + "...";
      return {
        chunkId: chunk.id,
        docId: chunk.docId,
        docTitle: chunk.docTitle,
        department: chunk.department,
        section: chunk.section,
        excerpt,
        relevanceScore: Math.round(score * 100),
      };
    });

    const contextText = retrieved.map(({ chunk }, index) => {
      return `--- SOURCE [${index + 1}]: "${chunk.docTitle}" | Section: "${chunk.section}" | Dept: ${chunk.department} ---\n${chunk.content}\n`;
    }).join("\n\n");

    const client = getAiClient();

    let answerText = "";
    let isSop = false;
    let sopSteps: SopStep[] = [];
    let suggestedFollowUps: string[] = [];
    let confidenceScore = citations.length > 0 && citations[0].relevanceScore > 40 ? Math.min(citations[0].relevanceScore + 25, 98) : 75;

    if (client) {
      const languageInstructions: Record<string, string> = {
        en: "Answer in English.",
        es: "Answer entirely in Spanish (Español).",
        de: "Answer entirely in German (Deutsch).",
        fr: "Answer entirely in French (Français).",
        ja: "Answer entirely in Japanese (日本語).",
        hi: "Answer entirely in Hindi (हिन्दी).",
        zh: "Answer entirely in Simplified Chinese (中文).",
        pt: "Answer entirely in Portuguese (Português).",
      };

      const langInstruction = languageInstructions[language] || `Answer in language: ${language}`;

      const systemPrompt = `You are the Enterprise AI Employee Knowledge Assistant for a high-growth tech organization.
Your job is to answer employee questions directly, accurately, and authoritatively using ONLY the provided verified company documentation and SOPs.

RULES:
1. ${langInstruction}
2. Ground all answers strictly in the provided sources. Cite the specific Document Title and Section when stating facts, steps, policies, or numbers.
3. If the query asks "how to deploy", "how to run", "how to configure", or is an execution procedure / SOP, format it with clear numbered steps and executable terminal commands in markdown code blocks. Also flag isSop=true and structure the steps into the sopSteps JSON array.
4. If there are caveats, warnings, rollback steps, or SLA timelines, highlight them prominently with bold or blockquotes.
5. Provide 3 highly relevant follow-up questions in the 'suggestedFollowUps' array that an engineer or employee would logically ask next.
6. Provide a realistic confidenceScore between 60 and 99 based on how completely the provided documentation answers the user's specific question.
7. Be direct, professional, friendly, and structured. No fluff or conversational filler.`;

      const userPrompt = `USER QUESTION: ${query}

VERIFIED KNOWLEDGE BASE SOURCES:
${contextText}

Please synthesize the authoritative answer and output ONLY valid JSON matching this schema:
{
  "answer": "Comprehensive, beautifully formatted markdown answer with exact citations, headers, lists, code blocks, and policy details.",
  "confidenceScore": 95,
  "isSop": true or false,
  "sopSteps": [
    {
      "stepNumber": 1,
      "title": "Short step title",
      "description": "Clear step description",
      "command": "optional bash or CLI command to copy",
      "environment": "e.g. Staging / Production / Terminal",
      "warning": "optional cautionary notice"
    }
  ],
  "suggestedFollowUps": [
    "Follow-up question 1",
    "Follow-up question 2",
    "Follow-up question 3"
  ]
}`;

      try {
        const response = await client.models.generateContent({
          model: "gemini-3.7-flash",
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                answer: { type: Type.STRING, description: "The complete markdown answer." },
                confidenceScore: { type: Type.NUMBER, description: "Confidence score 0-100." },
                isSop: { type: Type.BOOLEAN, description: "Whether this is an executable SOP guide." },
                sopSteps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      stepNumber: { type: Type.NUMBER },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      command: { type: Type.STRING },
                      environment: { type: Type.STRING },
                      warning: { type: Type.STRING },
                    },
                    required: ["stepNumber", "title", "description"],
                  },
                },
                suggestedFollowUps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["answer", "confidenceScore", "isSop", "suggestedFollowUps"],
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        answerText = parsed.answer || "";
        confidenceScore = parsed.confidenceScore || confidenceScore;
        isSop = !!parsed.isSop;
        sopSteps = parsed.sopSteps || [];
        suggestedFollowUps = parsed.suggestedFollowUps || [];
      } catch (geminiError: any) {
        console.error("Gemini Generate Error:", geminiError);
        // Fallback grounded template synthesis
        answerText = `Based on our enterprise documents (${citations.map(c => c.docTitle).join(", ")}):\n\n` +
          retrieved.map(r => `### From ${r.chunk.docTitle} - ${r.chunk.section}\n${r.chunk.content}`).join("\n\n");
        suggestedFollowUps = [
          "What is the rollback procedure if errors spike?",
          "Who is the on-call contact for this service?",
          "How do I request elevated access for this workflow?",
        ];
      }
    } else {
      // Fallback if Gemini key is not yet set
      answerText = `### Direct Answer from Enterprise Knowledge Base\n\n` +
        retrieved.map(r => `#### 📄 ${r.chunk.docTitle} (${r.chunk.section})\n${r.chunk.content}`).join("\n\n---\n\n");
      suggestedFollowUps = [
        "How do I verify staging metrics?",
        "What is the emergency escalation SLA?",
        "Where can I find additional API examples?",
      ];
    }

    res.json({
      answer: answerText,
      citations,
      confidenceScore,
      isSop,
      sopSteps,
      suggestedFollowUps,
      language,
    });
  } catch (err: any) {
    console.error("Ask endpoint error:", err);
    res.status(500).json({ error: err.message || "Failed to generate answer" });
  }
});

// Text-to-Speech API for Voice responses
app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const { text, voice = "Kore" } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    const client = getAiClient();
    if (!client) {
      return res.json({ available: false, fallback: true });
    }

    // Clean text for speech (remove markdown symbols)
    const cleanText = text.replace(/[*#`_\[\]]/g, "").slice(0, 350);

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say clearly and professionally: ${cleanText}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Kore" },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64) {
        return res.json({ available: true, audioBase64 });
      }
    } catch (ttsErr) {
      console.warn("Gemini TTS fallback to browser Web Speech:", ttsErr);
    }

    res.json({ available: false, fallback: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Knowledge Assistant server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
