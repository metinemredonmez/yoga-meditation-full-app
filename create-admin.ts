import { prisma } from './src/utils/database';
import { hashPassword } from './src/utils/password';

async function main() {
  const passwordHash = await hashPassword('admin123');

  const user = await prisma.user.upsert({
    where: { email: 'admin@yoga.com' },
    update: { passwordHash, role: 'SUPER_ADMIN' },
    create: {
      email: 'admin@yoga.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Admin user created/updated:', user.email, user.role);
  console.log('Login credentials:');
  console.log('  Email: admin@yoga.com');
  console.log('  Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
