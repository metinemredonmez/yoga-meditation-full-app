// Test fixtures for classes and programs

export const testClasses = {
  beginnerYoga: {
    id: 'test-class-001',
    title: 'Beginner Yoga Flow',
    description: 'A gentle introduction to yoga for beginners',
    schedule: new Date('2024-06-01T10:00:00Z'),
    instructorId: 'test-teacher-001',
    coInstructorIds: [],
    duration: 30,
    level: 'BEGINNER',
    category: 'YOGA',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    videoUrl: 'https://example.com/video.mp4',
    isPublished: true,
    isPremium: false,
    viewCount: 100,
    averageRating: 4.5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  advancedYoga: {
    id: 'test-class-002',
    title: 'Advanced Power Yoga',
    description: 'Challenging yoga for experienced practitioners',
    schedule: new Date('2024-06-01T14:00:00Z'),
    instructorId: 'test-teacher-001',
    coInstructorIds: [],
    duration: 60,
    level: 'ADVANCED',
    category: 'YOGA',
    thumbnailUrl: 'https://example.com/thumbnail2.jpg',
    videoUrl: 'https://example.com/video2.mp4',
    isPublished: true,
    isPremium: true,
    viewCount: 50,
    averageRating: 4.8,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  unpublishedClass: {
    id: 'test-class-003',
    title: 'Draft Class',
    description: 'This class is not published yet',
    schedule: new Date('2024-07-01T10:00:00Z'),
    instructorId: 'test-teacher-001',
    coInstructorIds: [],
    duration: 45,
    level: 'INTERMEDIATE',
    category: 'MEDITATION',
    thumbnailUrl: null,
    videoUrl: null,
    isPublished: false,
    isPremium: false,
    viewCount: 0,
    averageRating: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
};

export const testPrograms = {
  beginnerProgram: {
    id: 'test-program-001',
    title: '30-Day Yoga Challenge',
    description: 'Transform your practice in 30 days',
    level: 'BEGINNER',
    durationWeeks: 4,
    thumbnailUrl: 'https://example.com/program.jpg',
    instructorId: 'test-teacher-001',
    isPublished: true,
    isPremium: false,
    enrollmentCount: 500,
    averageRating: 4.7,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  premiumProgram: {
    id: 'test-program-002',
    title: 'Master Yoga Series',
    description: 'Comprehensive yoga mastery program',
    level: 'ADVANCED',
    durationWeeks: 12,
    thumbnailUrl: 'https://example.com/program2.jpg',
    instructorId: 'test-teacher-001',
    isPublished: true,
    isPremium: true,
    enrollmentCount: 200,
    averageRating: 4.9,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
};

export const createTestClass = (overrides: Partial<typeof testClasses.beginnerYoga> = {}) => ({
  ...testClasses.beginnerYoga,
  id: `test-class-${Date.now()}`,
  ...overrides
});

export const createTestProgram = (overrides: Partial<typeof testPrograms.beginnerProgram> = {}) => ({
  ...testPrograms.beginnerProgram,
  id: `test-program-${Date.now()}`,
  ...overrides
});
