import React from 'react';
import { 
  Bot, 
  Layers, 
  Globe, 
  Upload, 
  Search, 
  BookOpen, 
  Bookmark, 
  Sparkles,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Department, SupportedLanguage, LanguageOption } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/defaultKnowledge';

interface NavbarProps {
  currentDepartment: Department;
  onSelectDepartment: (dept: Department) => void;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onOpenUpload: () => void;
  onOpenExplorer: () => void;
  onOpenBookmarks: () => void;
  bookmarkedCount: number;
  totalDocsCount: number;
}

const DEPARTMENTS: Department[] = [
  'All',
  'DevOps & Infra',
  'Engineering',
  'HR & People',
  'IT & Security',
  'Product & Design',
];

export const Navbar: React.FC<NavbarProps> = ({
  currentDepartment,
  onSelectDepartment,
  currentLanguage,
  onSelectLanguage,
  onOpenUpload,
  onOpenExplorer,
  onOpenBookmarks,
  bookmarkedCount,
  totalDocsCount,
}) => {
  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <header id="main-navbar" className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Assistant Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold ring-1 ring-white/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">Enterprise Knowledge AI</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> RAG v3.4
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">Instant verified answers from SOPs, HR, DevOps & Specs</p>
            </div>
          </div>

          {/* Department Filter Selector */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            {DEPARTMENTS.map((dept) => {
              const active = currentDepartment === dept;
              return (
                <button
                  key={dept}
                  id={`dept-tab-${dept.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => onSelectDepartment(dept)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    active 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>

          {/* Action Tools: Multilingual, Upload, Explore, Bookmarks */}
          <div className="flex items-center gap-2">
            
            {/* Language Selector Dropdown */}
            <div className="relative group">
              <button 
                id="language-picker-btn"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                title="Change AI Language"
              >
                <span>{currentLangObj.flag}</span>
                <span className="hidden sm:inline">{currentLangObj.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <div className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                  Target Response Language
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    id={`lang-opt-${lang.code}`}
                    onClick={() => onSelectLanguage(lang.code)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                      currentLanguage === lang.code 
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold' 
                        : 'text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{lang.nativeLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Knowledge Base Explorer Button */}
            <button
              id="open-explorer-btn"
              onClick={onOpenExplorer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
              title="Browse Indexed Enterprise Documents"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Docs</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                {totalDocsCount}
              </span>
            </button>

            {/* Upload Document / OCR Ingest Button */}
            <button
              id="open-upload-btn"
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors"
              title="Upload SOP, PDF, or Jira/Slack Screenshot"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Doc / OCR</span>
            </button>

            {/* Bookmarks Drawer Trigger */}
            <button
              id="open-bookmarks-btn"
              onClick={onOpenBookmarks}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Saved Answers & Runbooks"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarkedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center">
                  {bookmarkedCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* Mobile Department Selector Bar */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/80">
          {DEPARTMENTS.map((dept) => {
            const active = currentDepartment === dept;
            return (
              <button
                key={dept}
                onClick={() => onSelectDepartment(dept)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  active 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
