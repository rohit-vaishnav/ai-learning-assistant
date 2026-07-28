import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import api, { uploadFile } from '../services/api';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle2, FileText, ChevronRight, Info } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const UploadPage = () => {
  const { refreshDocuments, showToast, setLoading } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { name, progress, step }
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'pptx'].includes(ext)) {
      showToast("Unsupported file format. Please upload PDF, DOCX, or PPTX.", "error");
      return;
    }

    setUploadStatus({ name: file.name, progress: 10, step: "Uploading..." });
    setLoading("Processing Document...");

    try {
      // 1. Post file to backend (immediately returns status)
      const res = await uploadFile(file);
      
      // Cache check: if document was already processed
      if (res.data.status === "Ready") {
        setUploadStatus({ name: file.name, progress: 100, step: "Ready (cached)" });
        showToast(`Loaded ${file.name} from cache.`, "success");
        await refreshDocuments();
        setLoading(false);
        setTimeout(() => setUploadStatus(null), 3000);
        return;
      }

      // 2. Poll for status in the background
      let isCompleted = false;
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes timeout
      
      while (!isCompleted && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 800)); // check every 800ms
        attempts++;

        const statusRes = await api.get(`/upload/status?filename=${encodeURIComponent(file.name)}`);
        const status = statusRes.data.status;

        if (status === "Extracting Text...") {
          setUploadStatus({ name: file.name, progress: 35, step: "Extracting Text..." });
        } else if (status === "Creating Embeddings...") {
          setUploadStatus({ name: file.name, progress: 70, step: "Creating Embeddings..." });
        } else if (status === "Ready") {
          setUploadStatus({ name: file.name, progress: 100, step: "Ready" });
          isCompleted = true;
          showToast(`Successfully indexed ${file.name}`, "success");
          await refreshDocuments();
        } else if (status && status.startsWith("Error")) {
          isCompleted = true;
          setUploadStatus({ name: file.name, progress: 0, step: status });
          showToast(status, "error");
        }
      }

      if (attempts >= maxAttempts) {
        showToast("Processing timed out. Please try again.", "error");
        setUploadStatus({ name: file.name, progress: 0, step: "Timeout" });
      }

    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Upload error occurred. Check backend logs.";
      showToast(detail, "error");
      setUploadStatus({ name: file.name, progress: 0, step: "Error" });
    } finally {
      setLoading(false);
      setTimeout(() => setUploadStatus(null), 4000);
    }
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto text-slate-800 dark:text-slate-100 min-h-[calc(100vh-80px)] animate-fade-in-up">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-semibold mb-4 tracking-wide uppercase border border-violet-500/20">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Ingestion Console</span>
        </div>
        <h1 className="font-display font-bold text-3xl mb-2">Upload Study Materials</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto">
          Add textbooks, slides, and syllabus files. Embeddings will be computed locally using `SentenceTransformers`.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Dropzone area */}
        <div className="md:col-span-7">
          <GlassCard className="border border-slate-200 dark:border-slate-800 p-6 h-full">
            <form 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className="h-full flex flex-col justify-center"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.pptx"
                onChange={handleChange}
              />

              <div 
                onClick={() => fileInputRef.current.click()}
                className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer p-8 text-center transition-all min-h-[280px] group ${
                  dragActive 
                    ? 'border-violet-500 bg-violet-500/10' 
                    : 'border-slate-300 dark:border-slate-800 bg-slate-500/5 dark:bg-slate-950/20 hover:bg-slate-500/10 dark:hover:bg-slate-950/30'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/10 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform animate-pulse">
                  <UploadCloud className="w-8 h-8 text-violet-500 stroke-1" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Drag & Drop file here</p>
                <p className="text-xs text-slate-450 mt-1">or click to browse local files</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold bg-slate-200/50 dark:bg-slate-800/80 px-2.5 py-1 rounded-full mt-4">
                  PDF, DOCX, or PPTX up to 25MB
                </span>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Requirements and active statuses */}
        <div className="md:col-span-5">
          <GlassCard className="h-full flex flex-col justify-between p-6">
            <div>
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Pipeline Workflow</h3>
              
              <ul className="space-y-4">
                <li className="flex gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/10 text-violet-500 flex items-center justify-center font-bold shrink-0 text-[10px]">1</div>
                  <div>
                    <p className="font-semibold text-slate-750 dark:text-slate-200">Text Extraction</p>
                    <p className="text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">Reads visual pages, doc paragraphs, or slides.</p>
                  </div>
                </li>
                <li className="flex gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/10 text-indigo-500 flex items-center justify-center font-bold shrink-0 text-[10px]">2</div>
                  <div>
                    <p className="font-semibold text-slate-750 dark:text-slate-200">Text Chunking</p>
                    <p className="text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">Splits content recursively into 1000-char blocks.</p>
                  </div>
                </li>
                <li className="flex gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/10 text-pink-500 flex items-center justify-center font-bold shrink-0 text-[10px]">3</div>
                  <div>
                    <p className="font-semibold text-slate-750 dark:text-slate-200">Vector Indexing</p>
                    <p className="text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">Computes and caches embeddings inside local FAISS DB.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-200/10 mt-4 flex gap-2 items-start text-xs text-slate-400 dark:text-slate-500">
              <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <p>Uploaded contents reside on your local backend server environment and are processed safely.</p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Progress status card overlay */}
      {uploadStatus && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <GlassCard className="border border-violet-500/20 bg-violet-500/5">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-500" />
                <span className="font-semibold text-sm truncate max-w-xs">{uploadStatus.name}</span>
              </div>
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{uploadStatus.progress}%</span>
            </div>
            
            {/* Progress bar line */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full transition-all duration-300"
                style={{ width: `${uploadStatus.progress}%` }}
              />
            </div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center gap-1.5">
              {uploadStatus.progress === 100 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
              )}
              <span>{uploadStatus.step}</span>
            </p>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};

export default UploadPage;
