
import React, { useState } from 'react';
import {
  RefreshCw, Play, Trash2, Wand2, Video,
  Upload, Zap, Download, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore, checkFreeLimit } from '../store';
import { auth, deleteJobFromFirestore, incrementFreeUsage } from '../firebase';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const GrokVideoGenerator: React.FC = () => {
  const { addVideoJob, videoJobs, updateVideoJob, removeVideoJob, user, setShowUpgradeModal, incrementUserUsage } = useAppStore();
  const [activeType, setActiveType] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  const [params, setParams] = useState({ prompt: '' });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleRefinePrompt = async () => {
    if (!params.prompt.trim()) return toast.error("Tulis ide video singkat terlebih dahulu.");
    setIsRefining(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await axios.post('/api/v1/execute', {
        action: 'refine-video',
        prompt: params.prompt
      }, { headers: { Authorization: `Bearer ${idToken}` } });

      if (response.data.refined) {
        setParams({ ...params, prompt: response.data.refined });
        toast.success("AI: Prompt Video Diperhalus!");
      }
    } catch (e) {
      toast.error("Gagal memperhalus prompt.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!user) return;
    try {
      await deleteJobFromFirestore(user.id, jobId);
      removeVideoJob(jobId);
      toast.success("Video berhasil dihapus.");
    } catch (e) {
      toast.error("Gagal menghapus video.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    toast.success("Frame referensi dipilih!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Silakan login.");
    if (!params.prompt.trim()) return toast.error("Prompt wajib diisi.");
    if (activeType === 'image-to-video' && !selectedFile) return toast.error("Pilih gambar referensi.");

    // Check Free Limit
    if (checkFreeLimit(user)) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    const storeJobId = `grok_${Date.now()}`;

    addVideoJob({
      id: storeJobId,
      status: 'pending',
      createdAt: Date.now(),
      parameters: { ...params, model: 'grok-1.0', ratio: '9:16', type: activeType }
    });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const formData = new FormData();
      formData.append('prompt', params.prompt);
      if (selectedFile) formData.append('image', selectedFile);

      const res = await axios.post('/api/grok-video', formData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.ok) {
        updateVideoJob(storeJobId, {
          status: 'processing',
          internalTaskId: res.data.taskId
        });
        if (user.plan === 'FREE') {
          incrementFreeUsage(user.id);
          incrementUserUsage();
        }
        toast.info("Grok sedang memproses video...");
      } else { throw res.data; }
    } catch (e: any) {
      removeVideoJob(storeJobId);
      if (e.response?.status === 429) setShowUpgradeModal(true);
      else toast.error("Gagal generate video.");
    } finally { setIsGenerating(false); }
  };

  const handleDownload = async (videoUrl: string, jobId: string) => {
    setDownloadingId(jobId);
    try {
      const a = document.createElement('a');
      a.href = `/api/proxy?url=${encodeURIComponent(videoUrl)}`;
      a.download = `Viintools_Grok_${jobId}.mp4`;
      a.click();
    } catch (error) {
      toast.error("Gagal mengunduh.");
    } finally { setDownloadingId(null); }
  };

  return (
    <div className="max-w-[500px] mx-auto pb-20 space-y-10">
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-black font-heading italic uppercase text-white leading-none">GROK <span className="text-[#3BF48F]">VIDEO</span></h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">AI Motion Engine • Grok Generation</p>
      </div>

      <div className="flex p-1 bg-[#151926] border border-white/20 rounded-xl">
        {['text-to-video', 'image-to-video'].map(t => (
          <button key={t} onClick={() => setActiveType(t as any)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeType === t ? 'bg-[#3BF48F] text-[#090B14]' : 'text-slate-500 hover:text-white'}`}>
            {t.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      <div className="glass p-8 rounded-3xl border-white/20 space-y-6">
        <AnimatePresence mode="wait">
          {activeType === 'image-to-video' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="relative p-8 border-2 border-dashed border-white/10 rounded-2xl text-center bg-[#3BF48F]/5 group hover:border-[#3BF48F]/30 transition-all overflow-hidden aspect-video flex flex-col items-center justify-center">
                {previewUrl ? (
                  <div className="absolute inset-0 w-full h-full">
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button onClick={() => { setPreviewUrl(null); setSelectedFile(null); }} className="bg-rose-500 text-white p-2 rounded-full"><X size={20} /></button>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest mt-2">Ganti Gambar</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={handleFileChange} accept="image/*" />
                    <Upload size={32} className="mx-auto text-[#3BF48F] mb-4 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PILIH GAMBAR REFERENSI</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group">
          <textarea rows={4} className="w-full bg-[#090B14] border border-white/20 rounded-xl px-6 py-5 pr-14 text-sm text-white focus:border-[#3BF48F]/50 outline-none resize-none transition-all placeholder:text-slate-700" placeholder="Deskripsikan video..." value={params.prompt} onChange={e => setParams({ ...params, prompt: e.target.value })} />
          <button type="button" onClick={handleRefinePrompt} disabled={isRefining || !params.prompt} className="absolute right-4 top-4 p-2.5 bg-[#3BF48F]/10 text-[#3BF48F] rounded-lg hover:bg-[#3BF48F] hover:text-[#090B14] transition-all disabled:opacity-30">
            {isRefining ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
          </button>
        </div>

        <button onClick={handleSubmit} disabled={isGenerating || uploading} className="w-full py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-sm uppercase italic tracking-tighter shadow-lg shadow-[#3BF48F]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {isGenerating ? <><RefreshCw className="animate-spin" size={18} /> SEDANG DIBUAT...</> : 'BUAT VIDEO'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2 text-white/50"><Video size={16} /><h3 className="text-xs font-black uppercase tracking-widest">Riwayat Grok</h3></div>
        <div className="grid grid-cols-1 gap-6">
          {videoJobs.filter(j => j.id.startsWith('grok_')).map(job => (
            <div key={job.id} className="glass rounded-[2rem] overflow-hidden border-white/20 relative bg-[#090B14] shadow-2xl">
              {job.status === 'processing' || job.status === 'pending' ? (
                <div className="aspect-video flex flex-col items-center justify-center space-y-4 bg-slate-900/40">
                  <div className="relative">
                    <Zap className="text-[#3BF48F] animate-pulse" size={48} />
                    <RefreshCw className="absolute inset-0 text-[#3BF48F] animate-spin opacity-40" size={48} />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Memproses Video...</p>
                </div>
              ) : job.status === 'done' ? (
                <div className="relative flex flex-col">
                  <div className="relative aspect-video bg-black group overflow-hidden">
                    <video src={job.result} className="w-full h-full object-cover opacity-60" playsInline muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button onClick={() => setActiveVideoModal(job.result!)} className="w-16 h-16 bg-white text-[#090B14] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"><Play size={28} fill="currentColor" className="ml-1" /></button>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between bg-white/[0.02] border-t border-white/10">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-[9px] font-black text-[#3BF48F] uppercase tracking-widest mb-1">Grok Video</p>
                      <p className="text-xs font-bold text-white truncate">{job.parameters.prompt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDownload(job.result!, job.id)} className="p-3 bg-[#3BF48F] text-[#090B14] rounded-xl"><Download size={16} /></button>
                      <button onClick={() => handleDeleteJob(job.id)} className="p-3 bg-white/5 text-slate-500 rounded-xl"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center text-rose-500 text-[10px] font-black uppercase">Gagal Render</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeVideoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" onClick={() => setActiveVideoModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-5xl aspect-video glass border border-white/20 rounded-3xl overflow-hidden bg-black shadow-2xl" onClick={e => e.stopPropagation()}>
              <video src={activeVideoModal} className="w-full h-full object-contain" autoPlay controls />
              <button onClick={() => setActiveVideoModal(null)} className="absolute top-6 right-6 p-2.5 bg-black/50 text-white rounded-full"><X size={20} /></button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GrokVideoGenerator;
