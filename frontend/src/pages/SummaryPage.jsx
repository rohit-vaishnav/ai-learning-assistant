import React from 'react';
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
    setLoading, 
    loading,
    summaryText,
    setSummaryText,
    summaryType,
    setSummaryType,
    summaryActiveTab,
    setSummaryActiveTab,
    summaryCustomText,
    setSummaryCustomText
  } = useApp();

  const isLocalLoading = loading === "Generating Summary...";

  const handleGenerate = async () => {
    if (summaryActiveTab === "file" && !selectedFile) {
      showToast("Please upload and select a document first.", "error");
      return;
    }
    if (summaryActiveTab === "text" && !summaryCustomText.trim()) {
      showToast("Please provide text to summarize.", "error");
      return;
    }

    setLoading("Generating Summary...");
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
      setLoading(false);
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
    <div className="px-6 py-10 max-w-4xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)]">
      <div className="text-center mb-10">
        <h1 className="font-display font-bold text-3xl mb-2 flex items-center justify-center gap-2">
          <Activity className="w-7 h-7 text-indigo-500" />
          <span>Summarize Materials</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          Condense lengthy chapters or text inputs into short summaries, key details, or structured bullet lists.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Configurations panel */}
        <div className="space-y-6">
          <GlassCard className="border border-slate-200 dark:border-slate-800">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Settings</h3>

            {/* Input toggle */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 block mb-2">Input Source</label>
              <div className="flex bg-slate-150 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  onClick={() => setSummaryActiveTab("file")}
                  disabled={!!loading}
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
                  disabled={!!loading}
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
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 block mb-2">Output Mode</label>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
                disabled={!!loading}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none cursor-pointer text-slate-700 dark:text-slate-350 disabled:opacity-55"
              >
                <option value="short" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Short Summary</option>
                <option value="detailed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Detailed Overview</option>
                <option value="bullets" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Bullet Revision Notes</option>
              </select>
            </div>

            {/* Context details */}
            {summaryActiveTab === "file" && (
              <div className="mb-6 p-3 bg-violet-500/5 rounded-xl border border-violet-500/10 text-xs">
                {selectedFile ? (
                  <p className="text-slate-500 dark:text-slate-400">
                    Will summarize: <span className="font-semibold text-violet-600 dark:text-violet-400 block truncate">{selectedFile.filename}</span>
                  </p>
                ) : (
                  <p className="text-rose-500 font-semibold">Please upload a document to proceed.</p>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!!loading || (summaryActiveTab === "file" && !selectedFile)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Generate Summary</span>
            </button>
          </GlassCard>
        </div>

        {/* Text area and output panel */}
        <div className="md:col-span-2 space-y-6">
          {summaryActiveTab === "text" && (
            <GlassCard className="border border-slate-200 dark:border-slate-800">
              <h3 className="font-display font-semibold text-sm text-slate-500 uppercase tracking-wider mb-3">Custom Text Input</h3>
              <textarea
                value={summaryCustomText}
                onChange={(e) => setSummaryCustomText(e.target.value)}
                placeholder="Paste raw textbook text, essays, or notes here..."
                rows={6}
                disabled={!!loading}
                className="w-full bg-transparent border border-slate-250 dark:border-slate-800 focus:ring-2 focus:ring-violet-500/10 rounded-xl p-4 text-sm outline-none transition-all resize-none placeholder-slate-400 text-slate-800 dark:text-slate-100 disabled:opacity-55 animate-fade-in"
              />
            </GlassCard>
          )}

          <GlassCard className="min-h-[280px] flex flex-col justify-between relative overflow-hidden border border-slate-200 dark:border-slate-800">
            {isLocalLoading && <CardLoader message="Generating Summary..." />}
            
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="font-display font-semibold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
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
                      disabled={!!loading}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {summaryText ? (
                <div className="prose dark:prose-invert">
                  <ReactMarkdown>{summaryText}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                  <Activity className="w-10 h-10 stroke-1 mb-2 animate-pulse" />
                  <p className="text-xs">Select options and click generate to process the summary.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
