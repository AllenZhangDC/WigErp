"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, MapPin, Loader2, AlertCircle } from "lucide-react";
import { getLocations, createLocation, deleteLocation } from "@/actions/location.actions";
import { formatDate } from "@/lib/utils";

export default function StockLocationsPage() {
    const [locations, setLocations] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ code: "", name: "", description: "" });

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        const data = await getLocations();
        setLocations(data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        const res = await createLocation(formData);
        if ('error' in res) {
            setError(res.error as string);
            setIsSaving(false);
        } else {
            setIsAdding(false);
            setIsSaving(false);
            setFormData({ code: "", name: "", description: "" });
            loadLocations();
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`确定要删除仓位 [${code}] 吗？`)) return;
        const res = await deleteLocation(id);
        if ('error' in res) {
            alert(res.error);
        } else {
            loadLocations();
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-4 italic tracking-tight">
                        <MapPin className="text-indigo-400" size={32} />
                        物理仓位维护
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase ml-2 bg-slate-900/40 px-3 py-1.5 rounded-full border border-slate-800 not-italic">Warehouse Locations</span>
                    </h1>
                    <p className="page-subtitle mt-2 text-slate-400 font-medium italic">管理全球实体仓储，分配库位以供库区分拣与库存归属追踪。</p>
                </div>
                <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary h-12 px-6 shadow-xl shadow-indigo-600/10 active:scale-95 transition-all">
                    <Plus size={18} />
                    <span className="font-bold">新增仓位</span>
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleCreate} className="card bg-slate-900/40 border-indigo-500/30 p-8 space-y-6 animate-slide-up relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><MapPin size={80} /></div>

                    <h3 className="text-lg font-black text-white italic tracking-tight">建立新仓位区块</h3>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        <div className="form-group">
                            <label className="input-label">唯一代号 (Code)</label>
                            <input
                                type="text"
                                required
                                placeholder="例如: MAIN, LA-01, DEFECTIVE"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="input h-12 bg-slate-950 font-mono text-indigo-400 font-bold uppercase"
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">仓位名称</label>
                            <input
                                type="text"
                                required
                                placeholder="例如: 洛杉矶主仓"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="input h-12 bg-slate-950 font-bold"
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">备注 / 地址信息</label>
                            <input
                                type="text"
                                placeholder="..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="input h-12 bg-slate-950"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 relative z-10">
                        <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary h-12 px-8">取消</button>
                        <button type="submit" disabled={isSaving} className="btn btn-primary h-12 px-10">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : "确认创建"}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.map((loc) => (
                    <div key={loc.id} className="card bg-slate-900/40 border-slate-800 p-6 flex flex-col justify-between group overflow-hidden">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="badge text-[10px] bg-slate-800 border-slate-700 text-slate-300 font-mono font-black px-2.5 py-1 mb-2 shadow-inner group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-colors">
                                        {loc.code}
                                    </span>
                                    <h3 className="text-xl font-bold text-slate-200 mt-1">{loc.name}</h3>
                                </div>
                                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 group-hover:border-indigo-500/30 transition-colors shadow-inner">
                                    <MapPin size={24} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-medium italic min-h-[2.5rem] leading-snug">
                                {loc.description || "未提供补充信息"}
                            </p>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] italic">
                                EST. {formatDate(loc.created_at)}
                            </span>
                            <button
                                onClick={() => handleDelete(loc.id, loc.code)}
                                className="w-8 h-8 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
                                title="删除此仓位"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {locations.length === 0 && (
                <div className="py-32 text-center text-slate-500 flex flex-col items-center">
                    <MapPin size={48} className="mb-4 opacity-30" />
                    <p className="text-xs font-black uppercase tracking-widest italic">暂无可管辖的物理仓位</p>
                </div>
            )}
        </div>
    );
}
