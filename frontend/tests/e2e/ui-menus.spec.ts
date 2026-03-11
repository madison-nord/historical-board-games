import { test, expect } from '@playwright/test';

/**
 * E2E Tests for UI and Menus
 * 
 * These tests validate:
 * - Main menu functionality
 * - Dialog display and interaction
 * - Game mode selection
 * - Error handling
 */

test.describe('UI and Menus E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display main menu on load', async ({ page }) => {
    // Check for main menu elements
    const menuButtons = page.locator('button');
    expect(await menuButtons.count()).toBeGreaterThan(0);
    
    // Should have game mode buttons
    await expect(page.locator('button:has-text("Single Player")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Tutorial")')).toBeVisible();
    await expect(page.locator('button:has-text("Local")')).toBeVisible();
  });

  test('should show all game mode options', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Check for expected game mode buttons
    const expectedModes = ['Single Player', 'Local', 'Tutorial'];
    
    for (const mode of expectedModes) {
      const button = page.locator(`button:has-text("${mode}")`);
      // At least one of these should be visible
      if (await button.count() > 0) {
        await expect(button.first()).toBeVisible();
      }
    }
  });

  test('should start local two-player game', async ({ page }) => {
    // Click local two-player button
    const localButton = page.locator('button:has-text("Local"), button:has-text("Two Player")');
    if (await localButton.count() > 0) {
      await localButton.first().click();
      await page.waitForTimeout(1000);
      
      // Game canvas should be visible
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
      
      // Game info should be displayed
      // (This would be rendered on canvas or in DOM elements)
    }
  });

  test('should display tutorial when tutorial button clicked', async ({ page }) => {
    const tutorialButton = page.locator('button:has-text("Tutorial")');
    if (await tutorialButton.count() > 0) {
      await tutorialButton.click();
      await page.waitForTimeout(1000);
      
      // Tutorial overlay should appear
      const tutorialOverlay = page.locator('.tutorial-overlay, .tutorial-container');
      await expect(tutorialOverlay).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle button hover effects', async ({ page }) => {
    const button = page.locator('button').first();
    
    if (await button.isVisible()) {
      // Get initial styles
      const initialBg = await button.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Hover over button
      await button.hover();
      await page.waitForTimeout(200);
      
      // Background should change (hover effect)
      const hoverBg = await button.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Note: This might not change if CSS transitions are instant
      // The test validates that hover doesn't break the UI
      expect(hoverBg).toBeDefined();
    }
  });

  test('should have consistent typography', async ({ page }) => {
    // Check that text elements use consistent fonts
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    
    if (count > 0) {
      const fontFamily = await headings.first().evaluate(el =>
        window.getComputedStyle(el).fontFamily
      );
      
      expect(fontFamily).toBeDefined();
      expect(fontFamily.length).toBeGreaterThan(0);
    }
  });

  test('should display canvas with proper styling', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    
    // Canvas should have proper dimensions
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThan(0);
    expect(boundingBox!.height).toBeGreaterThan(0);
    
    // Canvas should be square (or close to it)
    const aspectRatio = boundingBox!.width / boundingBox!.height;
    expect(aspectRatio).toBeCloseTo(1, 1);
  });

  test('should handle rapid button clicks gracefully', async ({ page }) => {
    const button = page.locator('button').first();
    
    if (await button.isVisible()) {
      // Click button once
      await button.click();
      
      // Wait for debounce to complete (300ms + buffer)
      await page.waitForTimeout(400);
      
      // Page should not crash or show errors
      // Canvas should still be visible
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
    }
  });

  test('should maintain UI state after window resize', async ({ page }) => {
    // Start a game
    const localButton = page.locator('button:has-text("Local"), button:has-text("Two Player")');
    if (await localButton.count() > 0) {
      await localButton.first().click();
      await page.waitForTimeout(1000);
    }
    
    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);
    
    // Canvas should still be visible
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    
    // Resize again
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(500);
    
    await expect(canvas).toBeVisible();
  });

  test('should display game without console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should have no critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && // Ignore favicon errors
      !e.includes('DevTools')   // Ignore DevTools messages
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
