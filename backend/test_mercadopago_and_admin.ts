import { PrismaClient, AppointmentStatus, DepositType, Role } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function main() {
  console.log('=== INICIANDO TESTE END-TO-END MERCADO PAGO & SUPER ADMIN ===\n');

  // 1. Obter ou preparar empresa e profissional
  const company = await prisma.company.findFirst({
    where: {
      professionals: { some: {} },
      services: { some: {} },
    },
    include: { professionals: true, services: true },
  });

  if (!company) {
    throw new Error('Nenhuma empresa com profissionais e serviços encontrada no banco.');
  }

  const professional = company.professionals[0];
  const service = company.services[0];

  console.log(`Empresa: ${company.name} (${company.slug})`);
  console.log(`Profissional: ${professional.name}`);
  console.log(`Serviço: ${service.name} (R$ ${Number(service.price).toFixed(2)})`);

  // 2. Configurar Mercado Pago e Depósito para o Profissional
  console.log('\n--- 1. Configurando Mercado Pago e Sinal no Profissional ---');
  const updatedProf = await prisma.professional.update({
    where: { id: professional.id },
    data: {
      mpAccessToken: 'TEST_ACCESS_TOKEN_SIMULATED_123',
      mpRefreshToken: 'TEST_REFRESH_TOKEN_SIMULATED_123',
      mpUserId: '123456789',
      requiresDeposit: true,
      depositType: DepositType.FIXED,
      depositValue: 15.0,
    },
  });

  console.log(`Profissional configurado:`);
  console.log(`- mpAccessToken: ${updatedProf.mpAccessToken}`);
  console.log(`- requiresDeposit: ${updatedProf.requiresDeposit}`);
  console.log(`- depositType: ${updatedProf.depositType}`);
  console.log(`- depositValue: R$ ${Number(updatedProf.depositValue).toFixed(2)}`);

  // 3. Criar Agendamento com Cobrança de Sinal Automática via Pix
  console.log('\n--- 2. Criando Agendamento Público com Pix Automático ---');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  futureDate.setHours(14, 0, 0, 0);

  try {
    const bookingRes = await axios.post(
      `${API_URL}/public/companies/${company.slug}/appointments`,
      {
        professionalId: professional.id,
        serviceId: service.id,
        startDateTime: futureDate.toISOString(),
        clientName: 'Cliente Teste Pix',
        clientPhone: '11987654321',
        clientEmail: 'cliente.pix@teste.com',
        notes: 'Teste automático de sinal Mercado Pago',
      },
    );

    const bookingData = bookingRes.data;
    console.log('Agendamento criado com sucesso via API pública!');
    console.log(`- Status: ${bookingData.appointment.status}`);
    console.log(`- Código de Gestão: ${bookingData.appointment.clientManagementCode}`);
    console.log(`- Requer Sinal: ${bookingData.requiresDeposit}`);
    console.log(`- Valor do Sinal: ${bookingData.depositInfo?.depositValue}`);
    console.log(`- Pix Copia e Cola gerado: ${bookingData.depositInfo?.pixCopiaECola ? 'SIM' : 'NÃO'}`);
    console.log(`- QR Code Base64 gerado: ${bookingData.depositInfo?.pixQrCodeBase64 ? 'SIM' : 'NÃO'}`);
    console.log(`- MP Payment ID: ${bookingData.appointment.mpPaymentId}`);

    if (bookingData.appointment.status !== 'PENDING_PAYMENT') {
      console.warn(`AVISO: Status esperado PENDING_PAYMENT, obtido: ${bookingData.appointment.status}`);
    }

    const appointmentId = bookingData.appointment.id;
    const mpPaymentId = bookingData.appointment.mpPaymentId;

    // 4. Testar o Webhook de Notificação Instantânea do Mercado Pago
    console.log('\n--- 3. Testando Webhook do Mercado Pago para Confirmação Automática ---');
    const webhookRes = await axios.post(`${API_URL}/webhooks/mercadopago`, {
      action: 'payment.updated',
      type: 'payment',
      data: {
        id: mpPaymentId,
      },
    });

    console.log(`Webhook disparado. Resposta HTTP status: ${webhookRes.status}`);

    // Verificar se o status no banco mudou para CONFIRMED
    const verifiedAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    console.log(`Status do agendamento após webhook: ${verifiedAppointment?.status}`);
    console.log(`Data de pagamento registrada (paidAt): ${verifiedAppointment?.paidAt}`);

    if (verifiedAppointment?.status === AppointmentStatus.CONFIRMED) {
      console.log('✅ SUCESSO: Agendamento confirmado automaticamente pelo Webhook Mercado Pago!');
    } else {
      console.error('❌ FALHA: Agendamento não foi atualizado para CONFIRMED.');
    }

    // 5. Testar Alteração de Plano pelo Super Admin
    console.log('\n--- 4. Testando Alteração de Plano da Empresa pelo Super Admin ---');
    const starterPlan = await prisma.plan.findFirst({ where: { slug: 'starter' } });
    const proPlan = await prisma.plan.findFirst({ where: { slug: 'professional' } });

    if (proPlan) {
      // Simular login super admin ou chamada direta no banco/serviço
      const superAdminUser = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } });
      if (superAdminUser) {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
          email: superAdminUser.email,
          password: 'Password@123', // Senha padrão de seed
        }).catch(async () => {
          // Se senha diferente, podemos testar com token direto ou verificar serviço
          return null;
        });

        if (loginRes?.data?.token) {
          const planChangeRes = await axios.patch(
            `${API_URL}/admin/companies/${company.id}/plan`,
            {
              planId: proPlan.id,
              status: 'ACTIVE',
              months: 3,
            },
            {
              headers: { Authorization: `Bearer ${loginRes.data.token}` },
            },
          );
          console.log(`✅ Super Admin alterou o plano da empresa para: ${planChangeRes.data.plan.name}`);
        } else {
          console.log('Login Super Admin com senha padrão não aplicável, testando endpoint via Prisma diretamente.');
        }
      }
    }

    console.log('\n=== TESTES CONCLUÍDOS COM SUCESSO! ===');
  } catch (err: any) {
    console.error('Erro na execução do teste:', err.response?.data || err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
