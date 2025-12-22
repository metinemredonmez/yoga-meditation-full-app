const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findUnique({
    where: { email: 'emre9821@hotmail.com' },
    include: { instructor_profiles: true }
  });

  console.log('User:', JSON.stringify(user, null, 2));

  if (user && !user.instructor_profiles) {
    console.log('Creating instructor profile...');
    const profile = await prisma.instructor_profiles.create({
      data: {
        userId: user.id,
        displayName: ((user.firstName || '') + ' ' + (user.lastName || '')).trim() || 'Instructor',
        slug: 'emre-instructor-' + Date.now(),
        bio: 'Yoga eğitmeni',
        status: 'APPROVED',
        tier: 'PRO',
      }
    });
    console.log('Created:', profile);
  } else if (user && user.instructor_profiles) {
    console.log('Instructor profile exists');
  }

  // Also update user role if needed
  if (user && user.role !== 'INSTRUCTOR') {
    await prisma.users.update({
      where: { id: user.id },
      data: { role: 'INSTRUCTOR' }
    });
    console.log('Updated user role to INSTRUCTOR');
  }

  await prisma.$disconnect();
}

main();
