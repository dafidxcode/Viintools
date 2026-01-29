
import React, { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCw, Copy, MessageSquare, ChevronRight, ShieldCheck, Zap, Ghost, Plus, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import axios from 'axios';
import { toast } from 'sonner';

const TempMail: React.FC = () => {
  const { tempMail, setTempMail, setMailMessages, setShowUpgradeModal } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const pollingRef = useRef<any>(null);

  useEffect(() => {
    if (!tempMail.expiresAt) return;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((tempMail.expiresAt! - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [tempMail.expiresAt]);

  useEffect(() => {
    if (tempMail.email) {
      refreshInbox();
      pollingRef.current = setInterval(refreshInbox, 9000);
    }
    return () => clearInterval(pollingRef.current);
  }, [tempMail.email]);

  const generateEmail = async () => {
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get('/api/tempmail/create', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.ok) {
        setTempMail(res.data.email, Date.now() + 600000);
      } else {
        throw res.data;
      }
    } catch (e: any) {
      if (e.limit_reached) {
        setShowUpgradeModal(true);
      } else {
        toast.error(e.message || "Gagal membuat email sementara.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInbox = async () => {
    if (!tempMail.email) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await axios.get(`/api/tempmail/inbox?email=${encodeURIComponent(tempMail.email)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.ok) setMailMessages(res.data.messages || []);
    } catch (e) { }
  };

  return (
    <div className="max-w-[700px] mx-auto pb-20 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black font-heading italic uppercase text-white leading-none">ANONYMOUS <span className="text-[#3BF48F]">MAIL</span></h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Burner Inbox for Secure Testing</p>
      </div>

      <div className="flex justify-center">
        {!tempMail.email ? (
          <div className="w-full space-y-8">
            <div className="glass p-12 rounded-[3rem] border-white/20 text-center space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#3BF48F]/5 blur-[80px] -z-10" />
              <div className="w-20 h-20 bg-[#3BF48F]/10 rounded-3xl flex items-center justify-center text-[#3BF48F] mx-auto shadow-2xl shadow-[#3BF48F]/10">
                <ShieldCheck size={40} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Identity Protection Active</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">Gunakan email sekali pakai untuk melewati registrasi situs yang tidak terpercaya dan jaga inbox utama Anda dari spam.</p>
              </div>
              <button onClick={generateEmail} disabled={isLoading} className="px-12 py-5 bg-[#3BF48F] hover:bg-[#2ED079] text-[#090B14] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#3BF48F]/20 transition-all active:scale-95">
                {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'INITIALIZE SECURE INBOX'}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-8">
            <div className="glass p-10 rounded-[2.5rem] border-white/20 text-center space-y-6 shadow-2xl">
              <div className="flex items-center justify-center gap-4 bg-[#090B14] p-5 rounded-2xl border border-white/20">
                <span className="text-xl font-black text-white">{tempMail.email}</span>
                <button onClick={() => { navigator.clipboard.writeText(tempMail.email || ''); toast.success("Email disalin!"); }} className="p-3 bg-white/5 text-[#3BF48F] hover:bg-[#3BF48F] hover:text-[#090B14] rounded-xl transition-all border border-white/10"><Copy size={18} /></button>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-[#3BF48F] uppercase tracking-widest">
                  <RefreshCw size={14} className="animate-spin" /> Auto-Refreshing
                </div>
                <div className="w-px h-3 bg-white/10" />
                <button
                  onClick={generateEmail}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-[#3BF48F]" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus size={12} className="text-[#3BF48F]" />
                      Destroy & Rebuild
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><MessageSquare size={16} className="text-[#3BF48F]" /> Live Feed</h3>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sesi Aktif</span>
              </div>

              {tempMail.messages.length === 0 ? (
                <div className="glass p-20 rounded-[2.5rem] border-white/20 text-center space-y-4">
                  <Mail size={48} className="mx-auto text-slate-800 animate-bounce" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Menunggu pesan masuk...</p>
                  </div>
                </div>
              ) : (
                tempMail.messages.map(msg => (
                  <div key={msg.id} className="glass p-5 rounded-2xl border-white/20 hover:border-[#3BF48F]/50 transition-all cursor-pointer flex justify-between items-center group">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-[#3BF48F] uppercase tracking-widest">{msg.sender_email}</p>
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-[#3BF48F] transition-colors">{msg.subject}</h4>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl text-slate-500 group-hover:text-white transition-all"><ChevronRight size={18} /></div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TempMail;
