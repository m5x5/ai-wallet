import { test, expect } from '@playwright/test';

/**
 * Smoke test for React example app
 * Just verifies the example loads and basic functionality works
 */

test.describe('React Example App - Smoke Test', () => {
  test('example app loads successfully', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify main heading
    await expect(page.locator('h1:has-text("AI Wallet React Example")')).toBeVisible({ timeout: 10000 });

    // Verify AI Wallet component is present
    const aiWallet = page.locator('ai-wallet');
    await expect(aiWallet).toBeAttached();

    // Verify config display component exists
    await expect(page.locator('.config-display')).toBeVisible();

    // Verify AI feature component exists
    await expect(page.locator('.card')).toBeVisible();
  });

  test('example responds to wallet configuration', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Initial state
    await expect(page.locator('p:has-text("No configuration loaded yet")')).toBeVisible({ timeout: 5000 });

    // Configure wallet
    await page.evaluate(() => {
      localStorage.setItem('ai-wallet-config', JSON.stringify({
        apiKey: 'sk-test-key-12345',
        endpoint: 'https://api.example.com/v1',
        llm: 'gpt-4',
        enabledCapabilities: ['llm']
      }));
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // Verify React app shows the configuration
    await expect(page.locator('p:has-text("Endpoint:")')).toBeVisible();
    await expect(page.locator('p:has-text("LLM Model: gpt-4")')).toBeVisible();
  });
});
