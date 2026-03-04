import { ChevronLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { getProductById, deleteProduct } from "@/actions/product.actions";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import VariantTable from "@/components/products/VariantTable";
import { CustomerTier } from "@/types/enums";

/**
 * 获取某个变体 (Variant) 的所有等级价格
 */
export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }>; }) {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) notFound();

    const totalStock = product.variants.reduce((acc: number, v: { stock: number }) => acc + v.stock, 0);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/products" className="btn btn-secondary p-2.5 flex items-center justify-center border-slate-700 bg-slate-900/40"><ChevronLeft size={20} /></Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">{product.name}</h1>
                        <div className="flex items-center gap-3 text-sm"><span className="text-indigo-400 font-mono">{product.slug}</span><span className="text-slate-700">|</span><span className="text-slate-500">{product.category || "未分类"}</span></div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-secondary h-10 border-slate-700 bg-slate-900/40 text-slate-300"><Edit size={16} /> 编辑</button>
                    <form action={async () => { "use server"; await deleteProduct(id); redirect("/products"); }}><button className="btn btn-secondary h-10 border-red-900/40 bg-red-500/5 text-red-500 hover:bg-red-500/10"><Trash2 size={16} /> 软删除</button></form>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="card bg-slate-900/30 border-slate-800 p-6"><p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">规格存量</p><p className="text-3xl font-extrabold text-white">{product.variants.length}</p></div>
                <div className="card bg-slate-900/30 border-slate-800 p-6"><p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">总库存数</p><p className="text-3xl font-extrabold text-emerald-400">{totalStock}</p></div>
            </div>
            <VariantTable variants={product.variants} productId={id} />
        </div>
    );
}
