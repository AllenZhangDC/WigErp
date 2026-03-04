"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Wand2, Check, AlertCircle, Copy, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { CurlPattern, CapSize } from "@prisma/client";

interface VariantPreview {
    sku: string;
    length: number;
    color: string;
    curl: CurlPattern;
    cost_price: number;
    wholesale_price: number;
    weight_grams: number;
    shelf_no?: string;
}

interface VariantGeneratorProps {
    productSlug: string;
    onSave: (variants: VariantPreview[]) => Promise<void>;
    isSaving: boolean;
}

export default function VariantGenerator({ productSlug, onSave, isSaving }: VariantGeneratorProps) {
    const [lengths, setLengths] = useState<string[]>(["18", "20", "22", "24"]);
    const [colors, setColors] = useState<string[]>(["#1B", "#613", "#4/27"]);
    const [curl, setCurl] = useState<CurlPattern>(CurlPattern.straight);
    const [capSize, setCapSize] = useState<CapSize>("medium");
    const [newLength, setNewLength] = useState("");
    const [newColor, setNewColor] = useState("");
    const [baseCost, setBaseCost] = useState(50);
    const [baseWholesale, setBaseWholesale] = useState(95);
    const [baseWeight, setBaseWeight] = useState(100);
    const [generated, setGenerated] = useState<VariantPreview[]>([]);
    const [isGenerated, setIsGenerated] = useState(false);

    const addLength = () => { if (newLength && !lengths.includes(newLength)) { setLengths([...lengths, newLength].sort((a, b) => Number(a) - Number(b))); setNewLength(""); } };
    const addColor = () => { if (newColor && !colors.includes(newColor)) { setColors([...colors, newColor]); setNewColor(""); } };
    const removeLength = (val: string) => setLengths(lengths.filter(l => l !== val));
    const removeColor = (val: string) => setColors(colors.filter(c => c !== val));

    const generateCombinations = () => {
        const results: VariantPreview[] = [];
        lengths.forEach(len => {
            colors.forEach(col => {
                const colorCode = col.replace("#", "").replace("/", "-");
                const curlAbbr = curl.split("_").map(w => w[0].toUpperCase()).join("");
                const sku = `${productSlug.toUpperCase()}-${len}-${colorCode}-${curlAbbr}`;
                results.push({ sku, length: Number(len), color: col, curl, cost_price: baseCost, wholesale_price: baseWholesale, weight_grams: baseWeight });
            });
        });
        setGenerated(results); setIsGenerated(true);
    };

    const updateVariant = (index: number, field: keyof VariantPreview, value: any) => {
        const updated = [...generated]; updated[index] = { ...updated[index], [field]: value }; setGenerated(updated);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card bg-slate-900/40 border-slate-800 p-6 space-y-6">
                    <h3 className="font-bold text-lg text-white">配置选项属性</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="input-label mb-2">可选长度</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {lengths.map(len => <span key={len} className="checkbox-chip selected group">{len}" <button onClick={() => removeLength(len)}><Trash2 size={12} /></button></span>)}
                            </div>
                            <div className="flex gap-2">
                                <input type="number" value={newLength} onChange={e => setNewLength(e.target.value)} placeholder="e.g. 26" className="input flex-1 h-9 bg-slate-900" />
                                <button onClick={addLength} className="btn btn-secondary h-9 w-9 p-0"><Plus size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card bg-slate-900/40 border-slate-800 p-6 space-y-6">
                    <h3 className="font-bold text-lg text-white">默认价格与参数</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="input-label">曲度</label>
                            <select className="input bg-slate-900 h-10" value={curl} onChange={e => setCurl(e.target.value as CurlPattern)}>
                                {Object.values(CurlPattern).map(p => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="input-label">进价</label>
                            <input type="number" value={baseCost} onChange={e => setBaseCost(Number(e.target.value))} className="input bg-slate-900 h-10" />
                        </div>
                        <div className="form-group">
                            <label className="input-label">批发价</label>
                            <input type="number" value={baseWholesale} onChange={e => setBaseWholesale(Number(e.target.value))} className="input bg-slate-900 h-10" />
                        </div>
                    </div>
                    <button onClick={generateCombinations} className="btn btn-primary w-full h-11">生成规格組合 ({lengths.length * colors.length})</button>
                </div>
            </div>
            {isGenerated && (
                <div className="animate-slide-up space-y-4">
                    <div className="table-container bg-slate-900/30 border-slate-800">
                        <table className="data-table">
                            <thead><tr><th>SKU 编码</th><th>长度</th><th>颜色</th><th>进价</th><th>批发价</th><th></th></tr></thead>
                            <tbody>
                                {generated.map((variant, idx) => (
                                    <tr key={variant.sku} className="group">
                                        <td className="font-mono text-[11px] text-slate-300">{variant.sku}</td>
                                        <td>{variant.length}"</td>
                                        <td>{variant.color}</td>
                                        <td><input type="number" value={variant.cost_price} onChange={e => updateVariant(idx, "cost_price", Number(e.target.value))} className="w-20 h-8 bg-slate-800 rounded px-2 text-xs" /></td>
                                        <td><input type="number" value={variant.wholesale_price} onChange={e => updateVariant(idx, "wholesale_price", Number(e.target.value))} className="w-20 h-8 bg-slate-800 rounded px-2 text-xs font-bold text-emerald-400" /></td>
                                        <td><button onClick={() => setGenerated(generated.filter((_, i) => i !== idx))} className="p-1.5 text-slate-500 hover:text-red-400"><Trash2 size={16} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={() => onSave(generated)} disabled={isSaving || generated.length === 0} className="btn btn-primary btn-lg min-w-[12rem]">
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} <span>保存款式及 {generated.length} 个规格</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
