
import React from 'react';
import { Sparkles, Clock, ArrowLeft, Cpu } from 'lucide-react';
import { useAppStore } from '../store';
import { View } from '../types';
import { motion } from 'framer-motion';

const ComingSoon: React.FC = () => {
  const { viewLabel, setView } = useAppStore();

  return (
    <div className="h-full flex items-center justify-center py-20 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-xl w-full glass p-12 md:p-16 rounded-[3rem] border-white/20 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#3BF48F]/10 blur-[80px] -z-10" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#3BF48F]/5 blur-[100px] -z-10" />

        <div className="inline-block p-5 bg-[#3BF48F]/10 rounded-3xl border border-white/20 mb-10 shadow-2xl shadow-[#3BF48F]/10">
          <Cpu size={48} className="text-[#3BF48F] animate-pulse" />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-black font-heading italic uppercase tracking-tighter text-white leading-tight">
              {viewLabel || 'NEW FEATURE'} <br/><span className="text-[#3BF48F]">ON THE HORIZON</span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-[#3BF48F]/60 text-[10px] font-black uppercase tracking-[0.3em]">
              <Sparkles size={12} />
              Engine V5 Integration
              <Sparkles size={12} />
            </div>
          </div>
          
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
            Our neural labs are working tirelessly to bring this powerful engine to your studio. Expect unprecedented creative freedom.
          </p>
        </div>

        <div className="mt-12 space-y-6">
           <div className="flex items-center justify-center gap-3 text-slate-400 font-black font-mono text-[10px] uppercase tracking-widest bg-white/5 py-3 rounded-2xl border border-white/10">
             <Clock size={14} className="animate-spin text-[#3BF48F]" /> 
             Build Status: 92% Complete
           </div>
           
           <button 
             onClick={() => setView(View.DASHBOARD)} 
             className="group flex items-center justify-center gap-3 w-full py-4 text-white hover:text-[#3BF48F] transition-all font-black uppercase tracking-widest text-[10px]"
           >
             <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
             Return to Headquarters
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
