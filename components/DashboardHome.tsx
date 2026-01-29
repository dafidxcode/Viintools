
import React from 'react';
import { useAppStore } from '../store';
import { View } from '../types';
import {
  Music, Video, Image as ImageIcon, Wand2,
  ArrowRight, Crown, Sparkles, Zap, Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardHome: React.FC = () => {
  const { setView, user } = useAppStore();

  const features = [
    {
      label: 'Music Generator',
      id: View.MUSIC_GEN,
      description: 'Create professional songs with Suno V3.5 technology',
      icon: Music,
      color: 'from-emerald-400 to-cyan-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      accent: 'text-emerald-400',
      isNew: true
    },
    {
      label: 'Video Generator',
      id: View.VEO_VIDEO,
      description: 'Generate realistic videos from text or images',
      icon: Video,
      color: 'from-blue-400 to-indigo-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      accent: 'text-blue-400',
      isNew: false
    },
    {
      label: 'Image Generator',
      id: View.IMAGEN,
      description: 'High-fidelity image generation with Imagen 3',
      icon: ImageIcon,
      color: 'from-purple-400 to-pink-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
      accent: 'text-purple-400',
      isNew: false
    },
    {
      label: 'Text to Speech',
      id: View.TEXT_TO_SPEECH,
      description: 'Clone voices or convert text to natural speech',
      icon: Wand2,
      color: 'from-orange-400 to-amber-400',
      bg: 'bg-orange-400/10',
      border: 'border-orange-400/20',
      accent: 'text-orange-400',
      isNew: false
    }
  ];

  const quickTools = [
    { label: 'Audio Split', id: View.MUSIC_SPLIT, icon: Layers },
    { label: 'Songs Cover', id: View.MUSIC_COVER, icon: Sparkles },
    { label: 'Grok Generator', id: View.GROK_VIDEO, icon: Zap },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#151926] to-[#090B14] border border-white/5 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3BF48F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#3BF48F] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#3BF48F]">System Online</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black font-heading italic text-white leading-tight">
              WELCOME BACK, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 uppercase">{user?.name?.split(' ')[0] || 'CREATOR'}</span>
            </h1>
            <p className="text-slate-400 max-w-lg text-sm leading-relaxed">
              Explore the next generation of AI tools. Create music, videos, and images with professional-grade neural engines.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button onClick={() => setView(View.MUSIC_GEN)} className="px-8 py-4 bg-[#3BF48F] hover:bg-[#2ED079] text-[#090B14] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#3BF48F]/20 transition-all flex items-center gap-2 group">
              Start Creating <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {user?.plan !== 'PRO' && (
              <button onClick={() => setView(View.UPGRADE_PACKAGE)} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2">
                <Crown size={16} className="text-amber-400" /> Upgrade Plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setView(feature.id)}
            className={`group relative overflow-hidden rounded-3xl bg-[#0F121C] border border-white/5 p-6 cursor-pointer hover:border-white/10 transition-all hover:translate-y-[-4px]`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-0 group-hover:opacity-20 transition-all bg-gradient-to-br ${feature.color}`} />

            <div className="space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feature.bg} ${feature.border} border`}>
                <feature.icon size={24} className={feature.accent} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#3BF48F] transition-colors">{feature.label}</h3>
                  {feature.isNew && <span className="text-[9px] font-black bg-[#3BF48F] text-[#090B14] px-1.5 py-0.5 rounded uppercase">New</span>}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Tools & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Access */}
        <div className="lg:col-span-2 glass rounded-3xl p-8 border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Quick Tools</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickTools.map(tool => (
              <button
                key={tool.label}
                onClick={() => setView(tool.id)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#090B14] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <tool.icon size={18} className="text-slate-400 group-hover:text-white" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white group-hover:text-[#3BF48F] transition-colors">{tool.label}</span>
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Open Tool</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Plan Status */}
        <div className="glass rounded-3xl p-8 border-white/5 space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3BF48F]/5 to-transparent opacity-50" />
          <div className="relative z-10 space-y-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Current Plan</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black italic text-white">{user?.plan || 'FREE'}</span>
              {user?.plan === 'PRO' && <Crown size={24} className="text-amber-400 mb-1" />}
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="w-full h-2 bg-[#090B14] rounded-full overflow-hidden">
              <div className="h-full bg-[#3BF48F] w-[75%]" />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
              <span>Credits Used</span>
              <span>75%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
