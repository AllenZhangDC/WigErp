"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serialize } from "@/lib/utils";

import { TxType, QualityStatus } from "@/types/enums";

// ── Validation Schemas ─────────────────────────────────────────

const PurchaseInSchema = z.object({
    batch_no: z.string().min(1, "批次号必填"),
    supplier_id: z.string().min(1, "供应商必填"),
    items: z.array(z.object({
        variant_id: z.string(),
        quantity: z.number().positive(),
        location_id: z.string().optional(),
        note: z.string().optional(),
    })),
});

const SaleOutSchema = z.object({
    customer_id: z.string(),
    order_id: z.string().optional(),
    items: z.array(z.object({
        variant_id: z.string(),
        quantity: z.number().positive(), // 这里传正数，内部减库存
        note: z.string().optional(),
    })),
});

// ── Stock Actions ──────────────────────────────────────────────

/**
 * 采购入库 (PURCHASE_IN)
 */
export async function purchaseIn(data: z.infer<typeof PurchaseInSchema>) {
    try {
        const parsed = PurchaseInSchema.safeParse(data);
        if (!parsed.success) return { error: parsed.error.issues[0].message };

        const result = await prisma.$transaction(async (tx: any) => {
            // 1. 创建批次 (Upsert)
            const batch = await tx.stockBatch.upsert({
                where: { batch_no: parsed.data.batch_no },
                update: {},
                create: {
                    batch_no: parsed.data.batch_no,
                    supplier_id: parsed.data.supplier_id,
                }
            });

            // 2. 循环处理每一项
            for (const item of parsed.data.items) {
                // 创建流水
                await tx.stockTransaction.create({
                    data: {
                        variant_id: item.variant_id,
                        batch_id: batch.id,
                        type: TxType.purchase_in,
                        quantity: item.quantity,
                        quality: QualityStatus.good,
                        note: item.note,
                    }
                });

                // 增加 Variant 缓存库存
                await tx.variant.update({
                    where: { id: item.variant_id },
                    data: { stock: { increment: item.quantity } }
                });
            }

            return { success: true, batch_no: batch.batch_no };
        });

        revalidatePath("/products");
        revalidatePath("/");
        return result;
    } catch (e: any) {
        return { error: e.message || "入库操作失败" };
    }
}

/**
 * 销售出库 (SALE_OUT) - 简易版，非订单驱动
 */
export async function saleOut(data: z.infer<typeof SaleOutSchema>) {
    try {
        const parsed = SaleOutSchema.safeParse(data);
        if (!parsed.success) return { error: parsed.error.issues[0].message };

        const result = await prisma.$transaction(async (tx: any) => {
            for (const item of parsed.data.items) {
                const variant = await tx.variant.findUnique({
                    where: { id: item.variant_id },
                    select: { stock: true, sku: true }
                });

                if (!variant || variant.stock < item.quantity) {
                    throw new Error(`库存不足: ${variant?.sku || '未知SKU'}`);
                }

                // 创建流水 (负值)
                await tx.stockTransaction.create({
                    data: {
                        variant_id: item.variant_id,
                        type: TxType.sale_out,
                        quantity: -item.quantity,
                        note: item.note,
                    }
                });

                // 扣减库存
                await tx.variant.update({
                    where: { id: item.variant_id },
                    data: { stock: { decrement: item.quantity } }
                });
            }
            return { success: true };
        });

        revalidatePath("/products");
        revalidatePath("/");
        return result;
    } catch (e: any) {
        return { error: e.message || "出库操作失败" };
    }
}

/**
 * 获取库存流水历史
 */
export async function getStockHistory(limit = 50) {
    const history = await prisma.stockTransaction.findMany({
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
            variant: {
                include: { product: { select: { name: true } } }
            },
            user: { select: { name: true } },
            batch: { select: { batch_no: true } }
        }
    });
    return serialize(history);
}
