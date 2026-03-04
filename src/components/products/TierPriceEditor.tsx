"use client";

import { useState, useEffect } from "react";
import { DollarSign, Save, Loader2, X, AlertCircle } from "lucide-react";
import { updateTierPrices, getTierPrices } from "@/actions/price.actions";
import { CustomerTier } from "@/types/enums";

interface TierPriceEditorProps {
    variantId: string;
    productId: string;
    sku: string;
    baseWholesale: number;
    onClose: () => void;
}

const TIER_LABELS: Record<CustomerTier, string> = {
    retail: "零 售 [RETAIL]",
    vip: "贵 宾 [VIP]",
    vvip: "金 牌 [VVIP]",
    agent: "代 理 [AGENT]",
};

export default function TierPriceEditor({ variantId, productId, sku, baseWholesale, onClose }: TierPriceEditorProps) {
    const [prices, setPrices] = useState<Partial<Record<CustomerTier, number>>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const results = await getTierPrices(variantId);
                const priceMap: Partial<Record<CustomerTier, number>> = {};
                results.forEach((p: any) => {
                    priceMap[p.tier as CustomerTier] = Number(p.price);
                });

                // 默认建议：零售由批发价上浮，代理跟随批发价等（可选逻辑）
                // 核心是如果有已存的就加载
                setPrices(priceMap);
            } catch (e) {
                setError("无法加载等级价格数据");
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [variantId]);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const data = Object.entries(prices)
                .filter(([_, price]) => price !== undefined)
                .map(([tier, price]) => ({
                    tier: tier as CustomerTier,
                    price: price as number,
                }));

            const result = await updateTierPrices(variantId, productId, data);
            if (result.error) {
                setError(result.error);
            } else {
                onClose();
            }
        } catch (e: any) {
            setError(e.message || "未知错误");
        } finally {
            setIsSaving(false);
        }
    };

    const updatePrice = (tier: CustomerTier, value: string) => {
        const num = parseFloat(value);
        if (!isNaN(num) || value === "") {
            setPrices(prev => ({ ...prev, [tier]: isNaN(num) ? 0 : num }));
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box max-w-lg bg-slate-900 border-indigo-500/20 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                            <DollarSign className="text-emerald-400" /> 等级价格管理
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Managing SKU: {sku}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6">
                            {Object.entries(TIER_LABELS).map(([tier, label]) => (
                                <div key={tier} className="form-group">
                                    <label className="input-label flex items-center justify-between">
                                        <span>{label}</span>
                                        <span className="text-[9px] opacity-40 italic">基础批发价: {baseWholesale}</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors font-bold">$</div>
                                        <input
                                            type="number"
                                            value={prices[tier as CustomerTier] ?? ""}
                                            onChange={(e) => updatePrice(tier as CustomerTier, e.target.value)}
                                            placeholder={`输入等级价格`}
                                            className="input h-12 w-full pl-10 bg-slate-950 border-slate-800 focus:border-indigo-500/50 transition-all font-mono text-lg font-black text-emerald-400"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                            <button onClick={onClose} className="btn btn-secondary h-12 px-8 border-slate-800">取消</button>
                            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary h-12 px-10 shadow-xl shadow-indigo-600/20 min-w-[10rem]">
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> <span>保存配置</span></>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
