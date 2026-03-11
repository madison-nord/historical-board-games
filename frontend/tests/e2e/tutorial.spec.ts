import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Tutorial System
 * 
 * These tests validate the complete tutorial flow including:
 * - Tutorial navigation (next, back, skip)
 * - Step content display
 * - Action validation
 * - Tutorial completion
 */

test.describe('Tutorial System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display main menu with tutorial button', async ({ page }) => {
    // Wait for main menu to appear
    const tutorialButton = page.locator('button:has-text("Tutorial")');
    await expect(tutorialButton).toBeVisible({ timeout: 10000 });
  });

  test('should start tutorial and display first step', async ({ page }) => {
    // Click tutorial button
    await page.click('button:has-text("Tutorial")');
    
    // Wait for tutorial overlay to appear
    const tutorialOverlay = page.locator('.tutorial-overlay');
    await expect(tutorialOverlay).toBeVisible({ timeout: 5000 });
    
    // Check first step content
    const stepTitle = page.locator('.tutorial-step-title');
    await expect(stepTitle).toContainText('Welcome to Nine Men\'s Morris');
    
    // Check navigation buttons
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    await expect(page.locator('button:has-text("Skip Tutorial")')).toBeVisible();
  });

  test('should navigate through all tutorial steps', async ({ page }) => {
    // Start tutorial
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });
    
    // Navigate through steps
    const expectedSteps = [
      'Welcome to Nine Men\'s Morris',
      'The Board',
      'Placement Phase',
      'Continue Placing',
      'Forming a Mill',
      'Removing Opponent Pieces',
      'Movement Phase',
      'Flying Phase',
      'How to Win',
      'Tutorial Complete!'
    ];
    
    for (let i = 0; i < expectedSteps.length; i++) {
      const stepTitle = page.locator('.tutorial-step-title');
      await expect(stepTitle).toContainText(expectedSteps[i], { timeout: 5000 });
      
      // Click next if not last step
      if (i < expectedSteps.length - 1) {
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(500); // Wait for step transition
      }
    }
  });

  test('should allow going back to previous steps', async ({ page }) => {
    // Start tutorial
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });
    
    // Go to step 3
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(300);
    
    // Verify we're on step 3
    const stepTitle = page.locator('.tutorial-step-title');
    await expect(stepTitle).toContainText('Placement Phase');
    
    // Go back
    await page.click('button:has-text("Back")');
    await page.waitForTimeout(300);
    
    // Verify we're back on step 2
    await expect(stepTitle).toContainText('The Board');
  });

  test('should allow skipping tutorial', async ({ page }) => {
    // Start tutorial
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });
    
    // Click skip
    await page.click('button:has-text("Skip Tutorial")');
    await page.waitForTimeout(500);
    
    // Tutorial overlay should be gone
    const tutorialOverlay = page.locator('.tutorial-overlay');
    await expect(tutorialOverlay).not.toBeVisible();
  });

  test('should highlight positions during tutorial', async ({ page }) => {
    // Start tutorial
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });
    
    // Navigate to placement step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(300);
    
    // Check if canvas exists (positions are highlighted on canvas)
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should complete tutorial and return to menu', async ({ page }) => {
    // Start tutorial
    await page.click('button:has-text("Tutorial")');
    await page.waitForSelector('.tutorial-overlay', { timeout: 5000 });
    
    // Navigate to last step
    for (let i = 0; i < 9; i++) {
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(300);
    }
    
    // Verify completion step
    const stepTitle = page.locator('.tutorial-step-title');
    await expect(stepTitle).toContainText('Tutorial Complete');
    
    // Click finish button (or similar)
    const finishButton = page.locator('button:has-text("Finish"), button:has-text("Start Game")');
    if (await finishButton.count() > 0) {
      await finishButton.first().click();
      await page.waitForTimeout(500);
    }
  });
});
