import { prisma } from "@/lib/prisma";
import { CustomerTier } from "@/types/enums";

/**
 * 获取某个规格 (Variant) 针对特定等级客户的最终售价
 * 逻辑：
 * 1. 优先查找 TierPrice 表中的特定定价 (Write-Hard)
 * 2. 如果没找到，查找 TierSetting 表中的全局折扣率 (Global Discount)
 * 3. 如果都没找到，返回基础批发价 (Wholesale Price)
 */
export async function getEffectivePrice(variantId: string, tier: CustomerTier, baseWholesalePrice: number) {
    // 1. 特别定价
    const specialPrice = await prisma.tierPrice.findUnique({
        where: {
            variant_id_tier: {
                variant_id: variantId,
                tier: tier
            }
        }
    });

    if (specialPrice) return Number(specialPrice.price);

    // 2. 全局折扣
    const tierSetting = await prisma.tierSetting.findUnique({
        where: { tier }
    });

    if (tierSetting && tierSetting.discount_rate > 0) {
        // discount_rate 比如 10 表示 10% off
        const multiplier = (100 - tierSetting.discount_rate) / 100;
        return baseWholesalePrice * multiplier;
    }

    // 3. 兜底
    return baseWholesalePrice;
}
