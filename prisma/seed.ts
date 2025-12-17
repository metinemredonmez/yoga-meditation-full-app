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
      description: 'Basic access to fitness content',
      tier: 'FREE' as const,
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'TRY',
      features: ['Access to 5 free classes', 'Basic pose library', '3 free meditations'],
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'plan-basic',
      name: 'Basic',
      description: 'Full access to all content',
      tier: 'BASIC' as const,
      priceMonthly: 99.99,
      priceYearly: 959.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_basic_monthly',
      features: ['Unlimited classes', 'All meditations', 'All breathwork', 'Sleep stories'],
      trialDays: 7,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'plan-premium',
      name: 'Premium',
      description: 'Premium experience with exclusive content',
      tier: 'PREMIUM' as const,
      priceMonthly: 199.99,
      priceYearly: 1799.88,
      currency: 'TRY',
      stripePriceIdMonthly: 'price_premium_monthly',
      features: ['Everything in Basic', 'Offline downloads', 'AI wellness coach', 'Custom sound mixes'],
      trialDays: 7,
      offlineDownloads: true,
      maxDevices: 3,
      isActive: true,
      sortOrder: 3,
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
  // JOURNAL PROMPTS
  // ============================================
  const journalPrompts = [
    { id: 'prompt-gratitude-1', type: 'GRATITUDE' as const, prompt: 'Bugün için minnettar olduğun 3 şey nedir?', category: 'daily', isActive: true },
    { id: 'prompt-reflection-1', type: 'REFLECTION' as const, prompt: 'Bugün kendini nasıl hissettin?', category: 'daily', isActive: true },
    { id: 'prompt-practice-1', type: 'PRACTICE_NOTES' as const, prompt: 'Bugünkü pratiğinde ne hissettin?', category: 'daily', isActive: true },
    { id: 'prompt-free-1', type: 'FREE_WRITE' as const, prompt: 'Şu an aklında ne var?', category: 'daily', isActive: true },
  ];

  for (const prompt of journalPrompts) {
    await prisma.journal_prompts.upsert({
      where: { id: prompt.id },
      update: prompt,
      create: prompt,
    });
  }
  console.log('📝 Journal prompts ensured');

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
