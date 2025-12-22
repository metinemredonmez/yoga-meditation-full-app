const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestStudents() {
  const userId = 'cmjg3y5co0019137m4thqe699'; // emre9821@hotmail.com
  const instructor = await prisma.instructor_profiles.findFirst({
    where: { userId }
  });

  if (!instructor) {
    console.log('No instructor found');
    return;
  }

  console.log('Instructor:', instructor.displayName);

  // Get instructor classes
  let classes = await prisma.classes.findMany({
    where: { instructorId: userId },
    take: 3
  });

  if (classes.length === 0) {
    // Create a test class
    const testClass = await prisma.classes.create({
      data: {
        title: 'Sabah Yoga Akisi',
        description: 'Gune enerjik baslamaniz icin yoga dersi',
        instructorId: userId,
        level: 'BEGINNER',
        duration: 45,
        status: 'PUBLISHED'
      }
    });
    classes = [testClass];
    console.log('Created test class:', testClass.title);
  }

  // Get some users
  const users = await prisma.users.findMany({ take: 5 });

  // Create bookings (students) for the instructor
  await prisma.bookings.deleteMany({
    where: { classId: { in: classes.map(c => c.id) } }
  });

  for (const user of users) {
    if (user.id === userId) continue; // Skip instructor

    for (const cls of classes) {
      await prisma.bookings.create({
        data: {
          userId: user.id,
          classId: cls.id,
          status: 'CONFIRMED',
        }
      });
    }
    console.log('Created bookings for:', user.firstName || user.email);
  }

  console.log('Done adding test students');
}

addTestStudents()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
