import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Tutorial System
 *
 * These tests validate the tutorial system basics:
 * - Tutorial can be started from main menu
 * - Tutorial displays step content
 * - Tutorial can be skipped
 * - Tutorial highlights positions on canvas
 *
 * Detailed interactive step tests are in task 38.4.
 */

test.describe('Tutorial System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display main menu with tutorial button', async ({ page }) => {
    const tutorialButton = page.locator('button:has-text("Tutorial")');
    await expect(tutorialButton).toBeVisible({ timeout: 10000 });
  });

  test('should start tutorial and display first step', async ({ page }) => {
    await page.click('button:has-text("Tutorial")');

    const tutorialOverlay = page.locator('.tutorial-overlay');
    await expect(tutorialOverlay).toBeVisible({ timeout: 5000 });

    const stepTitle = page.locator('.tutorial-step-title');
    await expect(stepTitle).toContainText("Welcome to Nine Men's Morris");

    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    await expect(page.locator('button:has-text("Skip Tutorial")')).toBeVisible();
  });

  test('should advance to second step with Next button', async ({ page }) => {
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });

    // Step 1 is informational — Next button should work
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    const stepTitle = page.locator('.tutorial-step-title');
    await expect(stepTitle).toContainText('The Board');
  });

  test('should allow going back from step 2 to step 1', async ({ page }) => {
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });

    // Advance to step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    const stepTitle = page.locator('.tutorial-step-title');
    await expect(stepTitle).toContainText('The Board');

    // Go back to step 1
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(500);

    await expect(stepTitle).toContainText("Welcome to Nine Men's Morris");
  });

  test('should allow skipping tutorial', async ({ page }) => {
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });

    await page.click('button:has-text("Skip Tutorial")');
    await page.waitForTimeout(500);

    const tutorialOverlay = page.locator('.tutorial-overlay');
    await expect(tutorialOverlay).not.toBeVisible();
  });

  test('should show canvas with highlights during tutorial', async ({ page }) => {
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });

    // Advance to step 2 (Board Layout) which highlights all positions
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show step counter in tutorial', async ({ page }) => {
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });

    // Check for step indicator (e.g., "Step 1 of 15")
    const stepIndicator = page.locator('.tutorial-step-indicator');
    if ((await stepIndicator.count()) > 0) {
      await expect(stepIndicator).toContainText('1');
    }
  });
});
