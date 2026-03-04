import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  History,
  Plus,
  Search,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  LucideIcon,
  PackageCheck
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStockHistory } from "@/actions/stock.actions";

async function getDashboardStats() {
  const [productCount, variantCount, totalStock, totalAR] = await Promise.all([
    prisma.product.count({ where: { deleted_at: null } }),
    prisma.variant.count({ where: { deleted_at: null } }),
    prisma.variant.aggregate({
      where: { deleted_at: null },
      _sum: { stock: true }
    }),
    prisma.customer.aggregate({
      where: { deleted_at: null },
      _sum: { receivable_amt: true }
    })
  ]);

  return {
    productCount,
    variantCount,
    totalStock: totalStock._sum.stock || 0,
    totalAR: Number(totalAR._sum.receivable_amt || 0)
  };
}

export default async function Dashboard() {
  const stats = await getDashboardStats();
  const transactions = await getStockHistory(8);

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-10 pb-20">
      {/* 🔹 Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-widest leading-none uppercase italic">WigERP Dashboard</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Real-time inventory Status: All Systems Online
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/stock/purchase" className="btn btn-primary h-12 px-6 shadow-xl shadow-indigo-600/10">
            <Plus size={20} />
            <span>采购入库</span>
          </Link>
          <Link href="/stock/sale" className="btn btn-secondary h-12 px-6 border-slate-700 bg-slate-900/40">
            <ShoppingCart size={20} />
            <span>销售开单</span>
          </Link>
        </div>
      </div>

      {/* 🔹 Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="款式概况"
          value={stats.productCount}
          unit="Styles"
          icon={Package}
          color="indigo"
          trend="+5.2%"
        />
        <StatCard
          title="活动 SKU"
          value={stats.variantCount}
          unit="SKUs"
          icon={LayoutDashboard}
          color="emerald"
          trend="+12%"
        />
        <StatCard
          title="当前总库存"
          value={stats.totalStock}
          unit="Units"
          icon={Box}
          color="amber"
          trend="In Stock"
        />
        <StatCard
          title="应收账款 [A/R]"
          value={formatCurrency(stats.totalAR)}
          unit="USD Balance"
          icon={TrendingUp}
          color="rose"
          trend="Due Now"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🔹 Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3 italic">
              <History className="text-indigo-400" size={24} />
              近日库存流水报告
            </h2>
            <Link href="/stock/history" className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors flex items-center gap-1">
              查看全部 <ChevronRight size={14} />
            </Link>
          </div>

          <div className="table-container shadow-2xl shadow-black/30 bg-slate-900/10">
            <table className="data-table">
              <thead>
                <tr className="bg-slate-900/60 font-black border-b border-slate-800">
                  <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">操作类型</th>
                  <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">关联 SKU</th>
                  <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">数量 [PCS]</th>
                  <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">时间戳</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`badge uppercase text-[10px] font-black tracking-widest border border-current bg-current/5 px-2.5 py-1 ${tx.quantity > 0 ? "text-emerald-500" : "text-amber-500"
                        }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-slate-300 font-bold group-hover:text-indigo-400 transition-colors">{tx.variant.sku}</p>
                      <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold">{tx.variant.product.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tx.quantity > 0 ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-amber-500" />}
                        <span className={`text-base font-black ${tx.quantity > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 italic uppercase">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <PackageCheck className="mx-auto text-slate-800 mb-4" size={48} />
                      <p className="text-slate-600 font-black text-xs uppercase tracking-widest italic font-medium">尚无交易流水记录</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🔹 Quick Actions & Status */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3 italic px-2">
            <Plus className="text-emerald-400" size={24} />
            智慧功能索引
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <ActionCard
              title="产品录入"
              desc="建立款式、属性及批量 SKU 生成"
              href="/products/create"
              icon={Package}
              color="indigo"
            />
            <ActionCard
              title="客户档案"
              desc="管理批发商等级、地址及账单"
              href="/customers/create"
              icon={Users}
              color="emerald"
            />
            <ActionCard
              title="财务流水"
              desc="查看收款记录、退款及 A/R 结转"
              href="/finance/payments"
              icon={TrendingUp}
              color="rose"
            />
          </div>

          <div className="card bg-slate-900 border-indigo-500/20 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse border border-indigo-500/20">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">系统通知 (0)</p>
              <p className="text-[10px] text-slate-500 mt-1 font-medium italic">目前暂无库存告警或财务异常通知。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, icon: Icon, color, trend }: {
  title: string; value: string | number; unit: string; icon: LucideIcon; color: string; trend: string;
}) {
  const colorMap: any = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className="card card-hover bg-slate-900/40 border-slate-800 p-8 flex flex-col justify-between group overflow-hidden relative">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
        <Icon size={120} />
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Icon size={14} className={colorMap[color].split(' ')[0]} />
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-white italic tracking-tighter">{value}</p>
          <span className="text-[10px] font-black text-slate-600 uppercase italic opacity-60 tracking-widest">{unit}</span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className={`badge text-[9px] font-black uppercase tracking-widest px-2.5 py-1 ${colorMap[color]}`}>
          {trend}
        </div>
        <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
      </div>
    </div>
  );
}

function ActionCard({ title, desc, href, icon: Icon, color }: {
  title: string; desc: string; href: string; icon: LucideIcon; color: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-900 hover:border-indigo-500/30 hover:bg-slate-900/40 transition-all shadow-inner">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
          color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        }`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors uppercase tracking-widest text-xs italic">{title}</h4>
        <p className="text-[10px] text-slate-600 font-medium mt-1 leading-tight">{desc}</p>
      </div>
      <ArrowUpRight size={16} className="text-slate-800 group-hover:text-indigo-500 transition-colors" />
    </Link>
  );
}
