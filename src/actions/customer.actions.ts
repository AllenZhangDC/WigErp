"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serialize } from "@/lib/utils";
import { CustomerTier } from "@/types/enums";

const CustomerSchema = z.object({
    display_name: z.string().min(2, "显示名称至少2个字符"),
    company_name: z.string().optional().nullable(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email("无效邮箱").optional().nullable().or(z.literal("")),
    country: z.string().optional().nullable(),
    tier: z.nativeEnum(CustomerTier).default(CustomerTier.retail),
    credit_days: z.number().int().min(0).default(0),
    credit_limit: z.number().optional().nullable(),
});

const AddressSchema = z.object({
    customer_id: z.string(),
    label: z.string().optional().nullable(),
    recipient_name: z.string().min(1, "收件人必填"),
    phone: z.string().min(5, "电话必填"),
    address_line1: z.string().min(3, "地址必填"),
    address_line2: z.string().optional().nullable(),
    city: z.string().min(2, "城市必填"),
    state: z.string().optional().nullable(),
    zip: z.string().optional().nullable(),
    country: z.string().default("US"),
    is_default: z.boolean().default(false),
});

export async function getCustomers(search?: string) {
    const customers = await prisma.customer.findMany({
        where: {
            deleted_at: null,
            ...(search ? {
                OR: [
                    { display_name: { contains: search, mode: "insensitive" } },
                    { company_name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } },
                ],
            } : {}),
        },
        include: {
            _count: { select: { orders: true, addresses: { where: { deleted_at: null } } } }
        },
        orderBy: { created_at: "desc" },
    });
    return serialize(customers);
}

export async function getCustomerById(id: string) {
    const customer = await prisma.customer.findFirst({
        where: { id, deleted_at: null },
        include: {
            addresses: { where: { deleted_at: null }, orderBy: { is_default: "desc" } },
            orders: { take: 10, orderBy: { created_at: "desc" } },
        }
    });
    return serialize(customer);
}

export async function createCustomer(data: z.infer<typeof CustomerSchema>) {
    try {
        const parsed = CustomerSchema.safeParse(data);
        if (!parsed.success) return { error: parsed.error.issues[0].message };
        const customer = await prisma.customer.create({ data: { ...parsed.data, receivable_amt: 0 } });
        revalidatePath("/customers");
        return { success: true, id: customer.id };
    } catch (e: any) {
        return { error: e.message || "创建失败" };
    }
}

export async function createAddress(data: z.infer<typeof AddressSchema>) {
    try {
        const parsed = AddressSchema.safeParse(data);
        if (!parsed.success) return { error: parsed.error.issues[0].message };
        return await prisma.$transaction(async (tx: any) => {
            if (parsed.data.is_default) {
                await tx.address.updateMany({ where: { customer_id: parsed.data.customer_id, is_default: true }, data: { is_default: false } });
            }
            const address = await tx.address.create({ data: parsed.data });
            revalidatePath(`/customers/${parsed.data.customer_id}`);
            return { success: true, id: address.id };
        });
    } catch (e: any) {
        return { error: e.message || "添加地址失败" };
    }
}

export async function deleteCustomer(id: string) {
    await prisma.customer.update({ where: { id }, data: { deleted_at: new Date() } });
    revalidatePath("/customers");
    return { success: true };
}

export async function setDefaultAddress(id: string, customerId: string) {
    await prisma.$transaction([
        prisma.address.updateMany({ where: { customer_id: customerId, is_default: true }, data: { is_default: false } }),
        prisma.address.update({ where: { id }, data: { is_default: true } }),
    ]);
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
}

export async function deleteAddress(id: string, customerId: string) {
    await prisma.address.update({ where: { id }, data: { deleted_at: new Date(), is_default: false } });
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
}
