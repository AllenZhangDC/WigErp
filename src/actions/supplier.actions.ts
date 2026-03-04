"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSuppliers() {
    return prisma.supplier.findMany({
        where: { deleted_at: null },
        orderBy: { name: "asc" }
    });
}

export async function createSupplier(name: string) {
    try {
        const supplier = await prisma.supplier.create({
            data: { name }
        });
        revalidatePath("/stock/purchase");
        return { success: true, id: supplier.id };
    } catch (e: any) {
        return { error: e.message || "创建失败" };
    }
}
