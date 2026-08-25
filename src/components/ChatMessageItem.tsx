import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  Volume2, 
  VolumeX, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Share2, 
  Terminal,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { ChatMessage, Citation, SopStep } from '../types';
import { SopRunner } from './SopRunner';

interface ChatMessageItemProps {
  message: ChatMessage;
  onAskFollowUp: (query: string) => void;
  onViewDocument: (docId: string, chunkId?: string) => void;
  onToggleBookmark: (message: ChatMessage) => void;
  isBookmarked: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onAskFollowUp,
  onViewDocument,
  onToggleBookmark,
  isBookmarked,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isAssistant = message.role === 'assistant';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for natural speech
    const cleanText = message.content
      .replace(/[#*`_\[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .slice(0, 800);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const exportAsFile = () => {
    const blob = new Blob([message.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-answer-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`py-6 border-b border-slate-800/80 transition-all ${isAssistant ? 'bg-slate-900/40' : 'bg-transparent'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Author Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md ${
              isAssistant 
                ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white ring-1 ring-white/20' 
                : 'bg-slate-700 text-slate-200'
            }`}>
              {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {isAssistant ? 'Enterprise Knowledge AI' : 'You (Employee)'}
                </span>
                {isAssistant && message.confidenceScore && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    message.confidenceScore >= 90 
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    <ShieldCheck className="w-3 h-3" /> {message.confidenceScore}% Confidence
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500">{message.timestamp}</span>
            </div>
          </div>

          {/* Quick Actions (Copy, TTS, Bookmark, Download) */}
          {isAssistant && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleReadAloud}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  isPlayingAudio 
                    ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isPlayingAudio ? 'Stop Voice Narration' : 'Read Answer Aloud (Text to Speech)'}
              >
                {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={copyToClipboard}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                title="Copy markdown text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => onToggleBookmark(message)}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  isBookmarked 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Answer'}
              >
                {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={exportAsFile}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                title="Export as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="pl-11 pr-2 text-sm leading-relaxed text-slate-200">
          <div className="prose prose-invert prose-indigo max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-code:text-emerald-300 prose-headings:text-white prose-a:text-indigo-400">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Interactive SOP Runner if response is a SOP guide */}
          {message.isSop && message.sopSteps && message.sopSteps.length > 0 && (
            <SopRunner steps={message.sopSteps} />
          )}

          {/* Grounded Source Citations */}
          {isAssistant && message.citations && message.citations.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <button
                  onClick={() => setShowCitations(!showCitations)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Grounding Sources & Citations ({message.citations.length})</span>
                  {showCitations ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                </button>
                <span className="text-[10px] text-slate-500 font-mono">Semantic RAG verification</span>
              </div>

              {showCitations && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {message.citations.map((cite, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/40 text-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold truncate max-w-[130px]">
                            {cite.department}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-medium">
                            {cite.relevanceScore}% match
                          </span>
                        </div>
                        <h6 className="text-xs font-bold text-white line-clamp-1 mb-1">
                          {cite.docTitle}
                        </h6>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight italic bg-slate-900/60 p-1.5 rounded border border-slate-800">
                          "{cite.excerpt}"
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          § {cite.section}
                        </span>
                        <button
                          onClick={() => onViewDocument(cite.docId, cite.chunkId)}
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <span>View Doc</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggested Follow-Up Questions */}
          {isAssistant && message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Suggested Follow-Ups</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.suggestedFollowUps.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => onAskFollowUp(prompt)}
                    className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-indigo-300 transition-colors"
                  >
                    → {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
