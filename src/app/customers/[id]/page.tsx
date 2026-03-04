import { ChevronLeft, UserCircle, Building2, Phone, Mail, MapPin, History, CreditCard, ShoppingCart, DollarSign, Wallet, MoreVertical, Edit, Trash2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getCustomerById, deleteCustomer } from "@/actions/customer.actions";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import AddressBook from "@/components/customers/AddressBook";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }>; }) {
    const { id } = await params;
    const customer = await getCustomerById(id);
    if (!customer) notFound();
    const { receivable_amt, credit_limit } = customer;
    const isOverCredit = credit_limit && Number(receivable_amt) > Number(credit_limit);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-24 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Link href="/customers" className="btn btn-secondary h-11 w-11 p-0 flex items-center justify-center border-slate-700 bg-slate-900/40"><ChevronLeft size={24} /></Link>
                    <div className="flex items-center gap-5"><div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center p-2 shadow-xl shadow-indigo-600/5">{customer.company_name ? <Building2 size={32} /> : <UserCircle size={32} />}</div><div><h1 className="text-4xl font-black text-white tracking-tight">{customer.display_name}</h1><div className="flex items-center gap-3 mt-1.5 text-xs"><span className="badge badge-blue px-3 py-1 font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-[0.1em]">{customer.tier}</span><span className="text-slate-700">/</span><span className="text-slate-500 font-bold uppercase tracking-widest">{customer.first_name} {customer.last_name}</span></div></div></div>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-secondary h-11 px-5 border-slate-700 bg-slate-900/40 text-slate-300"><Edit size={18} /> 编辑</button>
                    <form action={async () => { "use server"; await deleteCustomer(id); redirect("/customers"); }}><button className="btn btn-secondary h-11 px-5 border-red-900/40 bg-red-500/10 text-red-500 hover:bg-red-500/20"><Trash2 size={18} /> 软删除</button></form>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card bg-slate-900/40 border-slate-800 p-6 flex flex-col justify-between overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={80} /></div><p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Wallet size={12} /> 应收账款汇总</p><div><p className={`text-4xl font-black tracking-tighter ${Number(receivable_amt) > 0 ? "text-amber-400" : "text-emerald-400"}`}>{formatCurrency(receivable_amt)}</p><p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Balance Receivable</p></div></div>
                <div className={`card p-6 flex flex-col justify-between border-2 transition-all ${isOverCredit ? "bg-red-500/10 border-red-500/60 shadow-xl shadow-red-500/10" : "bg-slate-900/40 border-slate-800"}`}><p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><CreditCard size={12} /> 信用额度</p><div><p className={`text-2xl font-black tracking-tight ${isOverCredit ? "text-red-400" : "text-slate-300"}`}>{customer.credit_limit ? formatCurrency(customer.credit_limit) : "UNCAPPED"}</p><div className="flex items-center gap-2 mt-2"><span className={`w-2 h-2 rounded-full ${isOverCredit ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} /><p className="text-[10px] text-slate-500 font-bold uppercase">{isOverCredit ? "CREDIT EXCEEDED" : "CREDIT HEALTHY"}</p></div></div></div>
                <div className="card bg-slate-900/40 border-slate-800 p-6 flex flex-col justify-between"><p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Clock size={12} /> 结款账期</p><div><p className="text-4xl font-black text-indigo-400 tracking-tighter">{customer.credit_days} <span className="text-xl font-bold ml-0.5">DAYS</span></p><p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Payment Term (NET)</p></div></div>
                <div className="card bg-slate-900/40 border-slate-800 p-6 flex flex-col justify-between"><p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><ShoppingCart size={12} /> 累计成交单数</p><div><p className="text-4xl font-black text-slate-300 tracking-tighter">{customer.orders.length} <span className="text-xl font-bold ml-0.5">ORDERS</span></p><p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Total Order History</p></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-8"><div className="card bg-slate-900/60 border-slate-800 p-8 space-y-6"><h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">基本联系信息</h3><div className="space-y-6"><div className="flex items-center gap-4"><div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shadow-inner"><Mail size={16} /></div><div><p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-0.5">EMAIL ADDRESS</p><p className="text-sm font-bold text-slate-300">{customer.email || "NO-EMAIL@RECORD.COM"}</p></div></div><div className="flex items-center gap-4"><div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shadow-inner"><Phone size={16} /></div><div><p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-0.5">PHONE NUMBER</p><p className="text-sm font-bold text-slate-300">{customer.phone || "UNSPECIFIED"}</p></div></div><div className="flex items-center gap-4"><div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shadow-inner"><MapPin size={16} /></div><div><p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-0.5">REGISTERED COUNTRY</p><p className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase">{customer.country || "UNKNOWN"}</p></div></div></div></div></div>
                <div className="lg:col-span-2 space-y-12"><AddressBook customerId={id} addresses={customer.addresses} /></div>
            </div>
        </div>
    );
}
