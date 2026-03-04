import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    History,
    Truck,
    DollarSign,
    ShieldCheck,
    LucideIcon,
    Box,
    Percent
} from "lucide-react";

export interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
    {
        label: "业务核心",
        items: [
            { name: "仪表盘", href: "/", icon: LayoutDashboard },
            { name: "产品管理", href: "/products", icon: Package },
            { name: "客户管理", href: "/customers", icon: Users },
        ]
    },
    {
        label: "仓储物流",
        items: [
            { name: "采购入库", href: "/stock/purchase", icon: Box },
            { name: "销售出库", href: "/stock/sale", icon: ShoppingCart },
            { name: "库存流水", href: "/stock/history", icon: History },
            { name: "仓位设置", href: "/settings/locations", icon: Truck },
        ]
    },
    {
        label: "财务风控",
        items: [
            { name: "收款记录", href: "/finance/payments", icon: DollarSign },
            { name: "等级折扣设置", href: "/settings/tiers", icon: Percent },
            { name: "操作日志", href: "/audit", icon: ShieldCheck },
        ]
    }
];
