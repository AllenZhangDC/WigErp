"use server";

import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "请输入邮箱和密码" };
    }

    try {
        const user = await prisma.user.findFirst({
            where: { email, deleted_at: null },
        });

        if (!user) {
            return { error: "该用户不存在或已被禁用" };
        }

        const isPasswordValid = await compare(password, user.password_hash);
        if (!isPasswordValid) {
            return { error: "密码错误" };
        }

        // 签发 JWT
        const session = await encrypt({
            id: user.id,
            email: user.email,
            name: user.name || "Unknown User",
            role: user.role,
        });

        // 设置 Cookie
        const cookieStore = await cookies();
        cookieStore.set("session", session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24, // 24h
        });

        // 成功登录后重定向到首页
    } catch (e: any) {
        return { error: e.message || "登录过程中发生未知错误" };
    }

    redirect("/");
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    redirect("/login");
}
