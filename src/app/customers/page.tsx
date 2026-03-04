import { Plus, Users, Search, Filter, MoreVertical, CreditCard, ChevronRight, MapPin, Building2, UserCircle } from "lucide-react";
import Link from "next/link";
import { getCustomers } from "@/actions/customer.actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string }>;
}) {
    const { query } = await searchParams;
    const customers = await getCustomers(query);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto">
            {/* 🔹 Header */}
            <div className="page-header flex-col md:flex-row md:items-center gap-4 mb-8">
                <div>
                    <h1 className="page-title leading-tight">客户档案中心</h1>
                    <p className="page-subtitle">管理批发商、美容院老板及分销渠道</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Link href="/customers/create" className="btn btn-primary btn-lg shadow-indigo-500/10">
                        <Plus size={20} />
                        <span>新增客户</span>
                    </Link>
                </div>
            </div>

            {/* 🔹 Tools */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <form className="search-bar flex-1 max-w-md">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        name="query"
                        placeholder="搜索姓名、公司或联系方式..."
                        className="input w-full pl-10 h-11 shadow-sm bg-slate-900/40"
                        defaultValue={query}
                    />
                </form>
                <div className="flex gap-3">
                    <button className="btn btn-secondary h-11 px-4 flex items-center gap-2 border-slate-700 bg-slate-900/40">
                        <Filter size={16} />
                        <span>高级筛选</span>
                    </button>
                </div>
            </div>

            {/* 🔹 Customer List */}
            {customers.length === 0 ? (
                <div className="card text-center py-24 bg-slate-900/20 border-dashed border-slate-800">
                    <Users className="mx-auto text-slate-700 mb-6 opacity-40 uppercase" size={64} />
                    <p className="text-2xl font-black text-slate-400 italic">暂无客户记录</p>
                    <p className="text-slate-600 mt-2 font-medium">点击“新增客户”建立您的第一个业务伙伴。</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map((customer) => {
                        const isOverCredit = customer.credit_limit && Number(customer.receivable_amt) > Number(customer.credit_limit);

                        return (
                            <Link key={customer.id} href={`/customers/${customer.id}`} className="group card card-hover p-6 shadow-2xl shadow-black/10 hover:translate-y-[-4px] transition-all bg-slate-900/40 border-slate-800/60 overflow-hidden relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                            {customer.company_name ? <Building2 size={24} /> : <UserCircle size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg text-white group-hover:text-indigo-300 transition-colors uppercase leading-none">{customer.display_name}</h3>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="badge badge-blue text-[9px] font-black tracking-widest bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 uppercase">{customer.tier}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-1 text-slate-700 hover:text-white">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <CreditCard size={14} className="text-slate-600" />
                                        <span className="font-bold uppercase tracking-widest">应收余额:</span>
                                        <span className={`font-black tracking-tight ${Number(customer.receivable_amt) > 0 ? "text-amber-400" : "text-emerald-400 text-sm"}`}>
                                            {formatCurrency(customer.receivable_amt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <MapPin size={14} className="text-slate-600" />
                                        <span className="font-bold uppercase tracking-widest">关联地址:</span>
                                        <span className="text-slate-300 font-black italic">{customer._count.addresses} 个站点</span>
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-slate-800/60 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isOverCredit ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/40" : "bg-emerald-500 shadow-lg shadow-emerald-500/40"}`} />
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">
                                            {isOverCredit ? "CREDIT RISK" : "CREDIT HEALTHY"}
                                        </p>
                                    </div>
                                    <span className="p-1.5 rounded-lg bg-slate-950 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                                        <ChevronRight size={16} />
                                    </span>
                                </div>

                                {/* Over Credit Glow Overlay */}
                                {isOverCredit && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-3xl rounded-full -mr-10 -mt-10" />}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
