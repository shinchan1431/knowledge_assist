import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  FileCheck, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Loader2,
  Tag,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Department } from '../types';

interface DocumentUploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newDoc: any) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  onClose,
  onUploadSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<Department>('Engineering');
  const [category, setCategory] = useState<string>('SOP');
  const [textContent, setTextContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    const reader = new FileReader();
    // If text/markdown/csv, read as text
    if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      reader.onload = (event) => {
        setTextContent(event.target?.result as string || '');
      };
      reader.readAsText(file);
    } else {
      // PDF or Image for multimodal OCR
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const base64Data = result.split(',')[1];
          setFileBase64(base64Data);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError('Please provide a document title.');
      return;
    }

    if (activeTab === 'text' && !textContent.trim()) {
      setUploadError('Please enter document content or markdown.');
      return;
    }

    if (activeTab === 'file' && !selectedFile && !textContent.trim()) {
      setUploadError('Please select a file or enter document text.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    try {
      const payload: any = {
        title: title.trim(),
        department,
        category,
        content: textContent,
        tags: tags.length > 0 ? tags : ['custom', department.toLowerCase()],
      };

      if (fileBase64 && selectedFile) {
        payload.fileBase64 = fileBase64;
        payload.mimeType = selectedFile.type || 'application/pdf';
        payload.filename = selectedFile.name;
      }

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      onUploadSuccess(data.document);
      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'An error occurred during document parsing and indexing.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Ingest Enterprise Document</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gemini OCR
                </span>
              </h3>
              <p className="text-xs text-slate-400">Add SOPs, HR Policies, PDFs, or Jira/Slack screenshots to the RAG vector base</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-5 pt-3 bg-slate-950/50">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'file'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Upload File (PDF, Image, Markdown, TXT)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'text'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Raw Text / Markdown Editor</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {uploadError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Title & Department Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SOP-OPS-102: Postgres Backup & Restore Runbook"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="DevOps & Infra">DevOps & Infra</option>
                <option value="Engineering">Engineering</option>
                <option value="HR & People">HR & People</option>
                <option value="IT & Security">IT & Security</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Customer Support">Customer Support</option>
              </select>
            </div>
          </div>

          {/* Category & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="SOP">SOP (Standard Operating Procedure)</option>
                <option value="Policy">Policy / Employee Handbook</option>
                <option value="API Spec">API Spec & Architecture</option>
                <option value="Runbook">Incident Runbook</option>
                <option value="Meeting Notes">Meeting Notes</option>
                <option value="Jira Archive">Jira Issue Archive</option>
                <option value="Slack Highlights">Slack Thread Highlights</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Search Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. backup, postgres, disaster-recovery, s3"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Tab 1: File Dropzone */}
          {activeTab === 'file' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select File for Vector Ingestion & OCR
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/70 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.json"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Custom format'}
                      </p>
                    </div>
                    <span className="text-[11px] text-indigo-400 underline">Click to change file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        Drag and drop your file here, or click to browse
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports PDF documents, screenshots of Jira/Slack (OCR), Markdown, and TXT files
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Raw Text / Markdown Editor */}
          {activeTab === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Content / Markdown *
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={8}
                placeholder={`# SOP-DEV-101: Title\n\n## 1. Overview\nDescribe procedure...\n\n## 2. Execution Steps\n\`\`\`bash\nkubectl get pods\n\`\`\``}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                required={activeTab === 'text'}
              />
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Files are indexed into vector chunks with instant semantic recall
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing & Indexing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Index into Knowledge Base</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
