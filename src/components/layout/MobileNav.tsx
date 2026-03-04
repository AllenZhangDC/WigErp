"use client";

import { LayoutDashboard, Package, Users, ShoppingCart, History } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
    const pathname = usePathname();

    const items = [
        { name: "首页", href: "/", icon: LayoutDashboard },
        { name: "产品", href: "/products", icon: Package },
        { name: "订单", href: "/orders", icon: ShoppingCart },
        { name: "客户", href: "/customers", icon: Users },
    ];

    return (
        <nav className="mobile-nav flex md:hidden">
            {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`mobile-nav-item ${isActive ? "active" : ""}`}
                    >
                        <item.icon size={20} />
                        <span className="font-bold">{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
