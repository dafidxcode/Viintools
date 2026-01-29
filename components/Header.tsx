
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, CheckCircle2, XCircle, RefreshCw, Crown, LogOut, User, MessageCircle, Settings as SettingsIcon, Wallet } from 'lucide-react';
import { useAppStore } from '../store';
import { View } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

const Header: React.FC = () => {
  const { setSidebarOpen, jobs, setView, user, setShowUpgradeModal } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Berhasil keluar.");
    } catch (error) {
      toast.error("Gagal keluar.");
    }
  };

  const pendingCount = jobs.filter(j => j.status === 'processing' || j.status === 'pending').length;

  return (
    <header className="h-20 border-b border-white/20 flex items-center justify-between px-6 md:px-8 bg-[#090B14]/40 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white md:hidden">
          <Menu size={24} />
        </button>
        <div className="md:hidden">
          <img src="/images/logo-full.svg" alt="Viintools" className="h-6" />
        </div>
        {/* Placeholder for left side content if needed, previously Search was here but requested to remove */}
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {user?.plan !== 'PRO' && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full transition-all group"
          >
            <Crown size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest hidden sm:inline">UPGRADE</span>
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 bg-white/5 border border-white/20 rounded-full text-slate-400 hover:text-white transition-all"
          >
            <Bell size={20} />
            {jobs.length > 0 && (
              <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#090B14] ${pendingCount > 0 ? 'bg-[#3BF48F] animate-pulse' : 'bg-emerald-500'}`}></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-3 w-80 max-h-[480px] bg-[#151926] border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in slide-in-from-top-2">
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#090B14]/40">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Daftar Tugas</h3>
                <span className="text-[10px] font-bold text-slate-500">{jobs.length} Item</span>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {jobs.length === 0 ? (
                  <div className="py-12 text-center space-y-3 opacity-30">
                    <Bell size={32} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Belum ada aktivitas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {jobs.map(job => (
                      <div key={job.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${job.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' :
                          job.status === 'error' ? 'bg-rose-500/10 text-rose-500' : 'bg-[#3BF48F]/10 text-[#3BF48F]'
                          }`}>
                          {job.status === 'done' ? <CheckCircle2 size={16} /> :
                            job.status === 'error' ? <XCircle size={16} /> :
                              <RefreshCw size={16} className="animate-spin" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{job.parameters.title || (job.parameters.prompt ? job.parameters.prompt.substring(0, 30) : 'Tugas')}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">
                            {job.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 hover:border-[#3BF48F] transition-all bg-[#090B14]">
            <img
              src={user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=Guest`}
              className="w-full h-full object-cover"
              alt="Profile"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.name || 'Guest'}`;
              }}
            />
          </button>

          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-[#151926] border border-white/20 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 p-2 space-y-1">
              <div className="p-3 bg-white/5 rounded-2xl mb-2 flex items-center gap-3">
                <img src={user?.avatar} className="w-10 h-10 rounded-lg" alt="" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-[#3BF48F] uppercase font-black tracking-widest">{user?.plan || 'FREE'}</p>
                </div>
              </div>

              <div className="px-3 py-2 flex items-center justify-between text-xs font-bold text-slate-400 bg-black/20 rounded-xl">
                <span className="flex items-center gap-2"><Wallet size={14} /> Kredit</span>
                <span className="text-white">∞</span>
              </div>

              <button onClick={() => setView(View.SETTINGS)} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-2 transition-all">
                <User size={16} /> Profile & Settings
              </button>

              <a href="https://whatsapp.com/channel/0029VbC28oZ9sBHzgs0plp3b" target="_blank" rel="noopener noreferrer" className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-[#25D366] text-xs font-bold flex items-center gap-2 transition-all">
                <MessageCircle size={16} /> WA Channel
              </a>

              <div className="h-px bg-white/10 my-1" />

              <button onClick={handleSignOut} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 text-xs font-bold flex items-center gap-2 transition-all">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
