"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CustomerTier } from "@/types/enums";

/**
 * 获取所有等级设置 (Global Discounts)
 */
export async function getTierSettings() {
    return prisma.tierSetting.findMany({
        orderBy: { tier: 'asc' }
    });
}

/**
 * 创建或更新等级设置 (Global Discounts)
 */
export async function updateTierSetting(tier: CustomerTier, discountRate: number, description?: string) {
    try {
        await prisma.tierSetting.upsert({
            where: { tier },
            update: {
                discount_rate: discountRate,
                description: description || ""
            },
            create: {
                tier,
                discount_rate: discountRate,
                description: description || ""
            }
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "更新等级设置失败" };
    }
}
