
import React, { useState } from 'react';
import { RefreshCw, Download, Image as LucideImage, Wand2, Zap, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore, checkFreeLimit } from '../store';
import { auth, deleteJobFromFirestore, incrementFreeUsage } from '../firebase';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ImageGenerator: React.FC = () => {
  const { addImageJob, imageJobs, updateImageJob, removeImageJob, user, setShowUpgradeModal, incrementUserUsage } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [params, setParams] = useState({ prompt: '', model: 'nano-banana-pro', ratio: '9:16' });

  const handleRefinePrompt = async () => {
    if (!params.prompt.trim()) return toast.error("Tulis deskripsi terlebih dahulu.");
    setIsRefining(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await axios.post('/api/v1/execute', {
        action: 'refine-image',
        prompt: params.prompt
      }, { headers: { Authorization: `Bearer ${idToken}` } });

      if (response.data.refined) {
        setParams({ ...params, prompt: response.data.refined });
        toast.success("Prompt Gambar Diperhalus!");
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
      removeImageJob(jobId);
      toast.success("Gambar berhasil dihapus.");
    } catch (e) {
      toast.error("Gagal menghapus gambar.");
    }
  };

  const handleDownload = async (imgUrl: string) => {
    setDownloadingUrl(imgUrl);
    const toastId = toast.loading("Menyiapkan gambar...");
    try {
      const url = `/api/proxy?url=${encodeURIComponent(imgUrl)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Viintools_Art_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success("Download dimulai!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Gagal mendownload gambar.", { id: toastId });
    } finally { setDownloadingUrl(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !params.prompt.trim()) return toast.error("Prompt diperlukan.");

    // Check Free Limit
    if (checkFreeLimit(user)) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    const storeJobId = `img_job_${Date.now()}`;

    // Status awal 'pending'
    addImageJob({
      id: storeJobId,
      status: 'pending',
      createdAt: Date.now(),
      parameters: { ...params }
    });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await axios.post('/api/generate-image', params, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (res.data.ok) {
        // Update ke 'processing' HANYA setelah mendapatkan taskId dari server
        updateImageJob(storeJobId, {
          status: 'processing',
          
        if (user.plan === 'FREE') {
          incrementFreeUsage(user.id);
          incrementUserUsage();
        }
        toast.info("Permintaan gambar sedang dikirim...");
      } else {
        throw res.data;
      }
    } catch (e: any) {
      removeImageJob(storeJobId);
      if (e.response?.status === 429 || e.limit_reached) {
        setShowUpgradeModal(true);
      } else {
        toast.error(e.response?.data?.message || "Generasi gambar gagal.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto pb-20 space-y-10">
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-black font-heading italic uppercase text-white leading-none">GAMBAR <span className="text-[#3BF48F]">AI</span></h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">Mesin Pembuat Karya Seni AI</p>
      </div>

      <div className="glass p-8 rounded-3xl border-white/20 space-y-6">
        <div className="relative group">
          <textarea
            rows={4}
            className="w-full bg-[#090B14] border border-white/20 rounded-xl px-6 py-5 pr-14 text-sm text-white focus:border-[#3BF48F]/50 outline-none resize-none transition-all placeholder:text-slate-700"
            placeholder="Deskripsikan visi artistik Anda (cth: Samurai Cyberpunk)..."
            value={params.prompt}
            onChange={e => setParams({ ...params, prompt: e.target.value })}
          />
          <button
            type="button"
            onClick={handleRefinePrompt}
            disabled={isRefining || !params.prompt}
            className="absolute right-4 top-4 p-2.5 bg-[#3BF48F]/10 text-[#3BF48F] rounded-lg hover:bg-[#3BF48F] hover:text-[#090B14] transition-all disabled:opacity-30"
          >
            {isRefining ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Rasio Aspek</span>
            <select className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[#3BF48F]/50 transition-all" value={params.ratio} onChange={e => setParams({ ...params, ratio: e.target.value })}>
              <option value="1:1">1:1 Persegi</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Portrait</option>
            </select>
          </div>
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Model</span>
            <select className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[#3BF48F]/50 transition-all" value={params.model} onChange={e => setParams({ ...params, model: e.target.value })}>
              <option value="nano-banana-pro">Nano Banana Pro</option>
              <option value="nano-banana">Nano Banana</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isGenerating}
          className="w-full py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-sm uppercase italic tracking-tighter shadow-lg shadow-[#3BF48F]/20 disabled:opacity-50 transition-all"
        >
          {isGenerating ? <div className="flex items-center justify-center gap-2"><RefreshCw className="animate-spin" size={18} /> Sedang Memproses...</div> : 'Buat Gambar'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2 text-white/50"><LucideImage size={16} /><h3 className="text-xs font-black uppercase tracking-widest">Generasi Terbaru</h3></div>
        <div className="grid grid-cols-1 gap-6">
          {imageJobs.filter(j => j.id.startsWith('img_')).slice(0, 10).map(job => (
            <div key={job.id} className="glass rounded-[2.5rem] overflow-hidden border-white/20 relative group bg-[#090B14]">
              {job.status === 'processing' || job.status === 'pending' ? (
                <div className="aspect-square flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Zap className="text-[#3BF48F] animate-pulse" size={48} />
                    <RefreshCw className="absolute inset-0 text-[#3BF48F] animate-spin opacity-40" size={48} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Proses Gambar</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Menyiapkan frame...</p>
                  </div>
                </div>
              ) : job.status === 'done' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {job.result?.map((imgUrl, i) => (
                      <div key={i} className="relative group/img aspect-square rounded-[2rem] overflow-hidden">
                        <img src={imgUrl} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" alt="" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity gap-4">
                          <button
                            onClick={() => handleDownload(imgUrl)}
                            disabled={downloadingUrl === imgUrl}
                            className="p-4 bg-white text-[#090B14] rounded-2xl hover:scale-110 transition-all shadow-xl disabled:opacity-50"
                          >
                            {downloadingUrl === imgUrl ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 flex items-center justify-between border-t border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold truncate max-w-[200px]">{job.parameters.prompt}</p>
                    <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-slate-600 hover:text-rose-400 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center text-rose-500 text-[10px] font-black uppercase">Gagal Proses</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
