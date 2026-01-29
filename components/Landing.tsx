import React, { useState, useEffect } from 'react';
import {
  Music2, ArrowRight, Sparkles, Play, Zap,
  Disc, Layers, Crown, Star, Mic, Video, Image as ImageIcon,
  Cpu, Shield, Globe, CheckCircle2, MoveRight, Menu, X
} from 'lucide-react';
import { useAppStore } from '../store';
import { Track } from '../types';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { signInWithGoogle, db, subscribeToLibrary } from '../firebase';
import { collectionGroup, query, orderBy, limit, getDocs } from 'firebase/firestore';

const Landing: React.FC = () => {
  const { isPlaying, setIsPlaying, currentTrack, setCurrentTrack, user } = useAppStore();
  const [communityTracks, setCommunityTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        const q = query(collectionGroup(db, "tracks"), orderBy("createdAt", "desc"), limit(6));
        const snap = await getDocs(q);
        setCommunityTracks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Track[]);
      } catch (e) {
        console.error("Failed to fetch discovery tracks:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscovery();
  }, []);

  const handlePlayToggle = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track, true);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#090B14] text-white selection:bg-[#3BF48F] selection:text-[#090B14] font-sans overflow-x-hidden">

      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[#3BF48F]/5 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-emerald-500/5 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[15s]" />
        <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[12s]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#090B14]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo-full.svg" alt="Viintools" className="h-6 md:h-8" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {['Studio', 'Features', 'Community', 'Pricing'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">{item}</a>
            ))}
          </div>

          <div className="hidden md:block">
            <button onClick={signInWithGoogle} className="group relative px-6 py-2.5 bg-white text-[#090B14] rounded-full text-xs font-black uppercase tracking-widest overflow-hidden hover:bg-[#3BF48F] transition-colors">
              <span className="relative z-10 flex items-center gap-2">Launch App <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/10 bg-[#090B14] overflow-hidden"
            >
              <div className="p-6 space-y-4 flex flex-col">
                {['Studio', 'Features', 'Community', 'Pricing'].map(item => (
                  <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white py-2">{item}</a>
                ))}
                <button onClick={signInWithGoogle} className="w-full py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-xs uppercase tracking-widest">
                  Launch App
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 px-6 z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm mx-auto lg:mx-0">
                <span className="w-2 h-2 rounded-full bg-[#3BF48F] animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#3BF48F]">Viintools Neural Engine V5.0</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-8xl font-black font-heading italic uppercase tracking-tighter leading-[0.9]">
                Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3BF48F] to-emerald-400">Beyond</span> <br />
                <span className="text-white">Human Limits</span>
              </h1>

              <p className="text-base md:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                The all-in-one generative studio for professionals. create charts-topping music, cinematic videos, and 8k visuals with one subscription.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button onClick={signInWithGoogle} className="w-full sm:w-auto h-14 px-8 bg-[#3BF48F] text-[#090B14] rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_-5px_#3BF48F66]">
                  Start Creating Free
                </button>
                <div className="flex items-center gap-4 px-6 h-14 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <img key={i} src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${i * 55}`} className="w-8 h-8 rounded-full border-2 border-[#090B14] bg-slate-800" alt="" />
                    ))}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="text-white font-black">12k+</span> Creators
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              style={{ y: y1 }}
              className="lg:col-span-5 relative hidden lg:block"
            >
              <div className="relative z-10 aspect-square rounded-[3rem] overflow-hidden border border-white/10 bg-[#090B14]/50 backdrop-blur-md shadow-2xl p-2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3BF48F]/20 to-transparent opacity-50" />
                <img src="/images/hero-art.jpg" onError={(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=2574&auto=format&fit=crop'} className="w-full h-full object-cover rounded-[2.5rem] opacity-80" alt="Art" />

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#3BF48F] flex items-center justify-center text-[#090B14]">
                      <Play fill="currentColor" size={20} />
                    </div>
                    <div>
                      <div className="h-1.5 w-32 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-[#3BF48F]" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-2">Generating Audio...</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="py-6 md:py-10 border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex items-center gap-12 md:gap-20 whitespace-nowrap w-max px-6 md:px-10"
        >
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              {['SONY MUSIC', 'UNIVERSAL', 'NETFLIX', 'SPOTIFY', 'WARNER BROS', 'PIXAR'].map(brand => (
                <span key={brand} className="text-xl md:text-2xl font-black font-heading italic uppercase text-white/10 hover:text-[#3BF48F] transition-colors cursor-default">
                  {brand}
                </span>
              ))}
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* Bento Grid Features */}
      <section id="features" className="py-20 md:py-32 px-6 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12 md:mb-20 space-y-4">
            <h2 className="text-4xl md:text-7xl font-black font-heading italic uppercase tracking-tighter">
              One Subscription. <br /> <span className="text-[#3BF48F]">Infinite Possibilities.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[800px]">
            {/* Box 1: Music (Large) */}
            <div className="min-h-[300px] md:col-span-2 md:row-span-2 group relative rounded-3xl md:rounded-[2.5rem] bg-[#151926] border border-white/10 overflow-hidden hover:border-[#3BF48F]/50 transition-all duration-500">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090B14] via-[#090B14]/50 to-transparent" />
              <div className="absolute bottom-0 p-8 md:p-10 space-y-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#3BF48F] flex items-center justify-center text-[#090B14] mb-4">
                  <Music2 size={24} className="md:w-8 md:h-8" />
                </div>
                <h3 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">AI Music Generator</h3>
                <p className="text-sm md:text-base text-slate-400 font-medium">Create full songs with vocals, lyrics, and production in seconds. Powered by Suno V5.</p>
              </div>
            </div>

            {/* Box 2: Video (Medium) */}
            <div className="min-h-[250px] md:col-span-2 md:row-span-1 group relative rounded-3xl md:rounded-[2.5rem] bg-[#151926] border border-white/10 overflow-hidden hover:border-[#3BF48F]/50 transition-all duration-500">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#090B14] via-[#090B14]/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <Video className="text-[#3BF48F]" size={24} />
                  <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">AI Video Generator</h3>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Veo 3.1 • Grok • Sora 2</p>
              </div>
            </div>

            {/* Box 3: Image (Small) */}
            <div className="min-h-[200px] md:col-span-1 md:row-span-1 group relative rounded-3xl md:rounded-[2.5rem] bg-[#151926] border border-white/10 overflow-hidden hover:border-[#3BF48F]/50 transition-all duration-500">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 bg-gradient-to-t from-[#090B14] to-transparent">
                <ImageIcon className="text-[#3BF48F] mb-3" size={24} />
                <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tighter">8K Imagery</h3>
              </div>
            </div>

            {/* Box 4: TTS (Small) */}
            <div className="min-h-[200px] md:col-span-1 md:row-span-1 group relative rounded-3xl md:rounded-[2.5rem] bg-[#151926] border border-white/10 overflow-hidden hover:border-[#3BF48F]/50 transition-all duration-500">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 bg-gradient-to-t from-[#090B14] to-transparent">
                <Mic className="text-[#3BF48F] mb-3" size={24} />
                <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tighter">Voice Clone</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Feed */}
      <section id="community" className="py-20 md:py-32 px-6 bg-[#090B14] relative z-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <div>
              <h2 className="text-4xl md:text-6xl font-black font-heading italic uppercase tracking-tighter">Community <br /><span className="text-[#3BF48F]">Showcase</span></h2>
            </div>
            <button onClick={signInWithGoogle} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-[#3BF48F] transition-colors">
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {loading ? [...Array(6)].map((_, i) => <div key={i} className="aspect-square rounded-3xl bg-white/5 animate-pulse" />) :
              communityTracks.map((track, idx) => (
                <div key={track.id} className={`group relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer ${idx === 0 || idx === 1 ? 'col-span-2 aspect-video lg:col-span-3' : 'col-span-1 aspect-square lg:col-span-2'}`}>
                  <img src={track.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handlePlayToggle(track)} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white text-[#090B14] flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                      {currentTrack?.id === track.id && isPlaying ? <div className="w-3 h-3 md:w-4 md:h-4 bg-[#090B14]" /> : <Play fill="currentColor" size={20} className="md:w-6 md:h-6" />}
                    </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-[#090B14] to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-xs md:text-sm font-bold truncate text-white">{track.title}</p>
                    <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-[#3BF48F]">{track.model || 'Generated'}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-20 border-t border-white/10 px-6 bg-[#05070a]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src="/images/logo-full.svg" alt="Viintools" className="h-6 md:h-8 opacity-80" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">© 2025 Neural Studio Network.</p>
          </div>
          <div className="flex items-center gap-6 md:gap-8">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#3BF48F] hover:text-[#090B14] transition-all"><Globe size={18} /></a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#3BF48F] hover:text-[#090B14] transition-all"><Shield size={18} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
