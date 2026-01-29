
import React, { useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { View } from './types';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
// Fix: Added missing subscribeToLibrary import
import { auth, db, syncUserDoc, subscribeToLibrary } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Crown, Zap, X } from 'lucide-react';

// Import components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Landing from './components/Landing';
import DashboardHome from './components/DashboardHome';
import Settings from './components/Settings';
import ImageGenerator from './components/ImageGenerator';
import ImagenGenerator from './components/ImagenGenerator';
import TempMail from './components/TempMail';
import JobMonitor from './components/JobMonitor';
import DeepNude from './components/DeepNude';
import ComingSoon from './components/ComingSoon';
import TextToSpeech from './components/TextToSpeech';
import UpgradePackage from './components/UpgradePackage';
import VeoVideoGenerator from './components/VeoVideoGenerator';
import GrokVideoGenerator from './components/GrokVideoGenerator';
import MusicGenerator from './components/MusicGenerator';
import Library from './components/Library';
import MusicGeneratorV2 from './components/MusicGeneratorV2';
import MusicCover from './components/MusicCover';
import MusicSplitter from './components/MusicSplitter';
// Fix: Imported GlobalPlayer for global state management
import GlobalPlayer from './components/GlobalPlayer';

const App: React.FC = () => {
  // Fix: Added setLibrary and currentTrack from store
  const { view, user, setUser, setView, authLoading, setAuthLoading, showUpgradeModal, setShowUpgradeModal, setLibrary, currentTrack } = useAppStore();
  const profileUnsubRef = useRef<Unsubscribe | null>(null);
  // Fix: Added libraryUnsubRef to handle cleanup of library listener
  const libraryUnsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }
      // Fix: Cleanup library listener on auth changes
      if (libraryUnsubRef.current) {
        libraryUnsubRef.current();
        libraryUnsubRef.current = null;
      }

      if (firebaseUser) {
        await syncUserDoc(firebaseUser);
        profileUnsubRef.current = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'PRO',
              email: data.email || firebaseUser.email || '',
              avatar: data.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${firebaseUser.uid}`,
              plan: data.plan || 'FREE',
              imageTimestamps: data.imageTimestamps || [],
              tempMailTimestamps: data.tempMailTimestamps || [],
              // Fix: Added missing ttsTimestamps assignment
              ttsTimestamps: data.ttsTimestamps || [],
              videoTimestamps: data.videoTimestamps || []
            });
          }
        });

        // Fix: Subscribe to the user's personal track library
        libraryUnsubRef.current = subscribeToLibrary(firebaseUser.uid, (tracks) => {
          setLibrary(tracks);
        });

        if (useAppStore.getState().view === View.LANDING) {
          setView(View.DASHBOARD);
        }
      } else {
        setUser(null);
        if (useAppStore.getState().view !== View.LANDING) {
          setView(View.LANDING);
        }
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (profileUnsubRef.current) profileUnsubRef.current();
      if (libraryUnsubRef.current) libraryUnsubRef.current();
    };
  }, [setUser, setView, setAuthLoading, setLibrary]);

  useEffect(() => {
    if (user && user.plan !== 'PRO' && view === View.DASHBOARD) {
      setShowUpgradeModal(true);
    }
  }, [view, user, setShowUpgradeModal]);

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#090B14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#3BF48F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#3BF48F] font-bold tracking-widest text-xs uppercase animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case View.DASHBOARD: return <DashboardHome />;
      case View.LIBRARY: return <Library />;
      case View.IMAGE_GEN: return <ImageGenerator />;
      case View.IMAGEN: return <ImagenGenerator />;
      case View.DEEP_NUDE: return <DeepNude />;
      case View.TEMP_MAIL: return <TempMail />;
      case View.TEXT_TO_SPEECH: return <TextToSpeech />;
      case View.SETTINGS: return <Settings />;
      case View.COMING_SOON: return <ComingSoon />;
      case View.UPGRADE_PACKAGE: return <UpgradePackage />;
      case View.VEO_VIDEO: return <VeoVideoGenerator />;
      case View.GROK_VIDEO: return <GrokVideoGenerator />;
      case View.MUSIC_GEN: return <MusicGenerator />;
      case View.SUNO_MUSIC_V2: return <MusicGeneratorV2 />;
      case View.MUSIC_COVER: return <MusicCover />;
      case View.MUSIC_SPLIT: return <MusicSplitter />;
      default: return <DashboardHome />;
    }
  };

  if (view === View.LANDING) {
    return (
      <>
        <Landing />
        <JobMonitor />
        {/* Fix: Added GlobalPlayer for playback control on landing page */}
        {currentTrack && <GlobalPlayer />}
        <Toaster position="top-right" theme="dark" richColors />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#090B14] text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header />
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar scroll-smooth`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-w-7xl mx-auto"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Upgrade Modal Overlay */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-md w-full glass border border-[#3BF48F]/30 p-8 rounded-2xl shadow-2xl text-center space-y-6">
              <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
              <div className="w-16 h-16 bg-[#3BF48F]/10 text-[#3BF48F] rounded-2xl flex items-center justify-center mx-auto"><Crown size={32} /></div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">LIMIT TERCAPAI</h3>
                <p className="text-sm text-slate-400">Upgrade ke <span className="text-[#3BF48F] font-bold">Viintools PRO Legacy</span> untuk menikmati akses studio profesional tanpa batas harian!</p>
              </div>
              <ul className="text-left space-y-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <li className="flex items-center gap-2"><Zap size={12} className="text-[#3BF48F]" /> High Fidelity Video & Image Engines</li>
                <li className="flex items-center gap-2"><Zap size={12} className="text-[#3BF48F]" /> All Pro Tools Unlocked</li>
              </ul>
              <button onClick={() => { setView(View.UPGRADE_PACKAGE); setShowUpgradeModal(false); }} className="w-full py-4 bg-[#3BF48F] text-[#090B14] rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#3BF48F]/20 hover:scale-[1.02] transition-all">UPGRADE SEKARANG</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fix: Render GlobalPlayer globally in the app */}
      <GlobalPlayer />
      <JobMonitor />
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
};

export default App;
