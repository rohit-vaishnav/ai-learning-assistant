import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDocuments, login, register, logout, getDashboardStats } from '../services/api';
import { useTheme } from '../hooks/useTheme';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  // Dashboard telemetry stats
  const [dashboardStats, setDashboardStats] = useState(null);

  // App State
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }
  const { theme, toggleTheme } = useTheme();

  // Persisted Page States
  // 1. Chat Page
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const val = localStorage.getItem('chatMessages');
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  });

  // 2. Summary Page
  const [summaryText, setSummaryText] = useState(() => localStorage.getItem('summaryText') || "");
  const [summaryType, setSummaryType] = useState(() => localStorage.getItem('summaryType') || "short");
  const [summaryActiveTab, setSummaryActiveTab] = useState(() => localStorage.getItem('summaryActiveTab') || "file");
  const [summaryCustomText, setSummaryCustomText] = useState(() => localStorage.getItem('summaryCustomText') || "");

  // 3. Quiz Page
  const [quizQuestions, setQuizQuestions] = useState(() => {
    try {
      const val = localStorage.getItem('quizQuestions');
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  });
  const [quizAnswers, setQuizAnswers] = useState(() => {
    try {
      const val = localStorage.getItem('quizAnswers');
      return val ? JSON.parse(val) : {};
    } catch {
      return {};
    }
  });
  const [quizSubmitted, setQuizSubmitted] = useState(() => {
    try {
      const val = localStorage.getItem('quizSubmitted');
      return val ? JSON.parse(val) : false;
    } catch {
      return false;
    }
  });
  const [quizScore, setQuizScore] = useState(() => {
    try {
      const val = localStorage.getItem('quizScore');
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  });
  const [quizType, setQuizType] = useState(() => localStorage.getItem('quizType') || "mcq");
  const [quizDifficulty, setQuizDifficulty] = useState(() => localStorage.getItem('quizDifficulty') || "medium");
  const [quizNumQuestions, setQuizNumQuestions] = useState(() => {
    try {
      const val = localStorage.getItem('quizNumQuestions');
      return val ? JSON.parse(val) : 3;
    } catch {
      return 3;
    }
  });

  // 4. Explain Page
  const [explainTopicVal, setExplainTopicVal] = useState(() => localStorage.getItem('explainTopicVal') || "");
  const [explainMode, setExplainMode] = useState(() => localStorage.getItem('explainMode') || "student");
  const [explainUseContext, setExplainUseContext] = useState(() => {
    try {
      const val = localStorage.getItem('explainUseContext');
      return val ? JSON.parse(val) : false;
    } catch {
      return false;
    }
  });
  const [explainOutput, setExplainOutput] = useState(() => localStorage.getItem('explainOutput') || "");

  // 5. Translate Page
  const [translateSourceText, setTranslateSourceText] = useState(() => localStorage.getItem('translateSourceText') || "");
  const [translateTargetLang, setTranslateTargetLang] = useState(() => localStorage.getItem('translateTargetLang') || "hindi");
  const [translateOutput, setTranslateOutput] = useState(() => localStorage.getItem('translateOutput') || "");

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

  // Sync Chat Page
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Sync Summary Page
  useEffect(() => {
    localStorage.setItem('summaryText', summaryText || "");
    localStorage.setItem('summaryType', summaryType || "short");
    localStorage.setItem('summaryActiveTab', summaryActiveTab || "file");
    localStorage.setItem('summaryCustomText', summaryCustomText || "");
  }, [summaryText, summaryType, summaryActiveTab, summaryCustomText]);

  // Sync Quiz Page
  useEffect(() => {
    localStorage.setItem('quizQuestions', JSON.stringify(quizQuestions));
    localStorage.setItem('quizAnswers', JSON.stringify(quizAnswers));
    localStorage.setItem('quizSubmitted', JSON.stringify(quizSubmitted));
    localStorage.setItem('quizScore', JSON.stringify(quizScore));
    localStorage.setItem('quizType', quizType || "mcq");
    localStorage.setItem('quizDifficulty', quizDifficulty || "medium");
    localStorage.setItem('quizNumQuestions', JSON.stringify(quizNumQuestions));
  }, [quizQuestions, quizAnswers, quizSubmitted, quizScore, quizType, quizDifficulty, quizNumQuestions]);

  // Sync Explain Page
  useEffect(() => {
    localStorage.setItem('explainTopicVal', explainTopicVal || "");
    localStorage.setItem('explainMode', explainMode || "student");
    localStorage.setItem('explainUseContext', JSON.stringify(explainUseContext));
    localStorage.setItem('explainOutput', explainOutput || "");
  }, [explainTopicVal, explainMode, explainUseContext, explainOutput]);

  // Sync Translate Page
  useEffect(() => {
    localStorage.setItem('translateSourceText', translateSourceText || "");
    localStorage.setItem('translateTargetLang', translateTargetLang || "hindi");
    localStorage.setItem('translateOutput', translateOutput || "");
  }, [translateSourceText, translateTargetLang, translateOutput]);

  // Document management (Enforce authentication guard)
  const refreshDocuments = async () => {
    const activeToken = localStorage.getItem('token');
    if (!activeToken) return;
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

  // Dashboard Telemetry
  const refreshDashboardStats = async () => {
    const activeToken = localStorage.getItem('token');
    if (!activeToken) return;
    try {
      const res = await getDashboardStats();
      setDashboardStats(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  };

  // Login handler
  const handleLogin = async (email, password, rememberMe = true) => {
    setLoading(true);
    try {
      const res = await login(email, password);
      const { access_token, user: userData } = res.data;
      
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      showToast(`Welcome back, ${userData.name}!`, "success");
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Invalid credentials.";
      showToast(errMsg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Registration handler
  const handleRegister = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await register(name, email, password);
      const { access_token, user: userData } = res.data;
      
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      showToast(`Account created successfully! Welcome, ${userData.name}!`, "success");
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Registration failed.";
      showToast(errMsg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // client-side validation clear anyway
    }
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setDashboardStats(null);
    setUploadedFiles([]);
    setSelectedFile(null);
    
    // Clear page states
    setChatMessages([]);
    setSummaryText("");
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setExplainTopicVal("");
    setExplainOutput("");
    setTranslateSourceText("");
    setTranslateOutput("");

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('summaryText');
    localStorage.removeItem('summaryType');
    localStorage.removeItem('summaryActiveTab');
    localStorage.removeItem('summaryCustomText');
    localStorage.removeItem('quizQuestions');
    localStorage.removeItem('quizAnswers');
    localStorage.removeItem('quizSubmitted');
    localStorage.removeItem('quizScore');
    localStorage.removeItem('quizType');
    localStorage.removeItem('quizDifficulty');
    localStorage.removeItem('quizNumQuestions');
    localStorage.removeItem('explainTopicVal');
    localStorage.removeItem('explainMode');
    localStorage.removeItem('explainUseContext');
    localStorage.removeItem('explainOutput');
    localStorage.removeItem('translateSourceText');
    localStorage.removeItem('translateTargetLang');
    localStorage.removeItem('translateOutput');
    
    showToast("Logged out successfully.", "info");
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshDocuments();
      refreshDashboardStats();
    }
  }, [isAuthenticated]);

  return (
    <AppContext.Provider value={{
      // Auth Exports
      token,
      user,
      isAuthenticated,
      dashboardStats,
      handleLogin,
      handleRegister,
      handleLogout,
      refreshDashboardStats,

      // App Exports
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
