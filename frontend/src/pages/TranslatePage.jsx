import React from 'react';
import { useApp } from '../context/AppContext';
import { translateText } from '../services/api';
import { Languages, Copy, Sparkles, RefreshCw } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import CardLoader from '../components/CardLoader';

const TranslatePage = () => {
  const { 
    showToast, 
    setLoading, 
    loading,
    translateSourceText,
    setTranslateSourceText,
    translateTargetLang,
    setTranslateTargetLang,
    translateOutput,
    setTranslateOutput
  } = useApp();

  const isLocalLoading = loading === "Translating...";

  const handleTranslate = async () => {
    if (!translateSourceText.trim()) {
      showToast("Please enter English text to translate.", "error");
      return;
    }

    setLoading("Translating...");
    setTranslateOutput("");
    try {
      const res = await translateText(translateSourceText.trim(), translateTargetLang);
      setTranslateOutput(res.data.translated_text);
      showToast("Translation completed!", "success");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Translation service failed. Verify backend model downloads.";
      showToast(detail, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTranslateOutput("");
    setTranslateSourceText("");
  };

  const handleCopy = () => {
    if (!translateOutput) return;
    navigator.clipboard.writeText(translateOutput);
    showToast("Translated text copied to clipboard!", "success");
  };

  const languages = [
    { value: "hindi", label: "Hindi (हिन्दी)" },
    { value: "gujarati", label: "Gujarati (ગુજરાતી)" },
    { value: "french", label: "French (Français)" },
    { value: "spanish", label: "Spanish (Español)" }
  ];

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)] flex flex-col justify-center">
      <div className="text-center mb-10">
        <h1 className="font-display font-bold text-3xl mb-2 flex items-center justify-center gap-2">
          <Languages className="w-7 h-7 text-sky-500" />
          <span>Translate Content</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          Translate generated summaries, revision guides, or explanations instantly using local Ollama translator pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Source Text Input Pane */}
        <GlassCard className="flex flex-col justify-between relative border border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-display font-semibold text-xs text-slate-500 uppercase tracking-wider">Source Text (English)</h3>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Eng</span>
            </div>
            <textarea
              value={translateSourceText}
              onChange={(e) => setTranslateSourceText(e.target.value)}
              placeholder="Type or paste English text to translate..."
              rows={8}
              disabled={!!loading}
              className="w-full bg-transparent border-none text-sm outline-none resize-none placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 leading-relaxed min-h-[220px] disabled:opacity-55"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-400 shrink-0">Translate to:</label>
              <select
                value={translateTargetLang}
                onChange={(e) => setTranslateTargetLang(e.target.value)}
                disabled={!!loading}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none cursor-pointer w-full sm:w-auto text-slate-700 dark:text-slate-300 disabled:opacity-55"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto ml-auto">
              {translateSourceText && (
                <button
                  onClick={handleClear}
                  disabled={!!loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs transition-all cursor-pointer font-semibold disabled:opacity-50"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleTranslate}
                disabled={!!loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-md shadow-violet-500/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Translate</span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Target Translation Output Pane */}
        <GlassCard className="flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-slate-800">
          {isLocalLoading && <CardLoader message="Translating..." />}
          
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-display font-semibold text-xs text-slate-500 uppercase tracking-wider">Translation Output</h3>
              {translateOutput && (
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  title="Copy translation"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {translateOutput ? (
              <p className="text-sm text-slate-850 dark:text-slate-100 leading-relaxed whitespace-pre-wrap min-h-[220px]">
                {translateOutput}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 min-h-[220px] py-10">
                <RefreshCw className="w-8 h-8 stroke-1 mb-2 text-slate-300 dark:text-slate-700 animate-spin-slow" />
                <p className="text-xs">Translation output will appear here after clicking translate.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex gap-2 items-center text-[10px] text-slate-400 dark:text-slate-500">
            <InfoIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <p>Target codes are mapped to appropriate languages dynamically using optimized Ollama prompts.</p>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

const InfoIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-.041.02m0 0a.75.75 0 01-1.085-1.085l.041-.02m0 0V18M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default TranslatePage;
