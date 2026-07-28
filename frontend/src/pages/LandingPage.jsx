import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  FileText, 
  MessageSquare, 
  Activity, 
  ArrowRight, 
  Languages, 
  HelpCircle, 
  UploadCloud, 
  Compass, 
  Star 
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

import { useApp } from '../context/AppContext';

const LandingPage = () => {
  const { isAuthenticated } = useApp();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-violet-500" />,
      title: "Document Chat",
      desc: "Interact with your PDF, DOCX, and PPTX documents using a RAG pipeline. Cite pages and sources."
    },
    {
      icon: <Activity className="w-6 h-6 text-indigo-500" />,
      title: "Summarization",
      desc: "Generate short overviews, thorough detailed synopses, or structured bullet-point revision notes."
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-pink-500" />,
      title: "Interactive Quizzes",
      desc: "Test comprehension with automatic MCQ, true/false, and short answer evaluation."
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-emerald-500" />,
      title: "Explain Concepts",
      desc: "Clarify confusing topics with beginner analogies, student study guides, or technical deep-dives."
    },
    {
      icon: <Languages className="w-6 h-6 text-sky-500" />,
      title: "NLLB-200 Translation",
      desc: "Translate explanations and summaries instantly into Hindi, Gujarati, French, or Spanish."
    },
    {
      icon: <UploadCloud className="w-6 h-6 text-amber-500" />,
      title: "Multi-Format Parser",
      desc: "Upload slides, corporate manuals, and assignments. Extracts text, indexes vectors seamlessly."
    }
  ];

  return (
    <div className="relative min-height-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden pb-12 transition-colors duration-300">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 max-w-6xl mx-auto text-center flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-600 dark:text-violet-400 mb-8"
        >
          <Star className="w-3.5 h-3.5 fill-violet-500" />
          <span>Local Hugging Face Seq2Seq Pipeline</span>
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-extrabold text-4xl sm:text-6xl tracking-tight leading-[1.1] mb-6 max-w-4xl"
        >
          Your Intelligent <span className="gradient-text">AI Learning Assistant</span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed font-sans"
        >
          Upload documents and extract instant insights. Ask questions, generate interactive tests, simplify subjects, and translate results locally.
        </motion.p>
        
        <motion.div 
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full"
        >
          <NavLink 
            to={isAuthenticated ? "/dashboard" : "/register"} 
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 transition-all duration-300 transform hover:-y-0.5 active:scale-95"
          >
            <span>{isAuthenticated ? "Enter Workspace" : "Get Started Free"}</span>
            <ArrowRight className="w-5 h-5" />
          </NavLink>
          
          <NavLink 
            to={isAuthenticated ? "/upload" : "/login"} 
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95"
          >
            <span>{isAuthenticated ? "Upload Document" : "Sign In"}</span>
          </NavLink>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">Powerful Learning Modalities</h2>
          <p className="text-slate-500 dark:text-slate-400">Everything you need to master lectures, slides, and textbooks.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat, idx) => (
            <motion.div variants={itemVariants} key={idx}>
              <GlassCard className="h-full flex flex-col justify-between hover:shadow-xl hover:border-violet-500/30 group">
                <div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform duration-300">
                    {feat.icon}
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-3 text-slate-900 dark:text-slate-100">{feat.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{feat.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Workflow Section */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="glass-premium rounded-3xl p-8 sm:p-12 border border-slate-200/50 dark:border-slate-800/50">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">Under The Hood: RAG Pipeline</h2>
            <p className="text-slate-500 dark:text-slate-400">Understanding how your uploads are processed using local deep learning pipelines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center text-center">
            {/* Step 1 */}
            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-full bg-violet-500 text-white font-bold flex items-center justify-center shadow-md mb-4">1</div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Upload Document</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">PDF, DOCX, or PPTX parser extracts contents.</p>
            </div>
            {/* Divider */}
            <div className="hidden md:flex justify-center text-violet-500/40"><ArrowRight className="w-8 h-8" /></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shadow-md mb-4">2</div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Index Embeddings</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">SentenceTransformer creates vector maps.</p>
            </div>
            {/* Divider */}
            <div className="hidden md:flex justify-center text-violet-500/40"><ArrowRight className="w-8 h-8" /></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center p-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shadow-md mb-4">3</div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">FLAN-T5 Synthesis</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Retrieves chunks to output accurate QA response.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="px-6 py-12 max-w-4xl mx-auto text-center">
        <h2 className="font-display font-bold text-3xl mb-6">Ready to Supercharge Your Studying?</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8 text-sm">
          Run inference models directly in the backend. 100% data privacy. No third party keys required.
        </p>
        <NavLink 
          to="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg"
        >
          <span>Get Started Now</span>
          <ArrowRight className="w-4 h-4" />
        </NavLink>
      </section>
    </div>
  );
};

export default LandingPage;
