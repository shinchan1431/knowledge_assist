/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  BookOpen, 
  Upload, 
  ShieldCheck, 
  Layers, 
  MessageSquare, 
  Globe, 
  Bot, 
  RotateCcw,
  Search,
  ArrowRight,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ChatMessageItem } from './components/ChatMessageItem';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { QuickPromptChips } from './components/QuickPromptChips';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { KnowledgeExplorerModal } from './components/KnowledgeExplorerModal';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { 
  ChatMessage, 
  Department, 
  SupportedLanguage, 
  EnterpriseDocument, 
  AskResponse 
} from './types';
import { DEFAULT_DOCUMENTS, SUPPORTED_LANGUAGES } from './data/defaultKnowledge';

const INITIAL_GREETING: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content: `### 👋 Welcome to your Enterprise AI Knowledge Assistant!

I am your organization's intelligent RAG knowledge assistant. Instead of manually searching through hundreds of scattered documents, SOPs, Jira tickets, and Slack threads, you can ask me anything directly.

#### ⚡ What I can help you with:
- **🚀 DevOps & Deployments**: Step-by-step SOP execution, ArgoCD canary commands, rollback runbooks, and staging verification.
- **💼 HR & People Operations**: 2026 flexible PTO, parental leave schedules, $1,500 WFH stipends, and working abroad limits.
- **⚡ Engineering & Architecture**: Payments API v2 spec, JWT auth headers, idempotency keys, and Postmortem #409 root causes.
- **🔒 IT & Security Access**: AWS IAM roles, Teleport database read-only queries, and Cloudflare Warp VPN.
- **🎙️ Speech & Multilingual**: Ask via voice or in any language (English, Spanish, German, French, Japanese, Hindi, Chinese, Portuguese).
- **📄 Document Upload & OCR**: Ingest new SOPs or screenshot images with instant vector indexing.

*Select a quick prompt below or type your question!*`,
  timestamp: 'Just now',
  confidenceScore: 99,
  suggestedFollowUps: [
    'How do I deploy Project Phoenix to staging?',
    'What is the parental leave policy for 2026?',
    'What required headers does Payments API v2 need?',
  ],
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ent_chat_messages');
      return saved ? JSON.parse(saved) : [INITIAL_GREETING];
    } catch {
      return [INITIAL_GREETING];
    }
  });

  const [inputQuery, setInputQuery] = useState('');
  const [currentDepartment, setCurrentDepartment] = useState<Department>('All');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Enterprise Documents state
  const [documents, setDocuments] = useState<EnterpriseDocument[]>(DEFAULT_DOCUMENTS);
  const [selectedViewerDoc, setSelectedViewerDoc] = useState<EnterpriseDocument | null>(null);
  const [highlightChunkId, setHighlightChunkId] = useState<string | undefined>(undefined);

  // Modals state
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ent_bookmarked_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ent_chat_messages', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Save bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('ent_bookmarked_ids', JSON.stringify(bookmarkedIds));
    } catch (e) {}
  }, [bookmarkedIds]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch documents from server on load
  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        if (data.documents) {
          // Merge with content from default if needed
          setDocuments(data.documents);
        }
      }
    } catch (err) {
      console.warn('Failed to load live documents from server:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSendMessage = async (queryText?: string) => {
    const query = (queryText || inputQuery).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          department: currentDepartment,
          language: currentLanguage,
          conversationHistory: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: AskResponse = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations,
        confidenceScore: data.confidenceScore,
        isSop: data.isSop,
        sopSteps: data.sopSteps,
        suggestedFollowUps: data.suggestedFollowUps,
        language: data.language,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Ask error:', err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to retrieve verified knowledge:** ${err.message || 'An error occurred connecting to the RAG vector service.'}\n\nPlease try rephrasing your query or verify your server connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidenceScore: 50,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInputQuery(text);
    if (text.trim().length > 5) {
      handleSendMessage(text);
    }
  };

  const handleToggleBookmark = (msg: ChatMessage) => {
    if (bookmarkedIds.includes(msg.id)) {
      setBookmarkedIds((prev) => prev.filter((id) => id !== msg.id));
    } else {
      setBookmarkedIds((prev) => [...prev, msg.id]);
    }
  };

  const handleViewDocument = async (docId: string, chunkId?: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedViewerDoc(data.document);
        setHighlightChunkId(chunkId);
        return;
      }
    } catch (e) {}

    // Fallback to local
    const found = documents.find((d) => d.id === docId) || DEFAULT_DOCUMENTS.find((d) => d.id === docId);
    if (found) {
      setSelectedViewerDoc(found);
      setHighlightChunkId(chunkId);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const res = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (err) {
      console.error('Delete doc error:', err);
    }
  };

  const handleResetDocuments = async () => {
    try {
      const res = await fetch('/api/documents/reset', {
        method: 'POST',
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (err) {
      console.error('Reset docs error:', err);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_GREETING]);
    localStorage.removeItem('ent_chat_messages');
  };

  const bookmarkedMessages = messages.filter((m) => bookmarkedIds.includes(m.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Enterprise Navigation */}
      <Navbar
        currentDepartment={currentDepartment}
        onSelectDepartment={setCurrentDepartment}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExplorer={() => setIsExplorerOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        bookmarkedCount={bookmarkedIds.length}
        totalDocsCount={documents.length}
      />

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-2 sm:px-4 lg:px-6 relative">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto pb-44">
          
          {/* Active Department Filter Banner if not 'All' */}
          {currentDepartment !== 'All' && (
            <div className="my-3 mx-4 p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200 animate-in fade-in">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Filtering answers for department: <strong>{currentDepartment}</strong>
              </span>
              <button
                onClick={() => setCurrentDepartment('All')}
                className="text-[11px] underline text-indigo-300 hover:text-white"
              >
                Reset to All
              </button>
            </div>
          )}

          {/* Render Chat Messages */}
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              onAskFollowUp={(query) => handleSendMessage(query)}
              onViewDocument={handleViewDocument}
              onToggleBookmark={handleToggleBookmark}
              isBookmarked={bookmarkedIds.includes(msg.id)}
            />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-6 border-b border-slate-800/60 bg-slate-900/30 animate-in fade-in">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs ring-1 ring-white/20 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Synthesizing Answer</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                      Querying RAG Vector DB...
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full w-3/4 animate-pulse" />
                  <div className="h-3 bg-slate-800 rounded-full w-1/2 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Floating Bottom Input & Quick Queries Dock */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-4 px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Quick Prompt Suggestions when chat has 1 message */}
            {messages.length <= 2 && (
              <div className="mb-2">
                <QuickPromptChips
                  currentDepartment={currentDepartment}
                  onSelectPrompt={(prompt) => handleSendMessage(prompt)}
                />
              </div>
            )}

            {/* Input Form Container */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="bg-slate-900 border border-slate-700/80 focus-within:border-indigo-500/80 rounded-2xl p-2 shadow-2xl backdrop-blur-lg flex items-center gap-2 transition-all"
            >
              {/* Voice Visualizer Mic */}
              <VoiceVisualizer
                onTranscript={handleVoiceTranscript}
                currentLanguage={currentLanguage}
                isListening={isListening}
                setIsListening={setIsListening}
              />

              {/* Main Query Input */}
              <input
                ref={inputRef}
                type="text"
                id="main-knowledge-query-input"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={`Ask anything (e.g. "How do I deploy Phoenix to staging?", "What is the 2026 parental leave policy?")...`}
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none px-2 py-1.5"
                disabled={isLoading}
              />

              {/* Clear History Button */}
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Send Button */}
              <button
                type="submit"
                id="submit-query-btn"
                disabled={!inputQuery.trim() || isLoading}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center shrink-0"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-2">
              <span>Grounding across {documents.length} enterprise documents & SOPs</span>
              <span className="hidden sm:inline">Voice & Multilingual Enabled</span>
            </div>

          </div>
        </div>

      </main>

      {/* Modals & Drawers */}
      {selectedViewerDoc && (
        <DocumentViewerModal
          document={selectedViewerDoc}
          highlightChunkId={highlightChunkId}
          onClose={() => {
            setSelectedViewerDoc(null);
            setHighlightChunkId(undefined);
          }}
        />
      )}

      {isExplorerOpen && (
        <KnowledgeExplorerModal
          documents={documents}
          onClose={() => setIsExplorerOpen(false)}
          onViewDoc={(doc) => setSelectedViewerDoc(doc)}
          onDeleteDoc={handleDeleteDocument}
          onResetDocs={handleResetDocuments}
          onOpenUpload={() => {
            setIsExplorerOpen(false);
            setIsUploadOpen(true);
          }}
        />
      )}

      {isUploadOpen && (
        <DocumentUploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={(newDoc) => {
            fetchDocuments();
            // Add notification message in chat
            const notice: ChatMessage = {
              id: `msg-upload-${Date.now()}`,
              role: 'assistant',
              content: `✅ **Successfully indexed new enterprise document into RAG vector database!**\n\n📄 **Title**: ${newDoc.title}\n🏷️ **Department**: ${newDoc.department} • **Category**: ${newDoc.category}\n📊 **Extracted**: ${newDoc.totalWords} words\n\nYou can now ask questions grounded in this new document.`,
              timestamp: 'Just now',
              confidenceScore: 98,
            };
            setMessages((prev) => [...prev, notice]);
          }}
        />
      )}

      <BookmarksDrawer
        bookmarks={bookmarkedMessages}
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        onSelectBookmark={(msg) => {
          // Scroll to this message if possible or open modal
        }}
        onRemoveBookmark={(id) => {
          setBookmarkedIds((prev) => prev.filter((bId) => bId !== id));
        }}
        onClearAll={() => setBookmarkedIds([])}
      />

    </div>
  );
}
