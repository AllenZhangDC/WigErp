"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLocations() {
    return prisma.stockLocation.findMany({
        orderBy: { code: 'asc' }
    });
}

export async function createLocation(data: { code: string, name: string, description?: string }) {
    try {
        const result = await prisma.stockLocation.create({ data });
        revalidatePath("/settings/locations");
        return { success: true, location: result };
    } catch (e: any) {
        return { error: e.message || "创建失败" };
    }
}

export async function deleteLocation(id: string) {
    try {
        await prisma.stockLocation.delete({ where: { id } });
        revalidatePath("/settings/locations");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "删除失败" };
    }
}
