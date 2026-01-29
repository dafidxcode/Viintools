import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, ShieldAlert, Globe, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ApiKey } from '../types';

const ApiKeyManager: React.FC = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newDomain, setNewDomain] = useState('*');

    useEffect(() => {
        // Realtime listener for API Keys
        const q = query(collection(db, "api_keys"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const loadedKeys: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setKeys(loadedKeys);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const generateKey = () => {
        return 'viin_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return toast.error("Nama kunci wajib diisi");

        try {
            const newKey = generateKey();
            await addDoc(collection(db, "api_keys"), {
                key: newKey,
                name: newName,
                ownerId: auth.currentUser?.uid || 'admin',
                domain: newDomain || '*',
                usageCount: 0,
                isActive: true,
                createdAt: Date.now()
            });
            toast.success("API Key berhasil dibuat!");
            setNewName('');
            setShowAdd(false);
        } catch (error) {
            console.error("Error creating API key:", error);
            toast.error("Gagal membuat kunci.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus kunci ini? Akses aplikasi yang menggunakannya akan mati.")) return;
        try {
            await deleteDoc(doc(db, "api_keys", id));
            toast.success("Kunci dihapus.");
        } catch (error) {
            console.error("Error deleting API key:", error);
            toast.error("Gagal menghapus.");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Disalin ke clipboard!");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-white uppercase italic">API Keys</h2>
                    <p className="text-xs text-slate-400">Kelola akses untuk aplikasi eksternal (Android/Web).</p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} className="p-3 bg-[#3BF48F] text-[#090B14] rounded-xl font-bold hover:scale-105 transition-all">
                    {showAdd ? "Batal" : <Plus size={20} />}
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div className="glass p-6 rounded-2xl border-white/10 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleCreateKey} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nama Aplikasi</label>
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-[#3BF48F]" placeholder="Contoh: Android App v1" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Allowed Domain (CORS)</label>
                                <input type="text" value={newDomain} onChange={e => setNewDomain(e.target.value)} className="w-full bg-[#090B14] border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-[#3BF48F]" placeholder="* untuk semua, atau https://domain.com" />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-[#3BF48F] text-[#090B14] rounded-xl font-black uppercase tracking-widest hover:bg-[#2ED079]">Buat Kunci API</button>
                    </form>
                </div>
            )}

            {/* Keys List */}
            <div className="space-y-3">
                {loading ? <div className="text-center py-10 opacity-50">Memuat data...</div> : keys.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                        <Key className="mx-auto text-slate-600 mb-2" size={32} />
                        <p className="text-slate-500 font-bold">Belum ada API Key aktif.</p>
                    </div>
                ) : (
                    keys.map(key => (
                        <div key={key.id} className="glass p-5 rounded-2xl border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-[#3BF48F]/30 transition-all">
                            <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                                <div className="w-10 h-10 rounded-xl bg-[#3BF48F]/10 flex items-center justify-center text-[#3BF48F] shrink-0">
                                    <Key size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white truncate">{key.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400 font-mono flex items-center gap-1"><Globe size={10} /> {key.domain}</span>
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400 font-mono flex items-center gap-1"><Activity size={10} /> Used: {key.usageCount || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto bg-[#090B14] p-2 rounded-xl border border-white/10">
                                <code className="text-xs text-[#3BF48F] font-mono flex-1 md:w-48 truncate px-2 select-all">{key.key}</code>
                                <button onClick={() => copyToClipboard(key.key)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><Copy size={14} /></button>
                            </div>

                            <button onClick={() => handleDelete(key.id)} className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ApiKeyManager;
