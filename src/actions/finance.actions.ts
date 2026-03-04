"use server";

import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";

/**
 * 获取近期收款流水 (Payment Logs)
 */
export async function getPaymentLogs(limit = 100) {
    const logs = await prisma.paymentLog.findMany({
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
            order: {
                select: {
                    order_no: true,
                    total_amount: true,
                    customer: {
                        select: {
                            display_name: true
                        }
                    }
                }
            }
        }
    });
    return serialize(logs);
}

/**
 * 获取欠款客户排名 (A/R Aging)
 */
export async function getReceivableCustomers(limit = 20) {
    const customers = await prisma.customer.findMany({
        take: limit,
        where: { receivable_amt: { gt: 0 }, deleted_at: null },
        orderBy: { receivable_amt: "desc" },
        select: {
            id: true,
            display_name: true,
            receivable_amt: true,
            tier: true,
            phone: true
        }
    });
    return serialize(customers);
}
