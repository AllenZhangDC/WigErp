"use client";

import { useState } from "react";
import { Plus, Trash2, MapPin, Phone, UserCircle, Star, StarOff, MoreVertical, Edit, Building2 } from "lucide-react";
import { createAddress, deleteAddress, setDefaultAddress } from "@/actions/customer.actions";
import { formatCurrency } from "@/lib/utils";

interface AddressBookProps { customerId: string; addresses: any[]; }

export default function AddressBook({ customerId, addresses }: AddressBookProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ label: "", recipient_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", zip: "", country: "US", is_default: false });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true); setError(null);
        const result = await createAddress({ ...formData, customer_id: customerId });
        if (result.error) { setError(result.error); setIsSaving(false); } else {
            setIsAdding(false); setIsSaving(false);
            setFormData({ label: "", recipient_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", zip: "", country: "US", is_default: false });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2"><MapPin size={20} className="text-indigo-500" /> 地址簿管理</h2>
                <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary h-9 text-xs"><Plus size={14} /> <span>新增收货地址</span></button>
            </div>
            {isAdding && (
                <form onSubmit={handleCreate} className="card bg-slate-900/40 border-indigo-500/30 p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group"><label className="input-label">收件人</label><input type="text" required value={formData.recipient_name} onChange={e => setFormData({ ...formData, recipient_name: e.target.value })} className="input h-10 bg-slate-900" /></div>
                        <div className="form-group"><label className="input-label">收件人电话</label><input type="text" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input h-10 bg-slate-900" /></div>
                        <div className="form-group md:col-span-2"><label className="input-label">详细地址</label><input type="text" required value={formData.address_line1} onChange={e => setFormData({ ...formData, address_line1: e.target.value })} className="input h-10 bg-slate-900" /></div>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
                        <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary h-10 px-6">取消</button>
                        <button type="submit" disabled={isSaving} className="btn btn-primary h-10 px-8">{isSaving ? "保存中..." : "保存地址"}</button>
                    </div>
                </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addresses.map((addr) => (
                    <div key={addr.id} className={`card p-6 flex flex-col justify-between ${addr.is_default ? "bg-indigo-500/10 border-indigo-500/40" : "bg-slate-900/40 border-slate-800"}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div><span className="badge text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-slate-700 bg-slate-800 text-slate-400 w-fit mb-1.5">{addr.label || "未命名"}</span><p className="font-bold text-slate-200">{addr.recipient_name}</p></div>
                            {addr.is_default ? <Star size={18} fill="currentColor" className="text-indigo-400" /> : <button onClick={() => setDefaultAddress(addr.id, customerId)} className="p-1.5 text-slate-600 hover:text-indigo-400"><StarOff size={16} /></button>}
                        </div>
                        <div className="space-y-3.5 mb-6 text-slate-400 text-sm"><p>{addr.address_line1}</p><p>{addr.city}, {addr.state} {addr.zip}</p><p>{addr.phone}</p></div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800/60"><button className="text-[10px] text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-1"><Edit size={10} /> 编辑</button><button onClick={() => deleteAddress(addr.id, customerId)} className="text-[10px] text-red-500/60 hover:text-red-500 uppercase tracking-widest flex items-center gap-1"><Trash2 size={10} /> 删除</button></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
