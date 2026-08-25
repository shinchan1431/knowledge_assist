import React from 'react';
import { Sparkles, Terminal, FileText, ShieldAlert, Cpu, HeartHandshake, KeyRound } from 'lucide-react';
import { Department } from '../types';

interface QuickPromptChipsProps {
  currentDepartment: Department;
  onSelectPrompt: (prompt: string) => void;
}

interface PromptPreset {
  text: string;
  dept: Department;
  icon: any;
  tag: string;
}

const PROMPT_PRESETS: PromptPreset[] = [
  {
    text: 'How do I deploy Project Phoenix to staging and production?',
    dept: 'DevOps & Infra',
    icon: Terminal,
    tag: 'SOP Execution',
  },
  {
    text: 'What is the 2026 parental leave policy and return schedule?',
    dept: 'HR & People',
    icon: HeartHandshake,
    tag: 'HR Policy',
  },
  {
    text: 'What required auth headers and rate limits apply to Payments API v2?',
    dept: 'Engineering',
    icon: Cpu,
    tag: 'API Spec',
  },
  {
    text: 'How do I request AWS IAM access and production database login via Teleport?',
    dept: 'IT & Security',
    icon: KeyRound,
    tag: 'Access Guide',
  },
  {
    text: 'What caused Incident #409 and what was the Redis stampede fix?',
    dept: 'Engineering',
    icon: ShieldAlert,
    tag: 'Postmortem',
  },
  {
    text: 'What is the annual home office and WFH equipment stipend for 2026?',
    dept: 'HR & People',
    icon: FileText,
    tag: 'Benefits',
  },
];

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({
  currentDepartment,
  onSelectPrompt,
}) => {
  const filtered = currentDepartment === 'All'
    ? PROMPT_PRESETS
    : PROMPT_PRESETS.filter(p => p.dept === currentDepartment);

  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Frequently Asked Employee Queries</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              id={`quick-prompt-${idx}`}
              onClick={() => onSelectPrompt(item.text)}
              className="text-left p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 text-slate-200 transition-all hover:shadow-md group flex items-start gap-2.5"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-indigo-300">
                    {item.tag}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-700/60 text-slate-400">
                    {item.dept}
                  </span>
                </div>
                <p className="text-xs text-slate-300 group-hover:text-white font-medium line-clamp-2 leading-relaxed">
                  {item.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
