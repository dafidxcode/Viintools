
import React from 'react';
import { Shield, Settings2, LogOut, CheckCircle2, ChevronRight, User as UserIcon, Bell, Lock } from 'lucide-react';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const { user } = useAppStore();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully.");
    } catch (error) {
      toast.error("Sign out failed.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="border-b border-white/20 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-heading tracking-tight mb-2 uppercase italic">Studio <span className="text-[#3BF48F]">Profile</span></h1>
          <p className="text-slate-500 text-sm font-medium">Manage your identity and studio configurations.</p>
        </div>
        {user?.plan === 'PRO' && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5 rounded-2xl">
            <CheckCircle2 className="text-emerald-500" size={18} />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Legacy Membership Active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Profile Info */}
        <div className="md:col-span-5 glass p-10 rounded-[3rem] border-white/20 space-y-10">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="relative group">
              <img src={user?.avatar} className="w-28 h-28 rounded-[2.5rem] border-2 border-white/20 group-hover:border-[#3BF48F]/50 transition-all shadow-2xl" alt="" />
              <div className="absolute -bottom-2 -right-2 bg-[#3BF48F] p-2.5 rounded-2xl border-4 border-[#090B14] shadow-xl">
                <Settings2 size={16} className="text-[#090B14]" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{user?.name}</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { l: 'Edit Display Name', i: UserIcon },
              { l: 'Notification Settings', i: Bell },
              { l: 'API & Security', i: Lock }
            ].map((opt, i) => (
              <button key={i} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
                <div className="flex items-center gap-3">
                  <opt.i size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{opt.l}</span>
                </div>
                <ChevronRight size={14} className="text-slate-700" />
              </button>
            ))}
          </div>
        </div>

        {/* Plan Info */}
        <div className="md:col-span-7 space-y-8">
          <div className="glass p-10 rounded-[3rem] border-white/20 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3BF48F]/5 blur-[60px]" />
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Account Tier</h3>
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${user?.plan === 'PRO' ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-slate-800/50 border-white/10 text-slate-500'}`}>
                <Shield size={32} />
              </div>
              <div>
                <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter">{user?.plan || 'Standard'} Member</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Status: Active Service</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-5 bg-rose-600/10 border border-rose-600/30 text-rose-500 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-600/5"
          >
            TERMINATE SESSION
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
