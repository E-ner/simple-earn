import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding default admin user...");
  const adminEmail = process.env.ADMIN_EMAIL || 'neric5311@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true
    },
    create: {
      email: adminEmail,
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      country: 'RW',
      mainBalance: 100.00,
      gameBalance: 50.00
    }
  });

  console.log(`Admin seeded successfully: ${admin.email}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
