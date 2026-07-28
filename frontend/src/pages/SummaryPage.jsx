import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateSummary } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { FileText, Copy, Download, Sparkles, Activity } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import CardLoader from '../components/CardLoader';

const SummaryPage = () => {
  const { 
    selectedFile, 
    showToast, 
    summaryText,
    setSummaryText,
    summaryType,
    setSummaryType,
    summaryActiveTab,
    setSummaryActiveTab,
    summaryCustomText,
    setSummaryCustomText
  } = useApp();

  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const handleGenerate = async () => {
    if (summaryActiveTab === "file" && !selectedFile) {
      showToast("Please upload and select a document first.", "error");
      return;
    }
    if (summaryActiveTab === "text" && !summaryCustomText.trim()) {
      showToast("Please provide text to summarize.", "error");
      return;
    }

    setIsLocalLoading(true);
    setSummaryText("");
    try {
      const textToUse = summaryActiveTab === "text" ? summaryCustomText : "";
      const filename = summaryActiveTab === "file" ? selectedFile.filename : "";
      const res = await generateSummary(textToUse, summaryType, filename);
      setSummaryText(res.data.summary);
      showToast("Summary generated successfully!", "success");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Summarization failed. Verify backend services.";
      showToast(detail, "error");
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleClear = () => {
    setSummaryText("");
    setSummaryCustomText("");
  };

  const handleCopy = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    showToast("Summary copied to clipboard!", "success");
  };

  const handleDownload = () => {
    if (!summaryText) return;
    const printWindow = window.open('', '_blank');
    const docTitle = selectedFile?.filename ? selectedFile.filename.replace(/\.[^/.]+$/, "") : "Study Notes";
    
    let formattedSummary = summaryText
      .replace(/^# (.*?)$/gm, '<h1 class="pdf-h1">$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2 class="pdf-h2">$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3 class="pdf-h3">$1</h3>')
      .replace(/^\- (.*?)$/gm, '<li>$1</li>')
      .replace(/^\* (.*?)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br/>');

    formattedSummary = formattedSummary.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

    printWindow.document.write(`
      <html>
        <head>
          <title>${docTitle} - Summary Guide</title>
          <style>
            @page {
              size: A4;
              margin: 2.5cm 2cm;
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              line-height: 1.65;
              font-size: 14px;
              padding: 0;
              margin: 0;
            }
            .header-bar {
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 12px;
              margin-bottom: 28px;
            }
            .doc-title {
              font-size: 24px;
              font-weight: 800;
              color: #1e1b4b;
              margin: 0;
            }
            .meta-info {
              font-size: 11px;
              color: #64748b;
              margin-top: 4px;
            }
            .pdf-h1 {
              font-size: 18px;
              font-weight: 700;
              color: #4338ca;
              margin-top: 32px;
              margin-bottom: 10px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
              page-break-after: avoid;
            }
            .pdf-h2 {
              font-size: 15px;
              font-weight: 600;
              color: #312e81;
              margin-top: 24px;
              margin-bottom: 8px;
              page-break-after: avoid;
            }
            .pdf-h3 {
              font-size: 13px;
              font-weight: 600;
              color: #4f46e5;
              margin-top: 18px;
              margin-bottom: 6px;
              page-break-after: avoid;
            }
            p {
              margin-bottom: 12px;
              text-align: justify;
            }
            ul {
              margin-top: 4px;
              margin-bottom: 12px;
              padding-left: 20px;
            }
            li {
              margin-bottom: 5px;
            }
            .footer-bar {
              position: fixed;
              bottom: -1cm;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              padding-top: 8px;
            }
            @media print {
              .footer-bar {
                display: block;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <h1 class="doc-title">${docTitle}</h1>
            <div class="meta-info">Generated by AI Learning Assistant &bull; Revision Study Guide</div>
          </div>
          <div class="content-body">
            ${formattedSummary}
          </div>
          <div class="footer-bar">
            AI Learning Assistant &bull; Page 1
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast("Opening print dialogue for PDF generation...", "success");
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)] animate-fade-in-up">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-semibold mb-4 tracking-wide uppercase border border-indigo-500/20">
          <FileText className="w-3.5 h-3.5" />
          <span>Synthesis Engine</span>
        </div>
        <h1 className="font-display font-bold text-3xl mb-2 flex items-center justify-center gap-2">
          <span>Summarize Materials</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          Condense lengthy chapters or text inputs into short summaries, key details, or structured bullet lists.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Configurations panel */}
        <div className="md:col-span-5">
          <GlassCard className="border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500">Settings</h3>

            {/* Input toggle */}
            <div>
              <label className="text-xs font-bold text-slate-550 block mb-2">Input Source</label>
              <div className="flex bg-slate-150 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  onClick={() => setSummaryActiveTab("file")}
                  disabled={isLocalLoading}
                  className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    summaryActiveTab === "file" 
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
                  }`}
                >
                  Active Document
                </button>
                <button
                  onClick={() => setSummaryActiveTab("text")}
                  disabled={isLocalLoading}
                  className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    summaryActiveTab === "text" 
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
                  }`}
                >
                  Custom Text
                </button>
              </div>
            </div>

            {/* Summary type select */}
            <div>
              <label className="text-xs font-bold text-slate-555 block mb-2">Output Mode</label>
              <div className="relative">
                <select
                  value={summaryType}
                  onChange={(e) => setSummaryType(e.target.value)}
                  disabled={isLocalLoading}
                  className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-3 text-sm font-semibold outline-none cursor-pointer text-slate-900 dark:text-white disabled:opacity-55 transition-all hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  <option value="short" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">Short Summary</option>
                  <option value="detailed" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">Detailed Overview</option>
                  <option value="bullets" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">Bullet Revision Notes</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <FileText className="w-3.5 h-3.5 text-indigo-550" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-3.5 h-3.5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Context details */}
            {summaryActiveTab === "file" && (
              <div className="p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/20 text-xs">
                {selectedFile ? (
                  <p className="text-slate-500 dark:text-slate-400">
                    Will summarize: <span className="font-semibold text-indigo-600 dark:text-indigo-400 block truncate mt-0.5">{selectedFile.filename}</span>
                  </p>
                ) : (
                  <p className="text-rose-500 font-semibold">Please upload a document to proceed.</p>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLocalLoading || (summaryActiveTab === "file" && !selectedFile)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-50 hover:to-violet-550 text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
              <span>Generate Summary</span>
            </button>
          </GlassCard>
        </div>

        {/* Text area and output panel */}
        <div className="md:col-span-7 space-y-6">
          {summaryActiveTab === "text" && (
            <GlassCard className="border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-display font-semibold text-xs text-slate-500 uppercase tracking-wider mb-3">Custom Text Input</h3>
              <textarea
                value={summaryCustomText}
                onChange={(e) => setSummaryCustomText(e.target.value)}
                placeholder="Paste raw textbook text, essays, or notes here..."
                rows={5}
                disabled={isLocalLoading}
                className="w-full bg-transparent border border-slate-300 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/10 rounded-xl p-4 text-sm outline-none transition-all resize-none placeholder-slate-400 text-slate-800 dark:text-slate-100 disabled:opacity-55 animate-fade-in"
              />
            </GlassCard>
          )}

          <GlassCard className="min-h-[320px] flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-slate-800 p-6">
            {isLocalLoading && <CardLoader message="Creating Summary..." />}
            
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 shrink-0">
                <h3 className="font-display font-semibold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Output</span>
                </h3>

                {(summaryText || summaryCustomText) && (
                  <div className="flex items-center gap-1.5">
                    {summaryText && (
                      <>
                        <button
                          onClick={handleCopy}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                          title="Copy summary"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleDownload}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
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
              <div className="flex-1 overflow-y-auto pr-1 my-2 min-h-[224px] max-h-[360px]">
                {summaryText ? (
                  <div className="prose dark:prose-invert leading-relaxed text-sm">
                    <ReactMarkdown>{summaryText}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 border border-indigo-500/10 flex items-center justify-center mb-4 shadow-sm">
                      <FileText className="w-7 h-7 text-indigo-500 stroke-1" />
                    </div>
                    <h4 className="font-display font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">Awaiting Summary Input</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[220px] leading-relaxed">
                      Select a document source or write text in custom input to produce summaries.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
