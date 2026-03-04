import { Plus, Package, Search, Filter, MoreVertical, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { getProducts } from "@/actions/product.actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>;
}) {
    const { query } = await searchParams;
    const products = await getProducts(query);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto">
            {/* 🔹 Header */}
            <div className="page-header flex-col items-start gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="page-title leading-tight">产品中心</h1>
                    <p className="page-subtitle">管理款式、SKU规格及库存状态</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Link href="/products/create" className="btn btn-primary btn-lg shadow-indigo-500/10">
                        <Plus size={20} />
                        <span>新增款式</span>
                    </Link>
                </div>
            </div>

            {/* 🔹 Tools & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <form className="search-bar flex-1 max-w-md">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        name="query"
                        placeholder="搜索产品名称、Slug 或分类..."
                        className="input w-full pl-10 h-10 shadow-sm"
                        defaultValue={query}
                    />
                </form>
                <div className="flex gap-2">
                    <button className="btn btn-secondary h-10 px-3 flex items-center gap-2 border-slate-700 bg-slate-900/40">
                        <Filter size={16} />
                        <span>筛选</span>
                    </button>
                    <div className="flex p-1 bg-slate-900/60 rounded-lg border border-slate-800">
                        <button className="p-1.5 rounded-md text-indigo-500 bg-indigo-500/10 shadow-inner">
                            <LayoutGrid size={18} />
                        </button>
                        <button className="p-1.5 rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors">
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 🔹 Product Grid */}
            {products.length === 0 ? (
                <div className="card text-center py-20 bg-slate-900/20 border-dashed border-slate-700">
                    <Package className="mx-auto text-slate-600 mb-4" size={48} />
                    <p className="text-xl font-medium text-slate-300">暂无相关产品</p>
                    <p className="text-slate-500 mt-2">点击上方“新增款式”开始建立您的库存。</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product: any) => (
                        <Link key={product.id} href={`/products/${product.id}`} className="group card card-hover p-0 overflow-hidden shadow-xl shadow-black/5 hover:translate-y-[-2px] transition-transform">
                            <div className="aspect-[16/9] w-full bg-slate-800 relative overflow-hidden">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                        <Package size={48} className="text-slate-700 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="badge badge-blue bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 backdrop-blur-md px-2.5 py-1 text-xs">
                                        {product.material === "human_hair" ? "真人发" : "化纤"}
                                    </span>
                                    <span className="badge badge-gray bg-slate-900/40 border border-slate-700 text-slate-300 backdrop-blur-md px-2.5 py-1 text-xs">
                                        {product.craft.replace("_", " ")}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{product.name}</h3>
                                        <p className="text-[12px] text-slate-500 font-mono mt-0.5">{product.slug}</p>
                                    </div>
                                    <button className="p-1 hover:bg-slate-800 rounded-md transition-colors text-slate-500">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/50">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">规格总数</p>
                                        <p className="text-xl font-bold text-slate-200 mt-1">{product._count.variants} <span className="text-xs font-normal text-slate-500 ml-1">SKUs</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">最后更新</p>
                                        <p className="text-sm font-medium text-slate-300 mt-1.5">{formatDate(product.updated_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
