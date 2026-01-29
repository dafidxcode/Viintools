
import React, { useState, useEffect } from 'react';
import {
  RefreshCw, Play, Clock, Trash2, Wand2, Music, FileJson, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore, checkFreeLimit } from '../store';
import { auth, deleteJobFromFirestore, incrementFreeUsage } from '../firebase';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const MusicGenerator: React.FC = () => {
  const { addJob, updateJob, removeJob, user, jobs, setCurrentTrack, setIsPlaying, currentTrack, isPlaying, setShowUpgradeModal, incrementUserUsage } = useAppStore();
  const [activeMode, setActiveMode] = useState<'simple' | 'custom' | 'json'>('simple');
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [params, setParams] = useState({
    instrumental: false,
    title: '',
    style: '',
    prompt: '',
    model: 'V5',
    vocalGender: 'm',
  });

  const [jsonInput, setJsonInput] = useState('');

  const isHighEndModel = ['V5', 'V4.5', 'V4.5PLUS'].includes(params.model);
  const promptLimit = activeMode === 'custom' ? (isHighEndModel ? 5000 : 3000) : 400;
  const styleLimit = isHighEndModel ? 1000 : 200;

  const musicJobs = jobs.filter(j =>
    j.parameters.type === 'music' || j.parameters.type === 'cover' || !j.parameters.type
  ).slice(0, 10);

  const activeJobsCount = musicJobs.filter(j => j.status === 'processing' || j.status === 'pending').length;

  const handleRefinePrompt = async () => {
    if (!params.prompt.trim()) return toast.error("Tulis ide lagu singkat terlebih dahulu.");
    setIsRefining(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await axios.post('/api/v1/execute', {
        action: 'refine-music',
        prompt: params.prompt,
        model: params.model,
        customMode: activeMode === 'custom'
      }, { headers: { Authorization: `Bearer ${idToken}` } });

      if (response.data.refined) {
        setParams({ ...params, prompt: response.data.refined.substring(0, promptLimit) });
        toast.success("Prompt Studio Diperbarui!");
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
      removeJob(jobId);
      toast.success("Tugas berhasil dihapus.");
    } catch (e) {
      toast.error("Gagal menghapus tugas.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Silakan masuk terlebih dahulu.");

    // Check Limit
    if (checkFreeLimit(user)) {
      setShowUpgradeModal(true);
      return;
    }

    if (activeJobsCount >= 2) return toast.error("Antrean studio penuh (Maks 2 tugas).");

    setIsGenerating(true);
    let finalPayload: any = { type: 'music' };

    if (activeMode === 'json') {
      try {
        const parsed = JSON.parse(jsonInput);
        finalPayload = { ...finalPayload, ...parsed };
      } catch (e) { setIsGenerating(false); return toast.error("Format JSON tidak valid."); }
    } else if (activeMode === 'custom') {
      if (!params.style.trim()) { setIsGenerating(false); return toast.error("Style/Genre wajib diisi."); }
      finalPayload = {
        model: params.model,
        customMode: true,
        instrumental: params.instrumental,
        prompt: params.prompt.substring(0, promptLimit),
        style: params.style.substring(0, styleLimit),
        title: params.title.substring(0, 80)
      };
    } else {
      if (!params.prompt.trim()) { setIsGenerating(false); return toast.error("Prompt tidak boleh kosong."); }
      finalPayload = {
        prompt: params.prompt.substring(0, 400),
        customMode: false,
        model: params.model,
        instrumental: params.instrumental
      };
    }

    const storeJobId = `mjob_${Date.now()}`;
    addJob({ id: storeJobId, status: 'pending', createdAt: Date.now(), parameters: finalPayload });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await axios.post('/api/generate', finalPayload, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.ok) {
        updateJob(storeJobId, {
          status: 'processing',
          // @ts-ignore
          internalTaskId: response.data.taskId
        });
        if (user.plan === 'FREE') {
          incrementFreeUsage(user.id);
          incrementUserUsage();
        }
        toast.info("Musik Anda sedang dibuat...");
      } else {
        throw response.data;
      }
    } catch (error: any) {
      removeJob(storeJobId);
      if (error.response?.status === 429) setShowUpgradeModal(true);
      else toast.error("Gagal menghubungi neural engine.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto pb-20 space-y-10">
      <div className="space-y-2 px-2 text-center md:text-left">
        <h1 className="text-3xl font-black font-heading italic uppercase text-white leading-none">MUSIK <span className="text-[#3BF48F]">AI</span></h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">Neural V5 AI Composer Engine</p>
      </div>

      <div className="flex p-1 bg-[#151926] border border-white/20 rounded-xl relative">
        {['simple', 'custom', 'json'].map((m) => (
          <button key={m} onClick={() => setActiveMode(m as any)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === m ? 'bg-[#3BF48F] text-[#090B14]' : 'text-slate-500 hover:text-white'}`}>
            {m}
          </button>
        ))}
      </div>

      <div className="glass p-8 rounded-3xl border-white/20 space-y-6">
        <div className="space-y-2">
          <span className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-[0.2em]">Pilih Model</span>
          <select className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3 text-xs font-black text-[#3BF48F] uppercase outline-none focus:ring-1 focus:ring-[#3BF48F]/50" value={params.model} onChange={e => setParams({ ...params, model: e.target.value })}>
            <option value="V5">SUNO V5 (PRO)</option>
            <option value="V4.5">SUNO V4.5</option>
            <option value="V4">SUNO V4</option>
            <option value="V3.5">SUNO V3.5</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeMode === 'simple' && (
            <div className="space-y-2">
              <div className="relative group">
                <textarea rows={4} className="w-full bg-[#090B14] border border-white/20 rounded-xl px-6 py-5 pr-14 text-sm text-white focus:border-[#3BF48F]/50 outline-none resize-none transition-all placeholder:text-slate-700" placeholder="Deskripsikan lagu..." value={params.prompt} maxLength={400} onChange={e => setParams({ ...params, prompt: e.target.value })} />
                <button type="button" onClick={handleRefinePrompt} disabled={isRefining || !params.prompt} className="absolute right-4 top-4 p-2.5 bg-[#3BF48F]/10 text-[#3BF48F] rounded-lg hover:bg-[#3BF48F] hover:text-[#090B14] transition-all disabled:opacity-30">
                  {isRefining ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                </button>
              </div>
            </div>
          )}

          {activeMode === 'custom' && (
            <div className="space-y-4">
              <input type="text" className="w-full bg-[#090B14] border border-white/20 rounded-xl px-6 py-3.5 text-xs text-white outline-none focus:border-[#3BF48F]/50 font-bold" placeholder="Judul Track" value={params.title} onChange={e => setParams({ ...params, title: e.target.value })} />
              <input type="text" className="w-full bg-[#090B14] border border-white/20 rounded-xl px-6 py-3.5 text-xs text-white outline-none focus:border-[#3BF48F]/50 font-bold" placeholder="Genre / Style (cth: Pop, Jazz)" value={params.style} onChange={e => setParams({ ...params, style: e.target.value })} />
              <div className="relative">
                <textarea rows={5} className="w-full bg-[#090B14] border border-white/20 rounded-xl px-6 py-5 pr-14 text-sm text-white outline-none resize-none focus:border-[#3BF48F]/50 transition-all" placeholder="Lirik atau struktur lagu..." value={params.prompt} onChange={e => setParams({ ...params, prompt: e.target.value })} />
                <button type="button" onClick={handleRefinePrompt} disabled={isRefining || !params.prompt} className="absolute right-4 top-4 p-2.5 bg-[#3BF48F]/10 text-[#3BF48F] rounded-lg hover:bg-[#3BF48F] hover:text-[#090B14] transition-all disabled:opacity-30">
                  {isRefining ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={isGenerating || activeJobsCount >= 2} className="w-full py-4 rounded-xl font-black text-sm bg-[#3BF48F] hover:bg-[#2ED079] text-[#090B14] transition-all uppercase italic tracking-tighter shadow-lg shadow-[#3BF48F]/20 disabled:opacity-50">
            {isGenerating ? <div className="flex items-center justify-center gap-2"><RefreshCw className="animate-spin" size={18} /> Memproses...</div> : 'Buat Musik'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2 text-white/50"><Clock size={16} /><h3 className="text-xs font-black uppercase tracking-widest">Antrean Studio</h3></div>
        {musicJobs.map(job => (
          <div key={job.id} className="glass p-3 rounded-2xl border-white/20 flex flex-col gap-3 group bg-[#090B14]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
                  {job.status === 'processing' || job.status === 'pending' ? <RefreshCw size={18} className="text-[#3BF48F] animate-spin" /> : <Music size={18} className="text-[#3BF48F]" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{job.parameters.title || (job.parameters.prompt ? job.parameters.prompt.substring(0, 30) : 'Untitled')}</h4>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{job.status}</p>
                </div>
              </div>
              <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-slate-600 hover:text-rose-400"><Trash2 size={14} /></button>
            </div>

            {job.status === 'done' && (
              <div className="grid grid-cols-1 gap-2 border-t border-white/5 pt-2">
                {job.result?.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={t.imageUrl} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                      <p className="text-[10px] font-bold text-white truncate">{t.title}</p>
                    </div>
                    <button onClick={() => { setCurrentTrack(t); setIsPlaying(true); }} className="p-2 bg-[#3BF48F] text-[#090B14] rounded-lg shadow-lg"><Play size={10} fill="currentColor" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicGenerator;
