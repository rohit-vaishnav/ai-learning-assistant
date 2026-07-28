import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { chatWithDocument } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Trash2, 
  User, 
  Sparkles, 
  FileText, 
  Compass, 
  BookOpen 
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

// Animated text typing effect
const TypewriterText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let index = 0;
    const words = text.split(" ");
    if (words.length === 0) {
      setDisplayedText(text);
      if (onComplete) onComplete();
      return;
    }
    
    const interval = setInterval(() => {
      if (index < words.length) {
        setDisplayedText((prev) => prev + (prev ? " " : "") + words[index]);
        index++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 30); // comfortable speed (30ms per word)
    
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return (
    <div className="prose dark:prose-invert leading-relaxed">
      <ReactMarkdown>{displayedText}</ReactMarkdown>
    </div>
  );
};

const ChatPage = () => {
  const { 
    selectedFile, 
    showToast, 
    chatMessages: messages,
    setChatMessages: setMessages
  } = useApp();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isStreaming]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping || isStreaming) return;
    if (!selectedFile) {
      showToast("Please upload and select a document first.", "error");
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Change progress overlay text to generating answer
      setTimeout(() => {
        // Local streaming state is active
      }, 600);

      const apiUrl = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ""
        ? import.meta.env.VITE_API_URL
        : (window.location.origin.includes("localhost:5173") ? "http://localhost:8000" : window.location.origin);
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          question: userMsg.text,
          index_name: "default"
        })
      });

      if (!response.ok) {
        throw new Error("Server responded with error status");
      }

      setIsTyping(false);
      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let finished = false;
      let firstChunk = true;
      let assistantText = "";
      let assistantSources = [];
      let buffer = "";

      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg = {
        id: assistantMsgId,
        role: 'assistant',
        text: "",
        sources: []
      };

      setMessages((prev) => [...prev, assistantMsg]);

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        if (firstChunk) {
          const newlineIndex = buffer.indexOf("\n");
          if (newlineIndex !== -1) {
            const firstLine = buffer.substring(0, newlineIndex);
            const remainingText = buffer.substring(newlineIndex + 1);
            try {
              const meta = JSON.parse(firstLine);
              assistantSources = meta.sources || [];
            } catch (err) {
              assistantText += firstLine + "\n";
            }
            assistantText += remainingText;
            firstChunk = false;
          }
        } else {
          assistantText += chunk;
        }

        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.id === assistantMsgId) {
            lastMsg.text = assistantText;
            lastMsg.sources = assistantSources;
          }
          return updated;
        });
      }

      setIsStreaming(false);

    } catch (err) {
      console.error(err);
      showToast("Failed to fetch response from local server.", "error");
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I couldn't fetch an answer due to server issues. Verify your FastAPI terminal is running.",
        sources: []
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    showToast("Conversation cleared.", "info");
  };

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto text-slate-800 dark:text-slate-100 h-[calc(100vh-80px)] flex flex-col justify-between animate-fade-in-up">
      
      {/* Header Info */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-semibold tracking-wide uppercase border border-violet-500/20">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Query Console</span>
          </div>
          <h1 className="font-display font-bold text-2xl mt-2 flex items-center gap-2 text-slate-900 dark:text-white">
            <span>Document Chat</span>
          </h1>
          {selectedFile ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/5 border border-violet-500/15 rounded-xl text-xs text-slate-650 dark:text-slate-350 mt-2.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-550 shrink-0 animate-pulse" />
              <span className="truncate font-semibold max-w-[280px]">{selectedFile.filename}</span>
            </div>
          ) : (
            <p className="text-xs text-rose-500 mt-2 font-semibold">No active document selected. Upload to begin.</p>
          )}
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-500/5 border border-slate-200/10 dark:border-slate-800/10 transition-all cursor-pointer"
            title="Clear Chat Log"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Message window wrapped in a premium GlassCard */}
      <GlassCard className="flex-1 overflow-y-auto my-4 p-6 space-y-6 border border-slate-200 dark:border-slate-800/60 shadow-lg min-h-[300px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/10 flex items-center justify-center mb-4 shadow-sm">
              <Compass className="w-8 h-8 text-violet-500 stroke-1 animate-spin-slow" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Ask anything about your document</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
              The model utilizes semantic search vectors in FAISS to query source text chunks and generate responses.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for assistant */}
                {msg.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                )}

                {/* Message bubble */}
                <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                  <div 
                    className={`rounded-2xl px-4.5 py-3 text-sm shadow-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-650 text-white font-medium rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-tl-none text-slate-850 dark:text-slate-100'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                      // Typewriter effect only if not streaming and it is the latest message
                      messages[messages.length - 1].id === msg.id && !isStreaming && isTyping ? (
                        <TypewriterText text={msg.text} />
                      ) : (
                        <div className="prose dark:prose-invert leading-relaxed">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )
                    )}
                  </div>

                  {/* Citation sources card */}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Cited Sources:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <div 
                            key={sIdx}
                            className="p-2.5 rounded-lg bg-slate-500/5 border border-slate-200/10 dark:border-slate-800/10 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400"
                          >
                            <div className="flex justify-between items-center font-bold text-slate-600 dark:text-slate-300 mb-1">
                              <span className="truncate max-w-[120px]">{src.source}</span>
                              <span className="flex items-center gap-0.5 text-violet-600 dark:text-violet-400">
                                <BookOpen className="w-3 h-3" />
                                <span>Pg {src.page}</span>
                              </span>
                            </div>
                            <p className="line-clamp-2 italic">"{src.content}"</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Avatar for user */}
                {msg.role === 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-300/10">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading / Typing indicator */}
        {isTyping && (
          <div className="flex gap-4 items-center justify-start">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </GlassCard>

      {/* Input container bar */}
      <form onSubmit={handleSubmit} className="flex gap-3 shrink-0 pt-2 border-t border-slate-200 dark:border-slate-850">
        <div className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!selectedFile || isTyping}
            type="text"
            placeholder={selectedFile ? "Type your question..." : "Please upload a document to begin chatting"}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:ring-2 focus:ring-violet-500/10 rounded-2xl pl-5 pr-12 py-3.5 text-sm outline-none text-slate-850 dark:text-slate-105 transition-all placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!selectedFile || !input.trim() || isTyping}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-500/10 flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;
