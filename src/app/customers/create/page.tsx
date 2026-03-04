"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, UserPlus, Building2, Save, Info, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createCustomer } from "@/actions/customer.actions";
import { CustomerTier } from "@prisma/client";

export default function CreateCustomerPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ display_name: "", company_name: "", first_name: "", last_name: "", phone: "", email: "", country: "US", tier: CustomerTier.retail, credit_days: 0, credit_limit: 0 });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); if (!formData.display_name) { setError("请填写显示名称"); return; }
        setIsSaving(true); setError(null);
        const result = await createCustomer({ ...formData, credit_limit: formData.credit_limit || null });
        if (result.error) { setError(result.error); setIsSaving(false); } else { router.push(`/customers/${result.id}`); }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <Link href="/customers" className="btn btn-ghost mb-6 text-slate-400 hover:text-white -ml-2"><ChevronLeft size={20} /> 返回客户列表</Link>
            <div className="flex items-center gap-4 mb-10"><div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><UserPlus size={24} /></div><div><h1 className="text-3xl font-extrabold text-white">建立客户档案</h1></div></div>
            <form onSubmit={handleSave} className="space-y-8">
                <div className="card bg-slate-900/40 p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group md:col-span-2"><label className="input-label">显示名称</label><input type="text" required value={formData.display_name} onChange={e => setFormData({ ...formData, display_name: e.target.value })} className="input h-11 bg-slate-900 font-bold" /></div>
                        <div className="form-group"><label className="input-label">公司</label><input type="text" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className="input h-11 bg-slate-900" /></div>
                        <div className="form-group"><label className="input-label">等级</label><select className="input h-11 bg-slate-900" value={formData.tier} onChange={e => setFormData({ ...formData, tier: e.target.value as CustomerTier })}>{Object.values(CustomerTier).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div>
                    </div>
                </div>
                <div className="flex justify-end gap-4"><button type="submit" disabled={isSaving} className="btn btn-primary h-12 px-12">{isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} <span>正式建立档案</span></button></div>
            </form>
        </div>
    );
}
