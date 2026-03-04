"use client";

import { useState } from "react";
import { LayoutGrid, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import TierPriceEditor from "./TierPriceEditor";

interface VariantTableProps {
    variants: any[];
    productId: string;
}

export default function VariantTable({ variants, productId }: VariantTableProps) {
    const [editingVariant, setEditingVariant] = useState<any | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight italic">规格明细表 (Total: {variants.length})</h2>
            </div>

            <div className="table-container shadow-2xl shadow-black/20 bg-slate-900/20 border-slate-800">
                <table className="data-table">
                    <thead>
                        <tr className="bg-slate-900/60 font-black border-b border-slate-800">
                            <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">SKU & 规格展示</th>
                            <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">现货库存</th>
                            <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">批发基准价</th>
                            <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">操作项</th>
                        </tr>
                    </thead>
                    <tbody>
                        {variants.map((v) => (
                            <tr key={v.id} className="group border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-indigo-500/50 transition-all">
                                            <LayoutGrid size={20} className="text-slate-600 group-hover:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-xs text-slate-200 font-bold group-hover:text-indigo-400 transition-colors">{v.sku}</p>
                                            <p className="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest">{v.color} / {v.curl.replace("_", " ")}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-emerald-400 italic leading-none">{v.stock}</span>
                                        <span className="text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-widest">Available Units</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white leading-none">{formatCurrency(v.wholesale_price)}</span>
                                        <span className="text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-widest">Base Cost: {formatCurrency(v.cost_price)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setEditingVariant(v)}
                                        className="btn btn-secondary h-9 px-4 text-[10px] uppercase font-black tracking-widest bg-slate-900 border-slate-800 hover:border-indigo-500/50 flex items-center gap-2 group/btn"
                                    >
                                        <DollarSign size={14} className="group-hover/btn:text-emerald-400 transition-colors" />
                                        <span>等级调价</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingVariant && (
                <TierPriceEditor
                    variantId={editingVariant.id}
                    productId={productId}
                    sku={editingVariant.sku}
                    baseWholesale={Number(editingVariant.wholesale_price)}
                    onClose={() => setEditingVariant(null)}
                />
            )}
        </div>
    );
}
