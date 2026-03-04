"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, PackagePlus, LayoutGrid, Info, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { createProduct, createVariantsBatch } from "@/actions/product.actions";
import { MaterialType, CraftType, PriceMode } from "@/types/enums";
import VariantGenerator from "@/components/products/VariantGenerator";

export default function CreateProductPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [productData, setProductData] = useState({ name: "", slug: "", material: "human_hair" as MaterialType, craft: "lace_front" as CraftType, category: "", description: "", price_mode: "per_piece" as PriceMode, images: [] as string[] });

    const handleNext = () => { if (!productData.name || !productData.slug) { setError("请填写产品名称和 URL 标识"); return; } setError(null); setStep(2); };

    const handleSaveAll = async (variants: any[]) => {
        setIsSaving(true); setError(null);
        try {
            const prodResult = await createProduct(productData);
            if ('error' in prodResult) { setError(prodResult.error as string); setIsSaving(false); return; }
            const varResult = await createVariantsBatch(prodResult.id, variants);
            if ('error' in varResult) { setError(varResult.error as string); setIsSaving(false); return; }
            router.push(`/products/${prodResult.id}`);
        } catch (e: any) { setError(e.message || "异常"); } finally { setIsSaving(false); }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <Link href="/products" className="btn btn-ghost mb-6 text-slate-400 hover:text-white"><ChevronLeft size={20} /> 返回产品中心</Link>
            <div className="flex items-center gap-4 mb-10"><h1 className="text-3xl font-extrabold text-white">建立新款式</h1></div>
            {error && <div className="mb-8 p-4 bg-red-500/10 text-red-400">{error}</div>}
            {step === 1 && (
                <div className="card bg-slate-900/40 p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="form-group"><label className="input-label">产品名称</label><input type="text" value={productData.name} onChange={e => { const name = e.target.value; setProductData({ ...productData, name, slug: name.toLowerCase().replace(/\s+/g, '-') }); }} className="input h-11 bg-slate-900" /></div>
                        <div className="form-group"><label className="input-label">Slug</label><input type="text" value={productData.slug} onChange={e => setProductData({ ...productData, slug: e.target.value })} className="input h-11 bg-slate-900" /></div>
                    </div>
                    <button onClick={handleNext} className="btn btn-primary h-11 px-10">下一步</button>
                </div>
            )}
            {step === 2 && <VariantGenerator productSlug={productData.slug} onSave={handleSaveAll} isSaving={isSaving} />}
        </div>
    );
}
