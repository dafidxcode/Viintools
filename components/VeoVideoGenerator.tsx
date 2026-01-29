
import React, { useState } from 'react';
import {
  RefreshCw, Play, Trash2, Wand2, Video,
  Upload, Image as ImageIcon, Zap, Download, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore, checkFreeLimit } from '../store';
import { auth, deleteJobFromFirestore, incrementFreeUsage } from '../firebase';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const VeoVideoGenerator: React.FC = () => {
  const { addVideoJob, videoJobs, updateVideoJob, removeVideoJob, user, setShowUpgradeModal, incrementUserUsage } = useAppStore();
  const [activeType, setActiveType] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  const [params, setParams] = useState({ prompt: '', model: 'veo-3.1-fast', ratio: '9:16' });
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Silakan login.");

    // Check Free Limit
    if (checkFreeLimit(user)) {
      setShowUpgradeModal(true);
      return;
    }

    if (!params.prompt.trim()) return toast.error("Prompt wajib diisi.");

    setIsGenerating(true);
    const storeJobId = `vjob_${Date.now()}`;

    const payload = {
      ...params,
      type: activeType,
      imageUrls: activeType === 'image-to-video' ? uploadedImageUrl : undefined
    };

    // Add to local state first
    addVideoJob({ id: storeJobId, status: 'pending', createdAt: Date.now(), parameters: payload });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await axios.post('/api/generate-video', payload, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (res.data.ok) {
        // Increment usage if FREE
        if (user.plan === 'FREE') {
          incrementFreeUsage(user.id);
          incrementUserUsage();
        }

        // Simpan taskId internal untuk polling yang aman
        updateVideoJob(storeJobId, {
          status: 'processing',
          // @ts-ignore
          internalTaskId: res.data.taskId
        });
        toast.info("Permintaan dikirim ke antrean...");
      } else { throw res.data; }
    } catch (e: any) {
      removeVideoJob(storeJobId);
      if (e.response?.status === 429) setShowUpgradeModal(true);
      else toast.error("Gagal memulai proses.");
    } finally { setIsGenerating(false); }
  };

  // ... (sisa kode komponen UI tetap sama namun dengan teks yang sudah diperbarui di dashboard)
  return (
    <div className="max-w-[500px] mx-auto pb-20 space-y-10">
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-black font-heading italic uppercase text-white leading-none">VEO <span className="text-[#3BF48F]">VIDEO</span></h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">AI Motion Hub • 3.1 VEO</p>
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
                {uploadedImageUrl ? (
                  <div className="absolute inset-0 w-full h-full">
                    <img src={uploadedImageUrl} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button onClick={() => setUploadedImageUrl('')} className="bg-rose-500 text-white p-2 rounded-full"><X size={20} /></button>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest mt-2">Ganti Gambar</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      const tid = toast.loading("Mengunggah...");
                      try {
                        const idToken = await auth.currentUser?.getIdToken();
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('uploadPath', `veo-init/${Date.now()}`);
                        formData.append('fileName', file.name);

                        const res = await axios.post('/api/upload-file', formData, {
                          headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'multipart/form-data' }
                        });
                        const dUrl = res.data.data?.downloadUrl || res.data.downloadUrl;
                        if (dUrl) { setUploadedImageUrl(dUrl); toast.success("Siap!", { id: tid }); }
                      } catch { toast.error("Gagal unggah.", { id: tid }); } finally { setUploading(false); }
                    }} accept="image/*" />
                    <Upload size={32} className="mx-auto text-[#3BF48F] mb-4 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PILIH GAMBAR REFERENSI</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group">
          <textarea rows={4} className="w-full bg-[#090B14] border border-white/20 rounded-xl px-6 py-5 pr-14 text-sm text-white focus:border-[#3BF48F]/50 outline-none resize-none transition-all placeholder:text-slate-700" placeholder="Deskripsikan gerakan..." value={params.prompt} onChange={e => setParams({ ...params, prompt: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Rasio</span>
            <select className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[#3BF48F]/50 appearance-none" value={params.ratio} onChange={e => setParams({ ...params, ratio: e.target.value })}>
              <option value="9:16">9:16 Portrait</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="1:1">1:1 Square</option>
            </select>
          </div>
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">Model</span>
            <select className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[#3BF48F]/50 appearance-none" value={params.model} onChange={e => setParams({ ...params, model: e.target.value })}>
              <option value="veo-3.1-fast">Veo 3.1 Cepat</option>
              <option value="veo-3.1-ultra">Veo 3.1 Ultra</option>
            </select>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={isGenerating || uploading} className="w-full py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-sm uppercase italic tracking-tighter shadow-lg shadow-[#3BF48F]/20 disabled:opacity-50 transition-all">
          {isGenerating ? 'SEDANG DIPROSES...' : 'MULAI BUAT VIDEO'}
        </button>
      </div>

      <div className="space-y-4">
        {videoJobs.length > 0 && <div className="flex items-center gap-2 px-2 text-white/50"><Video size={16} /><h3 className="text-xs font-black uppercase tracking-widest">Antrean</h3></div>}
        <div className="grid grid-cols-1 gap-6">
          {videoJobs.map(job => (
            <div key={job.id} className="glass rounded-[2rem] overflow-hidden border-white/20 relative bg-[#090B14] shadow-2xl">
              {job.status === 'processing' || job.status === 'pending' ? (
                <div className="aspect-video flex flex-col items-center justify-center space-y-4 bg-slate-900/40">
                  <RefreshCw className="text-[#3BF48F] animate-spin" size={32} />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Memproses Video...</p>
                </div>
              ) : job.status === 'done' ? (
                <div className="relative flex flex-col">
                  <div className="relative aspect-video bg-black group overflow-hidden">
                    <video src={job.result} className="w-full h-full object-cover opacity-60" playsInline muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button onClick={() => setActiveVideoModal(job.result!)} className="w-16 h-16 bg-white text-[#090B14] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all"><Play size={28} fill="currentColor" className="ml-1" /></button>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between border-t border-white/10">
                    <p className="text-xs font-bold text-white truncate flex-1">{job.parameters.prompt}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        const a = document.createElement('a'); a.href = `/api/proxy?url=${encodeURIComponent(job.result!)}`; a.download = `video.mp4`; a.click();
                      }} className="p-3 bg-[#3BF48F] text-[#090B14] rounded-xl"><Download size={16} /></button>
                      <button onClick={() => removeVideoJob(job.id)} className="p-3 bg-white/5 text-slate-500 rounded-xl"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ) : <div className="aspect-video flex items-center justify-center text-rose-500">Gagal Render</div>}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeVideoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="relative w-full max-w-5xl aspect-video glass border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
              <video src={activeVideoModal} className="w-full h-full object-contain" autoPlay controls />
              <button onClick={() => setActiveVideoModal(null)} className="absolute top-6 right-6 p-2.5 bg-black/50 text-white rounded-full"><X size={20} /></button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VeoVideoGenerator;
