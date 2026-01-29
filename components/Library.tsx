import React, { useState, useMemo } from 'react';
import {
  Play, Pause, Trash2, Search, Music, Video, Image as ImageIcon,
  Grid, List, Download, Filter, MoreVertical, Clock, Calendar
} from 'lucide-react';
import { useAppStore } from '../store';
import { Track, VideoJob, ImageJob } from '../types';
import { toast } from 'sonner';
import { deleteTrackFromFirestore, deleteJobFromFirestore } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

type MediaType = 'all' | 'music' | 'video' | 'image';
type ViewMode = 'grid' | 'list';

const Library: React.FC = () => {
  const {
    library, videoJobs, imageJobs,
    user, currentTrack, setCurrentTrack, isPlaying, setIsPlaying,
    removeVideoJob, removeImageJob
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<MediaType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');

  // Normalize data into a common format
  const items = useMemo(() => {
    const musicItems = library.map(t => ({
      ...t,
      type: 'music' as const,
      date: t.createdAt,
      url: t.audioUrl
    } as (Track & { type: 'music'; date: any; url: string })));

    const vidItems = videoJobs.filter(j => j.status === 'done').map(j => ({
      id: j.id,
      title: j.parameters.prompt || 'Untitled Video',
      url: j.result,
      thumbnail: j.parameters.imageUrls || j.result, // Video result usually reusable as thumb or separate
      type: 'video' as const,
      style: j.parameters.model,
      date: j.createdAt
    }));

    const imgItems = imageJobs.filter(j => j.status === 'done').flatMap(j =>
      (j.result || []).map((url, idx) => ({
        id: `${j.id}_${idx}`,
        actualId: j.id, // for deletion
        title: j.parameters.prompt || 'Untitled Image',
        url: url,
        thumbnail: url,
        type: 'image' as const,
        style: j.parameters.model,
        date: j.createdAt
      }))
    );

    return [...musicItems, ...vidItems, ...imgItems].sort((a, b) => {
      // Handle different date formats (string vs number)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [library, videoJobs, imageJobs]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (activeTab !== 'all' && item.type !== activeTab) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, activeTab, search]);

  const handleDelete = async (item: any) => {
    if (!confirm('Permanently delete this item?')) return;

    try {
      if (item.type === 'music') {
        await deleteTrackFromFirestore(user!.id, item.id);
        toast.success("Music deleted");
      } else if (item.type === 'video') {
        await deleteJobFromFirestore(user!.id, item.id);
        removeVideoJob(item.id);
        toast.success("Video deleted");
      } else if (item.type === 'image') {
        // Image deletion is tricky if multiple images per job, but we'll try deleting the job for now
        // Or specific logic if supported
        await deleteJobFromFirestore(user!.id, item.actualId);
        removeImageJob(item.actualId);
        toast.success("Image set deleted");
      }
    } catch (e) {
      toast.error("Failed to delete item");
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = `/api/proxy?url=${encodeURIComponent(url)}`;
    a.download = filename;
    a.click();
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black font-heading italic uppercase tracking-tighter text-white">
            Media <span className="text-[#3BF48F]">Center</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3BF48F] animate-pulse" />
            Cloud Storage • {items.length} Assets
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#151926] p-1 rounded-xl border border-white/10">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#3BF48F]" size={14} />
            <input
              type="text"
              placeholder="Search assets..."
              className="bg-transparent border-none outline-none text-xs font-bold text-white pl-10 pr-4 py-2.5 w-40 md:w-64 placeholder:text-slate-600"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="w-px h-6 bg-white/10" />
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#3BF48F] text-[#090B14]' : 'text-slate-500 hover:text-white'}`}>
            <Grid size={16} />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#3BF48F] text-[#090B14]' : 'text-slate-500 hover:text-white'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/10 pb-1">
        {[
          { id: 'all', label: 'All Media' },
          { id: 'music', label: 'Music', icon: Music },
          { id: 'video', label: 'Videos', icon: Video },
          { id: 'image', label: 'Images', icon: ImageIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as MediaType)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap ${activeTab === tab.id
              ? 'border-[#3BF48F] text-[#3BF48F]'
              : 'border-transparent text-slate-500 hover:text-white hover:border-white/20'
              }`}
          >
            {tab.icon && <tab.icon size={14} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-600 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
              <Filter size={32} opacity={0.5} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest">No assets found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence mode='popLayout'>
              {filteredItems.map(item => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item.id}
                  className="group relative aspect-square bg-[#151926] rounded-2xl border border-white/10 overflow-hidden hover:border-[#3BF48F]/50 transition-all"
                >
                  {item.type === 'music' ? (
                    <>
                      <img src={item.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090B14] to-transparent p-4 flex flex-col justify-end">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white text-[#090B14] rounded-full flex items-center justify-center shadow-xl scale-0 group-hover:scale-100 transition-transform cursor-pointer"
                          onClick={() => currentTrack?.id === item.id && isPlaying ? setIsPlaying(false) : (setCurrentTrack(item as any), setIsPlaying(true))}>
                          {currentTrack?.id === item.id && isPlaying ? <Pause fill="currentColor" size={18} /> : <Play fill="currentColor" size={18} className="ml-1" />}
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                        <p className="text-[9px] text-[#3BF48F] font-black uppercase tracking-widest">{item.style || 'Music'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                      ) : (
                        <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                        <button onClick={() => handleDownload(item.url!, `${item.title}.${item.type === 'video' ? 'mp4' : 'png'}`)} className="p-2 bg-white/10 hover:bg-[#3BF48F] hover:text-[#090B14] rounded-lg transition-colors"><Download size={16} /></button>
                        <button onClick={() => handleDelete(item)} className="p-2 bg-white/10 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}
                  {/* Type Badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[8px] font-black uppercase tracking-widest text-[#3BF48F] border border-white/5">
                    {item.type}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-[#151926] rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#090B14] text-[9px] font-black uppercase text-slate-500 tracking-widest">
                <tr>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                          {item.type === 'music' ? <img src={(item as any).imageUrl} className="w-full h-full object-cover" /> :
                            item.type === 'video' ? <video src={item.url} className="w-full h-full object-cover" /> :
                              <img src={item.thumbnail} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          <p className="text-[9px] text-slate-500 truncate">{item.style || 'Generated Media'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${item.type === 'music' ? 'bg-[#3BF48F]/10 text-[#3BF48F] border-[#3BF48F]/20' :
                        item.type === 'video' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                        <Calendar size={12} />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.type === 'music' && (
                          <button onClick={() => currentTrack?.id === item.id && isPlaying ? setIsPlaying(false) : (setCurrentTrack(item as any), setIsPlaying(true))} className="p-2 hover:bg-[#3BF48F] hover:text-[#090B14] rounded-lg text-slate-400 transition-colors">
                            {currentTrack?.id === item.id && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        )}
                        <button onClick={() => handleDownload(item.url!, `${item.title}.${item.type === 'video' ? 'mp4' : 'mp3'}`)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><Download size={14} /></button>
                        <button onClick={() => handleDelete(item)} className="p-2 hover:bg-rose-500 hover:text-white rounded-lg text-slate-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
