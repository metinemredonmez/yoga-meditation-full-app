const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // First find the user with this email
  const user = await prisma.users.findFirst({
    where: { email: 'emre9821@hotmail.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('Found user:', user.id);
  
  // Update instructor status
  const result = await prisma.$executeRawUnsafe("UPDATE instructors SET status = 'APPROVED' WHERE \"userId\" = $1", user.id);
  console.log('Updated rows:', result);
}

main().then(() => prisma.$disconnect());
