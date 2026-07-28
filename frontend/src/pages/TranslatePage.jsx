import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translateText } from '../services/api';
import { Languages, Copy, Sparkles, RefreshCw } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import CardLoader from '../components/CardLoader';

const TranslatePage = () => {
  const { 
    showToast, 
    translateSourceText,
    setTranslateSourceText,
    translateTargetLang,
    setTranslateTargetLang,
    translateOutput,
    setTranslateOutput
  } = useApp();

  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const handleTranslate = async () => {
    if (!translateSourceText.trim()) {
      showToast("Please enter English text to translate.", "error");
      return;
    }

    setIsLocalLoading(true);
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
      setIsLocalLoading(false);
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
    <div className="px-6 py-10 max-w-5xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)] flex flex-col justify-center animate-fade-in-up">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 text-xs font-semibold mb-4 tracking-wide uppercase border border-sky-500/20">
          <Languages className="w-3.5 h-3.5" />
          <span>Translation Hub</span>
        </div>
        <h1 className="font-display font-bold text-3xl mb-2 flex items-center justify-center gap-2">
          <span>Translate Content</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          Translate generated summaries, revision guides, or explanations instantly using local Ollama translator pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Source Text Input Pane */}
        <GlassCard className="flex flex-col justify-between relative border border-slate-200 dark:border-slate-800 p-6">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-display font-semibold text-xs text-slate-650 dark:text-slate-400 uppercase tracking-wider">Source Text (English)</h3>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded">Eng</span>
            </div>
            <textarea
              value={translateSourceText}
              onChange={(e) => setTranslateSourceText(e.target.value)}
              placeholder="Type or paste English text to translate..."
              rows={8}
              disabled={isLocalLoading}
              className="w-full bg-transparent border-none text-sm outline-none focus:outline-none focus:ring-0 resize-none placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 leading-relaxed min-h-[220px] disabled:opacity-55 mt-2 textarea-no-focus-border"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-5">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">Translate to:</label>
              <div className="relative w-full sm:w-48">
                <select
                  value={translateTargetLang}
                  onChange={(e) => setTranslateTargetLang(e.target.value)}
                  disabled={isLocalLoading}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold outline-none cursor-pointer text-slate-800 dark:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-slate-900/60"
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value} className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">
                      {lang.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Languages className="w-3.5 h-3.5 text-sky-550" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-3.5 h-3.5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto ml-auto">
              {translateSourceText && (
                <button
                  onClick={handleClear}
                  disabled={isLocalLoading}
                  className="px-4 py-2 rounded-xl border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs transition-all cursor-pointer font-semibold disabled:opacity-50"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleTranslate}
                disabled={isLocalLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-650 hover:from-sky-550 hover:to-indigo-550 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Translate</span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Target Translation Output Pane */}
        <GlassCard className="flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-slate-800 p-6">
          {isLocalLoading && <CardLoader message="Translating Content..." />}
          
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-display font-semibold text-xs text-slate-650 dark:text-slate-400 uppercase tracking-wider">Translation Output</h3>
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
              <p className="text-sm text-slate-850 dark:text-slate-100 leading-relaxed whitespace-pre-wrap min-h-[220px] mt-2">
                {translateOutput}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-450 min-h-[224px] py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500/10 to-indigo-500/10 border border-sky-500/10 flex items-center justify-center mb-4 shadow-sm">
                  <Languages className="w-7 h-7 text-sky-500 stroke-1" />
                </div>
                <h4 className="font-display font-semibold text-xs text-slate-750 dark:text-slate-300 mb-1">Awaiting Translation Input</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-450 max-w-[220px] leading-relaxed">
                  Enter English text on the left pane and select translation target.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-5 flex gap-2 items-center text-[10px] text-slate-550 dark:text-slate-500">
            <InfoIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-550 shrink-0" />
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
