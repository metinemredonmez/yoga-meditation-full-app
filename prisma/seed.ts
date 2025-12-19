import { hashPassword } from '../src/utils/password';
import { prisma } from '../src/utils/database';

async function main() {
  console.log('🌱 Seeding fitness app database (Yoga, Pilates, Meditation, Wellness)...');

  // ============================================
  // ADMIN USERS
  // ============================================
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.users.upsert({
    where: { email: 'admin@fitness.com' },
    update: {},
    create: {
      email: 'admin@fitness.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      bio: 'System administrator',
    },
  });

  // ============================================
  // TEACHER USERS
  // ============================================
  const teacherPassword = await hashPassword('teacher123');

  const teacherTaylor = await prisma.users.upsert({
    where: { email: 'taylor@fitness.com' },
    update: {},
    create: {
      email: 'taylor@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Taylor',
      lastName: 'Johnson',
      role: 'TEACHER',
      bio: 'Experienced Vinyasa and Hatha yoga instructor with 10+ years of teaching experience.',
    },
  });

  const teacherMaya = await prisma.users.upsert({
    where: { email: 'maya@fitness.com' },
    update: {},
    create: {
      email: 'maya@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Maya',
      lastName: 'Chen',
      role: 'TEACHER',
      bio: 'Certified Pilates instructor specializing in Mat Pilates and Reformer.',
    },
  });

  const teacherAlex = await prisma.users.upsert({
    where: { email: 'alex@fitness.com' },
    update: {},
    create: {
      email: 'alex@fitness.com',
      passwordHash: teacherPassword,
      firstName: 'Alex',
      lastName: 'Rivera',
      role: 'TEACHER',
      bio: 'Meditation and mindfulness coach. Specializes in breathwork and guided meditation.',
    },
  });

  const teacher = teacherTaylor;

  // ============================================
  // STUDENT USERS
  // ============================================
  const studentPassword = await hashPassword('student123');

  const studentSam = await prisma.users.upsert({
    where: { email: 'sam@fitness.com' },
    update: {},
    create: {
      email: 'sam@fitness.com',
      passwordHash: studentPassword,
      firstName: 'Sam',
      lastName: 'Wilson',
      role: 'STUDENT',
      bio: 'Yoga enthusiast, intermediate level practitioner.',
    },
  });

  const studentEmma = await prisma.users.upsert({
    where: { email: 'emma@fitness.com' },
    update: {},
    create: {
      email: 'emma@fitness.com',
      passwordHash: studentPassword,
      firstName: 'Emma',
      lastName: 'Thompson',
      role: 'STUDENT',
      bio: 'Pilates lover, focusing on core strength and flexibility.',
    },
  });

  const student = studentSam;

  console.log('👤 Users ensured (1 Admin, 3 Teachers, 2 Students)');

  // ============================================
  // TAGS
  // ============================================
  const tagSeeds = [
    { id: 'tag-level-beginner', kind: 'LEVEL' as const, name: 'Beginner', slug: 'beginner' },
    { id: 'tag-level-intermediate', kind: 'LEVEL' as const, name: 'Intermediate', slug: 'intermediate' },
    { id: 'tag-level-advanced', kind: 'LEVEL' as const, name: 'Advanced', slug: 'advanced' },
    { id: 'tag-discipline-yoga', kind: 'FOCUS' as const, name: 'Yoga', slug: 'yoga' },
    { id: 'tag-discipline-pilates', kind: 'FOCUS' as const, name: 'Pilates', slug: 'pilates' },
    { id: 'tag-discipline-meditation', kind: 'FOCUS' as const, name: 'Meditation', slug: 'meditation' },
    { id: 'tag-focus-flexibility', kind: 'FOCUS' as const, name: 'Flexibility', slug: 'flexibility' },
    { id: 'tag-focus-strength', kind: 'FOCUS' as const, name: 'Strength', slug: 'strength' },
    { id: 'tag-focus-mindfulness', kind: 'FOCUS' as const, name: 'Mindfulness', slug: 'mindfulness' },
    { id: 'tag-focus-relaxation', kind: 'FOCUS' as const, name: 'Relaxation', slug: 'relaxation' },
    { id: 'tag-focus-stress-relief', kind: 'FOCUS' as const, name: 'Stress Relief', slug: 'stress-relief' },
    { id: 'tag-focus-sleep', kind: 'FOCUS' as const, name: 'Sleep', slug: 'sleep' },
    { id: 'tag-equip-mat', kind: 'EQUIPMENT' as const, name: 'Mat', slug: 'mat' },
    { id: 'tag-equip-no-equipment', kind: 'EQUIPMENT' as const, name: 'No Equipment', slug: 'no-equipment' },
  ];

  for (const tag of tagSeeds) {
    await prisma.tags.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, kind: tag.kind },
      create: tag,
    });
  }
  console.log('🏷️ Tags ensured');

  // ============================================
  // SUBSCRIPTION PLANS
  // ============================================
  const subscriptionPlans = [
    {
      id: 'plan-free',
      name: 'Free',
      description: 'Temel içeriklere erişim',
      tier: 'FREE' as const,
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'TRY',
      features: ['Günde 1 meditasyon', 'Temel nefes egzersizleri', 'Sınırlı yoga dersleri'],
      includedCategories: ['meditation_basic', 'breathwork_basic'],
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'plan-meditation',
      name: 'Meditation',
      description: 'Tüm meditasyon ve uyku içerikleri',
      tier: 'MEDITATION' as const,
      priceMonthly: 79.99,
      priceYearly: 699.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_meditation_monthly',
      features: ['Sınırsız meditasyon', 'Uyku hikayeleri', 'Nefes egzersizleri', 'Doğa sesleri', 'Reklamsız'],
      includedCategories: ['meditation', 'sleep', 'breathwork', 'soundscapes'],
      trialDays: 7,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'plan-yoga',
      name: 'Yoga',
      description: 'Tüm yoga ve pilates içerikleri',
      tier: 'YOGA' as const,
      priceMonthly: 99.99,
      priceYearly: 899.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_yoga_monthly',
      features: ['Sınırsız yoga dersleri', 'Pilates dersleri', 'Canlı dersler', 'Eğitmen programları', 'Reklamsız'],
      includedCategories: ['yoga', 'pilates', 'live_classes'],
      hasLiveClasses: true,
      trialDays: 7,
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'plan-premium',
      name: 'Premium',
      description: 'Tüm içerikler + AI koç + offline',
      tier: 'PREMIUM' as const,
      priceMonthly: 149.99,
      priceYearly: 1299.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_premium_monthly',
      features: ['Tüm içerikler', 'AI kişisel koç', 'Offline indirme', 'Canlı dersler', 'Öncelikli destek'],
      includedCategories: ['all'],
      trialDays: 7,
      hasOfflineDownload: true,
      hasAICoach: true,
      hasLiveClasses: true,
      maxDevices: 3,
      isActive: true,
      sortOrder: 4,
    },
    {
      id: 'plan-family',
      name: 'Family',
      description: '6 kişiye kadar aile paylaşımı',
      tier: 'FAMILY' as const,
      priceMonthly: 249.99,
      priceYearly: 2199.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_family_monthly',
      features: ['6 kişiye kadar paylaşım', 'Tüm Premium özellikler', 'Aile aktivite takibi'],
      includedCategories: ['all'],
      trialDays: 7,
      hasOfflineDownload: true,
      hasAICoach: true,
      hasLiveClasses: true,
      hasFamilySharing: true,
      maxFamilyMembers: 6,
      maxDevices: 6,
      isActive: true,
      sortOrder: 5,
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscription_plans.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }
  console.log('💎 Subscription plans ensured');

  // ============================================
  // INSTRUCTOR PROFILES
  // ============================================
  const instructorProfile = await prisma.instructor_profiles.upsert({
    where: { slug: 'taylor-yoga' },
    update: { userId: teacher.id },
    create: {
      userId: teacher.id,
      displayName: 'Taylor Yoga',
      slug: 'taylor-yoga',
      bio: 'Certified yoga instructor with over 10 years of experience.',
      shortBio: 'Vinyasa & Hatha specialist',
      specializations: ['Vinyasa', 'Hatha', 'Restorative'],
      yearsOfExperience: 10,
      languages: ['English', 'Turkish'],
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      isFeatured: true,
      totalStudents: 1250,
      averageRating: 4.85,
      commissionRate: 0.25,
    },
  });

  const instructorProfileAlex = await prisma.instructor_profiles.upsert({
    where: { slug: 'alex-meditation' },
    update: { userId: teacherAlex.id },
    create: {
      userId: teacherAlex.id,
      displayName: 'Alex Meditasyon',
      slug: 'alex-meditation',
      bio: 'Meditasyon ve farkındalık koçu.',
      shortBio: 'Meditasyon & Nefes Uzmanı',
      specializations: ['Meditasyon', 'Nefes Çalışmaları', 'Farkındalık'],
      yearsOfExperience: 6,
      languages: ['Turkish', 'English'],
      status: 'APPROVED',
      tier: 'PRO',
      isVerified: true,
      isFeatured: true,
      totalStudents: 850,
      averageRating: 4.9,
      commissionRate: 0.25,
    },
  });
  console.log('👩‍🏫 Instructor profiles ensured');

  // ============================================
  // GAMIFICATION: USER LEVELS
  // ============================================
  for (const user of [admin, teacher, student]) {
    await prisma.user_levels.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        level: 1,
        currentXP: 0,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        streakFreezeCount: 2,
        lastActivityDate: new Date(),
      },
    });
  }

  await prisma.user_levels.update({
    where: { userId: student.id },
    data: { totalXP: 500, currentXP: 500, level: 3, currentStreak: 5, longestStreak: 5 },
  });
  console.log('📊 User levels ensured');

  // ============================================
  // ACHIEVEMENTS
  // ============================================
  const achievementSeeds = [
    { id: 'achievement-first-class', slug: 'first-class', name: 'First Steps', description: 'Complete your first class', icon: 'trophy-first', category: 'PRACTICE' as const, difficulty: 'EASY' as const, xpReward: 50, requirementType: 'CLASSES_COMPLETED' as const, requirementValue: 1 },
    { id: 'achievement-10-classes', slug: '10-classes', name: 'Dedicated Practitioner', description: 'Complete 10 classes', icon: 'trophy-silver', category: 'PRACTICE' as const, difficulty: 'MEDIUM' as const, xpReward: 150, requirementType: 'CLASSES_COMPLETED' as const, requirementValue: 10 },
    { id: 'achievement-7-day-streak', slug: '7-day-streak', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'flame-bronze', category: 'CONSISTENCY' as const, difficulty: 'EASY' as const, xpReward: 100, requirementType: 'STREAK_DAYS' as const, requirementValue: 7 },
    { id: 'achievement-first-meditation', slug: 'first-meditation', name: 'İlk Meditasyon', description: 'İlk meditasyonunu tamamla', icon: 'lotus-bronze', category: 'PRACTICE' as const, difficulty: 'EASY' as const, xpReward: 50, requirementType: 'CUSTOM' as const, requirementValue: 1 },
    { id: 'achievement-breath-master', slug: 'breath-master', name: 'Nefes Ustası', description: '50 nefes egzersizi tamamla', icon: 'wind-gold', category: 'PRACTICE' as const, difficulty: 'HARD' as const, xpReward: 400, requirementType: 'CUSTOM' as const, requirementValue: 50 },
    { id: 'achievement-mood-tracker', slug: 'mood-tracker', name: 'Duygu Takipçisi', description: '30 gün mood kaydet', icon: 'smile-gold', category: 'CONSISTENCY' as const, difficulty: 'HARD' as const, xpReward: 350, requirementType: 'CUSTOM' as const, requirementValue: 30 },
  ];

  for (const achievement of achievementSeeds) {
    await prisma.achievements.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }
  console.log('🏆 Achievements ensured');

  // ============================================
  // QUESTS
  // ============================================
  const questSeeds = [
    { id: 'quest-daily-practice', name: 'Daily Practice', description: 'Complete at least one session today', icon: 'lotus', type: 'DAILY' as const, requirementType: 'COMPLETE_CLASSES' as const, requirementValue: 1, xpReward: 25, resetPeriod: 'DAILY' as const, isActive: true },
    { id: 'quest-daily-meditation', name: 'Günlük Meditasyon', description: 'Bugün en az 1 meditasyon yap', icon: 'lotus', type: 'DAILY' as const, requirementType: 'CUSTOM' as const, requirementValue: 1, xpReward: 30, resetPeriod: 'DAILY' as const, isActive: true },
    { id: 'quest-daily-breathwork', name: 'Günlük Nefes', description: 'Bugün en az 1 nefes egzersizi yap', icon: 'wind', type: 'DAILY' as const, requirementType: 'CUSTOM' as const, requirementValue: 1, xpReward: 25, resetPeriod: 'DAILY' as const, isActive: true },
    { id: 'quest-daily-mood', name: 'Mood Takibi', description: 'Bugün mood\'unu kaydet', icon: 'smile', type: 'DAILY' as const, requirementType: 'CUSTOM' as const, requirementValue: 1, xpReward: 15, resetPeriod: 'DAILY' as const, isActive: true },
  ];

  for (const quest of questSeeds) {
    await prisma.quests.upsert({
      where: { id: quest.id },
      update: quest,
      create: quest,
    });
  }
  console.log('📋 Quests ensured');

  // ============================================
  // LANGUAGES (i18n)
  // ============================================
  const languages = [
    { id: 'lang-en', code: 'en', name: 'English', nativeName: 'English', direction: 'LTR' as const, isDefault: true, isActive: true, flagEmoji: '🇺🇸' },
    { id: 'lang-tr', code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'LTR' as const, isDefault: false, isActive: true, flagEmoji: '🇹🇷' },
  ];

  for (const lang of languages) {
    await prisma.languages.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
  }
  console.log('🌍 Languages ensured');

  // ============================================
  // MEDITATION CATEGORIES
  // ============================================
  const meditationCategories = [
    { id: 'med-cat-stress', slug: 'stress-relief', name: 'Stres Giderme', nameEn: 'Stress Relief', description: 'Günlük stresinizi azaltın', icon: '😌', color: '#4CAF50', sortOrder: 1 },
    { id: 'med-cat-anxiety', slug: 'anxiety-relief', name: 'Kaygı Azaltma', nameEn: 'Anxiety Relief', description: 'Kaygı ve endişeyi azaltın', icon: '🌿', color: '#66BB6A', sortOrder: 2 },
    { id: 'med-cat-sleep', slug: 'sleep', name: 'Uyku', nameEn: 'Sleep', description: 'Derin ve huzurlu uyku için', icon: '🌙', color: '#5C6BC0', sortOrder: 3 },
    { id: 'med-cat-focus', slug: 'focus', name: 'Odaklanma', nameEn: 'Focus', description: 'Konsantrasyonunuzu artırın', icon: '🎯', color: '#FF7043', sortOrder: 4 },
    { id: 'med-cat-morning', slug: 'morning', name: 'Sabah', nameEn: 'Morning', description: 'Güne enerjik başlayın', icon: '🌅', color: '#FFCA28', sortOrder: 5 },
    { id: 'med-cat-evening', slug: 'evening', name: 'Akşam', nameEn: 'Evening', description: 'Günü huzurla kapatın', icon: '🌆', color: '#7E57C2', sortOrder: 6 },
    { id: 'med-cat-mindfulness', slug: 'mindfulness', name: 'Farkındalık', nameEn: 'Mindfulness', description: 'Şimdiki ana odaklanın', icon: '🍃', color: '#81C784', sortOrder: 7 },
    { id: 'med-cat-beginner', slug: 'beginner', name: 'Başlangıç', nameEn: 'Beginner', description: 'Yeni başlayanlar için', icon: '🌱', color: '#A5D6A7', sortOrder: 8 },
  ];

  for (const category of meditationCategories) {
    await prisma.meditation_categories.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }
  console.log('📂 Meditation categories ensured');

  // ============================================
  // MEDITATIONS
  // ============================================
  const meditations = [
    { id: 'med-beginner-intro', title: 'Meditasyona Giriş', titleEn: 'Introduction to Meditation', slug: 'meditasyona-giris', description: 'Meditasyona yeni başlayanlar için temel eğitim.', audioUrl: 'https://audio.wellness-app.local/meditations/beginner-intro.mp3', duration: 600, categoryId: 'med-cat-beginner', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 28450, averageRating: 4.8, tags: ['başlangıç', 'giriş'], benefits: ['Temelleri öğretir'], isPublished: true, publishedAt: new Date('2024-01-01') },
    { id: 'med-beginner-3min', title: '3 Dakikalık İlk Meditasyon', titleEn: '3-Minute First Meditation', slug: '3-dakikalik-ilk-meditasyon', description: 'En kısa ve basit meditasyon.', audioUrl: 'https://audio.wellness-app.local/meditations/beginner-3min.mp3', duration: 180, categoryId: 'med-cat-beginner', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 35620, averageRating: 4.85, tags: ['başlangıç', 'kısa'], benefits: ['Kolay başlangıç'], isPublished: true, publishedAt: new Date('2024-01-02') },
    { id: 'med-stress-relief-5min', title: '5 Dakikada Stres Giderme', titleEn: '5-Minute Stress Relief', slug: '5-dakikada-stres-giderme', description: 'Yoğun bir günün ortasında hızlıca rahatlayın.', audioUrl: 'https://audio.wellness-app.local/meditations/stress-relief-5min.mp3', duration: 300, categoryId: 'med-cat-stress', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 15420, averageRating: 4.7, tags: ['stres', 'hızlı'], benefits: ['Stresi azaltır'], isPublished: true, publishedAt: new Date('2024-01-15') },
    { id: 'med-sleep-relaxation', title: 'Uyku Öncesi Gevşeme', titleEn: 'Pre-Sleep Relaxation', slug: 'uyku-oncesi-gevseme', description: 'Uyumadan önce zihninizi hazırlayın.', audioUrl: 'https://audio.wellness-app.local/meditations/sleep-relaxation.mp3', duration: 900, categoryId: 'med-cat-sleep', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 25680, averageRating: 4.9, tags: ['uyku', 'gece'], benefits: ['Uyku kalitesini artırır'], isPublished: true, publishedAt: new Date('2024-01-10') },
    { id: 'med-morning-energy', title: 'Sabah Enerji Meditasyonu', titleEn: 'Morning Energy', slug: 'sabah-enerji', description: 'Güne enerji dolu başlamak için.', audioUrl: 'https://audio.wellness-app.local/meditations/morning-energy.mp3', duration: 420, categoryId: 'med-cat-morning', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 18650, averageRating: 4.75, tags: ['sabah', 'enerji'], benefits: ['Enerji verir'], isPublished: true, publishedAt: new Date('2024-01-12') },
    { id: 'med-mindfulness-present', title: 'Şimdiye Dönüş', titleEn: 'Return to Present', slug: 'simdiye-donus', description: 'Şimdiki ana dönün.', audioUrl: 'https://audio.wellness-app.local/meditations/mindfulness-present.mp3', duration: 480, categoryId: 'med-cat-mindfulness', difficulty: 'BEGINNER' as const, instructorId: instructorProfileAlex.id, isPremium: false, playCount: 16780, averageRating: 4.75, tags: ['farkındalık', 'şimdi'], benefits: ['Zihinsel netlik'], isPublished: true, publishedAt: new Date('2024-01-08') },
    { id: 'med-yoga-nidra', title: 'Yoga Nidra - Uyku Yogası', titleEn: 'Yoga Nidra', slug: 'yoga-nidra', description: 'Derin bilinçaltı gevşeme.', audioUrl: 'https://audio.wellness-app.local/meditations/yoga-nidra.mp3', duration: 2700, categoryId: 'med-cat-sleep', difficulty: 'INTERMEDIATE' as const, instructorId: instructorProfileAlex.id, isPremium: true, playCount: 9450, averageRating: 4.95, tags: ['yoga nidra', 'uyku'], benefits: ['45 dakika = 3 saat uyku'], isPublished: true, publishedAt: new Date('2024-02-15') },
  ];

  for (const meditation of meditations) {
    await prisma.meditations.upsert({
      where: { id: meditation.id },
      update: meditation,
      create: meditation,
    });
  }
  console.log('🧘‍♀️ Meditations ensured');

  // ============================================
  // BREATHWORK PATTERNS
  // ============================================
  const breathworks = [
    { id: 'breath-box', title: 'Kutu Nefesi', titleEn: 'Box Breathing', slug: 'kutu-nefesi', description: 'Navy SEAL\'ların kullandığı teknik.', pattern: 'BOX_BREATHING' as const, inhale: 4, hold1: 4, exhale: 4, hold2: 4, cycles: 4, audioUrl: 'https://audio.wellness-app.local/breathwork/box-breathing.mp3', totalDuration: 256, category: 'CALM' as const, difficulty: 'BEGINNER' as const, benefits: ['Stresi azaltır', 'Odaklanmayı artırır'], isPremium: false, animationType: 'CIRCLE' as const, playCount: 24580, isPublished: true },
    { id: 'breath-478', title: '4-7-8 Nefesi', titleEn: '4-7-8 Breathing', slug: '4-7-8-nefesi', description: 'Dr. Andrew Weil tarafından geliştirilen teknik.', pattern: 'FOUR_SEVEN_EIGHT' as const, inhale: 4, hold1: 7, exhale: 8, hold2: 0, cycles: 4, audioUrl: 'https://audio.wellness-app.local/breathwork/478-breathing.mp3', totalDuration: 304, category: 'SLEEP' as const, difficulty: 'BEGINNER' as const, benefits: ['Uykuya dalmayı kolaylaştırır'], isPremium: false, animationType: 'CIRCLE' as const, playCount: 31240, isPublished: true },
    { id: 'breath-relaxing', title: 'Gevşeme Nefesi', titleEn: 'Relaxing Breath', slug: 'gevseme-nefesi', description: 'Uzun nefes verme ile gevşeme.', pattern: 'RELAXING_BREATH' as const, inhale: 4, hold1: 2, exhale: 6, hold2: 0, cycles: 6, audioUrl: 'https://audio.wellness-app.local/breathwork/relaxing-breath.mp3', totalDuration: 288, category: 'CALM' as const, difficulty: 'BEGINNER' as const, benefits: ['Anında sakinlik'], isPremium: false, animationType: 'WAVE' as const, playCount: 18920, isPublished: true },
    { id: 'breath-energizing', title: 'Enerji Nefesi', titleEn: 'Energizing Breath', slug: 'enerji-nefesi', description: 'Enerji seviyenizi yükseltin.', pattern: 'ENERGIZING_BREATH' as const, inhale: 2, hold1: 0, exhale: 2, hold2: 0, cycles: 20, audioUrl: 'https://audio.wellness-app.local/breathwork/energizing-breath.mp3', totalDuration: 160, category: 'ENERGY' as const, difficulty: 'INTERMEDIATE' as const, benefits: ['Enerji verir'], isPremium: true, animationType: 'PULSE' as const, playCount: 12340, isPublished: true },
    { id: 'breath-quick-calm', title: 'Hızlı Sakinleşme', titleEn: 'Quick Calm', slug: 'hizli-sakinlesme', description: '1 dakikada sakinleşin.', pattern: 'RELAXING_BREATH' as const, inhale: 3, hold1: 0, exhale: 6, hold2: 0, cycles: 6, audioUrl: 'https://audio.wellness-app.local/breathwork/quick-calm.mp3', totalDuration: 54, category: 'QUICK' as const, difficulty: 'BEGINNER' as const, benefits: ['Anında sakinlik'], isPremium: false, animationType: 'WAVE' as const, playCount: 28650, isPublished: true },
    { id: 'breath-morning-wake', title: 'Sabah Uyanış Nefesi', titleEn: 'Morning Wake-Up', slug: 'sabah-uyanis', description: 'Güne hazırlanın.', pattern: 'ENERGIZING_BREATH' as const, inhale: 3, hold1: 3, exhale: 3, hold2: 0, cycles: 8, audioUrl: 'https://audio.wellness-app.local/breathwork/morning-wake.mp3', totalDuration: 144, category: 'MORNING' as const, difficulty: 'BEGINNER' as const, benefits: ['Güne enerjik başlatır'], isPremium: false, animationType: 'PULSE' as const, playCount: 15230, isPublished: true },
    { id: 'breath-bedtime', title: 'Yatağa Hazırlık Nefesi', titleEn: 'Bedtime Breath', slug: 'yataga-hazirlik', description: 'Uyumadan önce zihninizi uyku moduna alın.', pattern: 'FOUR_SEVEN_EIGHT' as const, inhale: 4, hold1: 7, exhale: 8, hold2: 2, cycles: 3, audioUrl: 'https://audio.wellness-app.local/breathwork/bedtime-breath.mp3', totalDuration: 126, category: 'EVENING' as const, difficulty: 'BEGINNER' as const, benefits: ['Uyku hazırlığı'], isPremium: false, animationType: 'WAVE' as const, playCount: 22180, isPublished: true },
    { id: 'breath-anxiety-relief', title: 'Kaygı Giderici Nefes', titleEn: 'Anxiety Relief', slug: 'kaygi-giderici', description: 'Kaygı anında uygulayın.', pattern: 'RELAXING_BREATH' as const, inhale: 4, hold1: 4, exhale: 8, hold2: 0, cycles: 5, audioUrl: 'https://audio.wellness-app.local/breathwork/anxiety-relief.mp3', totalDuration: 160, category: 'ANXIETY' as const, difficulty: 'BEGINNER' as const, benefits: ['Kaygıyı azaltır'], isPremium: false, animationType: 'WAVE' as const, playCount: 19870, isPublished: true },
  ];

  for (const breathwork of breathworks) {
    await prisma.breathworks.upsert({
      where: { id: breathwork.id },
      update: breathwork,
      create: breathwork,
    });
  }
  console.log('🌬️ Breathwork patterns ensured');

  // ============================================
  // SOUNDSCAPES
  // ============================================
  const soundscapes = [
    { id: 'sound-rain-soft', title: 'Yumuşak Yağmur', titleEn: 'Soft Rain', slug: 'yumusak-yagmur', audioUrl: 'https://audio.wellness-app.local/sounds/rain-soft.mp3', isLoop: true, category: 'RAIN' as const, isPremium: false, isMixable: true, defaultVolume: 50, playCount: 45620, tags: ['yağmur', 'doğa'], isPublished: true },
    { id: 'sound-rain-heavy', title: 'Şiddetli Yağmur', titleEn: 'Heavy Rain', slug: 'siddetli-yagmur', audioUrl: 'https://audio.wellness-app.local/sounds/rain-heavy.mp3', isLoop: true, category: 'RAIN' as const, isPremium: false, isMixable: true, defaultVolume: 40, playCount: 32450, tags: ['yağmur'], isPublished: true },
    { id: 'sound-thunder', title: 'Gök Gürültüsü', titleEn: 'Thunder', slug: 'gok-gurultusu', audioUrl: 'https://audio.wellness-app.local/sounds/thunder.mp3', isLoop: true, category: 'THUNDER' as const, isPremium: false, isMixable: true, defaultVolume: 30, playCount: 25890, tags: ['gök gürültüsü'], isPublished: true },
    { id: 'sound-ocean-waves', title: 'Okyanus Dalgaları', titleEn: 'Ocean Waves', slug: 'okyanus-dalgalari', audioUrl: 'https://audio.wellness-app.local/sounds/ocean-waves.mp3', isLoop: true, category: 'OCEAN' as const, isPremium: false, isMixable: true, defaultVolume: 50, playCount: 52340, tags: ['okyanus', 'dalga'], isPublished: true },
    { id: 'sound-forest', title: 'Orman Sesleri', titleEn: 'Forest Sounds', slug: 'orman-sesleri', audioUrl: 'https://audio.wellness-app.local/sounds/forest.mp3', isLoop: true, category: 'FOREST' as const, isPremium: false, isMixable: true, defaultVolume: 50, playCount: 41230, tags: ['orman', 'doğa'], isPublished: true },
    { id: 'sound-birds', title: 'Kuş Cıvıltıları', titleEn: 'Bird Songs', slug: 'kus-civiltilari', audioUrl: 'https://audio.wellness-app.local/sounds/birds.mp3', isLoop: true, category: 'BIRDS' as const, isPremium: false, isMixable: true, defaultVolume: 40, playCount: 35670, tags: ['kuş', 'sabah'], isPublished: true },
    { id: 'sound-fire', title: 'Şömine Ateşi', titleEn: 'Fireplace', slug: 'somine-atesi', audioUrl: 'https://audio.wellness-app.local/sounds/fire.mp3', isLoop: true, category: 'FIRE' as const, isPremium: false, isMixable: true, defaultVolume: 45, playCount: 48920, tags: ['ateş', 'şömine'], isPublished: true },
    { id: 'sound-white-noise', title: 'Beyaz Gürültü', titleEn: 'White Noise', slug: 'beyaz-gurultu', audioUrl: 'https://audio.wellness-app.local/sounds/white-noise.mp3', isLoop: true, category: 'WHITE_NOISE' as const, isPremium: false, isMixable: true, defaultVolume: 40, playCount: 56780, tags: ['beyaz gürültü', 'uyku'], isPublished: true },
    { id: 'sound-cafe', title: 'Kafe Ortamı', titleEn: 'Coffee Shop', slug: 'kafe-ortami', audioUrl: 'https://audio.wellness-app.local/sounds/cafe.mp3', isLoop: true, category: 'CAFE' as const, isPremium: false, isMixable: true, defaultVolume: 35, playCount: 38920, tags: ['kafe', 'çalışma'], isPublished: true },
    { id: 'sound-tibetan-bowls', title: 'Tibet Çanakları', titleEn: 'Tibetan Singing Bowls', slug: 'tibet-canaklari', audioUrl: 'https://audio.wellness-app.local/sounds/tibetan-bowls.mp3', isLoop: true, category: 'TIBETAN_BOWLS' as const, isPremium: true, isMixable: true, defaultVolume: 40, playCount: 35670, tags: ['tibet', 'meditasyon'], isPublished: true },
  ];

  for (const sound of soundscapes) {
    await prisma.soundscapes.upsert({
      where: { id: sound.id },
      update: sound,
      create: sound,
    });
  }
  console.log('🔊 Soundscapes ensured');

  // ============================================
  // SLEEP STORIES
  // ============================================
  const sleepStories = [
    { id: 'sleep-story-forest', title: 'Gizemli Orman Yolculuğu', titleEn: 'Mysterious Forest Journey', slug: 'gizemli-orman', description: 'Huzurlu bir orman yolculuğuna çıkın.', audioUrl: 'https://audio.wellness-app.local/sleep-stories/forest-journey.mp3', duration: 1800, category: 'NATURE' as const, narratorName: 'Elif Yıldız', coverImageUrl: 'https://images.wellness-app.local/sleep-stories/forest.jpg', isPremium: false, playCount: 15620, averageRating: 4.85, tags: ['orman', 'doğa'], isPublished: true },
    { id: 'sleep-story-sea', title: 'Ege Kıyılarında', titleEn: 'On the Aegean Coast', slug: 'ege-kiyilari', description: 'Ege\'nin masmavi sularında sakin bir gece.', audioUrl: 'https://audio.wellness-app.local/sleep-stories/aegean-coast.mp3', duration: 2100, category: 'NATURE' as const, narratorName: 'Ahmet Kaya', coverImageUrl: 'https://images.wellness-app.local/sleep-stories/sea.jpg', isPremium: true, playCount: 12340, averageRating: 4.9, tags: ['deniz', 'ege'], isPublished: true },
    { id: 'sleep-story-kapadokya', title: 'Kapadokya Gecesi', titleEn: 'Cappadocia Night', slug: 'kapadokya-gecesi', description: 'Peri bacaları arasında yıldızların altında.', audioUrl: 'https://audio.wellness-app.local/sleep-stories/cappadocia.mp3', duration: 2400, category: 'FANTASY' as const, narratorName: 'Merve Demir', coverImageUrl: 'https://images.wellness-app.local/sleep-stories/cappadocia.jpg', isPremium: true, playCount: 9870, averageRating: 4.95, tags: ['kapadokya', 'gece'], isPublished: true },
    { id: 'sleep-story-istanbul', title: 'İstanbul Akşamı', titleEn: 'Istanbul Evening', slug: 'istanbul-aksami', description: 'Boğaz\'ın ışıltılı sularında sakin bir akşam.', audioUrl: 'https://audio.wellness-app.local/sleep-stories/istanbul.mp3', duration: 1800, category: 'CITY' as const, narratorName: 'Can Öz', coverImageUrl: 'https://images.wellness-app.local/sleep-stories/istanbul.jpg', isPremium: false, playCount: 18450, averageRating: 4.8, tags: ['istanbul', 'boğaz'], isPublished: true },
    { id: 'sleep-story-rain', title: 'Yağmurlu Gece', titleEn: 'Rainy Night', slug: 'yagmurlu-gece', description: 'Pencereye vuran yağmur sesi eşliğinde.', audioUrl: 'https://audio.wellness-app.local/sleep-stories/rainy-night.mp3', duration: 2700, category: 'AMBIENT' as const, narratorName: 'Zeynep Arslan', coverImageUrl: 'https://images.wellness-app.local/sleep-stories/rain.jpg', isPremium: true, playCount: 21560, averageRating: 4.9, tags: ['yağmur', 'gece'], isPublished: true },
  ];

  for (const story of sleepStories) {
    await prisma.sleep_stories.upsert({
      where: { id: story.id },
      update: story,
      create: story,
    });
  }
  console.log('📖 Sleep stories ensured');

  // ============================================
  // DAILY QUOTES
  // ============================================
  const dailyQuotes = [
    { id: 'quote-1', text: 'Her gün yeni bir başlangıçtır.', author: 'Anonim', category: 'MOTIVATION' as const, language: 'tr', isActive: true },
    { id: 'quote-2', text: 'Bugün aldığın her nefes, yeni bir şans.', author: 'Thich Nhat Hanh', category: 'MINDFULNESS' as const, language: 'tr', isActive: true },
    { id: 'quote-3', text: 'Mutluluk içeride başlar.', author: 'Dalai Lama', category: 'HAPPINESS' as const, language: 'tr', isActive: true },
    { id: 'quote-4', text: 'Şimdi ve burada ol.', author: 'Ram Dass', category: 'MINDFULNESS' as const, language: 'tr', isActive: true },
    { id: 'quote-5', text: 'Nefes al, bırak gitsin.', author: 'Anonim', category: 'PEACE' as const, language: 'tr', isActive: true },
    { id: 'quote-6', text: 'Huzur, dışarıda değil içeridedir.', author: 'Marcus Aurelius', category: 'PEACE' as const, language: 'tr', isActive: true },
    { id: 'quote-7', text: 'Kendine nazik ol.', author: 'Buddha', category: 'SELF_LOVE' as const, language: 'tr', isActive: true },
    { id: 'quote-8', text: 'Bu an, sahip olduğun tek an.', author: 'Eckhart Tolle', category: 'MINDFULNESS' as const, language: 'tr', isActive: true },
    { id: 'quote-9', text: 'Yoga zihnin dalgalanmalarını durdurmaktır.', author: 'Patanjali', category: 'YOGA' as const, language: 'tr', isActive: true },
    { id: 'quote-10', text: 'Sevgi tüm yaraları iyileştirir.', author: 'Rumi', category: 'SUFI' as const, language: 'tr', isActive: true },
  ];

  for (const quote of dailyQuotes) {
    await prisma.daily_quotes.upsert({
      where: { id: quote.id },
      update: quote,
      create: quote,
    });
  }
  console.log('💬 Daily quotes ensured');

  // ============================================
  // MOOD TAGS
  // ============================================
  const moodTags = [
    { id: 'mood-tag-work', name: 'İş', nameEn: 'Work', category: 'ACTIVITY' as const, icon: '💼', color: '#607D8B' },
    { id: 'mood-tag-exercise', name: 'Egzersiz', nameEn: 'Exercise', category: 'ACTIVITY' as const, icon: '🏃', color: '#4CAF50' },
    { id: 'mood-tag-meditation', name: 'Meditasyon', nameEn: 'Meditation', category: 'ACTIVITY' as const, icon: '🧘', color: '#9C27B0' },
    { id: 'mood-tag-family', name: 'Aile', nameEn: 'Family', category: 'SOCIAL' as const, icon: '👨‍👩‍👧', color: '#E91E63' },
    { id: 'mood-tag-friends', name: 'Arkadaşlar', nameEn: 'Friends', category: 'SOCIAL' as const, icon: '👫', color: '#2196F3' },
    { id: 'mood-tag-tired', name: 'Yorgun', nameEn: 'Tired', category: 'HEALTH' as const, icon: '😫', color: '#78909C' },
    { id: 'mood-tag-energetic', name: 'Enerjik', nameEn: 'Energetic', category: 'HEALTH' as const, icon: '⚡', color: '#FFEB3B' },
    { id: 'mood-tag-grateful', name: 'Minnettar', nameEn: 'Grateful', category: 'OTHER' as const, icon: '🙏', color: '#8BC34A' },
  ];

  for (const tag of moodTags) {
    await prisma.mood_tags.upsert({
      where: { id: tag.id },
      update: tag,
      create: tag,
    });
  }
  console.log('🏷️ Mood tags ensured');

  // ============================================
  // JOURNAL PROMPTS (Sprint 4 - Expanded)
  // ============================================
  const journalPrompts = [
    // Gratitude
    { id: 'prompt-gratitude-1', type: 'GRATITUDE' as const, prompt: 'Bugün için minnettar olduğun 3 şey nedir?', promptEn: 'What are 3 things you are grateful for today?', category: 'daily', isActive: true, sortOrder: 1 },
    { id: 'prompt-gratitude-2', type: 'GRATITUDE' as const, prompt: 'Bugün seni gülümseten ne oldu?', promptEn: 'What made you smile today?', category: 'daily', isActive: true, sortOrder: 2 },
    { id: 'prompt-gratitude-3', type: 'GRATITUDE' as const, prompt: 'Hayatındaki hangi kişiye minnettarsın ve neden?', promptEn: 'Which person in your life are you grateful for and why?', category: 'weekly', isActive: true, sortOrder: 3 },
    // Reflection
    { id: 'prompt-reflection-1', type: 'REFLECTION' as const, prompt: 'Bugün kendini nasıl hissettin?', promptEn: 'How did you feel today?', category: 'daily', isActive: true, sortOrder: 4 },
    { id: 'prompt-reflection-2', type: 'REFLECTION' as const, prompt: 'Bu hafta öğrendiğin en önemli ders neydi?', promptEn: 'What was the most important lesson you learned this week?', category: 'weekly', isActive: true, sortOrder: 5 },
    { id: 'prompt-reflection-3', type: 'REFLECTION' as const, prompt: 'Şu anki en büyük zorluğun ne? Bu zorluktan ne öğrenebilirsin?', promptEn: 'What is your biggest challenge right now? What can you learn from it?', category: 'weekly', isActive: true, sortOrder: 6 },
    // Practice Notes
    { id: 'prompt-practice-1', type: 'PRACTICE_NOTES' as const, prompt: 'Bugünkü pratiğinde ne hissettin?', promptEn: 'What did you feel during today\'s practice?', category: 'daily', isActive: true, sortOrder: 7 },
    { id: 'prompt-practice-2', type: 'PRACTICE_NOTES' as const, prompt: 'Meditasyon sırasında hangi düşünceler aklına geldi?', promptEn: 'What thoughts came to mind during meditation?', category: 'daily', isActive: true, sortOrder: 8 },
    // Free Write
    { id: 'prompt-free-1', type: 'FREE_WRITE' as const, prompt: 'Şu an aklında ne var?', promptEn: 'What is on your mind right now?', category: 'daily', isActive: true, sortOrder: 9 },
    { id: 'prompt-free-2', type: 'FREE_WRITE' as const, prompt: '5 dakika boyunca filtresiz yaz. Akla gelen her şeyi kağıda dök.', promptEn: 'Write without filter for 5 minutes. Pour everything that comes to mind.', category: 'daily', isActive: true, sortOrder: 10 },
    // Intention
    { id: 'prompt-intention-1', type: 'INTENTION' as const, prompt: 'Bugün için niyetin ne?', promptEn: 'What is your intention for today?', category: 'morning', isActive: true, sortOrder: 11 },
    { id: 'prompt-intention-2', type: 'INTENTION' as const, prompt: 'Bu hafta odaklanmak istediğin 3 şey nedir?', promptEn: 'What are 3 things you want to focus on this week?', category: 'weekly', isActive: true, sortOrder: 12 },
    // Dream Journal
    { id: 'prompt-dream-1', type: 'DREAM' as const, prompt: 'Bu gece ne rüya gördün? Detaylarını yaz.', promptEn: 'What did you dream about last night? Write the details.', category: 'morning', isActive: true, sortOrder: 13 },
  ];

  for (const prompt of journalPrompts) {
    await prisma.journal_prompts.upsert({
      where: { id: prompt.id },
      update: prompt,
      create: prompt,
    });
  }
  console.log('📝 Journal prompts ensured (Sprint 4 expanded)');

  // ============================================
  // GOAL TEMPLATES (Sprint 4)
  // ============================================
  const goalTemplates = [
    { id: 'goal-tpl-practice-days-3', type: 'PRACTICE_DAYS' as const, title: 'Haftada 3 Gün Pratik', description: 'Haftada en az 3 gün yoga veya meditasyon yap', targetValue: 3, unit: 'gün', period: 'WEEKLY' as const, icon: '🧘', sortOrder: 1, isActive: true },
    { id: 'goal-tpl-practice-days-5', type: 'PRACTICE_DAYS' as const, title: 'Haftada 5 Gün Pratik', description: 'Haftada en az 5 gün pratik yap', targetValue: 5, unit: 'gün', period: 'WEEKLY' as const, icon: '🧘', sortOrder: 2, isActive: true },
    { id: 'goal-tpl-practice-days-7', type: 'PRACTICE_DAYS' as const, title: 'Her Gün Pratik', description: 'Her gün pratik yaparak tutarlılık kazan', targetValue: 7, unit: 'gün', period: 'WEEKLY' as const, icon: '⭐', sortOrder: 3, isActive: true },
    { id: 'goal-tpl-minutes-15', type: 'PRACTICE_MINUTES' as const, title: 'Günde 15 Dakika', description: 'Her gün en az 15 dakika meditasyon yap', targetValue: 15, unit: 'dakika', period: 'DAILY' as const, icon: '⏱️', sortOrder: 4, isActive: true },
    { id: 'goal-tpl-minutes-30', type: 'PRACTICE_MINUTES' as const, title: 'Günde 30 Dakika', description: 'Her gün en az 30 dakika pratik yap', targetValue: 30, unit: 'dakika', period: 'DAILY' as const, icon: '⏱️', sortOrder: 5, isActive: true },
    { id: 'goal-tpl-weekly-minutes', type: 'PRACTICE_MINUTES' as const, title: 'Haftada 2 Saat', description: 'Haftada toplam 2 saat pratik yap', targetValue: 120, unit: 'dakika', period: 'WEEKLY' as const, icon: '📊', sortOrder: 6, isActive: true },
    { id: 'goal-tpl-streak-7', type: 'STREAK' as const, title: '7 Günlük Seri', description: '7 gün üst üste pratik yap', targetValue: 7, unit: 'gün', period: 'MONTHLY' as const, icon: '🔥', sortOrder: 7, isActive: true },
    { id: 'goal-tpl-streak-30', type: 'STREAK' as const, title: '30 Günlük Seri', description: '30 gün üst üste pratik yap', targetValue: 30, unit: 'gün', period: 'MONTHLY' as const, icon: '🏆', sortOrder: 8, isActive: true },
    { id: 'goal-tpl-meditation-weekly', type: 'MEDITATION_COUNT' as const, title: 'Haftada 5 Meditasyon', description: 'Haftada en az 5 meditasyon tamamla', targetValue: 5, unit: 'meditasyon', period: 'WEEKLY' as const, icon: '🧘‍♀️', sortOrder: 9, isActive: true },
    { id: 'goal-tpl-breathwork-weekly', type: 'BREATHWORK_COUNT' as const, title: 'Haftada 3 Nefes Egzersizi', description: 'Haftada en az 3 nefes egzersizi yap', targetValue: 3, unit: 'egzersiz', period: 'WEEKLY' as const, icon: '🌬️', sortOrder: 10, isActive: true },
  ];

  for (const template of goalTemplates) {
    await prisma.goal_templates.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }
  console.log('🎯 Goal templates ensured (Sprint 4)');

  // ============================================
  // REMINDER TEMPLATES (Sprint 4)
  // ============================================
  const reminderTemplates = [
    { id: 'reminder-tpl-morning', type: 'MORNING' as const, title: 'Sabah Meditasyonu', message: 'Güne huzurlu bir başlangıç yap 🌅', time: '07:00', icon: '🌅', sortOrder: 1, isActive: true },
    { id: 'reminder-tpl-breathing', type: 'PRACTICE' as const, title: 'Nefes Molası', message: 'Derin bir nefes al 🌬️', time: '12:00', icon: '🌬️', sortOrder: 2, isActive: true },
    { id: 'reminder-tpl-afternoon', type: 'BREAK' as const, title: 'Öğleden Sonra Molası', message: 'Kısa bir mola ver, kendine zaman ayır ☀️', time: '15:00', icon: '☀️', sortOrder: 3, isActive: true },
    { id: 'reminder-tpl-evening', type: 'EVENING' as const, title: 'Akşam Gevşemesi', message: 'Günün stresini bırak 🌆', time: '19:00', icon: '🌆', sortOrder: 4, isActive: true },
    { id: 'reminder-tpl-sleep', type: 'BEDTIME' as const, title: 'Uyku Zamanı', message: 'Yatmadan önce rahatlama zamanı 🌙', time: '22:00', icon: '🌙', sortOrder: 5, isActive: true },
    { id: 'reminder-tpl-mindful', type: 'CUSTOM' as const, title: 'Farkındalık Anı', message: 'Bir an dur ve şimdiye odaklan 🍃', time: '14:00', icon: '🍃', sortOrder: 6, isActive: true },
  ];

  for (const template of reminderTemplates) {
    await prisma.reminder_templates.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }
  console.log('⏰ Reminder templates ensured (Sprint 4)');

  // ============================================
  // USER ONBOARDING
  // ============================================
  await prisma.user_onboarding.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      isCompleted: true,
      completedAt: new Date(),
      experienceLevel: 'INTERMEDIATE',
      goals: ['STRESS_RELIEF', 'FLEXIBILITY', 'BETTER_SLEEP'],
      interests: ['YOGA', 'MEDITATION', 'BREATHWORK'],
      practiceFrequency: 'DAILY',
      preferredDuration: 15,
      preferredTime: 'MORNING',
      currentStep: 5,
      totalSteps: 5,
    },
  });
  console.log('📋 User onboarding ensured');

  // ============================================
  // USER GOALS
  // ============================================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userGoals = [
    { id: `goal-${student.id}-practice`, userId: student.id, type: 'PRACTICE_DAYS' as const, title: 'Haftada 5 Gün Pratik', targetValue: 5, currentValue: 3, unit: 'gün', period: 'WEEKLY' as const, isActive: true, startDate: today },
    { id: `goal-${student.id}-minutes`, userId: student.id, type: 'PRACTICE_MINUTES' as const, title: 'Günde 20 Dakika', targetValue: 20, currentValue: 15, unit: 'dakika', period: 'DAILY' as const, isActive: true, startDate: today },
  ];

  for (const goal of userGoals) {
    await prisma.user_goals.upsert({
      where: { id: goal.id },
      update: goal,
      create: goal,
    });
  }
  console.log('🎯 User goals ensured');

  // ============================================
  // USER REMINDERS
  // ============================================
  const userReminders = [
    { id: `reminder-${student.id}-morning`, userId: student.id, type: 'MORNING' as const, title: 'Sabah Meditasyonu', message: 'Güne huzurlu başla 🧘', time: '07:00', days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'], isEnabled: true, timezone: 'Europe/Istanbul' },
    { id: `reminder-${student.id}-evening`, userId: student.id, type: 'EVENING' as const, title: 'Akşam Gevşeme', message: 'Günün stresini bırak 🌙', time: '21:00', days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'], isEnabled: true, timezone: 'Europe/Istanbul' },
  ];

  for (const reminder of userReminders) {
    await prisma.user_reminders.upsert({
      where: { id: reminder.id },
      update: reminder,
      create: reminder,
    });
  }
  console.log('⏰ User reminders ensured');

  // ============================================
  // MEDITATION FAVORITES
  // ============================================
  await prisma.meditation_favorites.upsert({
    where: { meditationId_userId: { meditationId: 'med-sleep-relaxation', userId: student.id } },
    update: {},
    create: { meditationId: 'med-sleep-relaxation', userId: student.id },
  });

  await prisma.meditation_favorites.upsert({
    where: { meditationId_userId: { meditationId: 'med-morning-energy', userId: student.id } },
    update: {},
    create: { meditationId: 'med-morning-energy', userId: student.id },
  });
  console.log('❤️ Meditation favorites ensured');

  // ============================================
  // SAMPLE MOOD ENTRIES
  // ============================================
  const moods = ['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD'] as const;
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const moodIndex = Math.floor(Math.random() * 3);

    await prisma.mood_entries.upsert({
      where: { id: `mood-entry-${student.id}-${i}` },
      update: {},
      create: {
        id: `mood-entry-${student.id}-${i}`,
        userId: student.id,
        mood: moods[moodIndex],
        moodScore: 5 - moodIndex,
        energy: Math.floor(Math.random() * 3) + 3,
        stress: Math.floor(Math.random() * 3) + 1,
        tags: ['mood-tag-meditation'],
        date: date,
      },
    });
  }
  console.log('😊 Mood entries ensured');

  // ============================================
  // SPRINT 3: TIMER PRESETS (System Presets)
  // ============================================
  const timerPresets = [
    {
      id: 'preset-quick-5',
      name: 'Hızlı Mola',
      nameEn: 'Quick Break',
      description: '5 dakikalık hızlı meditasyon molası',
      duration: 300, // 5 minutes
      startBell: 'bell_tibetan',
      endBell: 'bell_singing',
      icon: '⚡',
      color: '#FF6B6B',
      isSystem: true,
      sortOrder: 1,
    },
    {
      id: 'preset-morning-10',
      name: 'Sabah Meditasyonu',
      nameEn: 'Morning Meditation',
      description: '10 dakikalık güne enerjik başlama',
      duration: 600, // 10 minutes
      startBell: 'bell_chime',
      endBell: 'bell_gong',
      intervalBell: 300, // 5 minutes
      intervalBellSound: 'bell_soft',
      icon: '🌅',
      color: '#FFB347',
      isSystem: true,
      sortOrder: 2,
    },
    {
      id: 'preset-focus-15',
      name: 'Odaklanma',
      nameEn: 'Focus Session',
      description: '15 dakikalık derin odaklanma',
      duration: 900, // 15 minutes
      startBell: 'bell_tibetan',
      endBell: 'bell_tibetan',
      icon: '🎯',
      color: '#4ECDC4',
      isSystem: true,
      sortOrder: 3,
    },
    {
      id: 'preset-deep-20',
      name: 'Derin Meditasyon',
      nameEn: 'Deep Meditation',
      description: '20 dakikalık derin meditasyon',
      duration: 1200, // 20 minutes
      startBell: 'bell_singing',
      endBell: 'bell_singing',
      intervalBell: 600, // 10 minutes
      intervalBellSound: 'bell_soft',
      icon: '🧘',
      color: '#9B59B6',
      isSystem: true,
      sortOrder: 4,
    },
    {
      id: 'preset-extended-30',
      name: 'Uzun Seans',
      nameEn: 'Extended Session',
      description: '30 dakikalık kapsamlı meditasyon',
      duration: 1800, // 30 minutes
      startBell: 'bell_gong',
      endBell: 'bell_gong',
      intervalBell: 900, // 15 minutes
      intervalBellSound: 'bell_chime',
      icon: '🌟',
      color: '#3498DB',
      isSystem: true,
      sortOrder: 5,
    },
    {
      id: 'preset-sleep-45',
      name: 'Uyku Hazırlığı',
      nameEn: 'Sleep Preparation',
      description: '45 dakikalık uyku öncesi rahatlama',
      duration: 2700, // 45 minutes
      startBell: 'bell_soft',
      endBell: 'bell_soft',
      icon: '🌙',
      color: '#34495E',
      isSystem: true,
      sortOrder: 6,
    },
    {
      id: 'preset-open',
      name: 'Açık Uçlu',
      nameEn: 'Open-Ended',
      description: 'Süre sınırı olmadan meditasyon',
      duration: 0, // Open ended
      startBell: 'bell_tibetan',
      endBell: 'bell_tibetan',
      icon: '♾️',
      color: '#1ABC9C',
      isSystem: true,
      sortOrder: 7,
    },
  ];

  for (const preset of timerPresets) {
    await prisma.timer_presets.upsert({
      where: { id: preset.id },
      update: preset,
      create: preset,
    });
  }
  console.log('⏱️ Timer presets ensured');

  // ============================================
  // FEATURE FLAGS
  // ============================================
  const featureFlags = [
    { key: 'meditation_feature', name: 'Meditation', isEnabled: true, description: 'Enable meditation feature', rolloutPercentage: 100 },
    { key: 'breathwork_feature', name: 'Breathwork', isEnabled: true, description: 'Enable breathwork feature', rolloutPercentage: 100 },
    { key: 'sleep_stories_feature', name: 'Sleep Stories', isEnabled: true, description: 'Enable sleep stories feature', rolloutPercentage: 100 },
    { key: 'mood_tracking_feature', name: 'Mood Tracking', isEnabled: true, description: 'Enable mood tracking feature', rolloutPercentage: 100 },
    { key: 'journal_feature', name: 'Journal', isEnabled: true, description: 'Enable journal feature', rolloutPercentage: 100 },
    { key: 'sound_mixer_feature', name: 'Sound Mixer', isEnabled: true, description: 'Enable sound mixer feature', rolloutPercentage: 100 },
  ];

  for (const flag of featureFlags) {
    await prisma.feature_flags.upsert({
      where: { key: flag.key },
      update: flag,
      create: { ...flag, updatedById: admin.id },
    });
  }
  console.log('🚩 Feature flags ensured');

  // ============================================
  // SPRINT 5: SYSTEM PLAYLISTS
  // ============================================
  const systemPlaylists = [
    {
      id: 'playlist-morning-calm',
      name: 'Sabah Sakinliği',
      nameEn: 'Morning Calm',
      description: 'Güne huzurlu başlamak için seçilmiş içerikler',
      descriptionEn: 'Curated content to start your day peacefully',
      coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      color: '#FFE4B5',
      type: 'SYSTEM',
      contentType: 'MIXED',
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
    },
    {
      id: 'playlist-stress-relief',
      name: 'Stres Giderici',
      nameEn: 'Stress Relief',
      description: 'Stresi azaltmak için meditasyon ve nefes egzersizleri',
      descriptionEn: 'Meditation and breathing exercises to reduce stress',
      coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      color: '#98D8C8',
      type: 'SYSTEM',
      contentType: 'MIXED',
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
    },
    {
      id: 'playlist-better-sleep',
      name: 'Derin Uyku',
      nameEn: 'Better Sleep',
      description: 'Kaliteli uyku için uyku hikayeleri ve gevşeme içerikleri',
      descriptionEn: 'Sleep stories and relaxation content for quality sleep',
      coverImage: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=800',
      color: '#5D4E8C',
      type: 'SYSTEM',
      contentType: 'SLEEP',
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 3,
    },
    {
      id: 'playlist-focus',
      name: 'Odaklanma',
      nameEn: 'Focus & Concentration',
      description: 'Konsantrasyon ve üretkenlik için içerikler',
      descriptionEn: 'Content for concentration and productivity',
      coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
      color: '#4A90D9',
      type: 'SYSTEM',
      contentType: 'MEDITATION',
      isSystem: true,
      isPublic: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: 4,
    },
    {
      id: 'playlist-breathwork-basics',
      name: 'Nefes Temelleri',
      nameEn: 'Breathwork Basics',
      description: 'Temel nefes egzersizleri koleksiyonu',
      descriptionEn: 'Collection of basic breathing exercises',
      coverImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800',
      color: '#7ED6A0',
      type: 'CURATED',
      contentType: 'BREATHWORK',
      isSystem: true,
      isPublic: true,
      isFeatured: false,
      isPublished: true,
      sortOrder: 5,
    },
    {
      id: 'playlist-nature-sounds',
      name: 'Doğa Sesleri',
      nameEn: 'Nature Sounds',
      description: 'Doğadan rahatlatıcı ses manzaraları',
      descriptionEn: 'Relaxing soundscapes from nature',
      coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      color: '#2D5F2E',
      type: 'SYSTEM',
      contentType: 'SOUNDSCAPE',
      isSystem: true,
      isPublic: true,
      isFeatured: false,
      isPublished: true,
      sortOrder: 6,
    },
  ];

  for (const playlist of systemPlaylists) {
    await prisma.playlists.upsert({
      where: { id: playlist.id },
      update: playlist,
      create: playlist as any,
    });
  }
  console.log('📋 System playlists ensured');

  // ============================================
  // DAILY CONTENT (Bugün için)
  // ============================================
  const dailyContentToday = new Date();
  dailyContentToday.setHours(0, 0, 0, 0);

  await prisma.daily_content.upsert({
    where: { date: dailyContentToday },
    update: {},
    create: {
      date: dailyContentToday,
      quoteId: 'quote-1',
      meditationId: 'med-morning-energy',
      breathworkId: 'breath-morning-wake',
      tip: 'Günün ilk saatinde 5 dakikalık meditasyon, tüm günün kalitesini artırır.',
      isPublished: true,
    },
  });
  console.log('📅 Daily content ensured');

  // ============================================
  // USER WELLNESS STATS
  // ============================================
  await prisma.user_wellness_stats.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      totalMeditationMinutes: 450,
      totalMeditationCount: 28,
      totalBreathworkMinutes: 120,
      totalBreathworkCount: 15,
      totalSessionMinutes: 200,
      totalSessionCount: 12,
      totalSleepStoryCount: 5,
      totalJournalEntries: 14,
      totalMoodEntries: 21,
      currentStreak: 5,
      longestStreak: 12,
      lastActivityDate: new Date(),
      weeklyMinutes: 85,
      weeklySessionCount: 8,
      monthlyMinutes: 320,
      monthlySessionCount: 35,
      achievementCount: 3,
      badgeCount: 2,
    },
  });
  console.log('📊 User wellness stats ensured');

  // ============================================
  // PLAYLIST ITEMS (System playlist'lerine içerik ekle)
  // ============================================
  const playlistItemsData = [
    // Morning Calm playlist
    { id: 'pl-item-morning-1', playlistId: 'playlist-morning-calm', contentType: 'MEDITATION' as const, meditationId: 'med-morning-energy', sortOrder: 1 },
    { id: 'pl-item-morning-2', playlistId: 'playlist-morning-calm', contentType: 'BREATHWORK' as const, breathworkId: 'breath-morning-wake', sortOrder: 2 },
    { id: 'pl-item-morning-3', playlistId: 'playlist-morning-calm', contentType: 'MEDITATION' as const, meditationId: 'med-mindfulness-present', sortOrder: 3 },

    // Stress Relief playlist
    { id: 'pl-item-stress-1', playlistId: 'playlist-stress-relief', contentType: 'BREATHWORK' as const, breathworkId: 'breath-box', sortOrder: 1 },
    { id: 'pl-item-stress-2', playlistId: 'playlist-stress-relief', contentType: 'MEDITATION' as const, meditationId: 'med-stress-relief-5min', sortOrder: 2 },
    { id: 'pl-item-stress-3', playlistId: 'playlist-stress-relief', contentType: 'BREATHWORK' as const, breathworkId: 'breath-anxiety-relief', sortOrder: 3 },

    // Better Sleep playlist
    { id: 'pl-item-sleep-1', playlistId: 'playlist-better-sleep', contentType: 'MEDITATION' as const, meditationId: 'med-sleep-relaxation', sortOrder: 1 },
    { id: 'pl-item-sleep-2', playlistId: 'playlist-better-sleep', contentType: 'SLEEP_STORY' as const, sleepStoryId: 'sleep-story-forest', sortOrder: 2 },
    { id: 'pl-item-sleep-3', playlistId: 'playlist-better-sleep', contentType: 'SLEEP_STORY' as const, sleepStoryId: 'sleep-story-rain', sortOrder: 3 },

    // Focus playlist
    { id: 'pl-item-focus-1', playlistId: 'playlist-focus', contentType: 'MEDITATION' as const, meditationId: 'med-mindfulness-present', sortOrder: 1 },
    { id: 'pl-item-focus-2', playlistId: 'playlist-focus', contentType: 'BREATHWORK' as const, breathworkId: 'breath-box', sortOrder: 2 },

    // Breathwork Basics playlist
    { id: 'pl-item-breath-1', playlistId: 'playlist-breathwork-basics', contentType: 'BREATHWORK' as const, breathworkId: 'breath-box', sortOrder: 1 },
    { id: 'pl-item-breath-2', playlistId: 'playlist-breathwork-basics', contentType: 'BREATHWORK' as const, breathworkId: 'breath-478', sortOrder: 2 },
    { id: 'pl-item-breath-3', playlistId: 'playlist-breathwork-basics', contentType: 'BREATHWORK' as const, breathworkId: 'breath-relaxing', sortOrder: 3 },
    { id: 'pl-item-breath-4', playlistId: 'playlist-breathwork-basics', contentType: 'BREATHWORK' as const, breathworkId: 'breath-quick-calm', sortOrder: 4 },

    // Nature Sounds playlist
    { id: 'pl-item-nature-1', playlistId: 'playlist-nature-sounds', contentType: 'SOUNDSCAPE' as const, soundscapeId: 'sound-rain-soft', sortOrder: 1 },
    { id: 'pl-item-nature-2', playlistId: 'playlist-nature-sounds', contentType: 'SOUNDSCAPE' as const, soundscapeId: 'sound-ocean-waves', sortOrder: 2 },
    { id: 'pl-item-nature-3', playlistId: 'playlist-nature-sounds', contentType: 'SOUNDSCAPE' as const, soundscapeId: 'sound-forest', sortOrder: 3 },
    { id: 'pl-item-nature-4', playlistId: 'playlist-nature-sounds', contentType: 'SOUNDSCAPE' as const, soundscapeId: 'sound-birds', sortOrder: 4 },
  ];

  for (const item of playlistItemsData) {
    await prisma.playlist_items.upsert({
      where: { id: item.id },
      update: item,
      create: item as any,
    });
  }
  console.log('📋 Playlist items ensured');

  // Update playlist item counts
  await prisma.playlists.update({ where: { id: 'playlist-morning-calm' }, data: { itemCount: 3, totalDuration: 1044 } });
  await prisma.playlists.update({ where: { id: 'playlist-stress-relief' }, data: { itemCount: 3, totalDuration: 716 } });
  await prisma.playlists.update({ where: { id: 'playlist-better-sleep' }, data: { itemCount: 3, totalDuration: 5400 } });
  await prisma.playlists.update({ where: { id: 'playlist-focus' }, data: { itemCount: 2, totalDuration: 736 } });
  await prisma.playlists.update({ where: { id: 'playlist-breathwork-basics' }, data: { itemCount: 4, totalDuration: 902 } });
  await prisma.playlists.update({ where: { id: 'playlist-nature-sounds' }, data: { itemCount: 4, totalDuration: 0 } });

  // ============================================
  // MEDITATION PROGRESS
  // ============================================
  await prisma.meditation_progress.upsert({
    where: { meditationId_userId: { meditationId: 'med-sleep-relaxation', userId: student.id } },
    update: {},
    create: {
      meditationId: 'med-sleep-relaxation',
      userId: student.id,
      currentTime: 540,
      duration: 900,
      percentage: 60,
      completed: false,
      playCount: 3,
      totalListened: 1800,
    },
  });

  await prisma.meditation_progress.upsert({
    where: { meditationId_userId: { meditationId: 'med-morning-energy', userId: student.id } },
    update: {},
    create: {
      meditationId: 'med-morning-energy',
      userId: student.id,
      currentTime: 420,
      duration: 420,
      percentage: 100,
      completed: true,
      playCount: 5,
      totalListened: 2100,
      completedAt: new Date(),
    },
  });
  console.log('📈 Meditation progress ensured');

  // ============================================
  // BREATHWORK PROGRESS
  // ============================================
  await prisma.breathwork_progress.upsert({
    where: { breathworkId_userId: { breathworkId: 'breath-box', userId: student.id } },
    update: {},
    create: {
      breathworkId: 'breath-box',
      userId: student.id,
      totalSessions: 8,
      totalCycles: 32,
      totalSeconds: 2048,
    },
  });
  console.log('🌬️ Breathwork progress ensured');

  // ============================================
  // SLEEP TIMER SETTINGS
  // ============================================
  await prisma.sleep_timer_settings.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      defaultDuration: 1800,
      fadeOutEnabled: true,
      fadeOutDuration: 60,
      defaultSoundId: 'sound-rain-soft',
      defaultVolume: 40,
      autoPlayNextStory: false,
      bedtimeReminder: true,
      bedtimeReminderTime: '22:30',
    },
  });
  console.log('😴 Sleep timer settings ensured');

  // ============================================
  // SLEEP TRACKING (Son 3 gün)
  // ============================================
  for (let i = 0; i < 3; i++) {
    const sleepDate = new Date(today);
    sleepDate.setDate(sleepDate.getDate() - i);

    const bedTime = new Date(sleepDate);
    bedTime.setHours(23, 30, 0, 0);

    const wakeTime = new Date(sleepDate);
    wakeTime.setDate(wakeTime.getDate() + 1);
    wakeTime.setHours(7, 0, 0, 0);

    await prisma.sleep_tracking.upsert({
      where: { userId_date: { userId: student.id, date: sleepDate } },
      update: {},
      create: {
        userId: student.id,
        date: sleepDate,
        bedTime: bedTime,
        wakeTime: wakeTime,
        totalMinutes: 450,
        quality: 4,
        fellAsleepWith: 'story',
        contentId: 'sleep-story-rain',
        tags: ['derin uyku'],
      },
    });
  }
  console.log('🛏️ Sleep tracking ensured');

  // ============================================
  // SLEEP STORY PROGRESS
  // ============================================
  await prisma.sleep_story_progress.upsert({
    where: { storyId_userId: { storyId: 'sleep-story-forest', userId: student.id } },
    update: {},
    create: {
      storyId: 'sleep-story-forest',
      userId: student.id,
      currentTime: 1200,
      duration: 1800,
      completed: false,
      playCount: 2,
    },
  });

  await prisma.sleep_story_progress.upsert({
    where: { storyId_userId: { storyId: 'sleep-story-rain', userId: student.id } },
    update: {},
    create: {
      storyId: 'sleep-story-rain',
      userId: student.id,
      currentTime: 2700,
      duration: 2700,
      completed: true,
      playCount: 3,
      completedAt: new Date(),
    },
  });
  console.log('📖 Sleep story progress ensured');

  // ============================================
  // SOUNDSCAPE FAVORITES
  // ============================================
  await prisma.soundscape_favorites.upsert({
    where: { soundscapeId_userId: { soundscapeId: 'sound-rain-soft', userId: student.id } },
    update: {},
    create: { soundscapeId: 'sound-rain-soft', userId: student.id },
  });

  await prisma.soundscape_favorites.upsert({
    where: { soundscapeId_userId: { soundscapeId: 'sound-ocean-waves', userId: student.id } },
    update: {},
    create: { soundscapeId: 'sound-ocean-waves', userId: student.id },
  });
  console.log('🔊 Soundscape favorites ensured');

  // ============================================
  // USER SOUND MIX
  // ============================================
  const userMix = await prisma.user_sound_mixes.upsert({
    where: { id: `mix-${student.id}-rainy-forest` },
    update: {},
    create: {
      id: `mix-${student.id}-rainy-forest`,
      userId: student.id,
      name: 'Yağmurlu Orman',
      description: 'Yağmur ve orman seslerinin karışımı',
      isPublic: false,
      playCount: 12,
    },
  });

  await prisma.sound_mix_items.upsert({
    where: { mixId_soundscapeId: { mixId: userMix.id, soundscapeId: 'sound-rain-soft' } },
    update: {},
    create: { mixId: userMix.id, soundscapeId: 'sound-rain-soft', volume: 60 },
  });

  await prisma.sound_mix_items.upsert({
    where: { mixId_soundscapeId: { mixId: userMix.id, soundscapeId: 'sound-forest' } },
    update: {},
    create: { mixId: userMix.id, soundscapeId: 'sound-forest', volume: 40 },
  });
  console.log('🎵 User sound mix ensured');

  // ============================================
  // JOURNAL ENTRY
  // ============================================
  await prisma.journal_entries.upsert({
    where: { id: `journal-${student.id}-sample` },
    update: {},
    create: {
      id: `journal-${student.id}-sample`,
      userId: student.id,
      title: 'Bugünkü Pratik Notları',
      content: 'Sabah meditasyonu çok iyi geçti. Zihin daha sakin, nefes daha derin. Akşam da bir uyku meditasyonu deneyeceğim.',
      type: 'PRACTICE_NOTES',
      mood: 'GOOD',
      tags: ['meditasyon', 'sabah'],
      wordCount: 25,
      isPrivate: true,
      isFavorite: false,
      date: today,
    },
  });
  console.log('📓 Journal entry ensured');

  // ============================================
  // MEDITATION RATING
  // ============================================
  await prisma.meditation_ratings.upsert({
    where: { meditationId_userId: { meditationId: 'med-morning-energy', userId: student.id } },
    update: {},
    create: {
      meditationId: 'med-morning-energy',
      userId: student.id,
      rating: 5,
      review: 'Güne harika bir başlangıç yapıyorum, çok sevdim!',
    },
  });
  console.log('⭐ Meditation rating ensured');

  // ============================================
  // GOAL PROGRESS
  // ============================================
  const studentGoals = await prisma.user_goals.findMany({
    where: { userId: student.id },
    take: 1,
  });

  if (studentGoals.length > 0) {
    const goalId = studentGoals[0]!.id;
    for (let i = 0; i < 5; i++) {
      const progressDate = new Date(today);
      progressDate.setDate(progressDate.getDate() - i);

      await prisma.goal_progress.create({
        data: {
          goalId: goalId,
          value: 1,
          date: progressDate,
          source: i % 2 === 0 ? 'meditation' : 'breathwork',
          sourceId: i % 2 === 0 ? 'med-morning-energy' : 'breath-box',
        },
      });
    }
    console.log('📊 Goal progress ensured');
  }

  // ============================================
  // USER WELLNESS STATS
  // ============================================
  await prisma.user_wellness_stats.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      totalMeditationMinutes: 450,
      totalMeditationCount: 28,
      totalBreathworkMinutes: 120,
      totalBreathworkCount: 15,
      totalSleepStoryCount: 5,
      totalJournalEntries: 14,
      totalMoodEntries: 21,
      currentStreak: 5,
      longestStreak: 12,
      lastActivityDate: new Date(),
    },
  });
  console.log('📊 User wellness stats ensured');

  // ============================================
  // SLEEP TIMER SETTINGS
  // ============================================
  await prisma.sleep_timer_settings.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      defaultDuration: 1800,
      fadeOutEnabled: true,
      fadeOutDuration: 60,
      defaultSoundId: 'sound-rain-soft',
      defaultVolume: 40,
    },
  });
  console.log('😴 Sleep timer settings ensured');

  // ============================================
  // SOUNDSCAPE FAVORITES
  // ============================================
  await prisma.soundscape_favorites.createMany({
    data: [
      { soundscapeId: 'sound-rain-soft', userId: student.id },
      { soundscapeId: 'sound-ocean-waves', userId: student.id },
    ],
    skipDuplicates: true,
  });
  console.log('🔊 Soundscape favorites ensured');

  // ============================================
  // MEDITATION PROGRESS
  // ============================================
  await prisma.meditation_progress.upsert({
    where: { meditationId_userId: { meditationId: 'med-morning-energy', userId: student.id } },
    update: {},
    create: {
      meditationId: 'med-morning-energy',
      userId: student.id,
      currentTime: 420,
      duration: 420,
      percentage: 100,
      completed: true,
      playCount: 5,
      completedAt: new Date(),
    },
  });
  console.log('📈 Meditation progress ensured');

  // ============================================
  // BREATHWORK PROGRESS
  // ============================================
  await prisma.breathwork_progress.upsert({
    where: { breathworkId_userId: { breathworkId: 'breath-box', userId: student.id } },
    update: {},
    create: {
      breathworkId: 'breath-box',
      userId: student.id,
      totalSessions: 8,
      totalCycles: 32,
      totalSeconds: 2048,
    },
  });
  console.log('🌬️ Breathwork progress ensured');

  // ============================================
  // ADDITIONAL GOAL TEMPLATES
  // ============================================
  const additionalGoalTemplates = [
    { type: 'PRACTICE_DAYS' as const, title: 'Günlük Pratik', description: 'Her gün pratik yap', targetValue: 1, unit: 'gün', period: 'DAILY' as const, icon: '🧘', sortOrder: 11, isActive: true },
    { type: 'MEDITATION_COUNT' as const, title: 'Haftalık Meditasyon', description: 'Haftada 5 gün meditasyon', targetValue: 5, unit: 'seans', period: 'WEEKLY' as const, icon: '🧠', sortOrder: 12, isActive: true },
    { type: 'BREATHWORK_COUNT' as const, title: 'Nefes Egzersizi', description: 'Günde 10 dakika nefes egzersizi', targetValue: 10, unit: 'dakika', period: 'DAILY' as const, icon: '💨', sortOrder: 13, isActive: true },
    { type: 'SLEEP_TRACKING' as const, title: 'Uyku Kalitesi', description: 'Haftada 5 gece uyku takibi', targetValue: 5, unit: 'gece', period: 'WEEKLY' as const, icon: '😴', sortOrder: 14, isActive: true },
    { type: 'MOOD_LOG' as const, title: 'Farkındalık', description: 'Günde 3 farkındalık anı', targetValue: 3, unit: 'an', period: 'DAILY' as const, icon: '🎯', sortOrder: 15, isActive: true },
  ];

  for (const template of additionalGoalTemplates) {
    await prisma.goal_templates.upsert({
      where: { id: `goal-template-${template.type.toLowerCase()}` },
      update: {},
      create: {
        id: `goal-template-${template.type.toLowerCase()}`,
        ...template,
      },
    });
  }
  console.log('🎯 Additional goal templates ensured');

  // ============================================
  // ADDITIONAL REMINDER TEMPLATES
  // ============================================
  const additionalReminderTemplates = [
    { type: 'MORNING', title: 'Sabah Hatırlatıcısı', message: 'Güne meditasyonla başla!', time: '07:00', icon: '🌅', sortOrder: 1, isActive: true },
    { type: 'EVENING', title: 'Akşam Hatırlatıcısı', message: 'Günü değerlendir, yarına hazırlan.', time: '21:00', icon: '🌙', sortOrder: 2, isActive: true },
    { type: 'PRACTICE', title: 'Pratik Zamanı', message: 'Yoga pratiği zamanı geldi!', time: '18:00', icon: '🧘', sortOrder: 3, isActive: true },
    { type: 'MOOD', title: 'Mood Kaydı', message: 'Bugün nasıl hissediyorsun?', time: '12:00', icon: '😊', sortOrder: 4, isActive: true },
    { type: 'JOURNAL', title: 'Günlük Yazımı', message: 'Günlüğüne yazmayı unutma!', time: '22:00', icon: '📝', sortOrder: 5, isActive: true },
    { type: 'HYDRATION', title: 'Su İç', message: 'Su içmeyi unutma!', time: '10:00', icon: '💧', sortOrder: 6, isActive: true },
    { type: 'BREAK', title: 'Mola Ver', message: 'Biraz mola ver, nefes al.', time: '15:00', icon: '☕', sortOrder: 7, isActive: true },
    { type: 'BEDTIME', title: 'Yatma Vakti', message: 'Yatma vakti yaklaşıyor.', time: '23:00', icon: '😴', sortOrder: 8, isActive: true },
  ];

  for (const template of additionalReminderTemplates) {
    await prisma.reminder_templates.upsert({
      where: { id: `reminder-template-${template.type.toLowerCase()}` },
      update: {},
      create: {
        id: `reminder-template-${template.type.toLowerCase()}`,
        ...template,
      },
    });
  }
  console.log('⏰ Additional reminder templates ensured');

  // ============================================
  // ADDITIONAL MOOD TAGS
  // ============================================
  const additionalMoodTags = [
    { name: 'Mutlu', nameEn: 'Happy', category: 'HEALTH' as const, icon: '😊', color: '#22C55E', isActive: true },
    { name: 'Huzurlu', nameEn: 'Peaceful', category: 'HEALTH' as const, icon: '😌', color: '#06B6D4', isActive: true },
    { name: 'Enerjik', nameEn: 'Energetic', category: 'HEALTH' as const, icon: '⚡', color: '#F59E0B', isActive: true },
    { name: 'Yorgun', nameEn: 'Tired', category: 'HEALTH' as const, icon: '😴', color: '#6366F1', isActive: true },
    { name: 'Stresli', nameEn: 'Stressed', category: 'HEALTH' as const, icon: '😰', color: '#EF4444', isActive: true },
    { name: 'Kaygılı', nameEn: 'Anxious', category: 'HEALTH' as const, icon: '😟', color: '#F97316', isActive: true },
    { name: 'Yoga', nameEn: 'Yoga', category: 'ACTIVITY' as const, icon: '🧘', color: '#8B5CF6', isActive: true },
    { name: 'Meditasyon', nameEn: 'Meditation', category: 'ACTIVITY' as const, icon: '🧠', color: '#EC4899', isActive: true },
    { name: 'Egzersiz', nameEn: 'Exercise', category: 'ACTIVITY' as const, icon: '🏃', color: '#10B981', isActive: true },
    { name: 'Ev', nameEn: 'Home', category: 'OTHER' as const, icon: '🏠', color: '#14B8A6', isActive: true },
    { name: 'İş', nameEn: 'Work', category: 'OTHER' as const, icon: '💼', color: '#64748B', isActive: true },
    { name: 'Güneşli', nameEn: 'Sunny', category: 'WEATHER' as const, icon: '☀️', color: '#FBBF24', isActive: true },
    { name: 'Yağmurlu', nameEn: 'Rainy', category: 'WEATHER' as const, icon: '🌧️', color: '#3B82F6', isActive: true },
    { name: 'Aile', nameEn: 'Family', category: 'SOCIAL' as const, icon: '👨‍👩‍👧', color: '#F472B6', isActive: true },
    { name: 'Yalnız', nameEn: 'Alone', category: 'SOCIAL' as const, icon: '🧑', color: '#A78BFA', isActive: true },
  ];

  for (const tag of additionalMoodTags) {
    await prisma.mood_tags.upsert({
      where: { id: `mood-tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `mood-tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...tag,
      },
    });
  }
  console.log('🏷️ Additional mood tags ensured');

  // ============================================
  // USER ONBOARDING (sample completed)
  // ============================================
  await prisma.user_onboarding.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      currentStep: 5,
      isCompleted: true,
      experienceLevel: 'SOME',
      goals: ['STRESS_RELIEF', 'BETTER_SLEEP', 'FOCUS'],
      interests: ['MEDITATION', 'BREATHWORK', 'SLEEP'],
      preferredDuration: 15,
      preferredTime: 'MORNING',
      completedAt: new Date(),
    },
  });
  console.log('🎓 User onboarding ensured');

  console.log('✅ All seed data created successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
