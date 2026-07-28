import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { generateQuiz } from '../services/api';
import { jsPDF } from 'jspdf';
import { 
  Check, 
  X, 
  Sparkles, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  Timer, 
  RefreshCw, 
  Download, 
  LayoutDashboard, 
  BookOpen, 
  Award,
  Eye
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import CardLoader from '../components/CardLoader';

const QuizPage = () => {
  const { 
    selectedFile, 
    showToast, 
    quizQuestions,
    setQuizQuestions,
    quizAnswers,
    setQuizAnswers,
    quizSubmitted,
    setQuizSubmitted,
    quizScore,
    setQuizScore,
    quizType,
    setQuizType,
    quizDifficulty,
    setQuizDifficulty,
    quizNumQuestions,
    setQuizNumQuestions,
    refreshDashboardStats
  } = useApp();

  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  // Active Timer Effect
  useEffect(() => {
    let timer;
    if (quizQuestions.length > 0 && !quizSubmitted && !showResultScreen) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizQuestions, quizSubmitted, showResultScreen]);

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      showToast("Please upload and select a document first.", "error");
      return;
    }

    setIsLocalLoading(true);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setCurrentIdx(0);
    setElapsedTime(0);
    setShowResultScreen(false);
    setIsReviewing(false);

    try {
      const res = await generateQuiz(
        "", 
        quizType, 
        quizDifficulty, 
        quizNumQuestions, 
        selectedFile.filename
      );
      setQuizQuestions(res.data.questions || []);
      showToast("Quiz generated successfully! Test your knowledge.", "success");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to generate quiz. Verify backend server.";
      showToast(detail, "error");
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleOptionSelect = (qIdx, opt) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: opt }));
  };

  const handleSubmitQuiz = () => {
    if (quizSubmitted) return;

    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < quizQuestions.length && quizType !== "short") {
      showToast("Please answer all questions before submitting.", "info");
      return;
    }

    let correctCount = 0;
    const optionLetters = ["A", "B", "C", "D"];

    quizQuestions.forEach((q, idx) => {
      const userOptSelected = quizAnswers[idx];
      
      if (quizType === "mcq") {
        const ansLetter = q.answer.trim().toUpperCase();
        if (["A", "B", "C", "D"].includes(ansLetter)) {
          const letterIndices = { "A": 0, "B": 1, "C": 2, "D": 3 };
          const correctOptStr = q.options[letterIndices[ansLetter]];
          if (userOptSelected === correctOptStr) {
            correctCount++;
          }
        } else {
          if (userOptSelected?.toLowerCase() === q.answer?.toLowerCase()) {
            correctCount++;
          }
        }
      } else if (quizType === "tf") {
        if (userOptSelected?.toLowerCase() === q.answer?.toLowerCase()) {
          correctCount++;
        }
      }
    });

    setQuizScore(correctCount);
    setQuizSubmitted(true);
    setShowResultScreen(true);
    setIsReviewing(false);
    refreshDashboardStats();
    showToast("Quiz submitted successfully!", "success");
  };

  const handleRetry = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setCurrentIdx(0);
    setElapsedTime(0);
    setShowResultScreen(false);
    setIsReviewing(false);
    showToast("Quiz reset. Good luck!", "info");
  };

  const handleResetSettings = () => {
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setCurrentIdx(0);
    setElapsedTime(0);
    setShowResultScreen(false);
    setIsReviewing(false);
  };

  const downloadResults = () => {
    let textContent = `LearnAI Quiz Study Report\n`;
    textContent += `==================================================\n`;
    textContent += `Document Name: ${selectedFile?.filename || 'Custom Text'}\n`;
    textContent += `Quiz Format: ${quizType.toUpperCase()} (${quizDifficulty.toUpperCase()})\n`;
    textContent += `Score: ${quizScore} / ${quizQuestions.length} (${Math.round((quizScore / quizQuestions.length) * 100)}%)\n`;
    textContent += `Time Taken: ${formatTime(elapsedTime)}\n`;
    textContent += `==================================================\n\n`;
    
    quizQuestions.forEach((q, idx) => {
      textContent += `Question ${idx + 1}: ${q.question}\n`;
      if (q.options && q.options.length > 0) {
        textContent += `Options:\n`;
        q.options.forEach((opt, oIdx) => {
          textContent += `  [ ] ${opt}\n`;
        });
      }
      textContent += `Your Answer: ${quizAnswers[idx] || 'Not answered'}\n`;
      textContent += `Correct Answer: ${q.answer}\n`;
      if (q.explanation) {
        textContent += `Explanation: ${q.explanation}\n`;
      }
      textContent += `\n--------------------------------------------------\n\n`;
    });
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz_report_${selectedFile?.filename.split('.')[0] || 'study'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Study results downloaded successfully.", "success");
  };

  // Performance Telemetry Messages
  const getPerformanceFeedback = () => {
    if (quizQuestions.length === 0) return {};
    const percent = Math.round((quizScore / quizQuestions.length) * 100);
    if (percent === 100) return { title: "Perfect Score! 🌟", desc: "You have completely mastered this material.", color: "text-emerald-500 bg-emerald-500/10" };
    if (percent >= 80) return { title: "Excellent Work! 👍", desc: "Superb comprehension of the document facts.", color: "text-violet-500 bg-violet-500/10" };
    if (percent >= 50) return { title: "Passing Grade 📚", desc: "Good job, but some details might need re-reading.", color: "text-amber-500 bg-amber-500/10" };
    return { title: "Need Review ❌", desc: "We recommend reading the material and trying again.", color: "text-rose-500 bg-rose-500/10" };
  };

  const feedback = getPerformanceFeedback();
  const optionLetters = ["A", "B", "C", "D"];

  const downloadCertificate = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      
      // Draw outer rose border
      doc.setDrawColor(244, 63, 94);
      doc.setLineWidth(1.5);
      doc.rect(8, 8, width - 16, height - 16);
      
      // Draw inner purple border
      doc.setDrawColor(76, 29, 149);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, width - 20, height - 20);
      
      // Corner decorative triangles
      doc.setFillColor(244, 63, 94);
      doc.triangle(8, 8, 20, 8, 8, 20, 'F');
      doc.triangle(width - 8, 8, width - 20, 8, width - 8, 20, 'F');
      doc.triangle(8, height - 8, 20, height - 8, 8, height - 20, 'F');
      doc.triangle(width - 8, height - 8, width - 20, height - 8, width - 8, height - 20, 'F');
      
      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text("CERTIFICATE OF ACHIEVEMENT", width / 2, 45, { align: "center" });
      
      // Subtitle
      doc.setFont("helvetica", "italic");
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text("This is proudly presented to", width / 2, 60, { align: "center" });
      
      // Student Name from auth state
      let studentName = "Distinguished Student";
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.name) {
            studentName = parsed.name;
          }
        }
      } catch (e) {
        console.error(e);
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(219, 39, 119);
      doc.text(studentName.toUpperCase(), width / 2, 80, { align: "center" });
      
      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.8);
      doc.line(width / 2 - 50, 87, width / 2 + 50, 87);
      
      // Details Text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      
      const docTitle = selectedFile ? selectedFile.filename : "Course Documents";
      const scorePercent = Math.round((quizScore / quizQuestions.length) * 100);
      
      doc.text(
        "for successfully passing the Interactive Learning Assessment on",
        width / 2,
        100,
        { align: "center" }
      );
      
      doc.setFont("helvetica", "bold");
      doc.text(
        `"${docTitle}"`,
        width / 2,
        110,
        { align: "center" }
      );
      
      doc.setFont("helvetica", "normal");
      doc.text(
        `with an overall accuracy score of ${scorePercent}%`,
        width / 2,
        120,
        { align: "center" }
      );
      
      // Footer info
      const today = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Date Line
      doc.line(40, 160, 100, 160);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("DATE OF ISSUANCE", 70, 166, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(today, 70, 155, { align: "center" });
      
      // Emblem Badge
      doc.setFillColor(253, 224, 71);
      doc.setDrawColor(234, 179, 8);
      doc.setLineWidth(1);
      doc.ellipse(width / 2, 155, 12, 12, 'FD');
      doc.setFillColor(234, 179, 8);
      doc.triangle(width / 2 - 4, 165, width / 2 + 4, 165, width / 2, 175, 'F');
      doc.triangle(width / 2 - 8, 163, width / 2 + 8, 163, width / 2, 172, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(133, 77, 14);
      doc.text("PASSED", width / 2, 157, { align: "center" });
      
      // Signature Line
      doc.setDrawColor(226, 232, 240);
      doc.line(width - 100, 160, width - 40, 160);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("AUTHORIZED VERIFICATION", width - 70, 166, { align: "center" });
      doc.setFont("helvetica", "italic");
      doc.text("AI Learning Portal", width - 70, 155, { align: "center" });
      
      doc.save(`Certificate_${studentName.replace(/\s+/g, "_")}.pdf`);
      showToast("Certificate downloaded successfully!", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to generate PDF Certificate.", "error");
    }
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)] flex flex-col justify-center">
      
      {/* 1. INITIAL STATE: Centered Settings Card */}
      {quizQuestions.length === 0 && (
        <div className="max-w-xl w-full mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-xs font-semibold mb-4 tracking-wide uppercase border border-pink-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Assessment Arena</span>
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tight mb-2 text-slate-900 dark:text-white">
            Interactive Quiz Generator
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-8 font-medium">
            Test your knowledge! Select a document context and construct a customized test in seconds.
          </p>

          <GlassCard className="p-8 shadow-xl border border-slate-200/50 dark:border-slate-800/50 text-left relative min-h-[350px]">
            {isLocalLoading && <CardLoader message="Generating Quiz..." />}
            
            <div className="space-y-6">
              {/* Target File Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-2">Selected Document</label>
                {selectedFile ? (
                  <div className="flex items-center gap-2.5 p-3.5 bg-pink-500/5 rounded-xl border border-pink-500/25 text-xs">
                    <BookOpen className="w-4 h-4 text-pink-555 shrink-0 animate-pulse" />
                    <span className="font-semibold text-slate-700 dark:text-slate-250 truncate">{selectedFile.filename}</span>
                  </div>
                ) : (
                  <div className="p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/25 text-xs text-rose-500 font-bold">
                    No document selected. Please upload or select a file in the workspace first.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 block mb-2">Quiz Type</label>
                  <div className="relative">
                    <select
                      value={quizType}
                      onChange={(e) => setQuizType(e.target.value)}
                      disabled={isLocalLoading}
                      className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-3 text-xs font-semibold outline-none cursor-pointer text-slate-800 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-950"
                    >
                      <option value="mcq" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">Multiple Choice</option>
                      <option value="tf" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">True / False</option>
                      <option value="short" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">Short Answer</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <BookOpen className="w-3.5 h-3.5 text-pink-550" />
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg className="w-3.5 h-3.5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Difficulty Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 block mb-2">Difficulty</label>
                  <div className="relative">
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value)}
                      disabled={isLocalLoading}
                      className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-3 text-xs font-semibold outline-none cursor-pointer text-slate-800 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-950"
                    >
                      <option value="easy" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">Easy</option>
                      <option value="medium" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">Medium</option>
                      <option value="hard" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100">Hard</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Award className="w-3.5 h-3.5 text-pink-555" />
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg className="w-3.5 h-3.5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-2">Number of Questions</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={quizNumQuestions}
                    disabled={isLocalLoading}
                    onChange={(e) => setQuizNumQuestions(Math.min(5, Math.max(1, parseInt(e.target.value, 10) || 3)))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs font-semibold outline-none text-slate-700 dark:text-slate-200 disabled:opacity-50"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <HelpCircle className="w-3.5 h-3.5 text-pink-550" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block">Max 5 questions for local performance stability.</span>
              </div>

              {/* Action Generate */}
              <button
                onClick={handleGenerate}
                disabled={isLocalLoading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-pink-600 to-rose-650 hover:from-pink-500 hover:to-rose-550 shadow-md shadow-pink-500/10 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>Generate Quiz</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 2. RESULTS STATE: Results Dashboard */}
      {quizQuestions.length > 0 && showResultScreen && (
        <div className="max-w-xl w-full mx-auto animate-fade-in">
          <GlassCard className="p-8 shadow-xl border border-slate-200/50 dark:border-slate-800/50 text-center space-y-6">
            <div className="inline-flex p-4 rounded-3xl bg-violet-500/10 text-violet-500 mb-2">
              <Award className="w-12 h-12 stroke-1.5" />
            </div>

            <div>
              <h2 className="text-2xl font-display font-extrabold text-slate-950 dark:text-white">
                Test Completed!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-semibold">
                Here is your performance breakdown.
              </p>
            </div>

            {/* Performance Level */}
            {quizType !== "short" && (
              <div className={`p-4 rounded-xl border border-slate-200/20 ${feedback.color} max-w-sm mx-auto text-center`}>
                <h4 className="font-bold text-sm">{feedback.title}</h4>
                <p className="text-xs mt-1 opacity-90">{feedback.desc}</p>
              </div>
            )}

            {/* Score Grid stats */}
            <div className="grid grid-cols-3 gap-4 border-y border-slate-200/10 py-6 max-w-md mx-auto">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Correct</p>
                <p className="text-xl font-extrabold text-emerald-500 mt-1">
                  {quizType === "short" ? "-" : quizScore}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Incorrect</p>
                <p className="text-xl font-extrabold text-rose-500 mt-1">
                  {quizType === "short" ? "-" : (quizQuestions.length - quizScore)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Time Taken</p>
                <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
                  {formatTime(elapsedTime)}
                </p>
              </div>
            </div>

            {/* Score percentage circle */}
            {quizType !== "short" && (
              <div className="relative inline-flex items-center justify-center p-6 rounded-full bg-slate-500/5 mb-2">
                <div className="text-center">
                  <span className="text-3xl font-black text-pink-650 dark:text-pink-400">
                    {Math.round((quizScore / quizQuestions.length) * 100)}%
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Overall Accuracy</p>
                </div>
              </div>
            )}

            {/* Certificate Section */}
            {quizType !== "short" && Math.round((quizScore / quizQuestions.length) * 100) >= 75 && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 to-violet-500/10 border border-pink-500/20 text-center max-w-md mx-auto space-y-3 mt-4">
                <div className="flex items-center justify-center gap-1.5 text-pink-500 animate-pulse">
                  <Award className="w-5 h-5" />
                  <span className="font-display font-extrabold text-[10px] uppercase tracking-wider">Honor Certification</span>
                </div>
                <h4 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100">
                  Congratulations! You earned a Certificate of Achievement
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  You scored {Math.round((quizScore / quizQuestions.length) * 100)}%, exceeding the 75% honor threshold. Click below to download your official PDF Certificate.
                </p>
                <button
                  onClick={downloadCertificate}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Certificate (PDF)</span>
                </button>
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto pt-4">
              <button
                onClick={() => {
                  setShowResultScreen(false);
                  setIsReviewing(true);
                  setCurrentIdx(0);
                }}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-500/5 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer transition-colors truncate"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Answers</span>
              </button>
              
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-500/5 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer transition-colors truncate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Quiz</span>
              </button>
              
              <button
                onClick={handleResetSettings}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] cursor-pointer shadow-md transition-all truncate"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Quiz</span>
              </button>
            </div>

            <div className="pt-4 text-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 3. ACTIVE QUIZ STATE: Multi-Step Slide View */}
      {quizQuestions.length > 0 && !showResultScreen && (
        <div className="max-w-2xl w-full mx-auto animate-fade-in">
          {/* Header Progress panel */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] uppercase font-black text-pink-500 bg-pink-500/10 px-2.5 py-1 rounded-full">
                {isReviewing ? "Review Mode" : "Evaluation in Progress"}
              </span>
              <h2 className="font-display font-bold text-base text-slate-400 mt-2">
                Question <span className="text-slate-900 dark:text-white">{currentIdx + 1}</span> of {quizQuestions.length}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-500/5 px-3 py-1.5 rounded-xl border border-slate-200/5">
              <Timer className="w-4 h-4 text-pink-500" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
            <div 
              className="bg-pink-500 h-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>

          {/* Active Question Box */}
          <GlassCard className="p-8 border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="flex gap-4 items-start mb-6">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-pink-500/10 text-pink-500 text-xs font-bold shrink-0 shadow-sm">
                Q
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-relaxed">
                {quizQuestions[currentIdx].question}
              </h3>
            </div>

            {/* Answer Options */}
            {quizQuestions[currentIdx].options && quizQuestions[currentIdx].options.length > 0 ? (
              <div className="space-y-3.5 pl-11">
                {quizQuestions[currentIdx].options.map((opt, oIdx) => {
                  const isSelected = quizAnswers[currentIdx] === opt;
                  
                  let borderStyle = "border-slate-200 dark:border-slate-800 bg-slate-500/5 hover:bg-slate-500/10 text-slate-700 dark:text-slate-200";
                  let textIcon = null;

                  if (isSelected) {
                    borderStyle = "border-pink-500 bg-pink-500/10 text-pink-700 dark:text-pink-300 font-bold ring-2 ring-pink-500/10";
                  }

                  if (quizSubmitted) {
                    const q = quizQuestions[currentIdx];
                    const correctOptLetter = q.answer.trim().toUpperCase();
                    const correctOptionIndex = optionLetters.indexOf(correctOptLetter);
                    const isCorrectOption = (correctOptionIndex === oIdx) || (q.answer === opt);
                    
                    if (isCorrectOption) {
                      borderStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/10";
                      textIcon = <Check className="w-4 h-4 text-emerald-500 shrink-0" />;
                    } else if (isSelected) {
                      borderStyle = "border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300 font-bold ring-2 ring-rose-500/10";
                      textIcon = <X className="w-4 h-4 text-rose-500 shrink-0" />;
                    } else {
                      borderStyle = "opacity-45 border-slate-200 dark:border-slate-800 bg-slate-500/5";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleOptionSelect(currentIdx, opt)}
                      disabled={quizSubmitted}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm text-left transition-all cursor-pointer disabled:cursor-default ${borderStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-200/50 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                          {optionLetters[oIdx]}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {textIcon}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Text Area for Short Answers
              <div className="pl-11 space-y-4">
                <textarea
                  rows={4}
                  disabled={quizSubmitted}
                  value={quizAnswers[currentIdx] || ""}
                  onChange={(e) => handleOptionSelect(currentIdx, e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none text-slate-800 dark:text-slate-100 disabled:opacity-50 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                />
                
                {quizSubmitted && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Expected Answer Basis:</p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">"{quizQuestions[currentIdx].answer}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Explanation box during review mode */}
            {quizSubmitted && quizQuestions[currentIdx].explanation && (
              <div className="mt-6 pt-6 border-t border-slate-200/10 pl-11">
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15 text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                  <span className="font-bold text-violet-500 block mb-1">Source Context Details:</span>
                  {quizQuestions[currentIdx].explanation}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-500/5 text-slate-600 dark:text-slate-400 font-bold text-xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {isReviewing && (
              <button
                onClick={() => setShowResultScreen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
              >
                <span>Back to Scoreboard</span>
              </button>
            )}

            {currentIdx < quizQuestions.length - 1 ? (
              <button
                onClick={() => {
                  if (!quizAnswers[currentIdx] && quizType !== "short" && !quizSubmitted) {
                    showToast("Please choose an answer before moving on.", "info");
                    return;
                  }
                  setCurrentIdx(prev => prev + 1);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs cursor-pointer transition-all hover:opacity-90"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={quizSubmitted ? () => setShowResultScreen(true) : handleSubmitQuiz}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs cursor-pointer transition-all shadow-md"
              >
                {quizSubmitted ? "Done" : (quizType === "short" ? "Reveal Answers" : "Submit Quiz")}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizPage;
