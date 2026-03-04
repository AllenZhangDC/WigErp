import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind 类名
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * 格式化金额 (USD)
 */
export function formatCurrency(amount: number | any) {
    const num = typeof amount === "number" ? amount : Number(amount);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(num);
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string | null | any) {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * 序列化数据，解决 Prisma Decimal 无法传递给客户端组件的问题
 */
export function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}
