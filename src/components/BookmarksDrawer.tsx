import React from 'react';
import { X, Bookmark, Trash2, ExternalLink, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { ChatMessage } from '../types';

interface BookmarksDrawerProps {
  bookmarks: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
  onSelectBookmark: (msg: ChatMessage) => void;
  onRemoveBookmark: (id: string) => void;
  onClearAll: () => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  bookmarks,
  isOpen,
  onClose,
  onSelectBookmark,
  onRemoveBookmark,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100 animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Bookmarked Answers</span>
                <span className="text-xs px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                  {bookmarks.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Quick reference for SOPs and verified policies</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {bookmarks.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bookmark className="w-10 h-10 mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">No bookmarked answers yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Click the bookmark icon on any AI answer or SOP runbook to save it here for fast retrieval.
              </p>
            </div>
          ) : (
            bookmarks.map((msg) => (
              <div 
                key={msg.id}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    <button
                      onClick={() => onRemoveBookmark(msg.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 font-medium line-clamp-3 leading-relaxed mb-2.5">
                    {msg.content.slice(0, 180)}...
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <span className="text-[10px] text-indigo-400 font-mono">
                    {msg.citations?.length || 0} Citations
                  </span>
                  <button
                    onClick={() => {
                      onSelectBookmark(msg);
                      onClose();
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>View in Chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {bookmarks.length > 0 && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={onClearAll}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear All Bookmarks
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
