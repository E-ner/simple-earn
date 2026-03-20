const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("Wiping existing data...");
  
  // Wipe dependent tables first
  await prisma.supportMessage.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.protocolTransaction.deleteMany({});
  await prisma.gamePlay.deleteMany({});
  await prisma.notification.deleteMany({});
  
  // Wipe users
  await prisma.user.deleteMany({});
  console.log("Users and dependent data deleted.");

  console.log("Creating default admin user...");
  const passwordHash = await bcrypt.hash('admin@123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'neric5311@gmail.com',
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true, // Auto-activated for admin
      isEmailVerified: true,
      country: 'RW',
      mainBalance: 100.00, // Give admin some starting test balance
      gameBalance: 50.00
    }
  });

  console.log(`Admin created successfully: ${admin.email}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
