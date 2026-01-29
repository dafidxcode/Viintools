import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, X, Music, RefreshCw, ChevronUp, FileAudio, FileJson } from 'lucide-react';
import { useAppStore } from '../store';
import WaveSurfer from 'wavesurfer.js';
import { toast } from 'sonner';

const GlobalPlayer: React.FC = () => {
  const { currentTrack, setCurrentTrack, isPlaying, setIsPlaying, isPublicPlayback } = useAppStore();
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [duration, setDuration] = useState('0:00');
  const [currentTime, setCurrentTime] = useState('0:00');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const getSafeUrl = (url: string) => {
    if (!url) return '';
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (waveContainerRef.current && currentTrack) {
      setIsReady(false);
      setCurrentTime('0:00');
      setDuration('0:00');
      
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      wavesurferRef.current = WaveSurfer.create({
        container: waveContainerRef.current,
        waveColor: 'rgba(59, 244, 143, 0.1)',
        progressColor: '#3BF48F',
        cursorColor: '#3BF48F',
        barWidth: 2,
        barRadius: 4,
        height: 35,
        barGap: 3,
        interact: true,
        fillParent: true,
        minPxPerSec: 1,
        autoplay: false
      });

      const audioUrl = getSafeUrl(currentTrack.audioUrl);
      wavesurferRef.current.load(audioUrl);

      wavesurferRef.current.on('ready', () => {
        setIsReady(true);
        const totalDuration = wavesurferRef.current!.getDuration();
        setDuration(formatTime(totalDuration));
        if (isPlaying) {
          wavesurferRef.current!.play().catch(err => {
            console.warn("Autoplay prevented:", err);
            setIsPlaying(false);
          });
        }
      });

      wavesurferRef.current.on('audioprocess', () => {
        setCurrentTime(formatTime(wavesurferRef.current!.getCurrentTime()));
      });

      wavesurferRef.current.on('finish', () => setIsPlaying(false));
      
      wavesurferRef.current.on('error', (e) => {
          console.error("WaveSurfer Engine Error:", e);
          setIsReady(false);
          setIsPlaying(false);
          toast.error("Audio stream currently unavailable.");
      });

      return () => wavesurferRef.current?.destroy();
    }
  }, [currentTrack?.id, currentTrack?.audioUrl]);

  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      if (isPlaying) {
        wavesurferRef.current.play().catch(() => setIsPlaying(false));
      } else {
        wavesurferRef.current.pause();
      }
    }
  }, [isPlaying, isReady]);

  const bufferToWav = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);
    const channels = [];
    let i, sample, offset = 0, pos = 0;

    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return new Blob([outBuffer], { type: 'audio/wav' });
  };

  const handleDownload = async (format: 'mp3' | 'wav') => {
    if (!currentTrack || isDownloading || isPublicPlayback) return;
    setIsDownloading(true);
    setShowDownloadMenu(false);
    const toastId = toast.loading(`Preparing ${format.toUpperCase()} export...`);

    try {
      const response = await fetch(getSafeUrl(currentTrack.audioUrl));
      if (!response.ok) throw new Error("File fetch failed");
      
      let blob: Blob;
      if (format === 'wav') {
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        blob = bufferToWav(audioBuffer);
      } else {
        blob = await response.blob();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTrack.title.replace(/[^\w\s]/gi, '_')}_studio.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`${format.toUpperCase()} downloaded!`, { id: toastId });
    } catch (e) {
      console.error("Download Error:", e);
      toast.error("Download failed. Link may have expired.", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-6xl glass border border-white/10 rounded-[2.5rem] p-3 md:p-5 flex items-center gap-4 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-6">
       <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-[#3BF48F]/20 shadow-xl relative">
         <img src={currentTrack.imageUrl} alt="" className="w-full h-full object-cover" />
         {!isReady && (
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                 <RefreshCw className="animate-spin text-white" size={20} />
             </div>
         )}
       </div>
       
       <div className="min-w-0 hidden md:block w-56">
         <h4 className="font-bold text-sm truncate text-white">{currentTrack.title}</h4>
         <p className="text-[10px] text-[#3BF48F] uppercase font-black tracking-widest mt-1">Viintools • {currentTrack.style || 'Studio'}</p>
       </div>
       
       <button 
        onClick={() => setIsPlaying(!isPlaying)} 
        disabled={!isReady}
        className="w-12 h-12 md:w-14 md:h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl flex-shrink-0 disabled:opacity-50"
       >
         {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
       </button>

       <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 px-1">
             <span className="text-[10px] font-mono text-slate-500">{currentTime}</span>
             <span className="text-[10px] font-mono text-slate-500">{duration}</span>
          </div>
          <div ref={waveContainerRef} className="w-full overflow-hidden opacity-90"></div>
       </div>

       <div className="flex items-center gap-1 relative">
         {!isPublicPlayback && (
           <div className="relative">
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)} 
                disabled={isDownloading || !isReady} 
                className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all disabled:opacity-50"
              >
                {isDownloading ? <RefreshCw className="animate-spin" size={20} /> : <Download size={22} />}
              </button>
              
              {showDownloadMenu && (
                <div className="absolute bottom-full right-0 mb-4 w-48 bg-[#151926] border border-[#232936] rounded-2xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 py-2">Export Audio</p>
                   <button onClick={() => handleDownload('mp3')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 text-xs font-bold transition-all">
                      <span>MP3 (Compact)</span>
                      <FileAudio size={14} className="text-[#3BF48F]" />
                   </button>
                   <button onClick={() => handleDownload('wav')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 text-xs font-bold transition-all">
                      <span>WAV (Lossless)</span>
                      <FileAudio size={14} className="text-[#3BF48F]" />
                   </button>
                </div>
              )}
           </div>
         )}

         {isPublicPlayback && (
            <div className="p-3 text-slate-600 cursor-not-allowed group relative" title="Download disabled for public feed">
               <Download size={22} />
               <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-[8px] font-bold px-2 py-1 rounded pointer-events-none">Listen-only Mode</div>
            </div>
         )}

         <button onClick={() => { setCurrentTrack(null); setIsPlaying(false); }} className="p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 rounded-full transition-all">
           <X size={22} />
         </button>
       </div>
    </div>
  );
};

export default GlobalPlayer;