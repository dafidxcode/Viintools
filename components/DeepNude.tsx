
import React, { useState } from 'react';
import { Upload, RefreshCw, AlertTriangle, User, UserCheck, Crown, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '../firebase';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';

const DeepNude: React.FC = () => {
  const { user, setShowUpgradeModal } = useAppStore();
  const [image, setImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(true);
  const [gender, setGender] = useState<'WOMAN' | 'MAN'>('WOMAN');

  if (user?.plan !== 'PRO') {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="glass p-12 rounded-[3rem] border-amber-500/30 text-center max-w-lg space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Crown size={32} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">RESTRICTED</h2>
          <p className="text-slate-400 text-sm">Neural Inpainting Synthesis adalah fitur khusus untuk member PRO Legacy. Upgrade sekarang untuk membuka semua alat AI premium.</p>
          <button onClick={() => setShowUpgradeModal(true)} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-[#090B14] rounded-xl font-black text-sm uppercase tracking-widest">UPGRADE SEKARANG</button>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!resultUrl) return;
    setIsDownloading(true);
    const toastId = toast.loading("Menyiapkan unduhan...");
    try {
      const url = `/api/proxy?url=${encodeURIComponent(resultUrl)}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Viintools_DeepArt_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success("Unduhan berhasil!", { id: toastId });
    } catch (e) {
      toast.error("Gagal mengunduh gambar.", { id: toastId });
    } finally { setIsDownloading(false); }
  };

  const startProcess = async () => {
    if (!image) return toast.error("Select an image first.");
    setIsProcessing(true);
    const toastId = toast.loading("Processing AI inpainting...");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const formData = new FormData();
      formData.append('image', image);
      formData.append('type', gender);
      const res = await axios.post('/api/deepnude', formData, { headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setResultUrl(res.data.data.result);
        toast.success("Synthesis complete!", { id: toastId });
      } else { throw res.data; }
    } catch (e: any) {
      if (e.response?.data?.limit_reached) { setShowUpgradeModal(true); }
      else { toast.error(e.message || "Engine failure.", { id: toastId }); }
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 space-y-12">
      <AnimatePresence>
        {showWarning && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full glass p-10 rounded-[3rem] text-center space-y-6 border-rose-500/30">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/10"><AlertTriangle size={32} /></div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">18+ RESTRICTED</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">This tool is for artistic and experimental purposes only. By continuing, you confirm you are 18+ and take full responsibility for the content processed.</p>
              <button onClick={() => setShowWarning(false)} className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all">I AGREE & CONTINUE</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-black font-heading italic uppercase text-white leading-none">DEEP NUDE <span className="text-[#3BF48F]">AI</span></h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">Neural Inpainting Synthesis</p>
      </div>

      <div className="glass p-8 rounded-3xl border-white/20 space-y-8">
        {!resultUrl ? (
          <div className="space-y-6">
            <div className="flex p-1 bg-[#090B14] rounded-xl border border-white/10">
              <button onClick={() => setGender('WOMAN')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${gender === 'WOMAN' ? 'bg-[#3BF48F] text-[#090B14]' : 'text-slate-500 hover:text-white'}`}>
                <User size={14} /> Female
              </button>
              <button onClick={() => setGender('MAN')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${gender === 'MAN' ? 'bg-[#3BF48F] text-[#090B14]' : 'text-slate-500 hover:text-white'}`}>
                <User size={14} /> Male
              </button>
            </div>

            <div className="relative p-12 border-2 border-dashed border-white/10 rounded-2xl text-center bg-[#3BF48F]/5 group hover:border-[#3BF48F]/30 transition-all">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setImage(e.target.files?.[0] || null)} />
              <Upload size={32} className="mx-auto text-[#3BF48F] mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black text-slate-400 tracking-widest">{image ? image.name : 'UPLOAD CLOTHED PHOTO'}</p>
            </div>

            <button
              onClick={startProcess}
              disabled={isProcessing || !image}
              className="w-full py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-sm uppercase italic tracking-tighter shadow-lg shadow-[#3BF48F]/20 disabled:opacity-50 transition-all"
            >
              {isProcessing ? <div className="flex items-center justify-center gap-2"><RefreshCw className="animate-spin" size={18} /> Synthesizing...</div> : 'START UNDRESS'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in zoom-in">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img src={resultUrl} className="w-full" alt="AI Result" />
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <UserCheck size={14} className="text-[#3BF48F]" />
                <span className="text-[9px] font-black uppercase text-white tracking-widest">Neural Render</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setResultUrl(null)} className="py-4 bg-white/5 text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest border border-white/10 hover:text-white transition-all">New Session</button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <><Download size={16} /> Save Result</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepNude;
