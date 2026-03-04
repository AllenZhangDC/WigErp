"use client";

import { useState, useEffect, useRef } from "react";
import {
    Package,
    Search,
    Trash2,
    Plus,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    Building2,
    Box,
    Truck
} from "lucide-react";
import Link from "next/link";
import { getVariantsBySku } from "@/actions/product.actions";
import { getSuppliers, createSupplier } from "@/actions/supplier.actions";
import { purchaseIn } from "@/actions/stock.actions";
import { formatCurrency } from "@/lib/utils";

interface StockItem {
    variant_id: string;
    sku: string;
    product_name: string;
    quantity: number;
    cost_price: number;
    note?: string;
}

export default function PurchaseInPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [batchNo, setBatchNo] = useState(`PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [items, setItems] = useState<StockItem[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // 1. Initial Load
    useEffect(() => {
        getSuppliers().then(setSuppliers);
    }, []);

    // 2. Search Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                const results = await getVariantsBySku(searchQuery);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const addItem = (variant: any) => {
        if (items.some(i => i.variant_id === variant.id)) return;
        setItems([
            ...items,
            {
                variant_id: variant.id,
                sku: variant.sku,
                product_name: variant.product.name,
                quantity: 1,
                cost_price: Number(variant.cost_price),
            }
        ]);
        setSearchQuery("");
        setSearchResults([]);
    };

    const updateItem = (index: number, field: keyof StockItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!selectedSupplierId) return setError("请选择供应商");
        if (!batchNo) return setError("请填写批次/单号");
        if (items.length === 0) return setError("请添加至少一件入库商品");

        setIsSaving(true);
        setError(null);

        const res = await purchaseIn({
            batch_no: batchNo,
            supplier_id: selectedSupplierId,
            items: items.map(i => ({
                variant_id: i.variant_id,
                quantity: i.quantity,
                note: i.note
            }))
        });

        if ('error' in res) {
            setError(res.error as string);
            setIsSaving(false);
        } else {
            setSuccess(true);
            setIsSaving(false);
            setItems([]);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 size={40} />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">入库操作成功！</h1>
                <p className="text-slate-500 mb-8 font-medium">批次号 {batchNo} 已正式入账，相关 SKU 库存已更新。</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => { setSuccess(false); setBatchNo(`PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`); }} className="btn btn-primary h-11 px-8 shadow-xl shadow-indigo-600/10">继续下一单</button>
                    <Link href="/" className="btn btn-secondary h-11 px-8">返回仪表盘</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-fade-in">
            {/* 🔹 Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="btn btn-secondary p-2.5 bg-slate-900/40 border-slate-700">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                            <Box className="text-emerald-400" size={28} />
                            采购入库单
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">记录从供应商处收到的新货并增加库存。</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* 🔹 SKU Search Box */}
                    <div className="card bg-slate-900/40 border-slate-800 p-8 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">Search</div>
                            <h3 className="font-bold text-lg text-white">选择并添加商品</h3>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="扫描条码或输入 SKU 搜索规格..."
                                className="input h-14 pl-12 input-with-icon bg-slate-950/60 border-indigo-500/20 text-lg font-mono focus:border-indigo-500 transition-all rounded-2xl shadow-2xl shadow-black/20"
                            />

                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 p-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-down">
                                    {searchResults.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => addItem(v)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-slate-800 rounded-xl transition-colors text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700 group-hover:border-indigo-500 group-hover:text-indigo-400">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-mono text-sm text-slate-300 group-hover:text-white transition-colors">{v.sku}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{v.product.name} | {v.length}" | {v.color}</p>
                                                </div>
                                            </div>
                                            <Plus size={18} className="text-slate-600 group-hover:text-indigo-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🔹 Selected Items Table */}
                    <div className="card bg-slate-900/10 border-slate-800/60 p-0 overflow-hidden shadow-2xl shadow-black/40">
                        <table className="data-table">
                            <thead>
                                <tr className="bg-slate-900/60 font-bold border-b border-slate-800">
                                    <th className="py-4 px-6 text-xs uppercase text-slate-500 tracking-widest">SKU 明细</th>
                                    <th className="py-4 px-6 text-xs uppercase text-slate-500 tracking-widest w-24">入库数量</th>
                                    <th className="py-4 px-6 text-xs uppercase text-slate-500 tracking-widest w-32">进货单价</th>
                                    <th className="py-4 px-6 text-xs uppercase text-slate-500 tracking-widest">单行备注</th>
                                    <th className="py-4 px-6 w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item.variant_id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-5">
                                            <p className="font-mono text-xs text-indigo-400 font-bold">{item.sku}</p>
                                            <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-tight opacity-70">{item.product_name}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                                                className="w-full h-10 bg-slate-900 border border-slate-800 rounded-lg px-3 text-white text-center font-black focus:border-indigo-500 outline-none"
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={item.cost_price}
                                                    onChange={e => updateItem(idx, "cost_price", Number(e.target.value))}
                                                    className="w-full h-10 bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-3 text-slate-300 text-xs font-bold outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <input
                                                type="text"
                                                value={item.note || ""}
                                                onChange={e => updateItem(idx, "note", e.target.value)}
                                                placeholder="记录质量或库位..."
                                                className="w-full h-10 bg-slate-950/20 border-transparent hover:border-slate-800 focus:border-slate-700 rounded-lg px-3 text-slate-500 text-[10px] italic outline-none transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <button onClick={() => removeItem(idx)} className="p-2 text-slate-700 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <Box className="mx-auto text-slate-800 mb-4" size={48} />
                                            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-xs">清单暂为空</p>
                                            <p className="text-[10px] text-slate-700 mt-2 font-medium">请使用上方的搜索框或扫描器添加商品。</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    {/* 🔹 Document Info */}
                    <div className="card bg-slate-900/60 border-slate-800 p-8 space-y-6 shadow-2xl shadow-indigo-500/5">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            单据基础属性
                        </h3>

                        <div className="space-y-6">
                            <div className="form-group">
                                <label className="input-label flex items-center gap-2">
                                    <Truck size={14} className="text-indigo-400" />
                                    供应商 (Vendor)
                                </label>
                                <select
                                    value={selectedSupplierId}
                                    onChange={e => setSelectedSupplierId(e.target.value)}
                                    className="input h-12 bg-slate-950 border-slate-700 text-slate-200"
                                >
                                    <option value="">请选择供应商...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="input-label flex items-center gap-2">
                                    <Box size={14} className="text-emerald-400" />
                                    入库批次号 (Batch NO)
                                </label>
                                <input
                                    type="text"
                                    value={batchNo}
                                    onChange={e => setBatchNo(e.target.value)}
                                    className="input h-12 bg-slate-950 border-slate-700 font-mono tracking-tight text-white"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-800/80">
                                <div className="flex justify-between items-end mb-6">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">总计入库件数</p>
                                    <p className="text-3xl font-black text-white italic">{items.reduce((acc, i) => acc + i.quantity, 0)} <span className="text-xs not-italic font-bold text-slate-600 ml-1">PCS</span></p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-500 animate-shake">
                                        <AlertCircle size={18} />
                                        <p className="text-[11px] font-bold">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || items.length === 0}
                                    className="btn btn-primary h-14 w-full shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                                    <span className="text-lg font-black tracking-tight">确认提交入库单</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 🔹 Logic Note */}
                    <div className="card bg-slate-800/10 border-slate-800/40 p-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">业务自动化</h5>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                    入库提交后，系统将自动产生 `PURCHASE_IN` 流水，并为每个 SKU 建立批次追踪。相关款式详情页将即时反映最新库存存量。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
