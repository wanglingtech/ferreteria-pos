const { PrismaClient, UserRole } = require('@prisma/client');
const { hashPassword } = require('../shared/helpers/hash.helper');

const prisma = new PrismaClient();

async function runSeed() {
  const adminPassword = await hashPassword('Admin123*');
  const sellerPassword = await hashPassword('Seller123*');

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@ferreteriajuly.local',
      fullName: 'Administrador General',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: 'vendedor1' },
    update: {},
    create: {
      username: 'vendedor1',
      email: 'vendedor1@ferreteriajuly.local',
      fullName: 'Vendedor Principal',
      passwordHash: sellerPassword,
      role: UserRole.SELLER,
      isActive: true,
    },
  });

  console.log('Seed ejecutado correctamente: usuarios base creados.');
}

runSeed()
  .catch((error) => {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
