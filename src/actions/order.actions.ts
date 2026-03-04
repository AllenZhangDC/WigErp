"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serialize } from "@/lib/utils";
import { TxType } from "@/types/enums";

// ── Validation Schemas ─────────────────────────────────────────

const CreateOrderSchema = z.object({
    customer_id: z.string().min(1, "请选择客户"),
    items: z.array(z.object({
        variant_id: z.string(),
        quantity: z.number().int().positive("数量必须大于0"),
        unit_price: z.number().min(0, "单价不能为负"),
    })).min(1, "请添加商品"),
});

// ── Actions ────────────────────────────────────────────────────

/**
 * 销售开单 (Create Order)
 * 逻辑：
 * 1. 验证可用库存 (stock - reserved_stock >= quantity)
 * 2. 创建 Order & OrderItem
 * 3. 锁定库存 (reserved_stock 增加)
 * 4. 增加客户应收账款 (receivable_amt 增加)
 */
export async function createOrder(data: z.infer<typeof CreateOrderSchema>) {
    try {
        const parsed = CreateOrderSchema.safeParse(data);
        if (!parsed.success) return { error: parsed.error.issues[0].message };

        const { customer_id, items } = parsed.data;

        const total_amount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
        const order_no = `ORD-${Date.now()}`;

        const result = await prisma.$transaction(async (tx: any) => {
            // 1. 校验库存并锁定
            for (const item of items) {
                const variant = await tx.variant.findUnique({
                    where: { id: item.variant_id },
                    select: { stock: true, reserved_stock: true, sku: true }
                });

                if (!variant) throw new Error(`找不到规格`);
                const available = variant.stock - variant.reserved_stock;
                if (available < item.quantity) {
                    throw new Error(`SKU [${variant.sku}] 可用库存不足！可用: ${available}, 需求: ${item.quantity}`);
                }

                // 锁定库存
                await tx.variant.update({
                    where: { id: item.variant_id },
                    data: { reserved_stock: { increment: item.quantity } }
                });
            }

            // 2. 创建订单与订单项
            const order = await tx.order.create({
                data: {
                    order_no,
                    customer_id,
                    total_amount,
                    status: "pending", // OrderStatus.pending
                    shipping_status: "not_shipped", // ShippingStatus.not_shipped
                    items: {
                        create: items.map(item => ({
                            variant_id: item.variant_id,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                        }))
                    }
                }
            });

            // 3. 增加客户应收款
            await tx.customer.update({
                where: { id: customer_id },
                data: { receivable_amt: { increment: total_amount } }
            });

            return { success: true, order_id: order.id, order_no };
        });

        revalidatePath("/products");
        revalidatePath("/");
        revalidatePath("/customers");
        return serialize(result);
    } catch (e: any) {
        return { error: e.message || "开单失败" };
    }
}
