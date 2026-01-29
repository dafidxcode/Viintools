
import React, { useEffect, useState } from 'react';
import { User, Check, X, Trash2, Edit2, Shield, Search, RefreshCw, Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { getAllUsers, updateUserProfile, deleteUserDocument } from '../firebase';
import { useAppStore } from '../store';
import ApiKeyManager from './ApiKeyManager';

const AdminDashboard: React.FC = () => {
    const { user } = useAppStore();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<any | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (e) {
            toast.error("Gagal mengambil data user.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await updateUserProfile(editingUser.id, {
                plan: editingUser.plan,
                freeUsageCount: Number(editingUser.freeUsageCount),
                name: editingUser.name
            });
            toast.success("User updated!");
            setEditingUser(null);
            fetchUsers();
        } catch (e) {
            toast.error("Update gagal.");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Yakin ingin menghapus user ini? Data tidak bisa dikembalikan.")) return;
        try {
            await deleteUserDocument(userId);
            toast.success("User dihapus.");
            fetchUsers();
        } catch (e) {
            toast.error("Gagal menghapus user.");
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (user?.email !== 'kiyantodavin2@gmail.com') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Shield size={64} className="text-rose-500" />
                <h1 className="text-3xl font-black text-rose-500">ACCESS DENIED</h1>
                <p className="text-slate-400">Anda tidak memiliki izin untuk mengakses area ini.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black font-heading italic uppercase text-white leading-none">ADMIN <span className="text-[#3BF48F]">PANEL</span></h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">User Management System</p>
                </div>
                <button onClick={fetchUsers} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-6 rounded-2xl border-white/10">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Users</p>
                    <h3 className="text-3xl font-black text-white">{users.length}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border-white/10">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">PRO Users</p>
                    <h3 className="text-3xl font-black text-[#3BF48F]">{users.filter(u => u.plan === 'PRO').length}</h3>
                </div>
                <div className="glass p-6 rounded-2xl border-white/10">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Free Users</p>
                    <h3 className="text-3xl font-black text-slate-300">{users.filter(u => u.plan === 'FREE').length}</h3>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Cari user by nama atau email..."
                    className="w-full bg-[#090B14] border border-white/20 rounded-xl pl-12 pr-4 py-4 text-sm text-white focus:border-[#3BF48F] outline-none transition-all font-bold"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Users List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#3BF48F]" size={40} /></div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 font-bold">Tidak ada user ditemukan.</div>
                ) : (
                    <div className="grid gap-4">
                        {filteredUsers.map(u => (
                            <div key={u.id} className="glass p-4 rounded-xl border-white/10 flex items-center justify-between group hover:border-[#3BF48F]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <img src={u.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u.id}`} className="w-12 h-12 rounded-full bg-white/5 object-cover" alt="" />
                                    <div>
                                        <h4 className="font-bold text-white flex items-center gap-2">
                                            {u.name}
                                            {u.plan === 'PRO' && <Crown size={14} className="text-[#3BF48F] fill-[#3BF48F]" />}
                                        </h4>
                                        <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${u.plan === 'PRO' ? 'bg-[#3BF48F]/20 text-[#3BF48F]' : 'bg-slate-800 text-slate-400'}`}>{u.plan}</span>
                                            <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest bg-white/5 text-slate-400">Usage: {u.freeUsageCount || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingUser(u)} className="p-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/20 hover:text-white transition-all"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* API Key Management Section */}
            <div className="border-t border-white/10 pt-8">
                <ApiKeyManager />
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#090B14] border border-white/20 p-6 rounded-2xl w-full max-w-md space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-white italic uppercase">Edit User</h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nama</label>
                                <input type="text" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#3BF48F]" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Plan</label>
                                <select value={editingUser.plan} onChange={e => setEditingUser({ ...editingUser, plan: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#3BF48F]">
                                    <option value="FREE">FREE</option>
                                    <option value="PRO">PRO</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Usage Count</label>
                                <input type="number" value={editingUser.freeUsageCount} onChange={e => setEditingUser({ ...editingUser, freeUsageCount: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#3BF48F]" />
                            </div>

                            <button type="submit" className="w-full py-3 bg-[#3BF48F] text-[#090B14] rounded-xl font-black uppercase hover:bg-[#34D37B] transition-all">Simpan Perubahan</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
