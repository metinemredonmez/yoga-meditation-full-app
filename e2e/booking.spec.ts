import { test, expect } from '@playwright/test';
import { testUsers, testClasses } from './fixtures/test-data';

test.describe('Class Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Her testten önce login ol
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUsers.regular.email);
    await page.fill('[data-testid="password-input"]', testUsers.regular.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('Browse Classes', () => {
    test('should display class list', async ({ page }) => {
      await page.goto('/classes');

      // Sınıf listesi görünmeli
      await expect(page.locator('[data-testid="class-list"]')).toBeVisible();

      // En az bir sınıf olmalı
      const classCards = page.locator('[data-testid="class-card"]');
      await expect(classCards.first()).toBeVisible();
    });

    test('should filter classes by level', async ({ page }) => {
      await page.goto('/classes');

      // Başlangıç seviyesi filtrele
      await page.click('[data-testid="filter-level"]');
      await page.click('[data-testid="level-BEGINNER"]');

      // Sonuçlar başlangıç seviyesi olmalı
      const levelBadges = page.locator('[data-testid="class-level"]');
      const count = await levelBadges.count();

      for (let i = 0; i < count; i++) {
        await expect(levelBadges.nth(i)).toContainText(/beginner|başlangıç/i);
      }
    });

    test('should filter classes by category', async ({ page }) => {
      await page.goto('/classes');

      await page.click('[data-testid="filter-category"]');
      await page.click('[data-testid="category-YOGA"]');

      // Sonuçlar yoga kategorisinde olmalı
      await expect(page.locator('[data-testid="class-card"]').first()).toBeVisible();
    });

    test('should search classes', async ({ page }) => {
      await page.goto('/classes');

      await page.fill('[data-testid="search-input"]', 'yoga');
      await page.press('[data-testid="search-input"]', 'Enter');

      // Arama sonuçları görünmeli
      await expect(page.locator('[data-testid="class-list"]')).toBeVisible();
    });
  });

  test.describe('Class Details', () => {
    test('should display class details', async ({ page }) => {
      await page.goto('/classes');

      // İlk sınıfa tıkla
      await page.click('[data-testid="class-card"]:first-child');

      // Detay sayfası görünmeli
      await expect(page.locator('[data-testid="class-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="class-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="class-instructor"]')).toBeVisible();
      await expect(page.locator('[data-testid="class-duration"]')).toBeVisible();
    });

    test('should show booking button for authenticated user', async ({ page }) => {
      await page.goto('/classes');
      await page.click('[data-testid="class-card"]:first-child');

      // Rezervasyon butonu görünmeli
      await expect(page.locator('[data-testid="book-button"]')).toBeVisible();
    });
  });

  test.describe('Booking Process', () => {
    test('should complete booking successfully', async ({ page }) => {
      await page.goto('/classes');
      await page.click('[data-testid="class-card"]:first-child');

      // Rezervasyon yap
      await page.click('[data-testid="book-button"]');

      // Tarih seç
      await page.click('[data-testid="date-picker"]');
      await page.click('[data-testid="available-date"]:first-child');

      // Saat seç
      await page.click('[data-testid="time-slot"]:first-child');

      // Onayla
      await page.click('[data-testid="confirm-booking"]');

      // Başarı mesajı
      await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    });

    test('should show booking in my bookings', async ({ page }) => {
      await page.goto('/bookings');

      // Rezervasyonlar listesi görünmeli
      await expect(page.locator('[data-testid="booking-list"]')).toBeVisible();
    });

    test('should cancel booking', async ({ page }) => {
      await page.goto('/bookings');

      // İlk rezervasyonu iptal et
      await page.click('[data-testid="booking-card"]:first-child [data-testid="cancel-button"]');

      // Onay dialogu
      await page.click('[data-testid="confirm-cancel"]');

      // Başarı mesajı
      await expect(page.locator('[data-testid="cancel-success"]')).toBeVisible();
    });
  });

  test.describe('Calendar View', () => {
    test('should display calendar with bookings', async ({ page }) => {
      await page.goto('/calendar');

      // Takvim görünmeli
      await expect(page.locator('[data-testid="calendar"]')).toBeVisible();

      // Bu ayın günleri görünmeli
      await expect(page.locator('[data-testid="calendar-day"]').first()).toBeVisible();
    });

    test('should navigate between months', async ({ page }) => {
      await page.goto('/calendar');

      const currentMonth = await page.locator('[data-testid="current-month"]').textContent();

      // Sonraki ay
      await page.click('[data-testid="next-month"]');

      const nextMonth = await page.locator('[data-testid="current-month"]').textContent();
      expect(nextMonth).not.toBe(currentMonth);

      // Önceki ay
      await page.click('[data-testid="prev-month"]');
      await page.click('[data-testid="prev-month"]');

      const prevMonth = await page.locator('[data-testid="current-month"]').textContent();
      expect(prevMonth).not.toBe(currentMonth);
    });
  });
});

test.describe('API Booking Endpoints', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: testUsers.regular.email,
        password: testUsers.regular.password
      }
    });
    const data = await response.json();
    authToken = data.accessToken;
  });

  test('should list available classes', async ({ request }) => {
    const response = await request.get('/api/classes', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should get class details', async ({ request }) => {
    // Önce sınıf listesini al
    const listResponse = await request.get('/api/classes', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const listData = await listResponse.json();

    if (listData.data.length > 0) {
      const classId = listData.data[0].id;

      const response = await request.get(`/api/classes/${classId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title');
    }
  });

  test('should list user bookings', async ({ request }) => {
    const response = await request.get('/api/bookings', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data.data || data)).toBeTruthy();
  });
});
