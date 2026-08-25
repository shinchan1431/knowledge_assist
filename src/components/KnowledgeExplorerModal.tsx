import React, { useState } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  FileText, 
  Trash2, 
  RotateCcw, 
  Layers, 
  Calendar, 
  User, 
  ExternalLink,
  Plus,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { EnterpriseDocument, Department } from '../types';

interface KnowledgeExplorerModalProps {
  documents: EnterpriseDocument[];
  onClose: () => void;
  onViewDoc: (doc: EnterpriseDocument) => void;
  onDeleteDoc: (id: string) => void;
  onResetDocs: () => void;
  onOpenUpload: () => void;
}

export const KnowledgeExplorerModal: React.FC<KnowledgeExplorerModalProps> = ({
  documents,
  onClose,
  onViewDoc,
  onDeleteDoc,
  onResetDocs,
  onOpenUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredDocs = documents.filter((doc) => {
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesCat && matchesSearch;
  });

  const categories = ['All', 'SOP', 'Policy', 'API Spec', 'Runbook', 'Meeting Notes', 'Jira Archive', 'Slack Highlights'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Enterprise Knowledge Store</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                  {documents.length} Documents Indexed
                </span>
              </h3>
              <p className="text-xs text-slate-400">Searchable vector corpus feeding the RAG generation pipeline</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenUpload();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title, tags, keywords (e.g. Phoenix, ArgoCD, parental leave, Stripe)..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as Department)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Departments</option>
              <option value="DevOps & Infra">DevOps & Infra</option>
              <option value="Engineering">Engineering</option>
              <option value="HR & People">HR & People</option>
              <option value="IT & Security">IT & Security</option>
              <option value="Product & Design">Product & Design</option>
            </select>
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Type:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Document Cards Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No matching documents found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or department filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-slate-850 bg-slate-800/50 border border-slate-700/80 hover:border-indigo-500/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                        {doc.department}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                          {doc.category}
                        </span>
                        {doc.isCustom && (
                          <button
                            onClick={() => onDeleteDoc(doc.id)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete custom uploaded document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
                      {doc.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {doc.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2.5 pt-2 border-t border-slate-700/50">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {doc.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {doc.chunksCount} chunks
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 overflow-hidden">
                        {doc.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 truncate">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          onViewDoc(doc);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={onResetDocs}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            title="Reset Knowledge Base to original default enterprise documents"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard Enterprise Knowledge</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
