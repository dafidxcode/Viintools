
import React, { useState } from 'react';
import { Upload, RefreshCw, Music, Mic, Play, Youtube, Link as LinkIcon, Crown, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { auth, incrementFreeUsage } from '../firebase';
import { useAppStore, checkFreeLimit } from '../store';
import axios from 'axios';

const MusicSplitter: React.FC = () => {
  const { setCurrentTrack, setIsPlaying, user, setShowUpgradeModal } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [mode, setMode] = useState<'file' | 'youtube' | 'url'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [result, setResult] = useState<{ vocal: string, instrumental: string } | null>(null);

  if (user?.plan !== 'PRO') {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="glass p-12 rounded-[3rem] border-amber-500/30 text-center max-w-lg space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Crown size={32} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">PRO FEATURES</h2>
          <p className="text-slate-400 text-sm">Pemisahan stem vokal dan instrumen berkualitas studio adalah fitur eksklusif PRO Legacy. Bergabunglah dengan kreator pro lainnya hari ini.</p>
          <button onClick={() => setShowUpgradeModal(true)} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-[#090B14] rounded-xl font-black text-sm uppercase tracking-widest">UPGRADE SEKARANG</button>
        </div>
      </div>
    );
  }

  const handleDownload = async (audioUrl: string, name: string) => {
    setIsDownloading(audioUrl);
    const toastId = toast.loading("Menyiapkan unduhan...");
    try {
      const url = `/api/proxy?url=${encodeURIComponent(audioUrl)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Viintools_Split_${name}_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success("Berhasil diunduh!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Gagal mengunduh audio.", { id: toastId });
    } finally { setIsDownloading(null); }
  };

  const startSplit = async () => {
    if (mode === 'file' && !file) return toast.error("Pilih file audio terlebih dahulu.");
    if (mode !== 'file' && !externalUrl.trim()) return toast.error("Masukkan URL yang valid.");

    // Check Free Limit
    if (checkFreeLimit(user)) {
      setShowUpgradeModal(true);
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Isolating stems via Neural Engine...");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const formData = new FormData();

      if (mode === 'file' && file) {
        formData.append('file', file);
      } else {
        // Untuk mode YouTube/URL, kita kirim info URL-nya
        formData.append('url', externalUrl);
      }

      const res = await axios.post('/api/splitter', formData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        const stems = {
          vocal: res.data.data.vocal_url,
          instrumental: res.data.data.instrumental_url
        };
        if (user!.plan === 'FREE') incrementFreeUsage(user!.id);
        setResult(stems);
        toast.success("Splitting complete!", { id: toastId });

        // Auto-save stems to library (Kie AI + Firebase)
        try {
          await axios.post('/api/save-to-library', {
            type: 'music',
            tracks: [
              {
                id: `st_voc_${Date.now()}`,
                title: `Vocal: ${file?.name || 'Vocal Extraction'}`,
                audioUrl: stems.vocal,
                imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=vocal',
                style: 'Vocal Stem',
                model: 'Neural Splitter'
              },
              {
                id: `st_ins_${Date.now()}`,
                title: `Instr: ${file?.name || 'Instrumental Extraction'}`,
                audioUrl: stems.instrumental,
                imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=instr',
                style: 'Instrumental Stem',
                model: 'Neural Splitter'
              }
            ]
          }, { headers: { Authorization: `Bearer ${idToken}` } });
        } catch (e) { }
      } else { throw res.data; }
    } catch (e: any) {
      if (e.response?.data?.limit_reached) { setShowUpgradeModal(true); }
      else { toast.error(e.response?.data?.message || "Engine failure. Coba gunakan file lain.", { id: toastId }); }
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 space-y-12">
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-black font-heading italic uppercase text-white leading-none">STEM <span className="text-[#3BF48F]">SPLITTER</span></h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">Neural Vocal & Instrument Separation</p>
      </div>

      <div className="glass p-8 rounded-3xl border-white/20 space-y-8">
        {!result ? (
          <div className="space-y-6">
            <div className="flex p-1 bg-[#090B14] rounded-xl border border-white/10">
              {['file', 'youtube', 'url'].map(m => (
                <button key={m} onClick={() => { setMode(m as any); setFile(null); setExternalUrl(''); }} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === m ? 'bg-[#3BF48F] text-[#090B14]' : 'text-slate-500 hover:text-white'}`}>{m}</button>
              ))}
            </div>

            {mode === 'file' && (
              <div className="relative p-12 border-2 border-dashed border-white/10 rounded-2xl text-center bg-[#3BF48F]/5 group hover:border-[#3BF48F]/30 transition-all">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} accept="audio/*" />
                <Upload size={32} className="mx-auto text-[#3BF48F] mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{file ? file.name : 'DROP AUDIO SOURCE'}</p>
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
                  <input type="text" className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-slate-700" placeholder="Direct Audio URL (.mp3, .wav)..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
                </div>
              </div>
            )}

            <button onClick={startSplit} disabled={isProcessing || (mode === 'file' && !file) || (mode !== 'file' && !externalUrl)} className="w-full py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#3BF48F]/10 disabled:opacity-50 transition-all">
              {isProcessing ? <div className="flex items-center justify-center gap-2"><RefreshCw className="animate-spin" size={18} /> Isolating Stems...</div> : 'START SPLIT'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in zoom-in">
            {[
              { t: 'Vocal Stem', u: result.vocal, i: Mic, n: 'Vocal' },
              { t: 'Instrumental', u: result.instrumental, i: Music, n: 'Instr' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-5 bg-[#090B14] rounded-2xl border border-white/20 group hover:border-[#3BF48F]/30 transition-all">
                <div className="w-10 h-10 bg-[#3BF48F]/10 rounded-xl flex items-center justify-center text-[#3BF48F] group-hover:scale-110 transition-transform">
                  <item.i size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-black uppercase text-white tracking-widest">{item.t}</h5>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentTrack({ audioUrl: item.u, title: item.t, imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=split' } as any)} className="p-3 bg-[#3BF48F] text-[#090B14] rounded-xl shadow-lg hover:scale-105 transition-all">
                    <Play size={16} fill="currentColor" />
                  </button>
                  <button
                    onClick={() => handleDownload(item.u, item.n)}
                    disabled={isDownloading === item.u}
                    className="p-3 bg-white/5 text-slate-400 rounded-xl hover:text-white transition-all disabled:opacity-50"
                  >
                    {isDownloading === item.u ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => { setResult(null); setFile(null); setExternalUrl(''); }} className="w-full py-4 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]">New Session</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicSplitter;
