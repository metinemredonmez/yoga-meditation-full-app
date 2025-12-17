import { test, expect } from '@playwright/test';
import { testUsers, endpoints } from './fixtures/test-data';

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[data-testid="email-input"]', testUsers.regular.email);
      await page.fill('[data-testid="password-input"]', testUsers.regular.password);
      await page.click('[data-testid="login-button"]');

      // Dashboard'a yönlendirilmeli
      await expect(page).toHaveURL(/.*dashboard/);

      // Kullanıcı adı görünmeli
      await expect(page.locator('[data-testid="user-name"]')).toContainText(testUsers.regular.firstName);
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[data-testid="email-input"]', testUsers.regular.email);
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');

      // Hata mesajı görünmeli
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/şifre|password|invalid/i);
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // Validation hatası görünmeli
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    });

    test('should redirect to requested page after login', async ({ page }) => {
      // Korunan sayfaya git
      await page.goto('/classes/my-bookings');

      // Login'e yönlendirilmeli
      await expect(page).toHaveURL(/.*login/);

      // Login yap
      await page.fill('[data-testid="email-input"]', testUsers.regular.email);
      await page.fill('[data-testid="password-input"]', testUsers.regular.password);
      await page.click('[data-testid="login-button"]');

      // Orijinal sayfaya dönmeli
      await expect(page).toHaveURL(/.*my-bookings/);
    });
  });

  test.describe('Registration', () => {
    test('should register new user successfully', async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await page.goto('/register');

      await page.fill('[data-testid="firstName-input"]', 'New');
      await page.fill('[data-testid="lastName-input"]', 'User');
      await page.fill('[data-testid="email-input"]', uniqueEmail);
      await page.fill('[data-testid="password-input"]', 'NewUser123!@#');
      await page.fill('[data-testid="confirmPassword-input"]', 'NewUser123!@#');
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="register-button"]');

      // Onay sayfasına yönlendirilmeli
      await expect(page).toHaveURL(/.*verify|welcome|dashboard/);
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="firstName-input"]', 'Existing');
      await page.fill('[data-testid="lastName-input"]', 'User');
      await page.fill('[data-testid="email-input"]', testUsers.regular.email);
      await page.fill('[data-testid="password-input"]', 'Password123!@#');
      await page.fill('[data-testid="confirmPassword-input"]', 'Password123!@#');
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="register-button"]');

      // Hata mesajı görünmeli
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/already|exists|mevcut/i);
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="password-input"]', 'weak');
      await page.fill('[data-testid="confirmPassword-input"]', 'weak');

      // Şifre gereksinimleri hatası
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="password-input"]', 'StrongPass123!');
      await page.fill('[data-testid="confirmPassword-input"]', 'DifferentPass123!');
      await page.click('[data-testid="register-button"]');

      // Şifre eşleşmeme hatası
      await expect(page.locator('[data-testid="confirmPassword-error"]')).toContainText(/match|eşleş/i);
    });
  });

  test.describe('Password Reset', () => {
    test('should send password reset email', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.fill('[data-testid="email-input"]', testUsers.regular.email);
      await page.click('[data-testid="submit-button"]');

      // Başarı mesajı görünmeli
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText(/email|gönderildi|sent/i);
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Önce login ol
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', testUsers.regular.email);
      await page.fill('[data-testid="password-input"]', testUsers.regular.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard');

      // Logout yap
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Login sayfasına yönlendirilmeli
      await expect(page).toHaveURL(/.*login|home/);

      // Korunan sayfaya erişememeli
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*login/);
    });
  });
});

test.describe('API Authentication', () => {
  test('should return JWT tokens on login', async ({ request }) => {
    const response = await request.post(endpoints.auth.login, {
      data: {
        email: testUsers.regular.email,
        password: testUsers.regular.password
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
    expect(data).toHaveProperty('user');
    expect(data.user.email).toBe(testUsers.regular.email);
  });

  test('should refresh token successfully', async ({ request }) => {
    // Önce login ol
    const loginResponse = await request.post(endpoints.auth.login, {
      data: {
        email: testUsers.regular.email,
        password: testUsers.regular.password
      }
    });

    const loginData = await loginResponse.json();

    // Token'ı yenile
    const refreshResponse = await request.post(endpoints.auth.refresh, {
      data: {
        refreshToken: loginData.refreshToken
      }
    });

    expect(refreshResponse.ok()).toBeTruthy();

    const refreshData = await refreshResponse.json();
    expect(refreshData).toHaveProperty('accessToken');
  });

  test('should reject invalid token', async ({ request }) => {
    const response = await request.get(endpoints.users.me, {
      headers: {
        Authorization: 'Bearer invalid-token'
      }
    });

    expect(response.status()).toBe(401);
  });
});
