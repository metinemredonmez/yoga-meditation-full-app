import { prisma } from '../src/utils/database';
import { hashPassword } from '../src/utils/password';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@yoga.com';
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME || 'User';

  if (!password) {
    console.error('❌ ADMIN_PASSWORD gerekli!');
    console.log('');
    console.log('Kullanim:');
    console.log('  ADMIN_PASSWORD=guclu-sifre-123 npm run admin:create');
    console.log('');
    console.log('Veya .env dosyasinda tanimlayin:');
    console.log('  ADMIN_PASSWORD=guclu-sifre-123');
    console.log('  ADMIN_EMAIL=admin@yoga.com (opsiyonel)');
    process.exit(1);
  }

  console.log('🔐 Admin kullanici olusturuluyor...');

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      firstName,
      lastName,
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('');
  console.log('✅ Admin kullanici olusturuldu/guncellendi:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log('');
  console.log('⚠️  Sifreyi guvenli bir yerde sakladiginizdan emin olun!');
}

main()
  .catch((error) => {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
