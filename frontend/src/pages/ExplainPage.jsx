import React from 'react';
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
    setLoading, 
    loading,
    explainTopicVal,
    setExplainTopicVal,
    explainMode,
    setExplainMode,
    explainUseContext,
    setExplainUseContext,
    explainOutput,
    setExplainOutput
  } = useApp();

  const isLocalLoading = loading === "Searching Context & Explaining...";

  const handleExplain = async () => {
    if (!explainTopicVal.trim()) {
      showToast("Please enter a topic or concept to explain.", "error");
      return;
    }
    if (explainUseContext && !selectedFile) {
      showToast("No active document selected for context.", "error");
      return;
    }

    setLoading("Searching Context & Explaining...");
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
      setLoading(false);
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
    <div className="px-6 py-10 max-w-4xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)]">
      <div className="text-center mb-10">
        <h1 className="font-display font-bold text-3xl mb-2 flex items-center justify-center gap-2">
          <BrainCircuit className="w-7 h-7 text-emerald-500" />
          <span>Explain Topics</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          Simplify difficult vocabulary, scientific formulas, or code algorithms into readable formats tailored to your level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Settings options panel */}
        <div>
          <GlassCard className="space-y-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500">Settings</h3>

            {/* Target concept topic input */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2">Concept / Term</label>
              <input
                type="text"
                value={explainTopicVal}
                onChange={(e) => setExplainTopicVal(e.target.value)}
                disabled={!!loading}
                placeholder="e.g. Backpropagation, RAG, etc."
                className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none text-slate-705 dark:text-slate-300 disabled:opacity-55"
              />
            </div>

            {/* Mode dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2">Audience Level</label>
              <select
                value={explainMode}
                onChange={(e) => setExplainMode(e.target.value)}
                disabled={!!loading}
                className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none cursor-pointer text-slate-705 dark:text-slate-300 disabled:opacity-55"
              >
                <option value="beginner" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Beginner (Uses Analogy)</option>
                <option value="student" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Student (Clear Definitions)</option>
                <option value="technical" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Technical (Deep Breakdown)</option>
              </select>
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
                  disabled={!!loading}
                  onChange={(e) => setExplainUseContext(e.target.checked)}
                  className="w-4 h-4 text-violet-500 cursor-pointer disabled:opacity-50"
                />
              </div>
            )}

            <button
              onClick={handleExplain}
              disabled={!!loading || (explainUseContext && !selectedFile)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Simplify Concept</span>
            </button>
          </GlassCard>
        </div>

        {/* Output blocks panel */}
        <div className="md:col-span-2">
          <GlassCard className="min-h-[360px] flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-slate-800">
            {isLocalLoading && <CardLoader message="Searching Context & Explaining..." />}
            
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="font-display font-semibold text-sm text-slate-500 uppercase tracking-wider">Explanation</h3>
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
                      disabled={!!loading}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {explainOutput ? (
                <div className="prose dark:prose-invert animate-fade-in">
                  <ReactMarkdown>{explainOutput}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
                  <BrainCircuit className="w-12 h-12 stroke-1 mb-2 animate-pulse text-emerald-500" />
                  <p className="text-xs">Provide a concept topic and generate explanation text.</p>
                </div>
              )}
            </div>

            {explainUseContext && selectedFile && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex gap-2 items-start text-[10px] text-slate-400 dark:text-slate-500">
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
