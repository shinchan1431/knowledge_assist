import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X, FileText, Calendar, User, Tag, Layers, Download, Check } from 'lucide-react';
import { EnterpriseDocument } from '../types';

interface DocumentViewerModalProps {
  document: EnterpriseDocument | null;
  highlightChunkId?: string;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  highlightChunkId,
  onClose,
}) => {
  if (!document) return null;

  const downloadDoc = () => {
    const blob = new Blob([document.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-900/90">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold">
                  {document.department}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                  {document.category} • {document.version}
                </span>
                {document.isCustom && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                    Uploaded by Team
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {document.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadDoc}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors"
              title="Download Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {document.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Updated {document.lastUpdated}
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              {document.chunksCount} Chunks Indexed
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {document.tags.map((tag, tIdx) => (
              <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Document Content Scroll Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-slate-200">
          <div className="prose prose-invert prose-indigo max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-code:text-emerald-300 prose-headings:text-white prose-a:text-indigo-400">
            <ReactMarkdown>{document.content}</ReactMarkdown>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Enterprise RAG Vector DB ID: <code className="font-mono text-indigo-300">{document.id}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
