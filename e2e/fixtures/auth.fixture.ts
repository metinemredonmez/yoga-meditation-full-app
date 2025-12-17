import { test as base, expect } from '@playwright/test';
import { testUsers } from './test-data';

// Authenticated user fixture
interface AuthFixtures {
  authenticatedPage: ReturnType<typeof base['page']>;
  authToken: string;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login işlemi
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUsers.regular.email);
    await page.fill('[data-testid="password-input"]', testUsers.regular.password);
    await page.click('[data-testid="login-button"]');

    // Dashboard'a yönlendirilmeyi bekle
    await page.waitForURL('**/dashboard');

    await use(page);
  },

  authToken: async ({ request }, use) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: testUsers.regular.email,
        password: testUsers.regular.password
      }
    });

    const data = await response.json();
    await use(data.accessToken);
  }
});

export { expect };
