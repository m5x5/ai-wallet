import { test, expect } from '@playwright/test';

test.describe('AI Wallet Component', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should persist API key and endpoint after page reload', async ({ page }) => {
    await page.goto('/');

    // Wait for the component to load
    await page.waitForSelector('ai-wallet', { timeout: 10000 });

    // Get the shadow root
    const aiWallet = await page.locator('ai-wallet');

    // Enter API key in the setup wizard
    const apiKeyInput = aiWallet.locator('input[type="password"]');
    await apiKeyInput.waitFor({ state: 'visible', timeout: 5000 });
    await apiKeyInput.fill('sk-test-key-12345');

    // Click continue button
    const continueButton = aiWallet.locator('button:has-text("Continue")');
    await continueButton.click();

    // Wait for endpoint step or completion
    await page.waitForTimeout(1000);

    // Check if we need to enter endpoint
    const endpointInput = aiWallet.locator('input[type="url"]');
    const isEndpointVisible = await endpointInput.isVisible().catch(() => false);

    if (isEndpointVisible) {
      await endpointInput.fill('https://api.example.com/v1');
      const continueBtn = aiWallet.locator('button:has-text("Continue")').last();
      await continueBtn.click();
    }

    // Wait for setup to complete
    await page.waitForTimeout(2000);

    // Verify localStorage has the configuration
    const storedConfig = await page.evaluate(() => {
      return localStorage.getItem('ai-wallet-config');
    });

    expect(storedConfig).toBeTruthy();
    const config = JSON.parse(storedConfig!);
    expect(config.apiKey).toBe('sk-test-key-12345');

    // Reload the page
    await page.reload();
    await page.waitForSelector('ai-wallet', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify configuration is still there after reload
    const storedConfigAfterReload = await page.evaluate(() => {
      return localStorage.getItem('ai-wallet-config');
    });

    expect(storedConfigAfterReload).toBeTruthy();
    const configAfterReload = JSON.parse(storedConfigAfterReload!);
    expect(configAfterReload.apiKey).toBe('sk-test-key-12345');

    // Verify the component shows the main view (not setup wizard)
    const setupHeading = aiWallet.locator('h2:has-text("AI Wallet Setup")');
    const isSetupVisible = await setupHeading.isVisible().catch(() => false);
    expect(isSetupVisible).toBe(false);
  });

  test('should show advanced settings and persist values when toggling', async ({ page }) => {
    // Pre-populate localStorage with a complete config
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ai-wallet-config', JSON.stringify({
        apiKey: 'sk-test-key-12345',
        endpoint: 'https://api.example.com/v1',
        llm: 'gpt-4',
        vlm: 'gpt-4-vision',
        sst: 'whisper-1',
        tts: 'tts-1',
        enabledCapabilities: ['llm', 'vlm', 'sst', 'tts']
      }));
    });

    await page.reload();
    await page.waitForSelector('ai-wallet', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const aiWallet = page.locator('ai-wallet');

    // Find and click "Show Advanced Settings" button
    const showAdvancedBtn = aiWallet.locator('button:has-text("Show Advanced Settings")');
    await showAdvancedBtn.waitFor({ state: 'visible', timeout: 5000 });
    await showAdvancedBtn.click();

    // Wait for advanced settings to appear
    await page.waitForTimeout(500);

    // Verify advanced settings are visible
    const apiKeyLabel = aiWallet.locator('label:has-text("API Key")');
    await expect(apiKeyLabel).toBeVisible();

    // Verify the API key input has the value
    const apiKeyInput = aiWallet.locator('input[type="password"]');
    const apiKeyValue = await apiKeyInput.inputValue();
    expect(apiKeyValue).toBe('sk-test-key-12345');

    // Verify the endpoint input has the value
    const endpointInput = aiWallet.locator('input[type="url"]');
    const endpointValue = await endpointInput.inputValue();
    expect(endpointValue).toBe('https://api.example.com/v1');

    // Hide advanced settings
    const hideAdvancedBtn = aiWallet.locator('button:has-text("Hide Advanced Settings")');
    await hideAdvancedBtn.click();
    await page.waitForTimeout(500);

    // Show them again
    await showAdvancedBtn.click();
    await page.waitForTimeout(500);

    // Verify values are still there
    const apiKeyValueAfterToggle = await apiKeyInput.inputValue();
    expect(apiKeyValueAfterToggle).toBe('sk-test-key-12345');

    const endpointValueAfterToggle = await endpointInput.inputValue();
    expect(endpointValueAfterToggle).toBe('https://api.example.com/v1');
  });

  test('should display combo box dropdowns with proper z-index', async ({ page }) => {
    // Pre-populate localStorage with a complete config
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ai-wallet-config', JSON.stringify({
        apiKey: 'sk-test-key-12345',
        endpoint: 'https://api.example.com/v1',
        llm: 'gpt-4',
        vlm: 'gpt-4-vision',
        sst: 'whisper-1',
        tts: 'tts-1',
        enabledCapabilities: ['llm', 'vlm']
      }));
    });

    await page.reload();
    await page.waitForSelector('ai-wallet', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const aiWallet = page.locator('ai-wallet');

    // Find a vaadin-combo-box element
    const comboBox = aiWallet.locator('vaadin-combo-box').first();
    await comboBox.waitFor({ state: 'visible', timeout: 5000 });

    // Get the computed z-index style
    const zIndex = await comboBox.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // Verify z-index is set (should be '10' based on our fix)
    expect(zIndex).toBeTruthy();
    expect(zIndex).not.toBe('auto');
  });

  test('should persist dropdown values after toggling advanced settings', async ({ page }) => {
    // Setup with API key to get to main view
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ai-wallet-config', JSON.stringify({
        apiKey: 'sk-test-key-12345',
        endpoint: 'https://server.budecredits.de/',
        llm: 'test-llm-model',
        vlm: 'test-vlm-model',
        sst: 'test-sst-model',
        tts: 'test-tts-model',
        enabledCapabilities: ['llm', 'vlm', 'sst', 'tts']
      }));
    });

    await page.reload();
    await page.waitForSelector('ai-wallet', { timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for models to load

    const aiWallet = page.locator('ai-wallet');

    // Get all combo boxes
    const comboBoxes = await aiWallet.locator('vaadin-combo-box').all();
    expect(comboBoxes.length).toBeGreaterThan(0);

    // Read initial values from combo boxes
    const initialValues: string[] = [];
    for (const comboBox of comboBoxes) {
      const value = await comboBox.evaluate((el: any) => el.value);
      initialValues.push(value);
      console.log('Initial combo box value:', value);
    }

    // Toggle advanced settings open
    const showAdvancedBtn = aiWallet.locator('button:has-text("Show Advanced Settings")');
    await showAdvancedBtn.waitFor({ state: 'visible', timeout: 5000 });
    await showAdvancedBtn.click();
    await page.waitForTimeout(1000);

    // Toggle advanced settings closed
    const hideAdvancedBtn = aiWallet.locator('button:has-text("Hide Advanced Settings")');
    await hideAdvancedBtn.click();
    await page.waitForTimeout(1000);

    // Verify dropdown values are still the same
    const comboBoxesAfterToggle = await aiWallet.locator('vaadin-combo-box').all();
    for (let i = 0; i < comboBoxesAfterToggle.length; i++) {
      const value = await comboBoxesAfterToggle[i].evaluate((el: any) => el.value);
      console.log(`After toggle combo box ${i} value:`, value);
      expect(value).toBe(initialValues[i]);
    }
  });

  test('should persist dropdown values after page reload', async ({ page }) => {
    // Setup with API key to get to main view
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('ai-wallet-config', JSON.stringify({
        apiKey: 'sk-test-key-12345',
        endpoint: 'https://server.budecredits.de/',
        llm: 'test-llm-model',
        vlm: 'test-vlm-model',
        sst: 'test-sst-model',
        tts: 'test-tts-model',
        enabledCapabilities: ['llm', 'vlm', 'sst', 'tts']
      }));
    });

    await page.reload();
    await page.waitForSelector('ai-wallet', { timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for models to load

    const aiWallet = page.locator('ai-wallet');

    // Get all combo boxes and read their values
    const comboBoxes = await aiWallet.locator('vaadin-combo-box').all();
    expect(comboBoxes.length).toBeGreaterThan(0);

    const initialValues: string[] = [];
    for (const comboBox of comboBoxes) {
      const value = await comboBox.evaluate((el: any) => el.value);
      initialValues.push(value);
      console.log('Initial combo box value before reload:', value);
    }

    // Reload the page
    await page.reload();
    await page.waitForSelector('ai-wallet', { timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for models to load again

    // Verify dropdown values persisted after reload
    const comboBoxesAfterReload = await aiWallet.locator('vaadin-combo-box').all();
    for (let i = 0; i < comboBoxesAfterReload.length; i++) {
      const value = await comboBoxesAfterReload[i].evaluate((el: any) => el.value);
      console.log(`After reload combo box ${i} value:`, value);
      expect(value).toBe(initialValues[i]);
    }

    // Also verify localStorage still has the correct values
    const storedConfig = await page.evaluate(() => {
      return localStorage.getItem('ai-wallet-config');
    });
    expect(storedConfig).toBeTruthy();
    const config = JSON.parse(storedConfig!);
    expect(config.llm).toBe('test-llm-model');
    expect(config.vlm).toBe('test-vlm-model');
    expect(config.sst).toBe('test-sst-model');
    expect(config.tts).toBe('test-tts-model');
  });
});
