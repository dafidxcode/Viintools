
import React from 'react';
import {
  Crown, Check, Zap, Sparkles, ArrowLeft, Shield,
  CreditCard, Globe, Clock, Headphones, Music, Star, Rocket,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store';
import { View } from '../types';
import { auth } from '../firebase';
import axios from 'axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const UpgradePackage: React.FC = () => {
  const { setView, user } = useAppStore();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePayment = async () => {
    window.open('https://whatsapp.com/channel/0029VbC28oZ9sBHzgs0plp3b/146', '_blank');
  };

  const benefits = [
    { icon: Music, label: "Unlimited Music Generate", desc: "Create thousands of songs without daily limits." },
    { icon: Zap, label: "V5 High-Fidelity Engine", desc: "Access the latest studio-grade audio synthesis." },
    { icon: Shield, label: "Full Commercial Rights", desc: "You own 100% of your creations for Spotify/YouTube." },
    { icon: Rocket, label: "Priority Rendering", desc: "Skip the queue with dedicated high-speed servers." },
    { icon: Globe, label: "Lifetime Access", desc: "Pay once, enjoy premium features forever." },
    { icon: Headphones, label: "Lossless Export (WAV)", desc: "Download high-quality audio without compression." }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-12">
      <button
        onClick={() => setView(View.DASHBOARD)}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="relative overflow-hidden glass rounded-[3.5rem] border-amber-500/30 p-8 md:p-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3BF48F]/5 blur-[100px] -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-amber-500 text-[#090B14] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
              <Star size={14} fill="currentColor" /> MOST POPULAR • LEGACY PLAN
            </div>

            <h1 className="text-5xl md:text-7xl font-black font-heading italic uppercase tracking-tighter text-white leading-none">
              PRO <br /><span className="text-amber-500">LEGACY</span>
            </h1>

            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
              Hentikan bayar bulanan mahal di Suno AI ($10/bln). Dengan <span className="text-white font-bold">Viintools PRO Legacy</span>, bayar sekali, nikmati selamanya tanpa batas!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
                    <b.icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{b.label}</h4>
                    <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-10 rounded-[2.5rem] border-white/20 bg-white/[0.02] shadow-2xl relative">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-[#090B14] shadow-xl shadow-amber-500/20 rotate-12">
              <Crown size={32} />
            </div>

            <div className="text-center space-y-6">
              <div className="space-y-2">
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest line-through">Rp 1.500.000</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-6xl font-black text-white italic tracking-tighter">250K</span>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">LIFETIME</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">One-time</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 py-8 border-y border-white/10">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-2"><Check size={14} className="text-[#3BF48F]" /> Unlimited Generation</span>
                  <span className="text-[#3BF48F]">FREE</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-2"><Check size={14} className="text-[#3BF48F]" /> Commercial Rights</span>
                  <span className="text-[#3BF48F]">YES</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-2"><Check size={14} className="text-[#3BF48F]" /> Priority Support</span>
                  <span className="text-[#3BF48F]">24/7</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full py-6 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-[#25D366]/20 active:scale-95"
              >
                <CreditCard size={24} /> UPGRADE VIA WHATSAPP
              </button>

              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Instant Activation • Secure Payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePackage;
