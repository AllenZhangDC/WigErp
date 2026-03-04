"use client";

import { useEffect, useState } from "react";
import { Shield, RefreshCw, Eye, Info } from "lucide-react";
import { getAuditLogs } from "@/actions/audit.actions";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAuditLogs(50);
            setLogs(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const extractDetails = (log: any) => {
        if (!log.new_data && !log.old_data) return "N/A";
        return JSON.stringify(log.new_data || log.old_data).substring(0, 100) + "...";
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-fade-in space-y-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-widest italic flex items-center gap-3">
                        <Shield className="text-indigo-400" />
                        安全审计日志 <span className="text-slate-500 font-light">(Audit Logs)</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        System-wide operation tracking
                    </p>
                </div>
                <button onClick={loadData} className="btn btn-secondary h-10 border-slate-700 bg-slate-900 flex items-center gap-2 text-slate-300">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> 刷新数据
                </button>
            </div>

            <div className="table-container shadow-2xl bg-slate-900/40 border border-slate-800">
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-500 uppercase font-black tracking-widest gap-3">
                        <RefreshCw className="animate-spin text-indigo-500" /> 分析审计记录中...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 uppercase font-bold tracking-widest gap-4">
                        <Info size={48} className="text-slate-800" />
                        系统暂无操作记录
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr className="bg-slate-900/60 font-black border-b border-slate-800">
                                <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">时间戳</th>
                                <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">操作类型</th>
                                <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">目标表 / 编目 ID</th>
                                <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em]">操作员</th>
                                <th className="py-4 px-6 text-[10px] uppercase text-slate-500 tracking-[0.2em] text-right">特征值预览</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{formatDate(log.created_at)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`badge uppercase text-[9px] font-black tracking-widest border px-2 py-0.5
                                            ${log.action === 'CREATE' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                                                log.action === 'UPDATE' ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' :
                                                    'border-rose-500/30 text-rose-400 bg-rose-500/10'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-mono text-sm text-slate-300 font-bold">{log.table_name}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold font-mono tracking-widest">{log.record_id}</p>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-400 text-xs">
                                        {log.user?.name || "System Automated"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-center justify-end gap-2 text-[10px] text-slate-500 font-mono tracking-tighter opacity-50 group-hover:opacity-100 transition-opacity">
                                            {extractDetails(log)}
                                            <button className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors" title="View Full Diff">
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
