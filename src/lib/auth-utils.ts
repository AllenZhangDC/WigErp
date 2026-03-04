import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "wigerp-default-secret-key-change-it-in-prod"
);

export interface UserPayload {
    id: string;
    email: string;
    name: string;
    role: string;
}

/**
 * 签发 JWT
 */
export async function encrypt(payload: UserPayload) {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(SECRET_KEY);
}

/**
 * 验证 JWT
 */
export async function decrypt(input: string): Promise<UserPayload | null> {
    try {
        const { payload } = await jwtVerify(input, SECRET_KEY, {
            algorithms: ["HS256"],
        });
        return payload as unknown as UserPayload;
    } catch (e) {
        return null;
    }
}

/**
 * 获取当前登录用户 (服务端组件/Action)
 */
export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    return await decrypt(session);
}

/**
 * 更新 Session 过期时间 (用于中间件)
 */
export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;

    const parsed = await decrypt(session);
    if (!parsed) return;

    // 延长 24 小时
    const res = NextResponse.next();
    res.cookies.set({
        name: "session",
        value: await encrypt(parsed),
        httpOnly: true,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return res;
}
