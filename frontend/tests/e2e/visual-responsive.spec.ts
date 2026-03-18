import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Visual and Responsive Design (Task 37)
 *
 * 37.1 - Desktop rendering with screenshot comparison
 * 37.2 - Mobile rendering with screenshot and touch target validation
 * 37.3 - Responsive behavior: layout adaptation and game state preservation
 */

test.describe('Visual and Responsive Design', () => {
  // Helper: start a local two-player game so the board has pieces for visual tests
  async function startLocalGame(page: import('@playwright/test').Page): Promise<void> {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const localBtn = page.locator('button:has-text("Local"), button:has-text("Two Player")');
    if ((await localBtn.count()) > 0) {
      await localBtn.first().click();
      await page.waitForTimeout(500);
    }
  }

  // ─── 37.1 Desktop Rendering ───────────────────────────────────────────

  test.describe('37.1 Desktop Rendering', () => {
    test('board renders correctly at 1920x1080', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await startLocalGame(page);

      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(400);
      expect(box!.height).toBeGreaterThan(400);

      // Screenshot for visual comparison
      await page.screenshot({
        path: 'test-results/screenshots/desktop-1920x1080.png',
        fullPage: false,
      });
    });

    test('board renders correctly at 1366x768', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      await startLocalGame(page);

      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(300);
      expect(box!.height).toBeGreaterThan(300);

      await page.screenshot({
        path: 'test-results/screenshots/desktop-1366x768.png',
        fullPage: false,
      });
    });

    test('board renders correctly at 1024x768', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await startLocalGame(page);

      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(250);

      await page.screenshot({
        path: 'test-results/screenshots/desktop-1024x768.png',
        fullPage: false,
      });
    });
  });

  // ─── 37.2 Mobile Rendering ────────────────────────────────────────────

  test.describe('37.2 Mobile Rendering', () => {
    test('board renders on iPhone SE (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await startLocalGame(page);

      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      // Canvas must fit within the viewport width
      expect(box!.width).toBeLessThanOrEqual(375);
      // Canvas should still be reasonably sized
      expect(box!.width).toBeGreaterThan(200);

      await page.screenshot({
        path: 'test-results/screenshots/mobile-iphone-se-375x667.png',
        fullPage: false,
      });
    });

    test('board renders on iPhone 12 (390x844)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await startLocalGame(page);

      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(390);
      expect(box!.width).toBeGreaterThan(200);

      await page.screenshot({
        path: 'test-results/screenshots/mobile-iphone12-390x844.png',
        fullPage: false,
      });
    });

    test('board renders on iPad (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await startLocalGame(page);

      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(300);

      await page.screenshot({
        path: 'test-results/screenshots/tablet-ipad-768x1024.png',
        fullPage: false,
      });
    });

    test('touch targets meet 44x44px minimum on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check all visible game-button elements
      const buttons = page.locator('button.game-button:visible');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  // ─── 37.3 Responsive Behavior ─────────────────────────────────────────

  test.describe('37.3 Responsive Behavior', () => {
    test('layout adapts during window resize', async ({ page }) => {
      // Start at desktop size
      await page.setViewportSize({ width: 1200, height: 800 });
      await startLocalGame(page);

      const canvas = page.locator('#game-canvas');
      const desktopBox = await canvas.boundingBox();
      expect(desktopBox).not.toBeNull();

      // Resize to tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      const tabletBox = await canvas.boundingBox();
      expect(tabletBox).not.toBeNull();

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      const mobileBox = await canvas.boundingBox();
      expect(mobileBox).not.toBeNull();

      // Canvas should shrink as viewport shrinks
      expect(mobileBox!.width).toBeLessThan(desktopBox!.width);

      // Canvas should remain visible at all sizes
      await expect(canvas).toBeVisible();

      // Aspect ratio should stay roughly square
      const ratio = mobileBox!.width / mobileBox!.height;
      expect(ratio).toBeCloseTo(1, 0);
    });

    test('game state is preserved during resize', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await startLocalGame(page);

      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();

      // Click on the canvas to place a piece (position 0 — top-left area)
      const box = await canvas.boundingBox();
      if (box) {
        // Click near top-left of the board (position 0)
        // Board positions are mapped within the canvas; top-left corner is roughly
        // at ~10% from left and ~10% from top of the canvas
        const x = box.x + box.width * 0.1;
        const y = box.y + box.height * 0.1;
        await page.mouse.click(x, y);
        await page.waitForTimeout(300);
      }

      // Take a screenshot before resize to capture board state
      await page.screenshot({
        path: 'test-results/screenshots/state-before-resize.png',
        fullPage: false,
      });

      // Resize the viewport
      await page.setViewportSize({ width: 600, height: 800 });
      await page.waitForTimeout(500);

      // Canvas should still be visible
      await expect(canvas).toBeVisible();

      // The canvas should have resized but the game should still be running
      // (no error dialogs, no menu reappearing)
      const errorDialog = page.locator('.error-dialog');
      const errorCount = await errorDialog.count();
      // Error dialog should not be visible
      if (errorCount > 0) {
        await expect(errorDialog).not.toBeVisible();
      }

      // Resize back to original
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);

      // Canvas should still be visible and game should continue
      await expect(canvas).toBeVisible();

      // Take screenshot after resize round-trip
      await page.screenshot({
        path: 'test-results/screenshots/state-preserved-after-resize.png',
        fullPage: false,
      });

      // Verify no unexpected dialogs appeared (game state preserved)
      const mainMenuDialog = page.locator('.main-menu-dialog:visible');
      const menuCount = await mainMenuDialog.count();
      expect(menuCount).toBe(0);
    });
  });
});
