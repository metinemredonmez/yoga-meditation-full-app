import { test, expect } from '@playwright/test';
import { testUsers, testCards } from './fixtures/test-data';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUsers.regular.email);
    await page.fill('[data-testid="password-input"]', testUsers.regular.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('Subscription Purchase', () => {
    test('should display subscription plans', async ({ page }) => {
      await page.goto('/subscription');

      // Plan listesi görünmeli
      await expect(page.locator('[data-testid="plan-list"]')).toBeVisible();

      // En az bir plan olmalı
      const plans = page.locator('[data-testid="plan-card"]');
      await expect(plans.first()).toBeVisible();
    });

    test('should show plan features', async ({ page }) => {
      await page.goto('/subscription');

      // İlk planın özellikleri
      const firstPlan = page.locator('[data-testid="plan-card"]:first-child');
      await expect(firstPlan.locator('[data-testid="plan-name"]')).toBeVisible();
      await expect(firstPlan.locator('[data-testid="plan-price"]')).toBeVisible();
      await expect(firstPlan.locator('[data-testid="plan-features"]')).toBeVisible();
    });

    test('should navigate to checkout', async ({ page }) => {
      await page.goto('/subscription');

      // Premium planı seç
      await page.click('[data-testid="plan-card"]:nth-child(2) [data-testid="select-plan"]');

      // Checkout sayfasına yönlendirilmeli
      await expect(page).toHaveURL(/.*checkout/);
    });

    test('should complete payment with valid card', async ({ page }) => {
      await page.goto('/subscription');
      await page.click('[data-testid="plan-card"]:first-child [data-testid="select-plan"]');

      // Stripe iframe yüklenene kadar bekle
      await page.waitForSelector('iframe[name*="stripe"]');

      // Stripe iframe içinde kart bilgilerini doldur
      const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();

      await stripeFrame.locator('[placeholder*="Card number"]').fill(testCards.valid.number);
      await stripeFrame.locator('[placeholder*="MM / YY"]').fill(`${testCards.valid.expMonth}/${testCards.valid.expYear.slice(-2)}`);
      await stripeFrame.locator('[placeholder*="CVC"]').fill(testCards.valid.cvc);

      // Ödeme yap
      await page.click('[data-testid="pay-button"]');

      // Başarı sayfasına yönlendirilmeli
      await expect(page).toHaveURL(/.*success|confirmation/);
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    });

    test('should show error for declined card', async ({ page }) => {
      await page.goto('/subscription');
      await page.click('[data-testid="plan-card"]:first-child [data-testid="select-plan"]');

      await page.waitForSelector('iframe[name*="stripe"]');
      const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();

      await stripeFrame.locator('[placeholder*="Card number"]').fill(testCards.declined.number);
      await stripeFrame.locator('[placeholder*="MM / YY"]').fill(`${testCards.declined.expMonth}/${testCards.declined.expYear.slice(-2)}`);
      await stripeFrame.locator('[placeholder*="CVC"]').fill(testCards.declined.cvc);

      await page.click('[data-testid="pay-button"]');

      // Hata mesajı görünmeli
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-error"]')).toContainText(/declined|reddedildi/i);
    });
  });

  test.describe('Payment History', () => {
    test('should display payment history', async ({ page }) => {
      await page.goto('/account/payments');

      // Ödeme geçmişi görünmeli
      await expect(page.locator('[data-testid="payment-history"]')).toBeVisible();
    });

    test('should show payment details', async ({ page }) => {
      await page.goto('/account/payments');

      // İlk ödemeye tıkla
      const firstPayment = page.locator('[data-testid="payment-item"]:first-child');

      if (await firstPayment.isVisible()) {
        await firstPayment.click();

        // Detaylar görünmeli
        await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();
        await expect(page.locator('[data-testid="payment-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="payment-status"]')).toBeVisible();
      }
    });

    test('should download invoice', async ({ page }) => {
      await page.goto('/account/payments');

      const downloadButton = page.locator('[data-testid="download-invoice"]:first-child');

      if (await downloadButton.isVisible()) {
        // Download promise
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        const download = await downloadPromise;

        // PDF dosyası olmalı
        expect(download.suggestedFilename()).toContain('.pdf');
      }
    });
  });

  test.describe('Saved Payment Methods', () => {
    test('should display saved cards', async ({ page }) => {
      await page.goto('/account/payment-methods');

      await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
    });

    test('should add new payment method', async ({ page }) => {
      await page.goto('/account/payment-methods');

      await page.click('[data-testid="add-payment-method"]');

      await page.waitForSelector('iframe[name*="stripe"]');
      const stripeFrame = page.frameLocator('iframe[name*="stripe"]').first();

      await stripeFrame.locator('[placeholder*="Card number"]').fill(testCards.valid.number);
      await stripeFrame.locator('[placeholder*="MM / YY"]').fill(`${testCards.valid.expMonth}/${testCards.valid.expYear.slice(-2)}`);
      await stripeFrame.locator('[placeholder*="CVC"]').fill(testCards.valid.cvc);

      await page.click('[data-testid="save-card"]');

      await expect(page.locator('[data-testid="card-saved-success"]')).toBeVisible();
    });

    test('should delete payment method', async ({ page }) => {
      await page.goto('/account/payment-methods');

      const deleteButton = page.locator('[data-testid="delete-card"]:first-child');

      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.click('[data-testid="confirm-delete"]');

        await expect(page.locator('[data-testid="card-deleted-success"]')).toBeVisible();
      }
    });
  });

  test.describe('Subscription Management', () => {
    test('should display current subscription', async ({ page }) => {
      await page.goto('/account/subscription');

      await expect(page.locator('[data-testid="subscription-info"]')).toBeVisible();
    });

    test('should cancel subscription', async ({ page }) => {
      await page.goto('/account/subscription');

      const cancelButton = page.locator('[data-testid="cancel-subscription"]');

      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Sebep seç
        await page.click('[data-testid="cancel-reason"]:first-child');
        await page.click('[data-testid="confirm-cancel"]');

        await expect(page.locator('[data-testid="subscription-cancelled"]')).toBeVisible();
      }
    });

    test('should upgrade subscription', async ({ page }) => {
      await page.goto('/account/subscription');

      const upgradeButton = page.locator('[data-testid="upgrade-subscription"]');

      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();

        await expect(page).toHaveURL(/.*upgrade|subscription/);
      }
    });
  });
});

test.describe('API Payment Endpoints', () => {
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

  test('should create payment intent', async ({ request }) => {
    const response = await request.post('/api/payments/create-intent', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        amount: 9900,
        currency: 'try',
        description: 'Premium Subscription'
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('clientSecret');
  });

  test('should get payment history', async ({ request }) => {
    const response = await request.get('/api/payments/history', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data.data || data)).toBeTruthy();
  });
});
