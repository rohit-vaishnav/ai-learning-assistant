import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { explainTopic } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, Sparkles, FileText, Copy, Info } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import CardLoader from '../components/CardLoader';

const ExplainPage = () => {
  const { 
    selectedFile, 
    showToast, 
    explainTopicVal,
    setExplainTopicVal,
    explainMode,
    setExplainMode,
    explainUseContext,
    setExplainUseContext,
    explainOutput,
    setExplainOutput
  } = useApp();

  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const handleExplain = async () => {
    if (!explainTopicVal.trim()) {
      showToast("Please enter a topic or concept to explain.", "error");
      return;
    }
    if (explainUseContext && !selectedFile) {
      showToast("No active document selected for context.", "error");
      return;
    }

    setIsLocalLoading(true);
    setExplainOutput("");
    try {
      const filename = (explainUseContext && selectedFile) ? selectedFile.filename : "";
      const res = await explainTopic(explainTopicVal.trim(), explainMode, filename);
      setExplainOutput(res.data.explanation);
      showToast("Explanation generated successfully!", "success");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to generate explanation. Verify backend models.";
      showToast(detail, "error");
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleClear = () => {
    setExplainOutput("");
    setExplainTopicVal("");
  };

  const handleCopy = () => {
    if (!explainOutput) return;
    navigator.clipboard.writeText(explainOutput);
    showToast("Explanation copied to clipboard!", "success");
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)] animate-fade-in-up">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold mb-4 tracking-wide uppercase border border-emerald-500/20">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Concept Simplifier</span>
        </div>
        <h1 className="font-display font-bold text-3xl mb-2 flex items-center justify-center gap-2">
          <span>Explain Topics</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          Simplify difficult vocabulary, scientific formulas, or code algorithms into readable formats tailored to your level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Settings options panel */}
        <div className="md:col-span-5">
          <GlassCard className="space-y-6 border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-650 dark:text-slate-450">Settings</h3>

            {/* Target concept topic input */}
            <div>
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400 block mb-2">Concept / Term</label>
              <div className="relative">
                <input
                  type="text"
                  value={explainTopicVal}
                  onChange={(e) => setExplainTopicVal(e.target.value)}
                  disabled={isLocalLoading}
                  placeholder="e.g. Backpropagation, RAG, etc."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-3 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-450 disabled:opacity-55 font-medium transition-all focus:border-emerald-500/40"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Sparkles className="w-4 h-4 text-emerald-550" />
                </div>
              </div>
            </div>

            {/* Mode dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400 block mb-2">Audience Level</label>
              <div className="relative">
                <select
                  value={explainMode}
                  onChange={(e) => setExplainMode(e.target.value)}
                  disabled={isLocalLoading}
                  className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-3 text-sm outline-none cursor-pointer text-slate-900 dark:text-white disabled:opacity-55 font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  <option value="beginner" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Beginner (Uses Analogy)</option>
                  <option value="student" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Student (Clear Definitions)</option>
                  <option value="technical" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Technical (Deep Breakdown)</option>
                </select>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <BrainCircuit className="w-4 h-4 text-emerald-550" />
                </div>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Document reference toggle */}
            {selectedFile && (
              <div className="flex items-center justify-between p-3.5 bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex gap-2 items-center">
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold">Restrict to Document</span>
                </div>
                <input
                  type="checkbox"
                  checked={explainUseContext}
                  disabled={isLocalLoading}
                  onChange={(e) => setExplainUseContext(e.target.checked)}
                  className="w-4 h-4 text-emerald-550 cursor-pointer disabled:opacity-50"
                />
              </div>
            )}

            <button
              onClick={handleExplain}
              disabled={isLocalLoading || (explainUseContext && !selectedFile)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Simplify Concept</span>
            </button>
          </GlassCard>
        </div>

        {/* Output blocks panel */}
        <div className="md:col-span-7">
          <GlassCard className="min-h-[360px] flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-slate-800 p-6">
            {isLocalLoading && <CardLoader message="Searching Context & Explaining..." />}
            
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 shrink-0">
                <h3 className="font-display font-semibold text-xs text-slate-500 uppercase tracking-wider">Explanation</h3>
                {(explainOutput || explainTopicVal) && (
                  <div className="flex items-center gap-1.5">
                    {explainOutput && (
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                        title="Copy explanation"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={handleClear}
                      disabled={isLocalLoading}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable text container to prevent cutoff */}
              <div className="flex-1 overflow-y-auto pr-1 my-2 min-h-[240px] max-h-[360px]">
                {explainOutput ? (
                  <div className="prose dark:prose-invert animate-fade-in leading-relaxed text-sm">
                    <ReactMarkdown>{explainOutput}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/10 flex items-center justify-center mb-4 shadow-sm">
                      <BrainCircuit className="w-7 h-7 text-emerald-500 stroke-1" />
                    </div>
                    <h4 className="font-display font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">Awaiting Topic Concept</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[220px] leading-relaxed">
                      Enter a term or vocabulary query on the left settings panel to generate descriptions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {explainUseContext && selectedFile && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex gap-2 items-start text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <p>Explanation leverages semantic FAISS index queries targeting `{selectedFile.filename}` before generating descriptions.</p>
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default ExplainPage;
