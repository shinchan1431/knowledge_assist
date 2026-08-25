import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Copy, 
  Check, 
  Terminal, 
  AlertTriangle, 
  Play, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SopStep } from '../types';

interface SopRunnerProps {
  steps: SopStep[];
  title?: string;
}

export const SopRunner: React.FC<SopRunnerProps> = ({ steps, title = 'Interactive SOP Execution Runbook' }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const toggleStep = (stepNumber: number) => {
    const nextState = !completedSteps[stepNumber];
    const updated = { ...completedSteps, [stepNumber]: nextState };
    setCompletedSteps(updated);

    // If all steps completed, celebrate!
    const allDone = steps.every(s => updated[s.stepNumber]);
    if (allDone && nextState) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const copyCommand = (stepNumber: number, command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedStep(stepNumber);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const completedCount = steps.filter(s => completedSteps[s.stepNumber]).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const exportRunbookLog = () => {
    const log = `--- SOP EXECUTION LOG: ${title} ---
Generated: ${new Date().toISOString()}
Progress: ${completedCount}/${steps.length} steps completed (${progressPercent}%)

${steps.map(s => `[${completedSteps[s.stepNumber] ? 'COMPLETED' : 'PENDING'}] Step ${s.stepNumber}: ${s.title}
Environment: ${s.environment || 'N/A'}
Description: ${s.description}
Command: ${s.command || 'N/A'}
${s.warning ? `Warning: ${s.warning}` : ''}
----------------------------------------`).join('\n\n')}`;

    const blob = new Blob([log], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sop-execution-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-xl text-slate-100">
      
      {/* Header & Progress Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              {progressPercent === 100 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" /> All Steps Done
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400">Step-by-step verified execution checklist</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-indigo-300">{completedCount} / {steps.length}</span>
            <span className="text-[10px] text-slate-400 block">Completed</span>
          </div>
          
          <button
            onClick={exportRunbookLog}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1"
            title="Export Execution Log"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 my-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Cards List */}
      <div className="space-y-3 mt-3">
        {steps.map((step) => {
          const isDone = !!completedSteps[step.stepNumber];
          const isCopied = copiedStep === step.stepNumber;

          return (
            <div 
              key={step.stepNumber}
              className={`p-3.5 rounded-xl border transition-all ${
                isDone 
                  ? 'bg-slate-800/40 border-emerald-500/30 opacity-90' 
                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                
                {/* Step Toggle Checkbox Button */}
                <button
                  onClick={() => toggleStep(step.stepNumber)}
                  className={`mt-0.5 p-1 rounded-lg transition-colors ${
                    isDone 
                      ? 'text-emerald-400 hover:text-emerald-300' 
                      : 'text-slate-500 hover:text-indigo-400'
                  }`}
                  title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        Step {step.stepNumber}
                      </span>
                      <h5 className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                        {step.title}
                      </h5>
                    </div>

                    {step.environment && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                        {step.environment}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {step.description}
                  </p>

                  {/* Warning Notice if present */}
                  {step.warning && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>{step.warning}</span>
                    </div>
                  )}

                  {/* Executable Terminal Command Box */}
                  {step.command && (
                    <div className="relative group/cmd mt-2">
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-emerald-400 overflow-x-auto flex items-center justify-between gap-3">
                        <span className="select-all">{step.command}</span>
                        <button
                          onClick={() => copyCommand(step.stepNumber, step.command!)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-sans flex items-center gap-1 shrink-0 transition-colors"
                          title="Copy command to clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
