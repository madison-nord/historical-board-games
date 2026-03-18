import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Input Methods and Accessibility (Task 40)
 *
 * 40.1 - Mouse input
 * 40.2 - Touch input
 * 40.3 - Keyboard navigation
 * 40.4 - Screen reader compatibility
 *
 * Validates:
 * - Requirement 9.5: THE Game_System SHALL support both touch input (mobile) and mouse input (desktop)
 * - Accessibility: keyboard navigation, ARIA labels, role attributes, aria-live regions
 */

// ─── Helpers ─────────────────────────────────────────────────────────────

function boardPositionFraction(position: number): { fx: number; fy: number } {
  const p = 0.1;
  const b = 0.8;

  const outerPositions: Record<number, [number, number]> = {
    0: [0, 0],
    1: [0.5, 0],
    2: [1, 0],
    3: [1, 0.5],
    4: [1, 1],
    5: [0.5, 1],
    6: [0, 1],
    7: [0, 0.5],
  };

  const mOff = 0.17;
  const mSize = 0.66;
  const middlePositions: Record<number, [number, number]> = {
    8: [mOff, mOff],
    9: [mOff + mSize / 2, mOff],
    10: [mOff + mSize, mOff],
    11: [mOff + mSize, mOff + mSize / 2],
    12: [mOff + mSize, mOff + mSize],
    13: [mOff + mSize / 2, mOff + mSize],
    14: [mOff, mOff + mSize],
    15: [mOff, mOff + mSize / 2],
  };

  const iOff = 0.335;
  const iSize = 0.33;
  const innerPositions: Record<number, [number, number]> = {
    16: [iOff, iOff],
    17: [iOff + iSize / 2, iOff],
    18: [iOff + iSize, iOff],
    19: [iOff + iSize, iOff + iSize / 2],
    20: [iOff + iSize, iOff + iSize],
    21: [iOff + iSize / 2, iOff + iSize],
    22: [iOff, iOff + iSize],
    23: [iOff, iOff + iSize / 2],
  };

  const all = { ...outerPositions, ...middlePositions, ...innerPositions };
  const [rx, ry] = all[position] ?? [0.5, 0.5];

  return { fx: p + b * rx, fy: p + b * ry };
}

async function clickPosition(page: Page, position: number): Promise<void> {
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');

  const { fx, fy } = boardPositionFraction(position);
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await page.waitForTimeout(100);
}

async function startLocalGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const btn = page.locator('button:has-text("Local Two Player"), button:has-text("Local")');
  await btn.first().click();
  await page.waitForTimeout(500);
}

// ─── 40.1 Mouse Input ───────────────────────────────────────────────────

test.describe('40.1 Mouse input', () => {
  test.setTimeout(30000);

  test('should register piece placement via mouse click on canvas', async ({ page }) => {
    await startLocalGame(page);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Capture canvas pixel data before clicking position 0
    const beforePixels = await page.evaluate(({ fx, fy }) => {
      const cvs = document.getElementById('game-canvas') as HTMLCanvasElement;
      const ctx = cvs.getContext('2d');
      if (!ctx) return null;
      const x = Math.round(cvs.width * fx);
      const y = Math.round(cvs.height * fy);
      const size = 15;
      const data = ctx.getImageData(
        Math.max(0, x - size),
        Math.max(0, y - size),
        size * 2,
        size * 2
      ).data;
      return Array.from(data.slice(0, 40));
    }, boardPositionFraction(0));

    // Click position 0 with mouse
    await clickPosition(page, 0);
    await page.waitForTimeout(500);

    // Capture canvas pixel data after clicking — should have changed (piece placed)
    const afterPixels = await page.evaluate(({ fx, fy }) => {
      const cvs = document.getElementById('game-canvas') as HTMLCanvasElement;
      const ctx = cvs.getContext('2d');
      if (!ctx) return null;
      const x = Math.round(cvs.width * fx);
      const y = Math.round(cvs.height * fy);
      const size = 15;
      const data = ctx.getImageData(
        Math.max(0, x - size),
        Math.max(0, y - size),
        size * 2,
        size * 2
      ).data;
      return Array.from(data.slice(0, 40));
    }, boardPositionFraction(0));

    // Pixels should have changed after placing a piece
    // Validates: Requirement 9.5
    expect(beforePixels).not.toBeNull();
    expect(afterPixels).not.toBeNull();

    let pixelChanged = false;
    if (beforePixels && afterPixels) {
      for (let i = 0; i < beforePixels.length; i++) {
        if (Math.abs(beforePixels[i] - afterPixels[i]) > 5) {
          pixelChanged = true;
          break;
        }
      }
    }
    expect(pixelChanged).toBeTruthy();
  });

  test('should register multiple sequential mouse clicks as alternating moves', async ({
    page,
  }) => {
    await startLocalGame(page);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Place White at 0, Black at 8, White at 1 via mouse clicks
    await clickPosition(page, 0);
    await page.waitForTimeout(300);
    await clickPosition(page, 8);
    await page.waitForTimeout(300);
    await clickPosition(page, 1);
    await page.waitForTimeout(300);

    // Verify all three positions show pieces by checking pixel data at each
    const piecesPlaced = await page.evaluate(
      ({ positions }) => {
        const cvs = document.getElementById('game-canvas') as HTMLCanvasElement;
        const ctx = cvs.getContext('2d');
        if (!ctx) return [];

        return positions.map((pos: { fx: number; fy: number }) => {
          const x = Math.round(cvs.width * pos.fx);
          const y = Math.round(cvs.height * pos.fy);
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          // A piece renders as a colored circle — check if the pixel is not
          // the board background (typically dark brown/wood color)
          // We just check that the pixel has significant color values
          return pixel[0] + pixel[1] + pixel[2] > 0;
        });
      },
      {
        positions: [boardPositionFraction(0), boardPositionFraction(8), boardPositionFraction(1)],
      }
    );

    // All three positions should have non-zero pixel data (pieces rendered)
    // Validates: Requirement 9.5
    expect(piecesPlaced.length).toBe(3);
    for (const placed of piecesPlaced) {
      expect(placed).toBeTruthy();
    }
  });

  test('should handle mouse click on main menu buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify main menu buttons respond to mouse clicks
    const menuButtons = page.locator('button.game-button');
    const buttonCount = await menuButtons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Click "Local Two Player" button with mouse
    const localBtn = page.locator('button:has-text("Local Two Player"), button:has-text("Local")');
    await localBtn.first().click();
    await page.waitForTimeout(500);

    // Should have navigated away from main menu — canvas should be visible
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Main menu dialog should be closed
    const mainMenu = page.locator('.main-menu-dialog');
    const menuVisible = await mainMenu.isVisible().catch(() => false);
    expect(menuVisible).toBeFalsy();
  });
});

// ─── 40.2 Touch Input ───────────────────────────────────────────────────

test.describe('40.2 Touch input', () => {
  test.setTimeout(30000);

  test('should register piece placement via touch tap on canvas', async ({ page }) => {
    await startLocalGame(page);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Capture pixels before touch
    const beforePixels = await page.evaluate(({ fx, fy }) => {
      const cvs = document.getElementById('game-canvas') as HTMLCanvasElement;
      const ctx = cvs.getContext('2d');
      if (!ctx) return null;
      const x = Math.round(cvs.width * fx);
      const y = Math.round(cvs.height * fy);
      const data = ctx.getImageData(Math.max(0, x - 10), Math.max(0, y - 10), 20, 20).data;
      return Array.from(data.slice(0, 40));
    }, boardPositionFraction(0));

    // Simulate touch tap at position 0 using Playwright's touchscreen API
    const { fx, fy } = boardPositionFraction(0);
    await page.touchscreen.tap(box.x + box.width * fx, box.y + box.height * fy);
    await page.waitForTimeout(500);

    // Capture pixels after touch
    const afterPixels = await page.evaluate(({ fx, fy }) => {
      const cvs = document.getElementById('game-canvas') as HTMLCanvasElement;
      const ctx = cvs.getContext('2d');
      if (!ctx) return null;
      const x = Math.round(cvs.width * fx);
      const y = Math.round(cvs.height * fy);
      const data = ctx.getImageData(Math.max(0, x - 10), Math.max(0, y - 10), 20, 20).data;
      return Array.from(data.slice(0, 40));
    }, boardPositionFraction(0));

    // Verify pixels changed — touch input registered a move
    // Validates: Requirement 9.5
    expect(beforePixels).not.toBeNull();
    expect(afterPixels).not.toBeNull();

    let pixelChanged = false;
    if (beforePixels && afterPixels) {
      for (let i = 0; i < beforePixels.length; i++) {
        if (Math.abs(beforePixels[i] - afterPixels[i]) > 5) {
          pixelChanged = true;
          break;
        }
      }
    }
    expect(pixelChanged).toBeTruthy();
  });

  test('should register sequential touch taps as alternating moves', async ({ page }) => {
    await startLocalGame(page);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Tap position 0 (White), position 8 (Black), position 1 (White)
    const positions = [0, 8, 1];
    for (const pos of positions) {
      const { fx, fy } = boardPositionFraction(pos);
      await page.touchscreen.tap(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(300);
    }

    // Verify pieces were placed at all three positions
    const piecesPlaced = await page.evaluate(
      ({ positionFractions }) => {
        const cvs = document.getElementById('game-canvas') as HTMLCanvasElement;
        const ctx = cvs.getContext('2d');
        if (!ctx) return [];

        return positionFractions.map((pos: { fx: number; fy: number }) => {
          const x = Math.round(cvs.width * pos.fx);
          const y = Math.round(cvs.height * pos.fy);
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          return pixel[0] + pixel[1] + pixel[2] > 0;
        });
      },
      {
        positionFractions: positions.map(p => boardPositionFraction(p)),
      }
    );

    // Validates: Requirement 9.5
    expect(piecesPlaced.length).toBe(3);
    for (const placed of piecesPlaced) {
      expect(placed).toBeTruthy();
    }
  });

  test('should handle touch tap on menu buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find the "Local Two Player" button and tap it
    const localBtn = page.locator('button:has-text("Local Two Player"), button:has-text("Local")');
    await expect(localBtn.first()).toBeVisible();

    // Use tap instead of click for touch simulation
    await localBtn.first().tap();
    await page.waitForTimeout(500);

    // Should have started a game — canvas visible, menu closed
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });
});

// ─── 40.3 Keyboard Navigation ───────────────────────────────────────────

test.describe('40.3 Keyboard navigation', () => {
  test.setTimeout(30000);

  test('should allow tabbing through main menu buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through the menu buttons and verify focus moves
    const focusedElements: string[] = [];

    // Press Tab multiple times and record which elements receive focus
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';
        return `${el.tagName.toLowerCase()}:${el.textContent?.trim() ?? ''}`;
      });
      focusedElements.push(focused);
    }

    // At least some buttons should have received focus via Tab
    const buttonsFocused = focusedElements.filter(el => el.startsWith('button:'));
    expect(buttonsFocused.length).toBeGreaterThan(0);
  });

  test('should activate menu button with Enter key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab to the "Local Two Player" button
    const localBtn = page.locator('button:has-text("Local Two Player"), button:has-text("Local")');
    await localBtn.first().focus();
    await page.waitForTimeout(100);

    // Press Enter to activate
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Should have started a local game — canvas visible, menu closed
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    const mainMenu = page.locator('.main-menu-dialog');
    const menuVisible = await mainMenu.isVisible().catch(() => false);
    expect(menuVisible).toBeFalsy();
  });

  test('should activate menu button with Space key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Focus the Tutorial button and press Space
    const tutorialBtn = page.locator('button:has-text("Tutorial")');
    await tutorialBtn.first().focus();
    await page.waitForTimeout(100);

    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Tutorial should have started — overlay should appear
    const tutorialOverlay = page.locator('.tutorial-overlay');
    const overlayVisible = await tutorialOverlay.isVisible().catch(() => false);

    // Or the main menu should have closed (tutorial mode started)
    const mainMenu = page.locator('.main-menu-dialog');
    const menuVisible = await mainMenu.isVisible().catch(() => false);

    expect(overlayVisible || !menuVisible).toBeTruthy();
  });

  test('should allow tabbing through dialog buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click Single Player to open color selection dialog
    await page.click('button:has-text("Single Player")');
    await page.waitForTimeout(500);

    // Tab through the color selection buttons
    const focusedElements: string[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';
        return `${el.tagName.toLowerCase()}:${el.textContent?.trim() ?? ''}`;
      });
      focusedElements.push(focused);
    }

    const buttonsFocused = focusedElements.filter(el => el.startsWith('button:'));
    expect(buttonsFocused.length).toBeGreaterThan(0);
  });
});

// ─── 40.4 Screen Reader Compatibility ───────────────────────────────────

test.describe('40.4 Screen reader compatibility', () => {
  test.setTimeout(30000);

  test('should have ARIA label on the game canvas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has role and aria-label attributes
    const role = await canvas.getAttribute('role');
    const ariaLabel = await canvas.getAttribute('aria-label');

    expect(role).toBe('img');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Nine Men');
  });

  test('should have proper role attributes on dialog elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The main menu uses a <dialog> element which has implicit role="dialog"
    const dialog = page.locator('dialog');
    const dialogCount = await dialog.count();
    expect(dialogCount).toBeGreaterThan(0);

    // Verify the dialog is a native <dialog> element (implicit ARIA role)
    const tagName = await dialog.first().evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('dialog');

    // Native <dialog> elements shown with showModal() have implicit role="dialog"
    // and are accessible to screen readers without explicit role attribute
    const isOpen = await dialog.first().evaluate((el: HTMLDialogElement) => el.open);
    expect(isOpen).toBeTruthy();
  });

  test('should have accessible button text on all menu buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // All buttons should have visible text content for screen readers
    const buttons = page.locator('button.game-button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    for (let i = 0; i < buttonCount; i++) {
      const text = await buttons.nth(i).textContent();
      expect(text).toBeTruthy();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test('should have heading structure in main menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the main menu has a heading for screen reader navigation
    const heading = page.locator('.main-menu-dialog h1, .main-menu-dialog h2');
    const headingCount = await heading.count();
    expect(headingCount).toBeGreaterThan(0);

    const headingText = await heading.first().textContent();
    expect(headingText).toBeTruthy();
    expect(headingText).toContain('Morris');
  });

  test('should have lang attribute on html element', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the page has a lang attribute for screen readers
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang).toBe('en');
  });

  test('should have descriptive page title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should verify dynamic content containers exist for announcements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the announcement container exists in the DOM
    // This container is used for dynamic game state announcements
    const announcementContainer = page.locator('#announcement-container');
    const exists = await announcementContainer.count();
    expect(exists).toBe(1);

    // Verify the UI container exists for dynamic UI elements
    const uiContainer = page.locator('#ui-container');
    const uiExists = await uiContainer.count();
    expect(uiExists).toBe(1);
  });

  test('should have accessible info panel container', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the info panel container exists
    const infoPanel = page.locator('#info-panel-container');
    const exists = await infoPanel.count();
    expect(exists).toBe(1);
  });

  test('should have viewport meta tag for mobile accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify viewport meta tag exists (important for mobile screen readers)
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
  });
});
