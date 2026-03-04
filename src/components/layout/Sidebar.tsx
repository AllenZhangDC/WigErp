"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    History,
    ChevronRight,
    Truck,
    DollarSign,
    ShieldCheck,
    Box,
    LogOut,
    Settings
} from "lucide-react";
import { logout } from "@/actions/auth.actions";

import { NAV_GROUPS } from "@/lib/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar hidden md:flex flex-col">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight leading-none text-white">WigERP</h1>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold letter-spacing-widest">Enterprise v4.0</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-10">
                {NAV_GROUPS.map((group) => (
                    <div key={group.label}>
                        <p className="px-4 mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{group.label}</p>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`nav-item group ${isActive ? "active" : ""}`}
                                    >
                                        <item.icon size={18} className={isActive ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-300"} />
                                        <span className="flex-1 font-medium">{item.name}</span>
                                        {isActive && <div className="w-1 h-4 bg-indigo-500 rounded-full" />}
                                        {!isActive && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-1">
                <Link href="/settings" className="nav-item group">
                    <Settings size={18} className="text-slate-400 group-hover:text-slate-300" />
                    <span className="flex-1 font-medium text-slate-400 group-hover:text-slate-200">系统设置</span>
                </Link>
                <button
                    onClick={() => logout()}
                    className="nav-item group w-full text-left"
                >
                    <LogOut size={18} className="text-rose-500 opacity-70 group-hover:opacity-100" />
                    <span className="flex-1 font-medium text-slate-500 group-hover:text-rose-400">退出登录</span>
                </button>
            </div>
        </aside>
    );
}
