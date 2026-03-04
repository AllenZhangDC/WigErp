import { prisma } from '../src/lib/prisma'
import { UserRole, MaterialType, CraftType, CurlPattern, PriceMode, CustomerTier } from '../src/types/enums'
import { hash } from 'bcryptjs'
async function main() {
    process.stdout.write('\x1b[36m🌱 Seeding database...\x1b[0m\n')

    // 1. Create Default Admin
    const adminPassword = await hash('Jingjin@2020', 12)
    await prisma.user.upsert({
        where: { email: 'admin@wigerp.com' },
        update: { password_hash: adminPassword },
        create: {
            name: 'System Admin',
            email: 'admin@wigerp.com',
            password_hash: adminPassword,
            role: UserRole.admin,
        },
    })

    // 2. Create Stock Locations
    const locCount = await prisma.stockLocation.count()
    if (locCount === 0) {
        await prisma.stockLocation.createMany({
            data: [
                { code: 'MAIN', name: '总仓 (Main Warehouse)' },
                { code: 'DEFECTIVE', name: '次品仓 (Defective)' },
                { code: 'TRANSIT', name: '在途仓 (In-Transit)' },
            ]
        })
    }

    // 3. Create Tier Settings (Global Discounts)
    const tierSettings = [
        { tier: CustomerTier.retail, discount_rate: 0, description: 'Standard retail price' },
        { tier: CustomerTier.vip, discount_rate: 10, description: 'VIP 9折' },
        { tier: CustomerTier.vvip, discount_rate: 20, description: 'VVIP 8折' },
        { tier: CustomerTier.agent, discount_rate: 35, description: 'Agent 65折' },
    ]

    for (const setting of tierSettings) {
        await prisma.tierSetting.upsert({
            where: { tier: setting.tier },
            update: { discount_rate: setting.discount_rate },
            create: setting
        })
    }

    // 4. Create Sample Suppliers
    await prisma.supplier.upsert({
        where: { name: 'Global Hair Supplies' },
        update: {},
        create: {
            name: 'Global Hair Supplies',
            contact: 'Manager John',
            country: 'CN',
        }
    })

    // 5. Create Realistic Products
    const products = [
        {
            name: "Brazilian Body Wave",
            slug: "brazilian-body-wave",
            category: "Bundle",
            material: MaterialType.human_hair,
            craft: CraftType.machine_made,
            variants: [
                { length: 18, sku: "BW-BR-18", wholesale: 85, cost: 45 },
                { length: 20, sku: "BW-BR-20", wholesale: 95, cost: 50 },
                { length: 22, sku: "BW-BR-22", wholesale: 105, cost: 55 },
            ]
        },
        {
            name: "HD Lace Straight Wig",
            slug: "hd-lace-straight-wig",
            category: "Wig",
            material: MaterialType.human_hair,
            craft: CraftType.lace_front,
            variants: [
                { length: 24, sku: "ST-HD-24", wholesale: 280, cost: 160 },
                { length: 26, sku: "ST-HD-26", wholesale: 310, cost: 180 },
            ]
        },
        {
            name: "Kinky Curly 13x4 Lace",
            slug: "kinky-curly-13x4-lace",
            category: "Frontal",
            material: MaterialType.human_hair,
            craft: CraftType.lace_front,
            variants: [
                { length: 16, sku: "KC-134-16", wholesale: 120, cost: 70 },
                { length: 18, sku: "KC-134-18", wholesale: 135, cost: 80 },
            ]
        }
    ]

    for (const p of products) {
        // Use upsert for product to avoid duplicates on re-run
        const product = await prisma.product.upsert({
            where: { slug: p.slug },
            update: {},
            create: {
                name: p.name,
                slug: p.slug,
                category: p.category,
                material: p.material,
                craft: p.craft,
                variants: {
                    create: p.variants.map(v => ({
                        sku: v.sku,
                        length: v.length,
                        color: "#1B",
                        curl: CurlPattern.body_wave,
                        wholesale_price: v.wholesale,
                        cost_price: v.cost,
                        stock: Math.floor(Math.random() * 50) + 10
                    }))
                }
            }
        })
        console.log(`Product processed: ${product.name}`)
    }

    process.stdout.write('\x1b[32m✅ Seed completed successfully!\x1b[0m\n')
}

main()
    .catch((e) => {
        console.error('Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
