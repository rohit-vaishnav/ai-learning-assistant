import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import LoadingOverlay from './components/LoadingOverlay';
import ToastNotification from './components/ToastNotification';

// Public Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected Pages
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import ChatPage from './pages/ChatPage';
import SummaryPage from './pages/SummaryPage';
import QuizPage from './pages/QuizPage';
import ExplainPage from './pages/ExplainPage';
import TranslatePage from './pages/TranslatePage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Auth Route Guard (Redirect authenticated users away from login/register)
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AppContent = () => {
  const { loading, toast, clearToast } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header bar */}
      <Navbar />
      
      {/* Routed Main pages */}
      <main className="relative">
        <Routes>
          {/* Public Landing */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth pages */}
          <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
          <Route path="/forgot-password" element={<AuthRoute><ForgotPasswordPage /></AuthRoute>} />
          <Route path="/reset-password" element={<AuthRoute><ResetPasswordPage /></AuthRoute>} />
          
          {/* Protected student pages */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/explain" element={<ProtectedRoute><ExplainPage /></ProtectedRoute>} />
          <Route path="/translate" element={<ProtectedRoute><TranslatePage /></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global state notification popups and loader masks */}
      {!!loading && (
        <LoadingOverlay 
          message={typeof loading === 'string' ? loading : "Processing requested task..."} 
        />
      )}
      
      <ToastNotification toast={toast} onClose={clearToast} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
}

export default App;
