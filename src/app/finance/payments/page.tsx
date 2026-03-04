"use client";

import { useEffect, useState } from "react";
import { DollarSign, CheckCircle2, AlertCircle, RefreshCw, HandCoins, Users } from "lucide-react";
import { getPaymentLogs, getReceivableCustomers } from "@/actions/finance.actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function FinancePaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [debtors, setDebtors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [payLogs, debtList] = await Promise.all([
                getPaymentLogs(20),
                getReceivableCustomers(10)
            ]);
            setPayments(payLogs);
            setDebtors(debtList);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="max-w-7xl mx-auto pb-20 animate-fade-in space-y-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-widest italic flex items-center gap-3">
                        <HandCoins className="text-rose-400" />
                        财务与对账 <span className="text-slate-500 font-light">(Finances)</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        Real-time revenue tracking & receivables
                    </p>
                </div>
                <button onClick={loadData} className="btn btn-secondary h-10 border-slate-700 bg-slate-900 flex items-center gap-2 text-slate-300">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> 刷新数据
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-400" /> 近期收款水单 (Payment Logs)
                    </h2>

                    <div className="table-container shadow-2xl bg-slate-900/40">
                        {loading ? (
                            <div className="h-64 flex items-center justify-center text-slate-500 uppercase font-black tracking-widest gap-3">
                                <RefreshCw className="animate-spin text-rose-500" /> 同步加密账簿...
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-500 uppercase font-bold tracking-widest flex-col gap-3">
                                <DollarSign size={48} className="text-slate-800" /> 暂无收款流水
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr className="bg-slate-900/60 font-black border-b border-slate-800">
                                        <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">时间</th>
                                        <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">单号 / 客服</th>
                                        <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">收款方式 / 类型</th>
                                        <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">金额 ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(log => (
                                        <tr key={log.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{formatDate(log.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <Link href="#" className="font-mono text-sm text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                                                    {log.order.order_no}
                                                </Link>
                                                <p className="text-[10px] text-slate-300 font-bold mt-1 tracking-widest uppercase">
                                                    {log.order.customer.display_name}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="badge border border-slate-700 bg-slate-800 text-slate-300 tracking-widest text-[9px] uppercase">{log.payment_type}</span>
                                                <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest uppercase italic">{log.method || 'cash'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-emerald-400 font-black text-lg font-mono">
                                                +{formatCurrency(log.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <AlertCircle className="text-rose-400" /> A/R 欠款排名清单
                    </h2>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="h-64 flex items-center justify-center card bg-slate-900/40 border-slate-800">
                                <RefreshCw className="animate-spin text-slate-600" />
                            </div>
                        ) : debtors.length === 0 ? (
                            <div className="h-32 flex items-center justify-center card bg-slate-900/40 border-slate-800 text-[10px] uppercase tracking-widest text-emerald-500 font-black">
                                <CheckCircle2 size={16} className="mr-2" /> 所有客户均已结清账单
                            </div>
                        ) : (
                            debtors.map(debtor => (
                                <div key={debtor.id} className="card bg-slate-900/40 border-rose-500/20 p-5 hover:bg-slate-800/40 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex justify-center items-center text-slate-400 font-black group-hover:text-rose-400 group-hover:bg-rose-500/10 transition-colors">
                                                <Users size={16} />
                                            </div>
                                            <div>
                                                <Link href={`/customers/${debtor.id}`} className="font-bold text-white hover:text-indigo-400 transition-colors">
                                                    {debtor.display_name}
                                                </Link>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Tier: {debtor.tier}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pr-2">
                                        <div className="text-right">
                                            <p className="font-mono text-xl font-black text-rose-500 tracking-tighter">
                                                -{formatCurrency(debtor.receivable_amt)}
                                            </p>
                                            <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-600">Pending Balance</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
