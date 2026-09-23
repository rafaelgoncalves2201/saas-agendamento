const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('USERS:', users.map(u => ({ id: u.id, email: u.email, role: u.role, companyId: u.companyId })));
  
  const companies = await prisma.company.findMany({
    include: {
      subscription: true,
      professionals: true,
      services: true,
      availabilities: true,
    }
  });
  console.log('COMPANIES:', JSON.stringify(companies, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));

