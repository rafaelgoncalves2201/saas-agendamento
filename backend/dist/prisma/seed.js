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
            slug: 'starter',
            name: 'Starter',
            description: 'Ideal para profissionais autônomos que estão começando (50 agendamentos/mês).',
            priceMonthly: 29.9,
            priceYearly: 299.0,
            maxProfessionals: 1,
            maxAppointmentsPerMonth: 50,
            maxWhatsappMessages: 0,
            sortOrder: 1,
            features: {
                whatsappNotifications: false,
                customBranding: false,
                advancedReports: false,
                products: false,
            },
        },
        {
            slug: 'professional',
            name: 'Professional',
            description: 'Para profissionais com maior volume (100 agendamentos/mês por profissional).',
            priceMonthly: 59.9,
            priceYearly: 599.0,
            maxProfessionals: 5,
            maxAppointmentsPerMonth: 500,
            maxWhatsappMessages: 500,
            sortOrder: 2,
            features: {
                whatsappNotifications: true,
                customBranding: true,
                advancedReports: false,
                products: true,
            },
        },
        {
            slug: 'business',
            name: 'Business',
            description: 'Para empresas com equipe (200 agendamentos/mês por profissional).',
            priceMonthly: 99.9,
            priceYearly: 999.0,
            maxProfessionals: 15,
            maxAppointmentsPerMonth: 3000,
            maxWhatsappMessages: 2000,
            sortOrder: 3,
            features: {
                whatsappNotifications: true,
                customBranding: true,
                advancedReports: true,
                products: true,
            },
        },
    ];
    for (const planData of plans) {
        const plan = await prisma.plan.upsert({
            where: { slug: planData.slug },
            update: {
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
            create: {
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
        console.log(`✅ Plano criado/atualizado: ${plan.name} (R$ ${plan.priceMonthly}/mês)`);
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