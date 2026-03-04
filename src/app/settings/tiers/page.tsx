"use client";

import { useState, useEffect } from "react";
import {
    Users,
    ChevronLeft,
    Settings,
    Save,
    Loader2,
    Percent,
    Info,
    AlertCircle,
    CheckCircle2,
    DollarSign
} from "lucide-react";
import Link from "next/link";
import { getTierSettings, updateTierSetting } from "@/actions/tier.actions";
import { CustomerTier } from "@/types/enums";

const TIER_META: Record<CustomerTier, { label: string; color: string; desc: string }> = {
    retail: { label: "普通零售 (Retail)", color: "slate", desc: "基础散客等级，通常无额外折扣。" },
    vip: { label: "贵宾客户 (VIP)", color: "indigo", desc: "长期合作的中型客户。" },
    vvip: { label: "金牌客户 (VVIP)", color: "amber", desc: "核心大额批发客户。" },
    agent: { label: "地区代理 (Agent)", color: "emerald", desc: "长期代理合同客户，享受最高额定折扣。" },
};

export default function TierSettingsPage() {
    const [settings, setSettings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTierSettings().then(data => {
            // 合并默认值
            const mapped = Object.keys(TIER_META).map((tier: string) => {
                const existing = data.find((s: any) => s.tier === tier);
                return existing || { tier, discount_rate: 0, description: "" };
            });
            setSettings(mapped);
            setIsLoading(false);
        });
    }, []);

    const handleUpdate = async (tier: CustomerTier, rate: number, desc: string) => {
        setIsSaving(tier);
        setError(null);
        try {
            const result = await updateTierSetting(tier, rate, desc);
            if (result.error) setError(result.error);
        } catch (e: any) {
            setError(e.message || "更新失败");
        } finally {
            setIsSaving(null);
        }
    };

    const updateLocal = (tier: CustomerTier, field: string, value: any) => {
        setSettings(prev => prev.map(s => s.tier === tier ? { ...s, [field]: value } : s));
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
            <div className="flex items-center gap-4 mb-10">
                <Link href="/" className="btn btn-secondary p-2.5 bg-slate-900/40 border-slate-800">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter uppercase italic">
                        <Users className="text-indigo-400" size={28} />
                        客户等级与全局折扣管理
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">设置不同等级客户的默认结算折扣，个别商品定价将覆盖此设置。</p>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-3">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {settings.map((s) => (
                    <div key={s.tier} className="card bg-slate-900/40 border-slate-800/60 p-8 hover:border-indigo-500/20 transition-all group">
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{TIER_META[s.tier as CustomerTier].label}</h3>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm italic">
                                    {TIER_META[s.tier as CustomerTier].desc}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-end gap-4 w-full md:w-auto">
                                <div className="form-group w-full sm:w-40">
                                    <label className="input-label text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1.5 flex items-center gap-2">
                                        <Percent size={12} /> 全局折扣率 (%)
                                    </label>
                                    <div className="relative group/input">
                                        <input
                                            type="number"
                                            value={s.discount_rate}
                                            onChange={(e) => updateLocal(s.tier as CustomerTier, 'discount_rate', Number(e.target.value))}
                                            placeholder="0"
                                            className="input h-14 w-full pr-10 bg-slate-950/80 border-slate-800 text-2xl font-black text-emerald-400 italic font-mono transition-all focus:border-indigo-500/50"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 font-bold group-focus-within/input:text-indigo-400 transition-colors tracking-widest uppercase text-[10px]">OFF</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleUpdate(s.tier as CustomerTier, s.discount_rate, s.description)}
                                    disabled={isSaving === s.tier}
                                    className="btn btn-primary h-14 w-full sm:w-14 items-center justify-center shadow-xl shadow-indigo-600/10 active:scale-90 transition-all disabled:opacity-50"
                                >
                                    {isSaving === s.tier ? <Loader2 className="animate-spin" size={20} /> : <Save size={24} />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-8 card border-dashed border-slate-800 bg-transparent">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                        <Info size={24} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">计算优先级说明 (Formula Precedence)</h4>
                        <div className="text-[11px] text-slate-500 leading-relaxed font-medium italic space-y-1">
                            <p>1. 系统始终优先检查 <span className="text-indigo-400 font-bold">个别商品的特定等级价 (Hard-fixed)</span>，若存在则直接引用。</p>
                            <p>2. 如无特定计价，将以此处的 <span className="text-emerald-400 font-bold">全局折扣率 (Global Discount)</span> 作用于商品的批发基准价。</p>
                            <p>3. 若此处未设置 (为 0)，则系统回退至商品的原始批发价进行结算。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
