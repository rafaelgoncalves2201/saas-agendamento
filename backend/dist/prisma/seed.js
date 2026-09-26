"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando Seed do Banco de Dados...');
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'rgcarmo545@gmail.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || '99622_Rp';
    const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Admin';
    const passwordHash = await argon2.hash(superAdminPassword);
    const superAdmin = await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {
            passwordHash,
            role: client_1.Role.SUPER_ADMIN,
            isActive: true,
            name: superAdminName,
        },
        create: {
            email: superAdminEmail,
            name: superAdminName,
            passwordHash,
            role: client_1.Role.SUPER_ADMIN,
            isActive: true,
        },
    });
    console.log(`✅ Super Admin configurado com sucesso: ${superAdmin.email}`);
    const plans = [
        {
            slug: 'basic',
            legacySlug: 'starter',
            name: 'Básico',
            description: 'Ideal para profissionais autônomos. 1 profissional, até 50 agendamentos/mês e WhatsApp incluso.',
            priceMonthly: 29.90,
            priceYearly: 299.00,
            maxProfessionals: 1,
            maxAppointmentsPerMonth: 50,
            maxWhatsappMessages: 999999,
            sortOrder: 1,
            features: {
                scheduling: true,
                publicBookingPage: true,
                whatsappNotifications: true,
                whatsappAppointmentMessages: true,
                mercadopago: false,
                onlinePayment: false,
                pixSignal: false,
                inventory: false,
                inventoryControl: false,
                products: false,
                customBranding: false,
                advancedReports: false,
            },
        },
        {
            slug: 'professional',
            legacySlug: 'professional',
            name: 'Profissional',
            description: 'Para estúdios e profissionais que desejam receber pagamentos online e gerenciar estoque.',
            priceMonthly: 59.90,
            priceYearly: 599.00,
            maxProfessionals: 5,
            maxAppointmentsPerMonth: 100,
            maxWhatsappMessages: 999999,
            sortOrder: 2,
            features: {
                scheduling: true,
                publicBookingPage: true,
                whatsappNotifications: true,
                whatsappAppointmentMessages: true,
                mercadopago: true,
                onlinePayment: true,
                pixSignal: true,
                inventory: true,
                inventoryControl: true,
                products: true,
                customBranding: true,
                advancedReports: false,
            },
        },
        {
            slug: 'premium',
            legacySlug: 'business',
            name: 'Premium',
            description: 'Para equipes e clínicas com alto fluxo de clientes, sem limite de agendamentos e com todos os recursos.',
            priceMonthly: 99.90,
            priceYearly: 999.00,
            maxProfessionals: 15,
            maxAppointmentsPerMonth: 999999,
            maxWhatsappMessages: 999999,
            sortOrder: 3,
            features: {
                scheduling: true,
                publicBookingPage: true,
                whatsappNotifications: true,
                whatsappAppointmentMessages: true,
                mercadopago: true,
                onlinePayment: true,
                pixSignal: true,
                inventory: true,
                inventoryControl: true,
                products: true,
                customBranding: true,
                advancedReports: true,
            },
        },
    ];
    for (const planData of plans) {
        let existingPlan = await prisma.plan.findUnique({ where: { slug: planData.slug } });
        if (!existingPlan && planData.legacySlug) {
            existingPlan = await prisma.plan.findUnique({ where: { slug: planData.legacySlug } });
        }
        if (existingPlan) {
            const updated = await prisma.plan.update({
                where: { id: existingPlan.id },
                data: {
                    slug: planData.slug,
                    name: planData.name,
                    description: planData.description,
                    priceMonthly: planData.priceMonthly,
                    priceYearly: planData.priceYearly,
                    maxProfessionals: planData.maxProfessionals,
                    maxAppointmentsPerMonth: planData.maxAppointmentsPerMonth,
                    maxWhatsappMessages: planData.maxWhatsappMessages,
                    features: planData.features,
                    sortOrder: planData.sortOrder,
                    isActive: true,
                },
            });
            console.log(`✅ Plano atualizado: ${updated.name} (${updated.slug}) - R$ ${updated.priceMonthly}/mês`);
        }
        else {
            const created = await prisma.plan.create({
                data: {
                    slug: planData.slug,
                    name: planData.name,
                    description: planData.description,
                    priceMonthly: planData.priceMonthly,
                    priceYearly: planData.priceYearly,
                    maxProfessionals: planData.maxProfessionals,
                    maxAppointmentsPerMonth: planData.maxAppointmentsPerMonth,
                    maxWhatsappMessages: planData.maxWhatsappMessages,
                    features: planData.features,
                    sortOrder: planData.sortOrder,
                    isActive: true,
                },
            });
            console.log(`✅ Plano criado: ${created.name} (${created.slug}) - R$ ${created.priceMonthly}/mês`);
        }
    }
    const firstCompany = await prisma.company.findFirst({ where: { isActive: true } });
    if (firstCompany) {
        await prisma.companyMember.upsert({
            where: {
                companyId_userId: {
                    companyId: firstCompany.id,
                    userId: superAdmin.id,
                },
            },
            update: { role: client_1.Role.SUPER_ADMIN },
            create: {
                companyId: firstCompany.id,
                userId: superAdmin.id,
                role: client_1.Role.SUPER_ADMIN,
            },
        });
        console.log(`✅ Super Admin associado à empresa padrão: ${firstCompany.name}`);
    }
    console.log('🎉 Seed concluído com sucesso!');
}
main()
    .catch((e) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map