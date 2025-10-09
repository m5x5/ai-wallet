import { test, expect } from '@playwright/test';

/**
 * Tests for React integration hooks and context
 * Tests the React wrapper functionality
 */

test.describe('React Integration - Hooks', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the React example app
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
  });

  test('useAIConfig hook updates when configuration changes', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('h1:has-text("AI Wallet React Example")', { timeout: 10000 });

    // Initially should show "No configuration loaded yet"
    const initialConfig = page.locator('.config-display');
    await expect(initialConfig.locator('p:has-text("No configuration loaded yet")')).toBeVisible();

    // Configure the wallet through the web component
    const aiWallet = page.locator('ai-wallet');
    await aiWallet.waitFor({ state: 'attached', timeout: 5000 });

    const apiKeyInput = aiWallet.locator('input[type="password"]');
    await apiKeyInput.waitFor({ state: 'visible', timeout: 5000 });
    await apiKeyInput.fill('sk-test-key-12345');

    const continueButton = aiWallet.locator('button:has-text("Continue")');
    await continueButton.click();
    await page.waitForTimeout(1000);

    // Check if endpoint step is visible
    const endpointInput = aiWallet.locator('input[type="url"]');
    const isEndpointVisible = await endpointInput.isVisible().catch(() => false);

    if (isEndpointVisible) {
      await endpointInput.fill('https://api.example.com/v1');
      const continueBtn = aiWallet.locator('button:has-text("Continue")').last();
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }

    // Check that the React component received the configuration
    await expect(initialConfig.locator('p:has-text("Endpoint:")')).toBeVisible();
    const apiKeyDisplay = initialConfig.locator('p:has-text("API Key:")');
    await expect(apiKeyDisplay).toContainText('***');
  });

  test('useAIWallet hook provides config object', async ({ page }) => {
    // Pre-populate configuration
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.setItem('ai-wallet-config', JSON.stringify({
        apiKey: 'sk-test-key-12345',
        endpoint: 'https://server.budecredits.de/',
        llm: 'gpt-4',
        vlm: 'gpt-4-vision',
        enabledCapabilities: ['llm', 'vlm']
      }));
    });

    await page.reload();
    await page.waitForSelector('h1:has-text("AI Wallet React Example")', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify the configuration is displayed by the React hooks
    const configDisplay = page.locator('.config-display');
    await expect(configDisplay.locator('p:has-text("Endpoint: https://server.budecredits.de/")')).toBeVisible();
    await expect(configDisplay.locator('p:has-text("LLM Model: gpt-4")')).toBeVisible();
    await expect(configDisplay.locator('p:has-text("VLM Model: gpt-4-vision")')).toBeVisible();

    // Verify the AI Feature component gets the config
    const aiFeature = page.locator('.card:has-text("AI Feature Ready")');
    await expect(aiFeature).toBeVisible();
    await expect(aiFeature.locator('code:has-text("gpt-4")')).toBeVisible();
  });

  test('AIWalletProvider context updates propagate to child components', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('h1:has-text("AI Wallet React Example")', { timeout: 10000 });

    // Configure via the wallet
    const aiWallet = page.locator('ai-wallet');
    const apiKeyInput = aiWallet.locator('input[type="password"]');
    await apiKeyInput.waitFor({ state: 'visible', timeout: 5000 });
    await apiKeyInput.fill('sk-test-key-12345');

    const continueButton = aiWallet.locator('button:has-text("Continue")');
    await continueButton.click();
    await page.waitForTimeout(2000);

    // Check if we need to complete endpoint step
    const endpointInput = aiWallet.locator('input[type="url"]');
    const isEndpointVisible = await endpointInput.isVisible().catch(() => false);
    if (isEndpointVisible) {
      await endpointInput.fill('https://server.budecredits.de/');
      const continueBtn = aiWallet.locator('button:has-text("Continue")').last();
      await continueBtn.click();
      await page.waitForTimeout(3000);
    }

    // Wait for models to load and an LLM to be selected
    await page.waitForTimeout(3000);

    // Now the AIFeature component should show "AI Feature Ready" if an LLM is configured
    const aiFeature = page.locator('.card');
    const hasLLMConfigured = await page.evaluate(() => {
      const config = localStorage.getItem('ai-wallet-config');
      return config && JSON.parse(config).llm;
    });

    if (hasLLMConfigured) {
      await expect(aiFeature.locator('h3:has-text("AI Feature Ready")')).toBeVisible({ timeout: 5000 });
    }
  });
});
