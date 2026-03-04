"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serialize } from "@/lib/utils";

import {
    CustomerTier,
    MaterialType,
    CraftType,
    PriceMode,
    CurlPattern,
    CapSize
} from "@/types/enums";

const ProductSchema = z.object({
    name: z.string().min(2, "产品名称至少2个字符"),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "只允许小写字母、数字和连字符"),
    material: z.nativeEnum(MaterialType),
    craft: z.nativeEnum(CraftType),
    category: z.string().optional().nullable(),
    images: z.array(z.string()).default([]),
    description: z.string().optional().nullable(),
    price_mode: z.nativeEnum(PriceMode).default(PriceMode.per_piece),
});

export async function createProduct(data: z.infer<typeof ProductSchema>) {
    try {
        const parsed = ProductSchema.safeParse(data);
        if (!parsed.success) return { error: parsed.error.issues[0].message };
        return await prisma.$transaction(async (tx: any) => {
            const product = await tx.product.create({ data: parsed.data });
            revalidatePath("/products");
            return { success: true, id: product.id };
        });
    } catch (e: any) {
        if (e.code === "P2002") return { error: "Slug (URL标识) 已存在" };
        return { error: e.message || "创建失败" };
    }
}

export async function createVariantsBatch(
    productId: string,
    variants: any[]
) {
    try {
        return await prisma.$transaction(async (tx: any) => {
            const skus = variants.map((v) => v.sku);
            const existing = await tx.variant.findMany({
                where: { sku: { in: skus }, deleted_at: null },
                select: { sku: true },
            });
            if (existing.length > 0) {
                throw new Error(`以下SKU已存在: ${existing.map((e: any) => e.sku).join(", ")}`);
            }

            const created = await tx.variant.createMany({
                data: variants.map((v) => ({
                    product_id: productId,
                    sku: v.sku,
                    length: v.length,
                    color: v.color,
                    curl: v.curl,
                    density: v.density || 150,
                    cap_size: v.cap_size || "medium",
                    shelf_no: v.shelf_no,
                    cost_price: v.cost_price,
                    wholesale_price: v.wholesale_price,
                    weight_grams: v.weight_grams,
                    barcode: v.barcode,
                    images: v.images || [],
                    stock: 0,
                    reserved_stock: 0,
                    defective_stock: 0,
                })),
            });

            revalidatePath(`/products/${productId}`);
            revalidatePath("/products");
            return { success: true, count: created.count };
        });
    } catch (e: any) {
        return { error: e.message || "批量创建失败" };
    }
}

export async function getProducts(search?: string) {
    const products = await prisma.product.findMany({
        where: {
            deleted_at: null,
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { slug: { contains: search, mode: "insensitive" } },
                    { category: { contains: search, mode: "insensitive" } },
                ],
            } : {}),
        },
        include: {
            _count: { select: { variants: { where: { deleted_at: null } } } }
        },
        orderBy: { created_at: "desc" },
    });
    return serialize(products);
}

export async function getProductById(id: string) {
    const product = await prisma.product.findFirst({
        where: { id, deleted_at: null },
        include: {
            variants: {
                where: { deleted_at: null },
                orderBy: [{ length: "asc" }, { color: "asc" }],
                include: { tier_prices: true }
            }
        }
    });
    return serialize(product);
}

export async function deleteProduct(id: string) {
    try {
        await prisma.$transaction(async (tx: any) => {
            const now = new Date();
            await tx.product.update({ where: { id }, data: { deleted_at: now } });
            await tx.variant.updateMany({ where: { product_id: id, deleted_at: null }, data: { deleted_at: now } });
        });
        revalidatePath("/products");
        return { success: true };
    } catch (e: any) {
        return { error: "删除失败: " + e.message };
    }
}

/**
 * 搜索 Variant (用于入库/出库搜索)
 */
export async function getVariantsBySku(query: string) {
    if (!query || query.length < 2) return [];

    const variants = await prisma.variant.findMany({
        where: {
            deleted_at: null,
            OR: [
                { sku: { contains: query, mode: "insensitive" } },
                { barcode: { contains: query, mode: "insensitive" } },
            ]
        },
        include: {
            product: { select: { name: true, material: true, craft: true } }
        },
        take: 10
    });
    return serialize(variants);
}
