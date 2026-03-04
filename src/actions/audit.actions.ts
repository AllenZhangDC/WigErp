"use server";

import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";

/**
 * 获取审核日志 (Audit Logs)
 */
export async function getAuditLogs(limit = 100) {
    const logs = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
            user: { select: { name: true } }
        }
    });
    return serialize(logs);
}
