import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { clearDocuments } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, 
  Trash2, 
  UploadCloud, 
  MessageSquare, 
  Layers, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Activity,
  Globe,
  Clock,
  Compass
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Dashboard = () => {
  const { 
    user, 
    dashboardStats, 
    refreshDashboardStats,
    uploadedFiles, 
    selectedFile, 
    setSelectedFile, 
    refreshDocuments, 
    showToast, 
    setLoading 
  } = useApp();

  const [activeHistoryTab, setActiveHistoryTab] = useState("chats");
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const [selectedSummary, setSelectedSummary] = useState(null);

  useEffect(() => {
    refreshDashboardStats();
    refreshDocuments();
  }, []);

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all uploaded documents and clear your isolated FAISS index? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      await clearDocuments();
      await refreshDocuments();
      await refreshDashboardStats();
      showToast("All documents and vector database cleared.", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to clear documents.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = [
    { 
      label: "Uploaded Files", 
      value: dashboardStats?.stats?.uploaded_files ?? uploadedFiles.length, 
      icon: <FileText className="w-5 h-5 text-cyan-500" />,
      colorClass: "from-cyan-500/10 to-blue-500/10 border-cyan-550/20 text-cyan-600 dark:text-cyan-400"
    },
    { 
      label: "Questions Asked", 
      value: dashboardStats?.stats?.chat_messages ?? 0, 
      icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
      colorClass: "from-purple-500/10 to-violet-500/10 border-purple-550/20 text-purple-600 dark:text-purple-400"
    },
    { 
      label: "Summaries Saved", 
      value: dashboardStats?.stats?.generated_summaries ?? 0, 
      icon: <Activity className="w-5 h-5 text-indigo-500" />,
      colorClass: "from-indigo-500/10 to-violet-500/10 border-indigo-550/20 text-indigo-600 dark:text-indigo-400"
    },
    { 
      label: "Quizzes Created", 
      value: dashboardStats?.stats?.generated_quizzes ?? 0, 
      icon: <Sparkles className="w-5 h-5 text-pink-500" />,
      colorClass: "from-pink-500/10 to-rose-500/10 border-pink-550/20 text-pink-600 dark:text-pink-400"
    },
  ];

  const quickActions = [
    { title: "Document Chat", path: "/chat", desc: "Query your documents", icon: <MessageSquare className="w-5 h-5 text-purple-500" />, accentClass: "hover:border-purple-500/30 hover:translate-x-1" },
    { title: "Summarizer", path: "/summary", desc: "Generate outlines", icon: <Activity className="w-5 h-5 text-indigo-500" />, accentClass: "hover:border-indigo-500/30 hover:translate-x-1" },
    { title: "Quiz Generator", path: "/quiz", desc: "Interactive testing", icon: <Sparkles className="w-5 h-5 text-pink-500" />, accentClass: "hover:border-pink-500/30 hover:translate-x-1" },
    { title: "Explain Topic", path: "/explain", desc: "Clarify learning points", icon: <BookOpen className="w-5 h-5 text-violet-500" />, accentClass: "hover:border-violet-500/30 hover:translate-x-1" },
    { title: "Translate Text", path: "/translate", desc: "Multi-language utility", icon: <Globe className="w-5 h-5 text-cyan-500" />, accentClass: "hover:border-cyan-500/30 hover:translate-x-1" },
  ];

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)] animate-fade-in-up">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-semibold mb-3 tracking-wide uppercase border border-violet-500/20">
            <Layers className="w-3.5 h-3.5" />
            <span>Performance Hub</span>
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tight mb-2 text-slate-900 dark:text-white">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Monitor your study materials, review learning metrics, and select active topics.
          </p>
        </div>
        
        {uploadedFiles.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-500 hover:text-white bg-rose-500/5 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Clear Workspace</span>
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <GlassCard key={idx} className="flex items-center gap-4 py-5 px-6 border border-slate-200 dark:border-slate-800/60 shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-200">
            <div className={`p-3 rounded-2xl shrink-0 bg-gradient-to-tr ${stat.colorClass} border border-slate-200/5 dark:border-slate-800/5`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">{stat.label}</p>
              <h3 className="font-display font-black text-2xl mt-0.5 text-slate-850 dark:text-white">{stat.value}</h3>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Indexed Documents & Chat Log */}
        <div className="lg:col-span-2 space-y-8">
          {/* Document list */}
          <GlassCard className="p-6 border border-slate-200/50 dark:border-slate-800/50">
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

            {uploadedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4 stroke-1 animate-pulse" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-2">No documents indexed</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-6">Upload assignments or PDF textbooks to train your RAG chatbot.</p>
                <NavLink 
                  to="/upload"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs hover:bg-violet-500 transition-colors shadow-md"
                >
                  Go to Upload
                </NavLink>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.filename}
                    onClick={() => setSelectedFile(file)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:bg-slate-500/5 ${
                      selectedFile?.filename === file.filename
                        ? 'bg-violet-500/10 dark:bg-violet-500/10 border-violet-500/30 dark:border-violet-550/20 ring-2 ring-violet-500/5'
                        : 'bg-slate-500/5 border-slate-200/10 dark:border-slate-800/10 hover:bg-slate-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-slate-850 dark:text-slate-100 truncate">{file.filename}</h4>
                        <p className="text-xs text-slate-450 dark:text-slate-500 flex gap-2 mt-0.5 font-medium">
                          <span>{formatBytes(file.file_size)}</span>
                          <span>•</span>
                          <span>{file.num_pages} {file.num_pages === 1 ? 'page' : 'pages'}</span>
                          <span>•</span>
                          <span>{file.num_chunks} chunks</span>
                        </p>
                      </div>
                    </div>
                    {selectedFile?.filename === file.filename && (
                      <span className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-violet-600 dark:text-violet-400 bg-violet-500/20 px-2.5 py-1 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Recent Study History & Interactions */}
          <GlassCard className="p-6 border border-slate-200/50 dark:border-slate-800/50">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <span>Study History & Logs</span>
            </h3>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 shrink-0 gap-4">
              <button 
                onClick={() => setActiveHistoryTab("chats")}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeHistoryTab === "chats" 
                    ? "border-violet-500 text-slate-900 dark:text-white" 
                    : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-450"
                }`}
              >
                Chat Logs
              </button>
              <button 
                onClick={() => setActiveHistoryTab("summaries")}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeHistoryTab === "summaries" 
                    ? "border-violet-500 text-slate-900 dark:text-white" 
                    : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-455"
                }`}
              >
                Summaries
              </button>
              <button 
                onClick={() => setActiveHistoryTab("quizzes")}
                className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeHistoryTab === "quizzes" 
                    ? "border-violet-500 text-slate-900 dark:text-white" 
                    : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-455"
                }`}
              >
                Quizzes
              </button>
            </div>

            {/* Chat history list */}
            {activeHistoryTab === "chats" && (
              !dashboardStats?.recent_chats || dashboardStats.recent_chats.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 stroke-1" />
                  <p className="text-xs font-semibold">No questions asked yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
                  {dashboardStats.recent_chats.map((chat, idx) => (
                    <div key={idx} className="p-4 bg-slate-500/5 rounded-xl border border-slate-200/5 dark:border-slate-800/5 text-sm space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-slate-850 dark:text-slate-200">Q: {chat.question}</p>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0">
                          {new Date(chat.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                        A: {chat.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Summaries history list */}
            {activeHistoryTab === "summaries" && (
              !dashboardStats?.recent_summaries || dashboardStats.recent_summaries.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 stroke-1" />
                  <p className="text-xs font-semibold">No summaries generated yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
                  {dashboardStats.recent_summaries.map((summary) => (
                    <div key={summary.id} className="p-4 bg-slate-500/5 rounded-xl border border-slate-200/5 dark:border-slate-800/5 text-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold uppercase text-[9px] tracking-wide">
                            {summary.summary_type}
                          </span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 ml-2 truncate max-w-[150px] inline-block align-middle font-medium">
                            {summary.filename}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0">
                          {new Date(summary.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-650 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {summary.summary_text}
                      </p>
                      <button
                        onClick={() => setSelectedSummary(summary)}
                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>View Full Summary</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Quizzes history list */}
            {activeHistoryTab === "quizzes" && (
              !dashboardStats?.recent_quizzes || dashboardStats.recent_quizzes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 stroke-1" />
                  <p className="text-xs font-semibold">No quizzes generated yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
                  {dashboardStats.recent_quizzes.map((quiz) => (
                    <div key={quiz.id} className="p-4 bg-slate-500/5 rounded-xl border border-slate-200/5 dark:border-slate-800/5 text-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-505 font-bold uppercase text-[9px] tracking-wide">
                            Quiz #{quiz.id}
                          </span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 ml-2 truncate max-w-[150px] inline-block align-middle font-medium">
                            {quiz.filename}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0">
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {quiz.questions_count} Questions
                        </span>
                        
                        <button
                          onClick={() => setExpandedQuizId(expandedQuizId === quiz.id ? null : quiz.id)}
                          className="text-[10px] font-bold text-pink-500 hover:text-pink-600 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span>{expandedQuizId === quiz.id ? "Hide Details" : "View Questions & Answers"}</span>
                          <ArrowRight className={`w-3 h-3 transition-transform ${expandedQuizId === quiz.id ? "rotate-90" : ""}`} />
                        </button>
                      </div>

                      {expandedQuizId === quiz.id && quiz.questions && (
                        <div className="mt-3 pt-3 border-t border-slate-200/10 space-y-3 animate-fade-in pl-2">
                          {quiz.questions.map((q, qIdx) => (
                            <div key={qIdx} className="space-y-1.5 border-b border-slate-200/5 pb-2 last:border-0 last:pb-0">
                              <p className="font-bold text-slate-750 dark:text-slate-200 text-xs">
                                {qIdx + 1}. {q.question}
                              </p>
                              {q.options && q.options.length > 0 && (
                                <ul className="grid grid-cols-2 gap-1.5 pl-3 list-none">
                                  {q.options.map((opt, oIdx) => (
                                    <li key={oIdx} className="text-[10px] text-slate-500 dark:text-slate-400 flex gap-1 items-start">
                                      <span className="font-bold text-pink-500/80">{["A", "B", "C", "D"][oIdx]}.</span>
                                      <span>{opt}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold pl-3 flex gap-1 items-center">
                                <span className="uppercase text-[8px] px-1 rounded bg-emerald-500/10">Correct Answer:</span>
                                <span>{q.answer}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </GlassCard>
        </div>

        {/* Right Column: Quick Actions & Quiz Logs */}
        <div className="space-y-8">
          {/* Quick actions panel */}
          <GlassCard className="p-6 border border-slate-200/50 dark:border-slate-800/50">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span>Study Tools</span>
            </h3>

            <div className="space-y-3">
              {quickActions.map((action, idx) => (
                <NavLink
                  key={idx}
                  to={action.path}
                  className={`flex items-center justify-between p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/10 dark:border-slate-800/10 transition-all duration-200 group hover:bg-slate-500/10 ${action.accentClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/10">
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-850 dark:text-slate-100">{action.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-500 font-medium mt-0.5">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                </NavLink>
              ))}
            </div>
          </GlassCard>

          {/* Recent Quizzes log */}
          <GlassCard className="p-6 border border-slate-200/50 dark:border-slate-800/50">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <span>Recent Quizzes</span>
            </h3>

            {!dashboardStats?.recent_quizzes || dashboardStats.recent_quizzes.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 stroke-1" />
                <p className="text-xs font-semibold">No quizzes generated yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardStats.recent_quizzes.map((quiz, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-500/5 border border-slate-200/5 rounded-xl text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-pink-500/10 text-pink-500 rounded-lg">⚡</span>
                      <div>
                        <p className="text-slate-700 dark:text-slate-300">Quiz #{quiz.id}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{quiz.questions_count} Questions</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Active File detail */}
          <GlassCard className="p-6 bg-gradient-to-tr from-violet-500/5 to-indigo-500/5 border border-slate-200/50 dark:border-slate-800/50">
            <h3 className="font-display font-semibold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Active Learning Context</h3>
            {selectedFile ? (
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{selectedFile.filename}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
                  This document is active. Asking questions in Chat, generating summaries, or building quizzes will query this file.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                No active document selected. Please upload or select a document in the index table.
              </p>
            )}
          </GlassCard>
        </div>

      </div>

      {/* Read-Only Summary Detail Modal */}
      {selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <GlassCard className="max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col justify-between border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold uppercase text-[9px] tracking-wide">
                  {selectedSummary.summary_type} Summary
                </span>
                <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white mt-1 truncate max-w-[400px]">
                  {selectedSummary.filename}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSummary(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 cursor-pointer"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 my-2 min-h-[200px] max-h-[500px]">
              <div className="prose dark:prose-invert leading-relaxed text-sm">
                <ReactMarkdown>{selectedSummary.summary_text}</ReactMarkdown>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedSummary.summary_text);
                  showToast("Summary copied to clipboard!", "success");
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                Copy Content
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
