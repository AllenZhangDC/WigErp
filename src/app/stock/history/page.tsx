import { History, Package, Search, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react";
import { getStockHistory } from "@/actions/stock.actions";
import { formatDate } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function StockHistoryPage() {
    const transactions = await getStockHistory(100);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="page-header relative overflow-hidden card bg-slate-900/60 p-8 rounded-3xl border-slate-800 shadow-2xl mb-10">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white flex items-center gap-4 italic tracking-tight">
                        <History className="text-indigo-400" size={32} />
                        进销存流水追踪
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase ml-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 not-italic">Stock Transactions</span>
                    </h1>
                    <p className="page-subtitle mt-2 text-slate-400 font-medium italic">审计每一笔库存的变动，包括采购、零售、退货及盘点。</p>
                </div>
            </div>

            <div className="card p-0 border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl shadow-black/20">
                <div className="p-4 border-b border-slate-800/60 flex justify-between items-center bg-slate-950/60">
                    <div className="search-bar w-80">
                        <Search className="search-icon text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="搜索 SKU 或单号..."
                            className="input h-10 w-full pl-10 bg-slate-900 border-slate-800 focus:border-indigo-500 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="input h-10 bg-slate-900 border-slate-800 text-sm shadow-inner w-32">
                            <option value="">所有类型</option>
                            <option value="purchase_in">采购入库</option>
                            <option value="sale_out">销售出库</option>
                        </select>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800">
                            <th className="py-4 px-6 uppercase text-[10px] font-black tracking-widest text-slate-500">流水号 / 时间</th>
                            <th className="py-4 px-6 uppercase text-[10px] font-black tracking-widest text-slate-500">商品名称 & SKU</th>
                            <th className="py-4 px-6 uppercase text-[10px] font-black tracking-widest text-slate-500">业务类型</th>
                            <th className="py-4 px-6 uppercase text-[10px] font-black tracking-widest text-slate-500">数量变动</th>
                            <th className="py-4 px-6 uppercase text-[10px] font-black tracking-widest text-slate-500">操作人</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx: any) => (
                            <tr key={tx.id} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <p className="text-xs font-mono font-bold text-slate-300">{tx.tx_no.split('-')[0].toUpperCase()}</p>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase italic font-bold">{formatDate(tx.created_at)}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                            <Package size={14} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors uppercase">{tx.variant.product.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="font-mono text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{tx.variant.sku}</span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Quality: {tx.quality}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`badge uppercase text-[9px] font-black tracking-widest px-2 py-0.5 border border-current ${tx.quantity > 0
                                            ? "text-emerald-500 bg-emerald-500/10"
                                            : "text-amber-500 bg-amber-500/10"
                                        }`}>
                                        {tx.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {tx.quantity > 0 ? (
                                            <ArrowUpRight size={14} className="text-emerald-500" />
                                        ) : (
                                            <ArrowDownRight size={14} className="text-amber-500" />
                                        )}
                                        <span className={`text-lg font-black italic tracking-tighter ${tx.quantity > 0 ? 'text-emerald-400' : 'text-amber-400'
                                            }`}>
                                            {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-xs font-bold text-slate-300">{tx.user?.name || 'SYSTEM ADMIN'}</p>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <Tag className="mx-auto text-slate-800 mb-4" size={48} />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">暂无库存流水记录</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
