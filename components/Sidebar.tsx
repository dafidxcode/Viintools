
import React, { useState } from 'react';
import {
  LayoutDashboard, LogOut, X, Image as ImageIcon,
  Mail as MailIcon, ChevronDown, ChevronRight,
  Video, User, Volume2, MessageCircle, Music, Folder
} from 'lucide-react';
import { useAppStore } from '../store';
import { View } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

interface NavItem {
  id?: View;
  label: string;
  icon?: any;
  comingSoon?: boolean;
  subItems?: NavItem[];
}

const Sidebar: React.FC = () => {
  const { view, setView, user, isSidebarOpen, setSidebarOpen } = useAppStore();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'AI Images': true,
    'AI Videos': true,
    'AI Music': true
  });

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const menu: NavItem[] = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.LIBRARY, label: 'Library', icon: Folder },
    {
      label: 'AI Music',
      icon: Music,
      subItems: [
        { id: View.MUSIC_GEN, label: 'Suno Music' },
        { id: View.SUNO_MUSIC_V2, label: 'Suno V2' },
        { id: View.MUSIC_COVER, label: 'AI Cover' },
        { id: View.MUSIC_SPLIT, label: 'Vocal Remover' },
      ]
    },
    {
      label: 'AI Videos',
      icon: Video,
      subItems: [
        { id: View.VEO_VIDEO, label: 'Veo 3.1' },
        { id: View.COMING_SOON, label: 'Sora 2', comingSoon: true },
        { id: View.GROK_VIDEO, label: 'Grok' },
      ]
    },
    {
      label: 'AI Images',
      icon: ImageIcon,
      subItems: [
        { id: View.IMAGE_GEN, label: 'Nano Banana' },
        { id: View.IMAGEN, label: 'Imagen' },
        { id: View.DEEP_NUDE, label: 'Deep Nude AI' },
      ]
    },

    { id: View.TEXT_TO_SPEECH, label: 'Text to Speech', icon: Volume2 },
    { id: View.TEMP_MAIL, label: 'Temp Mail', icon: MailIcon },
  ];

  if (user?.email === 'kiyantodavin2@gmail.com') {
    menu.push({ id: View.ADMIN_DASHBOARD, label: 'Admin Panel', icon: User });
  }

  const handleNavClick = (item: NavItem) => {
    if (item.subItems) {
      toggleMenu(item.label);
    } else if (item.id) {
      setView(item.id, item.comingSoon ? item.label : undefined);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Berhasil keluar.");
    } catch (error) {
      toast.error("Gagal keluar.");
    }
  };

  return (
    <>
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:relative inset-y-0 left-0 w-72 h-full glass border-r border-white/20 p-6 z-[70] transition-transform duration-300 md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8 px-4 pt-4">
          <img src="/images/logo-full.svg" alt="Viintools" className="h-8 md:h-9" />
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-1">
          {menu.map(item => (
            <div key={item.label} className="space-y-1">
              <button
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all border ${view === item.id
                  ? 'bg-[#3BF48F]/15 text-[#3BF48F] border-[#3BF48F]/30'
                  : 'text-slate-500 hover:text-slate-200 border-white/10'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon size={18} />}
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                {item.subItems && (openMenus[item.label] ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </button>

              {item.subItems && openMenus[item.label] && (
                <div className="ml-9 space-y-1 border-l border-white/20 pl-4">
                  {item.subItems.map(sub => (
                    <button
                      key={sub.label}
                      onClick={() => handleNavClick(sub)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${view === sub.id && !sub.comingSoon ? 'text-[#3BF48F] bg-[#3BF48F]/5' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                      {sub.label}
                      {sub.comingSoon && <span className="ml-2 text-[8px] bg-slate-800 text-slate-500 px-1.5 rounded uppercase font-black">SOON</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
