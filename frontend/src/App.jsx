import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import LoadingOverlay from './components/LoadingOverlay';
import ToastNotification from './components/ToastNotification';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import ChatPage from './pages/ChatPage';
import SummaryPage from './pages/SummaryPage';
import QuizPage from './pages/QuizPage';
import ExplainPage from './pages/ExplainPage';
import TranslatePage from './pages/TranslatePage';
import NotFoundPage from './pages/NotFoundPage';

const AppContent = () => {
  const { loading, toast, clearToast } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header bar */}
      <Navbar />
      
      {/* Routed Main pages */}
      <main className="relative">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/explain" element={<ExplainPage />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global state notification popups and loader masks */}
      {loading === true && (
        <LoadingOverlay 
          message="Uploading and indexing file..." 
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
