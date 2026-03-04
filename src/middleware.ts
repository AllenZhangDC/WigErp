import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth-utils";

const protectedRoutes = ["/", "/products", "/customers", "/stock", "/settings", "/audit", "/finance"];
const authRoutes = ["/login", "/register"];

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(route => path === route || path.startsWith(route + "/"));
    const isAuthRoute = authRoutes.includes(path);

    const session = req.cookies.get("session")?.value;
    const user = session ? await decrypt(session) : null;

    // 1. 未登录且访问受保护页面 -> 跳到登录页
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // 2. 已登录且访问登录页 -> 跳到首页
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    // 3. (可选) 角色权限检查 - 假设 Admin 才能访问 /audit 或 /settings
    if (user && (path.startsWith("/audit") || path.startsWith("/settings")) && user.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.nextUrl)); // 非管理员跳回首页，也可展示 403
    }

    return NextResponse.next();
}

// 排除静态文件、API 路由等
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
