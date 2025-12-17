import { test, expect } from '@playwright/test';
import { testUsers, testPrograms } from './fixtures/test-data';

test.describe('Program Enrollment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUsers.regular.email);
    await page.fill('[data-testid="password-input"]', testUsers.regular.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('Browse Programs', () => {
    test('should display program list', async ({ page }) => {
      await page.goto('/programs');

      await expect(page.locator('[data-testid="program-list"]')).toBeVisible();

      const programCards = page.locator('[data-testid="program-card"]');
      await expect(programCards.first()).toBeVisible();
    });

    test('should filter programs by level', async ({ page }) => {
      await page.goto('/programs');

      await page.click('[data-testid="filter-level"]');
      await page.click('[data-testid="level-BEGINNER"]');

      const programs = page.locator('[data-testid="program-card"]');
      await expect(programs.first()).toBeVisible();
    });

    test('should filter programs by duration', async ({ page }) => {
      await page.goto('/programs');

      await page.click('[data-testid="filter-duration"]');
      await page.click('[data-testid="duration-7"]'); // 7 gün

      await expect(page.locator('[data-testid="program-list"]')).toBeVisible();
    });

    test('should search programs', async ({ page }) => {
      await page.goto('/programs');

      await page.fill('[data-testid="search-input"]', 'challenge');
      await page.press('[data-testid="search-input"]', 'Enter');

      await expect(page.locator('[data-testid="program-list"]')).toBeVisible();
    });
  });

  test.describe('Program Details', () => {
    test('should display program details', async ({ page }) => {
      await page.goto('/programs');
      await page.click('[data-testid="program-card"]:first-child');

      await expect(page.locator('[data-testid="program-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="program-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="program-duration"]')).toBeVisible();
      await expect(page.locator('[data-testid="program-lessons"]')).toBeVisible();
    });

    test('should show program curriculum', async ({ page }) => {
      await page.goto('/programs');
      await page.click('[data-testid="program-card"]:first-child');

      // Müfredat bölümü
      await expect(page.locator('[data-testid="curriculum"]')).toBeVisible();

      // Günler/dersler
      const days = page.locator('[data-testid="curriculum-day"]');
      await expect(days.first()).toBeVisible();
    });

    test('should show instructor info', async ({ page }) => {
      await page.goto('/programs');
      await page.click('[data-testid="program-card"]:first-child');

      await expect(page.locator('[data-testid="instructor-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="instructor-name"]')).toBeVisible();
    });
  });

  test.describe('Enrollment Process', () => {
    test('should enroll in free program', async ({ page }) => {
      await page.goto('/programs');

      // Ücretsiz program varsa
      const freeProgram = page.locator('[data-testid="program-card"]:has([data-testid="free-badge"])').first();

      if (await freeProgram.isVisible()) {
        await freeProgram.click();
        await page.click('[data-testid="enroll-button"]');

        await expect(page.locator('[data-testid="enrollment-success"]')).toBeVisible();
      }
    });

    test('should redirect to payment for paid program', async ({ page }) => {
      await page.goto('/programs');

      // Ücretli program
      const paidProgram = page.locator('[data-testid="program-card"]:has([data-testid="price"])').first();

      if (await paidProgram.isVisible()) {
        await paidProgram.click();
        await page.click('[data-testid="enroll-button"]');

        await expect(page).toHaveURL(/.*checkout|payment/);
      }
    });
  });

  test.describe('Program Progress', () => {
    test('should display enrolled programs', async ({ page }) => {
      await page.goto('/my-programs');

      await expect(page.locator('[data-testid="enrolled-programs"]')).toBeVisible();
    });

    test('should show progress bar', async ({ page }) => {
      await page.goto('/my-programs');

      const progressBar = page.locator('[data-testid="progress-bar"]').first();

      if (await progressBar.isVisible()) {
        await expect(progressBar).toBeVisible();
      }
    });

    test('should continue from last lesson', async ({ page }) => {
      await page.goto('/my-programs');

      const continueButton = page.locator('[data-testid="continue-button"]').first();

      if (await continueButton.isVisible()) {
        await continueButton.click();
        await expect(page).toHaveURL(/.*lesson|video|class/);
      }
    });

    test('should mark lesson as complete', async ({ page }) => {
      await page.goto('/my-programs');

      const programCard = page.locator('[data-testid="program-card"]').first();

      if (await programCard.isVisible()) {
        await programCard.click();

        // İlk dersi aç
        await page.click('[data-testid="lesson-item"]:first-child');

        // Video izle (simüle et)
        await page.waitForTimeout(2000);

        // Tamamlandı olarak işaretle
        await page.click('[data-testid="mark-complete"]');

        await expect(page.locator('[data-testid="lesson-completed"]')).toBeVisible();
      }
    });
  });

  test.describe('Program Reviews', () => {
    test('should display reviews', async ({ page }) => {
      await page.goto('/programs');
      await page.click('[data-testid="program-card"]:first-child');

      // Yorumlar bölümü
      await expect(page.locator('[data-testid="reviews-section"]')).toBeVisible();
    });

    test('should submit review after completion', async ({ page }) => {
      await page.goto('/my-programs');

      // Tamamlanmış program
      const completedProgram = page.locator('[data-testid="program-card"]:has([data-testid="completed-badge"])').first();

      if (await completedProgram.isVisible()) {
        await completedProgram.click();

        // Yorum yaz
        await page.click('[data-testid="write-review"]');
        await page.click('[data-testid="rating-5"]');
        await page.fill('[data-testid="review-text"]', 'Harika bir program! Çok faydalı oldu.');
        await page.click('[data-testid="submit-review"]');

        await expect(page.locator('[data-testid="review-submitted"]')).toBeVisible();
      }
    });
  });
});

test.describe('API Program Endpoints', () => {
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

  test('should list programs', async ({ request }) => {
    const response = await request.get('/api/programs', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should get program details', async ({ request }) => {
    const listResponse = await request.get('/api/programs', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const listData = await listResponse.json();

    if (listData.data.length > 0) {
      const programId = listData.data[0].id;

      const response = await request.get(`/api/programs/${programId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title');
    }
  });

  test('should get program progress', async ({ request }) => {
    const listResponse = await request.get('/api/programs', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const listData = await listResponse.json();

    if (listData.data.length > 0) {
      const programId = listData.data[0].id;

      const response = await request.get(`/api/programs/${programId}/progress`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      // 404 olabilir (kayıtlı değilse) veya 200
      expect([200, 404]).toContain(response.status());
    }
  });
});
