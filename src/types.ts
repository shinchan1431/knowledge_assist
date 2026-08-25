export type Department = 
  | 'All'
  | 'DevOps & Infra'
  | 'HR & People'
  | 'Engineering'
  | 'Product & Design'
  | 'IT & Security'
  | 'Customer Support';

export type SupportedLanguage = 
  | 'en' // English
  | 'es' // Spanish
  | 'de' // German
  | 'fr' // French
  | 'ja' // Japanese
  | 'hi' // Hindi
  | 'zh' // Chinese
  | 'pt'; // Portuguese

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  docTitle: string;
  department: Department;
  section: string;
  content: string;
  page?: number;
  tags: string[];
  embedding?: number[];
}

export interface EnterpriseDocument {
  id: string;
  title: string;
  department: Department;
  category: 'SOP' | 'Policy' | 'API Spec' | 'Meeting Notes' | 'Jira Archive' | 'Slack Highlights' | 'Runbook';
  description: string;
  fileType: 'pdf' | 'doc' | 'md' | 'image' | 'slack' | 'jira';
  author: string;
  lastUpdated: string;
  version: string;
  chunksCount: number;
  totalWords: number;
  content: string;
  tags: string[];
  isCustom?: boolean;
}

export interface Citation {
  chunkId: string;
  docId: string;
  docTitle: string;
  department: Department;
  section: string;
  excerpt: string;
  page?: number;
  relevanceScore: number;
}

export interface SopStep {
  stepNumber: number;
  title: string;
  description: string;
  command?: string;
  environment?: string;
  warning?: string;
  done?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  confidenceScore?: number; // 0 to 100
  isSop?: boolean;
  sopSteps?: SopStep[];
  suggestedFollowUps?: string[];
  language?: SupportedLanguage;
  audioPlaying?: boolean;
  audioBase64?: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  matchedTerms: string[];
  highlights: string[];
}

export interface AskResponse {
  answer: string;
  citations: Citation[];
  confidenceScore: number;
  isSop: boolean;
  sopSteps?: SopStep[];
  suggestedFollowUps: string[];
  language: SupportedLanguage;
  ttsAudio?: string;
}
