// Test kullanıcıları
export const testUsers = {
  regular: {
    email: 'test@example.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User'
  },
  premium: {
    email: 'premium@example.com',
    password: 'Premium123!@#',
    firstName: 'Premium',
    lastName: 'User'
  },
  teacher: {
    email: 'teacher@example.com',
    password: 'Teacher123!@#',
    firstName: 'Teacher',
    lastName: 'Yoga'
  },
  admin: {
    email: 'admin@example.com',
    password: 'Admin123!@#',
    firstName: 'Admin',
    lastName: 'User'
  }
};

// Test kartları (Stripe test kartları)
export const testCards = {
  valid: {
    number: '4242424242424242',
    expMonth: '12',
    expYear: '2030',
    cvc: '123'
  },
  declined: {
    number: '4000000000000002',
    expMonth: '12',
    expYear: '2030',
    cvc: '123'
  },
  insufficientFunds: {
    number: '4000000000009995',
    expMonth: '12',
    expYear: '2030',
    cvc: '123'
  },
  requires3DS: {
    number: '4000002500003155',
    expMonth: '12',
    expYear: '2030',
    cvc: '123'
  }
};

// Test sınıfları
export const testClasses = {
  beginner: {
    title: 'Başlangıç Yoga',
    description: 'Yeni başlayanlar için temel yoga dersi',
    level: 'BEGINNER',
    duration: 30,
    category: 'YOGA'
  },
  intermediate: {
    title: 'Orta Seviye Vinyasa',
    description: 'Orta seviye vinyasa akış dersi',
    level: 'INTERMEDIATE',
    duration: 45,
    category: 'YOGA'
  },
  advanced: {
    title: 'İleri Ashtanga',
    description: 'Deneyimli yogiler için ashtanga serisi',
    level: 'ADVANCED',
    duration: 60,
    category: 'YOGA'
  }
};

// Test programları
export const testPrograms = {
  thirtyDayChallenge: {
    title: '30 Günlük Yoga Challenge',
    description: 'Her gün yoga yaparak dönüşümünüzü başlatın',
    duration: 30,
    level: 'BEGINNER'
  },
  stressRelief: {
    title: 'Stres Azaltma Programı',
    description: 'Günlük stresi azaltmak için özel program',
    duration: 14,
    level: 'ALL'
  }
};

// API endpoints
export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password'
  },
  users: {
    me: '/api/users/me',
    profile: '/api/users/profile',
    preferences: '/api/users/preferences'
  },
  classes: {
    list: '/api/classes',
    detail: (id: string) => `/api/classes/${id}`,
    book: (id: string) => `/api/classes/${id}/book`
  },
  programs: {
    list: '/api/programs',
    detail: (id: string) => `/api/programs/${id}`,
    enroll: (id: string) => `/api/programs/${id}/enroll`
  },
  payments: {
    createIntent: '/api/payments/create-intent',
    confirm: '/api/payments/confirm',
    history: '/api/payments/history'
  },
  bookings: {
    list: '/api/bookings',
    cancel: (id: string) => `/api/bookings/${id}`
  }
};
