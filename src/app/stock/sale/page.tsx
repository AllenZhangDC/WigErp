"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Search,
    Trash2,
    Plus,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ShoppingCart,
    MapPin,
    DollarSign,
    Tag,
    CreditCard
} from "lucide-react";
import Link from "next/link";
import { getVariantsBySku } from "@/actions/product.actions";
import { getCustomers } from "@/actions/customer.actions";
import { saleOut } from "@/actions/stock.actions";
import { formatCurrency } from "@/lib/utils";
import { getTierSettings } from "@/actions/tier.actions";
import { CustomerTier } from "@/types/enums";

interface SaleItem {
    variant_id: string;
    sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    stock_available: number;
}

export default function SalesOutPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustId, setSelectedCustId] = useState("");
    const [selectedCust, setSelectedCust] = useState<any>(null);

    const [tierSettings, setTierSettings] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [items, setItems] = useState<SaleItem[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // 1. Initial Load
    useEffect(() => {
        getCustomers().then(setCustomers);
        getTierSettings().then(setTierSettings);
    }, []);

    // 2. Customer Change Logic
    useEffect(() => {
        const cust = customers.find(c => c.id === selectedCustId);
        setSelectedCust(cust || null);

        // Recalculate prices if customer tier changes
        if (cust && items.length > 0) {
            // Logic to re-check tiered pricing
        }
    }, [selectedCustId, customers]);

    // 3. Search Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 1) {
                const results = await getVariantsBySku(searchQuery);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const addItem = (v: any) => {
        if (items.some(i => i.variant_id === v.id)) return;

        // Determine price based on tier (Logic sync with lib/price-utils.ts)
        let price = Number(v.wholesale_price);
        if (selectedCust) {
            const tierPrice = v.tier_prices?.find((tp: any) => tp.tier === selectedCust.tier);
            if (tierPrice) {
                price = Number(tierPrice.price);
            } else {
                const setting = tierSettings.find(s => s.tier === selectedCust.tier);
                if (setting && setting.discount_rate > 0) {
                    price = price * (100 - setting.discount_rate) / 100;
                }
            }
        }

        setItems([
            ...items,
            {
                variant_id: v.id,
                sku: v.sku,
                product_name: v.product.name,
                quantity: 1,
                unit_price: price,
                stock_available: v.stock,
            }
        ]);
        setSearchQuery("");
        setSearchResults([]);
    };

    const updateItem = (index: number, field: keyof SaleItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!selectedCustId) return setError("请选择客户");
        if (items.length === 0) return setError("请添加商品");

        // Check for stock insufficiency
        const outOfStock = items.filter(i => i.quantity > i.stock_available);
        if (outOfStock.length > 0) {
            return setError(`SKU ${outOfStock[0].sku} 库存不足 (${outOfStock[0].stock_available} Pcs可用)`);
        }

        setIsSaving(true);
        setError(null);

        const res = await saleOut({
            customer_id: selectedCustId,
            items: items.map(i => ({
                variant_id: i.variant_id,
                quantity: i.quantity,
            }))
        });

        if (res.error) {
            setError(res.error);
            setIsSaving(false);
        } else {
            setSuccess(true);
            setIsSaving(false);
            setItems([]);
        }
    };

    const totalAmount = items.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0);

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
                <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/10">
                    <CheckCircle2 size={40} />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">订单已生成！</h1>
                <p className="text-slate-500 mb-8 font-medium">相关库存已扣减，销售流水已记入 {selectedCust?.display_name} 名下。</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setSuccess(false)} className="btn btn-primary h-11 px-8 shadow-xl shadow-indigo-600/10">继续开单</button>
                    <Link href="/" className="btn btn-secondary h-11 px-8">返回大盘</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/" className="btn btn-secondary p-2.5 bg-slate-900/40 border-slate-700">
                    <ChevronLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                    <ShoppingCart className="text-indigo-400" size={28} />
                    销售开单 (Invoicing)
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* 🔹 Item Selection */}
                    <div className="card bg-slate-900/40 border-slate-800 p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-white flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-black">1</span>
                                添加销售规格
                            </h3>
                            {selectedCust && (
                                <span className="badge badge-blue bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                                    {selectedCust.tier} Tier Pricing Enabled
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                disabled={!selectedCustId}
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={!selectedCustId ? "请先选择左侧客户..." : "搜索 SKU 或扫描条码..."}
                                className="input h-14 pl-12 bg-slate-950/60 border-indigo-500/20 text-lg font-mono focus:border-indigo-500 transition-all rounded-2xl"
                            />

                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 p-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50">
                                    {searchResults.map(v => (
                                        <button key={v.id} onClick={() => addItem(v)} className="w-full flex items-center justify-between p-4 hover:bg-slate-800 rounded-xl transition-colors text-left group">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
                                                    <Plus size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-mono text-sm text-slate-300 font-bold">{v.sku}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{v.product.name} | 库存: {v.stock} pcs</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-indigo-400 italic">{formatCurrency(selectedCust ? (v.tier_prices.find((tp: any) => tp.tier === selectedCust.tier)?.price || v.wholesale_price) : v.wholesale_price)}</p>
                                                <p className="text-[8px] text-slate-600 font-bold uppercase">Rate</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🔹 Sale Items Table */}
                    <div className="card bg-slate-900/10 border-slate-800/60 p-0 overflow-hidden">
                        <table className="data-table">
                            <thead>
                                <tr className="bg-slate-900/60 font-bold border-b border-slate-800">
                                    <th className="py-4 px-6 text-xs uppercase text-slate-500 tracking-widest">SKU & 货源</th>
                                    <th className="py-4 px-6 text-xs uppercase text-slate-500 tracking-widest w-24">销售数</th>
                                    <th className="py-4 px-6 text-xs uppercase text-slate-500 tracking-widest w-32">单价 [USD]</th>
                                    <th className="py-4 px-6 text-xs uppercase text-slate-500 tracking-widest text-right">小计</th>
                                    <th className="py-4 px-6 w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item.variant_id} className="border-b border-slate-800/40">
                                        <td className="px-6 py-5">
                                            <p className="font-mono text-[11px] text-indigo-400 font-bold">{item.sku}</p>
                                            <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-tight">{item.product_name}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                                                className={`w-full h-10 bg-slate-900 border ${item.quantity > item.stock_available ? 'border-red-500' : 'border-slate-800'} rounded-lg px-3 text-white text-center font-black`}
                                            />
                                            {item.quantity > item.stock_available && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 text-center">Over Stock</p>}
                                        </td>
                                        <td className="px-6 py-5">
                                            <input
                                                type="number"
                                                value={item.unit_price}
                                                onChange={e => updateItem(idx, "unit_price", Number(e.target.value))}
                                                className="w-full h-10 bg-slate-900 border border-slate-800 rounded-lg px-3 text-emerald-400 text-xs font-black text-center"
                                            />
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-200">
                                            {formatCurrency(item.quantity * item.unit_price)}
                                        </td>
                                        <td className="px-6 py-5 pr-6 text-right">
                                            <button onClick={() => removeItem(idx)} className="p-2 text-slate-700 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <ShoppingCart className="mx-auto text-slate-900 mb-4" size={48} />
                                            <p className="text-slate-800 font-bold uppercase tracking-[0.2em] text-xs">等待添加商品</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    {/* 🔹 Order Checkout Card */}
                    <div className="card bg-slate-900/60 border-slate-800 p-8 space-y-6 shadow-2xl">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">订单结账概要</h3>

                        <div className="space-y-6">
                            <div className="form-group">
                                <label className="input-label flex items-center gap-2">
                                    <Users size={14} className="text-indigo-400" />
                                    选择采购客户
                                </label>
                                <select
                                    value={selectedCustId}
                                    onChange={e => setSelectedCustId(e.target.value)}
                                    className="input h-12 bg-slate-950 border-slate-700 text-slate-200"
                                >
                                    <option value="">请选择批发对象...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.display_name} ({c.tier})</option>)}
                                </select>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-800/80">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    <span>商品总额</span>
                                    <span className="text-slate-300">{formatCurrency(totalAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    <span>运费 / 杂费</span>
                                    <span className="text-slate-300">$0.00</span>
                                </div>
                                <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Grand Total</p>
                                        <p className="text-3xl font-black text-white italic tracking-tighter">{formatCurrency(totalAmount)}</p>
                                    </div>
                                    <Tag size={24} className="text-indigo-600 opacity-30" />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold animate-pulse">
                                    <AlertCircle size={18} />
                                    <p>{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={isSaving || items.length === 0}
                                className="btn btn-primary h-14 w-full shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={24} /> : <CreditCard size={24} />}
                                <span className="text-lg font-black tracking-tight uppercase">Confirm Order</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
