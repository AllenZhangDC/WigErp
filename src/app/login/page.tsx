"use client";

import { useState } from "react";
import { login } from "@/actions/auth.actions";
import { LogIn, Mail, Lock, Loader2, LayoutDashboard, Database, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await login(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950 text-white selection:bg-indigo-500/30">
            {/* 🟦 Left Panel - Brand / Intro */}
            <div className="relative hidden lg:flex flex-col items-start justify-between p-20 overflow-hidden bg-slate-900/40">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-40" />
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-10 group">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                            <LayoutDashboard size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black italic tracking-tighter uppercase">WigERP</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-none mt-1">Enterprise Solution</p>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <h2 className="text-6xl font-black tracking-tighter leading-none uppercase italic max-w-md">
                            Elevate your <br /><span className="text-indigo-500">Inventory</span><br /> intelligence.
                        </h2>
                        <div className="space-y-6 max-w-xs">
                            <div className="flex gap-4 items-start">
                                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">精准库存</p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium italic">基于分布式事务的 SKU 深度管理系统，规避超卖风险。</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">安全审计</p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium italic">全流程操作日志追溯，每一笔流水都有迹可循。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                    © 2026 WigERP Systems Inc. All Rights Reserved.
                </div>
            </div>

            {/* ⬜ Right Panel - Login Form */}
            <div className="flex flex-col items-center justify-center p-8 md:p-12 lg:p-20 bg-slate-950">
                <div className="w-full max-w-md space-y-10 animate-fade-in">
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                            <LayoutDashboard size={20} />
                        </div>
                        <h1 className="text-xl font-black italic tracking-tighter uppercase">WigERP</h1>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-3xl font-black tracking-tighter uppercase italic">身份身份验证</h3>
                        <p className="text-sm text-slate-500 font-medium italic">请输入您的凭据以访问控制面板。</p>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="input-label">电子邮箱</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="admin@wigerp.com"
                                        className="input h-12 w-full pl-12 input-with-icon bg-slate-900 border-slate-800 focus:border-indigo-600 transition-all font-medium placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="input-label">登录密码</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        placeholder="••••••••"
                                        className="input h-12 w-full pl-12 input-with-icon bg-slate-900 border-slate-800 focus:border-indigo-600 transition-all font-medium placeholder:text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 bg-slate-900 border-slate-800 rounded checked:bg-indigo-600 border-none outline-none focus:ring-0 cursor-pointer" />
                                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors uppercase tracking-widest">保持登录状态</span>
                            </label>
                            <a href="#" className="text-xs font-black text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">忘记密码?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full h-14 text-base shadow-2xl shadow-indigo-600/30 hover:translate-y-[-1px] active:scale-[0.98] transition-all disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>立即登录系统</span>
                                    <LogIn size={20} className="ml-2" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-6 border-t border-slate-900 text-center">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
                            WigERP Cloud Systems • v4.0.1 Stable
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
