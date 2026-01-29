
import React, { useState } from 'react';
import {
  Upload, Link as LinkIcon, RefreshCw,
  Trash2, Youtube, Play, Download, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import axios from 'axios';

const UploadCover: React.FC = () => {
  const { addJob, jobs, removeJob, user, setShowUpgradeModal, setCurrentTrack, setIsPlaying } = useAppStore();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'file' | 'youtube' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalAudioUrl, setFinalAudioUrl] = useState('');

  const musicJobs = jobs.filter(j => j.parameters.type === 'cover').slice(0, 10);
  const [params, setParams] = useState({ title: '', style: '', prompt: '' });

  if (user?.plan !== 'PRO') {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="glass p-12 rounded-[3rem] border-amber-500/30 text-center max-w-lg space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <RefreshCw size={32} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">PREMIUM ACCESS</h2>
          <p className="text-slate-400 text-sm">Fitur AI Cover Engine eksklusif untuk member PRO Legacy. Buat remix vokal profesional dengan satu kali klik.</p>
          <button onClick={() => setShowUpgradeModal(true)} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-[#090B14] rounded-xl font-black text-sm uppercase tracking-widest">UPGRADE SEKARANG</button>
        </div>
      </div>
    );
  }

  const handleStepOne = async () => {
    setIsProcessing(true);
    const tid = toast.loading("Menganalisis sumber audio...");
    try {
      const idToken = await auth.currentUser?.getIdToken();

      if (mode === 'file') {
        if (!file) return toast.error("Pilih file terlebih dahulu.", { id: tid });
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post('/api/upload-stream', formData, {
          headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'multipart/form-data' }
        });
        setFinalAudioUrl(res.data.downloadUrl);
        setStep(2);
        toast.success("File lokal siap!", { id: tid });
      } else if (mode === 'youtube') {
        if (!externalUrl.trim()) return toast.error("Masukkan link YouTube.", { id: tid });
        const res = await axios.get(`/api/yt?url=${encodeURIComponent(externalUrl)}`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.data.ok) {
          setFinalAudioUrl(res.data.url || res.data.data?.url);
          setStep(2);
          toast.success("Link YouTube berhasil ditarik!", { id: tid });
        } else { throw new Error(); }
      } else {
        if (!externalUrl.trim()) return toast.error("Masukkan URL audio.", { id: tid });
        setFinalAudioUrl(externalUrl);
        setStep(2);
        toast.success("External URL siap!", { id: tid });
      }
    } catch (e) {
      toast.error("Gagal memproses sumber audio. Coba lagi.", { id: tid });
    } finally { setIsProcessing(false); }
  };

  const startCover = async () => {
    setIsProcessing(true);
    const toastId = toast.loading("Requesting remix synthesis...");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const payload = { ...params, uploadUrl: finalAudioUrl, model: 'V5', type: 'cover' };
      const res = await axios.post('/api/cover', payload, { headers: { Authorization: `Bearer ${idToken}` } });
      if (res.data.ok) {
        addJob({ id: `cv_${res.data.taskId}`, status: 'processing', createdAt: Date.now(), parameters: payload });
        setStep(1); setFile(null); setExternalUrl('');
        toast.success("Remix started!", { id: toastId });
      } else { throw res.data; }
    } catch (e: any) {
      if (e.response?.data?.limit_reached) { setShowUpgradeModal(true); }
      else { toast.error(e.response?.data?.msg || "Engine busy.", { id: toastId }); }
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="max-w-[500px] mx-auto pb-20 space-y-10">
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-black font-heading italic uppercase text-white leading-none">COVER <span className="text-[#3BF48F]">MUSIC</span></h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">AI Vocal Remix Synthesis Engine</p>
      </div>

      <div className="glass p-8 rounded-3xl border-white/20 space-y-6">
        {step === 1 ? (
          <div className="space-y-6">
            <div className="flex p-1 bg-[#090B14] rounded-xl border border-white/10">
              {['file', 'youtube', 'url'].map(m => (
                <button key={m} onClick={() => setMode(m as any)} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === m ? 'bg-[#3BF48F] text-[#090B14]' : 'text-slate-500 hover:text-white'}`}>{m}</button>
              ))}
            </div>

            {mode === 'file' && (
              <div className="relative p-12 border-2 border-dashed border-white/10 rounded-2xl text-center bg-[#3BF48F]/5 group hover:border-[#3BF48F]/30 transition-all">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} />
                <Upload size={32} className="mx-auto text-[#3BF48F] mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{file ? file.name : 'SELECT AUDIO FILE'}</p>
              </div>
            )}

            {mode === 'youtube' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-4 py-4 bg-[#090B14] border border-white/20 rounded-xl focus-within:border-[#3BF48F]/50 transition-all">
                  <Youtube className="text-rose-500" size={20} />
                  <input type="text" className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-slate-700" placeholder="Paste YouTube Link..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
                </div>
              </div>
            )}

            {mode === 'url' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-4 py-4 bg-[#090B14] border border-white/20 rounded-xl focus-within:border-[#3BF48F]/50 transition-all">
                  <LinkIcon className="text-blue-400" size={20} />
                  <input type="text" className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-slate-700" placeholder="Direct Audio URL (.mp3)..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
                </div>
              </div>
            )}

            <button onClick={handleStepOne} disabled={isProcessing || (mode === 'file' && !file) || (mode !== 'file' && !externalUrl)} className="w-full py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#3BF48F]/10 disabled:opacity-50 transition-all">
              {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : 'PROCEED TO SYNTHESIS'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input type="text" className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none focus:border-[#3BF48F]/50 placeholder:text-slate-700" placeholder="Judul Remix Baru" value={params.title} onChange={e => setParams({ ...params, title: e.target.value })} />
            <input type="text" className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none focus:border-[#3BF48F]/50 placeholder:text-slate-700" placeholder="Style Remix (cth: Jazz, EDM)" value={params.style} onChange={e => setParams({ ...params, style: e.target.value })} />
            <textarea rows={4} className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none resize-none focus:border-[#3BF48F]/50 placeholder:text-slate-700" placeholder="Context Prompt (Deskripsikan perubahan vokal)..." value={params.prompt} onChange={e => setParams({ ...params, prompt: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setStep(1)} className="py-4 bg-white/5 text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest border border-white/10 hover:text-white transition-all">Back</button>
              <button onClick={startCover} disabled={isProcessing} className="py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#3BF48F]/10 flex items-center justify-center gap-2">
                {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : 'Start Remix'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase px-2 text-slate-500 tracking-widest">Remix History</h3>
        {musicJobs.map(job => (
          <div key={job.id} className="glass p-4 rounded-2xl border-white/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{job.parameters.title || 'Untitled Remix'}</p>
                <p className={`text-[9px] font-black uppercase ${job.status === 'done' || job.status === 'synced' ? 'text-[#3BF48F]' : 'text-slate-500'}`}>{job.status}</p>
              </div>
              <button onClick={() => removeJob(job.id)} className="p-2.5 text-slate-600 hover:text-rose-400 transition-all"><Trash2 size={16} /></button>
            </div>

            {(job.status === 'done' || job.status === 'synced') && job.result?.map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={t.imageUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                  <p className="text-[10px] font-bold text-white truncate">{t.title}</p>
                </div>
                <button onClick={() => { setCurrentTrack(t); setIsPlaying(true); }} className="p-2 bg-[#3BF48F] text-[#090B14] rounded-lg">
                  <Play size={10} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadCover;
