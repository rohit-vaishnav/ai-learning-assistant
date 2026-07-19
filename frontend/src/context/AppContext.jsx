import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDocuments } from '../services/api';
import { useTheme } from '../hooks/useTheme';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }
  const { theme, toggleTheme } = useTheme();

  // Persisted Page States
  // 1. Chat Page
  const [chatMessages, setChatMessages] = useState([]);

  // 2. Summary Page
  const [summaryText, setSummaryText] = useState("");
  const [summaryType, setSummaryType] = useState("short");
  const [summaryActiveTab, setSummaryActiveTab] = useState("file");
  const [summaryCustomText, setSummaryCustomText] = useState("");

  // 3. Quiz Page
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizType, setQuizType] = useState("mcq");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizNumQuestions, setQuizNumQuestions] = useState(3);

  // 4. Explain Page
  const [explainTopicVal, setExplainTopicVal] = useState("");
  const [explainMode, setExplainMode] = useState("student");
  const [explainUseContext, setExplainUseContext] = useState(false);
  const [explainOutput, setExplainOutput] = useState("");

  // 5. Translate Page
  const [translateSourceText, setTranslateSourceText] = useState("");
  const [translateTargetLang, setTranslateTargetLang] = useState("hindi");
  const [translateOutput, setTranslateOutput] = useState("");

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const clearToast = () => setToast(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const refreshDocuments = async () => {
    try {
      const res = await getDocuments();
      setUploadedFiles(res.data);
      if (res.data.length > 0) {
        setSelectedFile((prev) => {
          if (prev && res.data.some(f => f.filename === prev.filename)) {
            return res.data.find(f => f.filename === prev.filename);
          }
          return res.data[0];
        });
      } else {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  useEffect(() => {
    refreshDocuments();
  }, []);

  return (
    <AppContext.Provider value={{
      uploadedFiles,
      setUploadedFiles,
      selectedFile,
      setSelectedFile,
      loading,
      setLoading,
      toast,
      showToast,
      clearToast,
      theme,
      toggleTheme,
      refreshDocuments,

      // Chat state
      chatMessages,
      setChatMessages,

      // Summary state
      summaryText,
      setSummaryText,
      summaryType,
      setSummaryType,
      summaryActiveTab,
      setSummaryActiveTab,
      summaryCustomText,
      setSummaryCustomText,

      // Quiz state
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

      // Explain state
      explainTopicVal,
      setExplainTopicVal,
      explainMode,
      setExplainMode,
      explainUseContext,
      setExplainUseContext,
      explainOutput,
      setExplainOutput,

      // Translate state
      translateSourceText,
      setTranslateSourceText,
      translateTargetLang,
      setTranslateTargetLang,
      translateOutput,
      setTranslateOutput
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
