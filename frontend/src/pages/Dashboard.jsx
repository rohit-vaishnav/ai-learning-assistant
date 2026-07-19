import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { clearDocuments } from '../services/api';
import { 
  FileText, 
  Trash2, 
  UploadCloud, 
  MessageSquare, 
  Layers, 
  Activity, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Dashboard = () => {
  const { uploadedFiles, selectedFile, setSelectedFile, refreshDocuments, showToast, setLoading } = useApp();

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all uploaded documents and clear the FAISS vector index? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      await clearDocuments();
      await refreshDocuments();
      showToast("All documents and vector database cleared.", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to clear documents.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper formatting for file size
  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate statistics
  const totalFiles = uploadedFiles.length;
  const totalChunks = uploadedFiles.reduce((acc, curr) => acc + (curr.num_chunks || 0), 0);
  const totalPages = uploadedFiles.reduce((acc, curr) => acc + (curr.num_pages || 0), 0);

  const stats = [
    { label: "Uploaded Files", value: totalFiles, icon: <FileText className="w-5 h-5 text-violet-500" /> },
    { label: "Total Pages", value: totalPages, icon: <BookOpen className="w-5 h-5 text-indigo-500" /> },
    { label: "Indexed Chunks", value: totalChunks, icon: <Layers className="w-5 h-5 text-pink-500" /> },
  ];

  const quickActions = [
    { title: "Document Chat", path: "/chat", desc: "Query your documents", icon: <MessageSquare className="w-5 h-5 text-violet-500" /> },
    { title: "Summarizer", path: "/summary", desc: "Generate text outlines", icon: <Activity className="w-5 h-5 text-indigo-500" /> },
    { title: "Quiz Generator", path: "/quiz", desc: "Build interactive tests", icon: <Sparkles className="w-5 h-5 text-pink-500" /> },
  ];

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)]">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight mb-2">Workspace Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor your indexed materials and trigger deep-learning tasks.</p>
        </div>
        
        {totalFiles > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Clear Index</span>
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <GlassCard key={idx} className="flex items-center gap-4 py-5 px-6">
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0">
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{stat.label}</p>
              <h3 className="font-display font-bold text-2xl mt-0.5">{stat.value}</h3>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Document list */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-500" />
                <span>Indexed Documents</span>
              </h3>
              <NavLink 
                to="/upload" 
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 hover:underline"
              >
                <UploadCloud className="w-4 h-4 shrink-0" />
                <span>Upload New</span>
              </NavLink>
            </div>

            {totalFiles === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4 stroke-1 animate-bounce" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-2">No documents indexed</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-6">Upload lecture slides, assignments, or PDF textbooks to train your RAG chatbot.</p>
                <NavLink 
                  to="/upload"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs hover:bg-violet-500 transition-colors shadow-md"
                >
                  Go to Upload
                </NavLink>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.filename}
                    onClick={() => setSelectedFile(file)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedFile?.filename === file.filename
                        ? 'bg-violet-500/10 border-violet-500/30'
                        : 'bg-slate-500/5 border-slate-200/10 dark:border-slate-800/10 hover:bg-slate-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{file.filename}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex gap-2 mt-0.5">
                          <span>{formatBytes(file.file_size)}</span>
                          <span>•</span>
                          <span>{file.num_pages} {file.num_pages === 1 ? 'page' : 'pages'}</span>
                          <span>•</span>
                          <span>{file.num_chunks} chunks</span>
                        </p>
                      </div>
                    </div>
                    {selectedFile?.filename === file.filename && (
                      <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Quick actions panel */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span>Quick Actions</span>
            </h3>

            <div className="space-y-4">
              {quickActions.map((action, idx) => (
                <NavLink
                  key={idx}
                  to={action.path}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200/10 dark:border-slate-800/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{action.title}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </NavLink>
              ))}
            </div>
          </GlassCard>

          {/* Active File detail */}
          <GlassCard className="bg-gradient-to-tr from-violet-500/5 to-indigo-500/5">
            <h3 className="font-display font-semibold text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Current Context</h3>
            {selectedFile ? (
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{selectedFile.filename}</p>
                <p className="text-xs text-slate-400 mt-1">This document is currently active. Any questions asked in Document Chat, Summaries generated, or Quizzes built will query this document.</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">No active document selected. Please upload or select a document above.</p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
