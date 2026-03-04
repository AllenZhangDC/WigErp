"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CustomerTier } from "@/types/enums";
import { serialize } from "@/lib/utils";

/**
 * 获取某个变体 (Variant) 的所有等级价格
 */
export async function getTierPrices(variantId: string) {
    const prices = await prisma.tierPrice.findMany({
        where: { variant_id: variantId },
    });
    return serialize(prices);
}

/**
 * 批量更新或创建变体的等级价格
 */
export async function updateTierPrices(variantId: string, productId: string, prices: { tier: CustomerTier; price: number }[]) {
    try {
        await prisma.$transaction(async (tx: any) => {
            for (const item of prices) {
                await tx.tierPrice.upsert({
                    where: {
                        variant_id_tier: {
                            variant_id: variantId,
                            tier: item.tier,
                        },
                    },
                    update: { price: item.price },
                    create: {
                        variant_id: variantId,
                        tier: item.tier,
                        price: item.price,
                    },
                });
            }
        });

        revalidatePath(`/products/${productId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "更新等级价格失败" };
    }
}
