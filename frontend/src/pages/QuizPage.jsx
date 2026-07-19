import React from 'react';
import { useApp } from '../context/AppContext';
import { generateQuiz } from '../services/api';
import { Check, X, Sparkles, HelpCircle, FileText, Activity } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import CardLoader from '../components/CardLoader';

const QuizPage = () => {
  const { 
    selectedFile, 
    showToast, 
    setLoading, 
    loading,
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
    setQuizNumQuestions
  } = useApp();

  const isLocalLoading = loading === "Generating Quiz...";

  const handleGenerate = async () => {
    if (!selectedFile) {
      showToast("Please upload and select a document first.", "error");
      return;
    }

    setLoading("Generating Quiz...");
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);

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
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleOptionSelect = (qIdx, opt) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: opt }));
  };

  const handleSubmit = () => {
    if (quizSubmitted) return;
    
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < quizQuestions.length && quizType !== "short") {
      showToast("Please answer all questions before submitting.", "info");
      return;
    }

    let correctCount = 0;
    
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
    showToast("Quiz evaluated successfully!", "success");
  };

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)]">
      <div className="text-center mb-10">
        <h1 className="font-display font-bold text-3xl mb-2 flex items-center justify-center gap-2">
          <HelpCircle className="w-7 h-7 text-pink-500" />
          <span>Interactive Quiz</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          Test your comprehension using automatically synthesized quizzes generated directly from your active document.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Settings Panel */}
        <div>
          <GlassCard className="space-y-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500">Settings</h3>
            
            {/* Type */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2">Quiz Type</label>
              <select
                value={quizType}
                onChange={(e) => setQuizType(e.target.value)}
                disabled={!!loading}
                className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none cursor-pointer text-slate-700 dark:text-slate-300 disabled:opacity-55"
              >
                <option value="mcq" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Multiple Choice (MCQ)</option>
                <option value="tf" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">True or False</option>
                <option value="short" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Short Answers</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2">Difficulty</label>
              <select
                value={quizDifficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={!!loading}
                className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none cursor-pointer text-slate-700 dark:text-slate-300 disabled:opacity-55"
              >
                <option value="easy" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Easy</option>
                <option value="medium" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Medium</option>
                <option value="hard" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Hard</option>
              </select>
            </div>

            {/* Question count */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2">Number of Questions</label>
              <input
                type="number"
                min="1"
                max="5"
                value={quizNumQuestions}
                disabled={!!loading}
                onChange={(e) => setQuizNumQuestions(Math.min(5, Math.max(1, parseInt(e.target.value, 10) || 3)))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none text-slate-700 dark:text-slate-300 disabled:opacity-55"
              />
            </div>

            {/* Selected File Context Info */}
            <div className="p-3 bg-pink-500/5 rounded-xl border border-pink-500/10 text-xs">
              {selectedFile ? (
                <p className="text-slate-500 dark:text-slate-400">
                  Target context: <span className="font-semibold text-pink-600 dark:text-pink-400 block truncate">{selectedFile.filename}</span>
                </p>
              ) : (
                <p className="text-rose-500 font-semibold">Please upload a document to proceed.</p>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!!loading || !selectedFile}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Generate Quiz</span>
            </button>
          </GlassCard>
        </div>

        {/* Quiz Questions List panel */}
        <div className="md:col-span-2 space-y-6 relative min-h-[360px]">
          {isLocalLoading && <CardLoader message="Generating Quiz..." />}
          
          {quizQuestions.length === 0 ? (
            <GlassCard className="min-h-[360px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
              <Activity className="w-12 h-12 stroke-1 mb-3 animate-pulse text-pink-500" />
              <p className="text-sm font-semibold">No active quiz generated</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs text-center">
                Confirm your document upload is selected and click the generate button to begin testing.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {quizQuestions.map((q, idx) => (
                <GlassCard key={idx} className="relative border border-slate-200 dark:border-slate-800">
                  <div className="flex gap-3 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/10 text-pink-500 text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-relaxed">{q.question}</h4>
                  </div>

                  {/* MCQ/TF Options list */}
                  {q.options && q.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = quizAnswers[idx] === opt;
                        
                        let borderStyle = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900";
                        let textIcon = null;

                        if (isSelected) {
                          borderStyle = "border-violet-500 bg-violet-500/10 text-violet-750 dark:text-violet-300 font-semibold";
                        }

                        if (quizSubmitted) {
                          const correctOptLetter = q.answer.trim().toUpperCase();
                          const correctOptionIndex = optionLetters.indexOf(correctOptLetter);
                          const isCorrectOption = (correctOptionIndex === oIdx) || (q.answer === opt);
                          
                          if (isCorrectOption) {
                            borderStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-750 dark:text-emerald-350 font-bold";
                            textIcon = <Check className="w-4 h-4 text-emerald-500 shrink-0" />;
                          } else if (isSelected) {
                            borderStyle = "border-rose-500 bg-rose-500/15 text-rose-750 dark:text-rose-350 font-semibold";
                            textIcon = <X className="w-4 h-4 text-rose-500 shrink-0" />;
                          } else {
                            borderStyle = "opacity-55 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleOptionSelect(idx, opt)}
                            disabled={quizSubmitted}
                            className={`flex items-center justify-between p-3.5 rounded-xl border text-xs text-left transition-all cursor-pointer disabled:cursor-default ${borderStyle}`}
                          >
                            <span className="truncate pr-4">{opt}</span>
                            {textIcon}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // Short answers text area
                    <div className="pl-9 space-y-3">
                      <textarea
                        rows={2}
                        disabled={quizSubmitted}
                        value={quizAnswers[idx] || ""}
                        onChange={(e) => handleOptionSelect(idx, e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs outline-none text-slate-800 dark:text-slate-100 disabled:opacity-55"
                      />
                      
                      {quizSubmitted && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs mt-2">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Sample Answer Reference:</p>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">"{q.answer}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              ))}

              {/* Submit / Score summary */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                {quizSubmitted && quizScore !== null && quizType !== "short" && (
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold">
                      Your Score: <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{quizScore}</span> / <span className="font-bold">{quizQuestions.length}</span>
                    </p>
                    <span className="text-xs text-slate-400">({Math.round((quizScore / quizQuestions.length) * 100)}% accuracy)</span>
                  </div>
                )}

                <div className="flex gap-2 w-full sm:w-auto ml-auto">
                  <button
                    onClick={handleClear}
                    disabled={!!loading}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Clear Quiz
                  </button>
                  
                  {!quizSubmitted && (
                    <button
                      onClick={handleSubmit}
                      className="px-8 py-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-all shadow-md cursor-pointer"
                    >
                      {quizType === "short" ? "Reveal Answers" : "Submit Score"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default QuizPage;
