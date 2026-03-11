import { test, expect, devices } from '@playwright/test';

/**
 * E2E Tests for Responsive Design
 * 
 * These tests validate that the application works correctly across different:
 * - Screen sizes (mobile, tablet, desktop)
 * - Orientations (portrait, landscape)
 * - Touch interactions
 */

test.describe('Responsive Design E2E Tests', () => {
  
  test.describe('Desktop Responsive Tests', () => {
    test('should display correctly on 1920x1080 desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check canvas is visible and sized appropriately
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
      
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox!.width).toBeGreaterThan(400);
      expect(boundingBox!.height).toBeGreaterThan(400);
    });

    test('should display correctly on 1366x768 desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
      
      // Menu should be visible
      const menuButtons = page.locator('button');
      expect(await menuButtons.count()).toBeGreaterThan(0);
    });

    test('should display correctly on 1024x768 desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Tablet Responsive Tests', () => {
    test('should display correctly on iPad (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
      
      // Check touch targets are large enough (44x44px minimum)
      const buttons = page.locator('button');
      const firstButton = buttons.first();
      if (await firstButton.count() > 0) {
        const box = await firstButton.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should handle orientation change on tablet', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500); // Wait for resize handler
      
      // Canvas should still be visible and properly sized
      await expect(canvas).toBeVisible();
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox).not.toBeNull();
    });
  });

  test.describe('Mobile Responsive Tests', () => {
    test('should display correctly on iPhone (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
      
      // Canvas should fit within viewport
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox!.width).toBeLessThanOrEqual(375);
    });

    test('should display correctly on larger phone (414x896)', async ({ page }) => {
      await page.setViewportSize({ width: 414, height: 896 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
    });

    test('should have touch-friendly buttons on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check all buttons meet minimum touch target size (44x44px)
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should handle mobile orientation change', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500); // Wait for resize handler
      
      // Canvas should still be visible
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Text Readability Tests', () => {
    test('should have readable text on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check that text elements have appropriate font sizes
      const textElements = page.locator('h1, h2, h3, p, button');
      const count = await textElements.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const fontSize = await element.evaluate(el => 
            window.getComputedStyle(el).fontSize
          );
          const fontSizeNum = parseInt(fontSize);
          // Minimum readable font size is 14px on mobile
          expect(fontSizeNum).toBeGreaterThanOrEqual(14);
        }
      }
    });

    test('should not have overlapping UI elements', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot to verify no overlapping
      await page.screenshot({ path: 'test-results/mobile-layout.png' });
      
      // Check that canvas and buttons don't overlap
      const canvas = page.locator('#game-canvas');
      const buttons = page.locator('button').first();
      
      if (await canvas.isVisible() && await buttons.isVisible()) {
        const canvasBox = await canvas.boundingBox();
        const buttonBox = await buttons.boundingBox();
        
        if (canvasBox && buttonBox) {
          // Buttons should not overlap with canvas
          const noOverlap = 
            buttonBox.y + buttonBox.height < canvasBox.y ||
            buttonBox.y > canvasBox.y + canvasBox.height ||
            buttonBox.x + buttonBox.width < canvasBox.x ||
            buttonBox.x > canvasBox.x + canvasBox.width;
          
          expect(noOverlap).toBeTruthy();
        }
      }
    });
  });

  test.describe('Canvas Scaling Tests', () => {
    test('should scale canvas proportionally on resize', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const canvas = page.locator('#game-canvas');
      const initialBox = await canvas.boundingBox();
      expect(initialBox).not.toBeNull();
      
      // Resize viewport
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(500); // Wait for resize handler
      
      const newBox = await canvas.boundingBox();
      expect(newBox).not.toBeNull();
      
      // Canvas should have resized
      expect(newBox!.width).not.toBe(initialBox!.width);
      
      // Aspect ratio should be maintained (square canvas)
      const aspectRatio = newBox!.width / newBox!.height;
      expect(aspectRatio).toBeCloseTo(1, 1); // Should be close to 1:1
    });
  });
});
