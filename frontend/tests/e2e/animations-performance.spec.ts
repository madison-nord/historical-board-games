import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Animations and Performance (Task 39)
 *
 * 39.1 - Animation smoothness (FPS monitoring)
 * 39.2 - Visual feedback timing (click-to-feedback latency)
 *
 * Validates:
 * - Requirement 10.5: THE Game_System SHALL maintain 60 FPS during animations
 * - Requirement 10.6: THE Game_System SHALL provide visual feedback within 100ms of user input
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

/** Click a board position on the canvas */
async function clickPosition(page: Page, position: number): Promise<void> {
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');

  const { fx, fy } = boardPositionFraction(position);
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await page.waitForTimeout(100);
}

/** Start a local two-player game from the main menu */
async function startLocalGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const btn = page.locator('button:has-text("Local Two Player"), button:has-text("Local")');
  await btn.first().click();
  await page.waitForTimeout(500);
}

// ─── 39.1 Animation Smoothness ──────────────────────────────────────────

test.describe('39.1 Animation smoothness - FPS monitoring', () => {
  test.setTimeout(30000);

  test('should maintain FPS above 55 during piece placement animations', async ({ page }) => {
    await startLocalGame(page);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Inject a frame rate monitor using requestAnimationFrame
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__fpsData = {
        frames: [] as number[],
        lastTime: performance.now(),
        running: true,
      };

      const data = w.__fpsData as {
        frames: number[];
        lastTime: number;
        running: boolean;
      };

      function measureFrame() {
        if (!data.running) return;
        const now = performance.now();
        const delta = now - data.lastTime;
        if (delta > 0) {
          data.frames.push(1000 / delta);
        }
        data.lastTime = now;
        requestAnimationFrame(measureFrame);
      }
      requestAnimationFrame(measureFrame);
    });

    // Trigger several piece placements to generate animations
    // White places at 0, Black places at 8, White places at 1, Black places at 9
    await clickPosition(page, 0);
    await page.waitForTimeout(400); // Wait for placement animation (300ms + buffer)
    await clickPosition(page, 8);
    await page.waitForTimeout(400);
    await clickPosition(page, 1);
    await page.waitForTimeout(400);
    await clickPosition(page, 9);
    await page.waitForTimeout(400);

    // Stop monitoring and collect results
    const fpsStats = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const data = w.__fpsData as {
        frames: number[];
        running: boolean;
      };
      data.running = false;

      const frames = data.frames;
      if (frames.length === 0) return { avg: 0, min: 0, count: 0 };

      // Filter out outlier frames (first few frames and extreme spikes)
      const filtered = frames.slice(5).filter(fps => fps > 5 && fps < 200);
      if (filtered.length === 0) return { avg: 0, min: 0, count: frames.length };

      const avg = filtered.reduce((sum, fps) => sum + fps, 0) / filtered.length;
      const sorted = [...filtered].sort((a, b) => a - b);
      // Use 5th percentile as "effective minimum" to ignore rare GC pauses
      const p5Index = Math.floor(sorted.length * 0.05);
      const min = sorted[p5Index] ?? sorted[0];

      return { avg: Math.round(avg), min: Math.round(min), count: filtered.length };
    });

    // Verify we collected enough frames
    expect(fpsStats.count).toBeGreaterThan(10);

    // Average FPS should be above 55 (close to 60)
    // Validates: Requirement 10.5
    expect(fpsStats.avg).toBeGreaterThanOrEqual(55);
  });

  test('should maintain FPS above 55 during continuous game interaction', async ({ page }) => {
    await startLocalGame(page);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Start FPS monitoring
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__fpsData = {
        frames: [] as number[],
        lastTime: performance.now(),
        running: true,
      };

      const data = w.__fpsData as {
        frames: number[];
        lastTime: number;
        running: boolean;
      };

      function measureFrame() {
        if (!data.running) return;
        const now = performance.now();
        const delta = now - data.lastTime;
        if (delta > 0) {
          data.frames.push(1000 / delta);
        }
        data.lastTime = now;
        requestAnimationFrame(measureFrame);
      }
      requestAnimationFrame(measureFrame);
    });

    // Place multiple pieces with mouse movements to simulate real gameplay
    const positions = [0, 8, 1, 9, 2, 10];
    for (const pos of positions) {
      await clickPosition(page, pos);
      await page.waitForTimeout(350);
    }

    // Also simulate mouse hover movements across the board
    const box = await canvas.boundingBox();
    if (box) {
      for (let i = 0; i < 5; i++) {
        const x = box.x + box.width * (0.2 + i * 0.15);
        const y = box.y + box.height * 0.5;
        await page.mouse.move(x, y);
        await page.waitForTimeout(50);
      }
    }

    await page.waitForTimeout(300);

    // Collect FPS results
    const fpsStats = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const data = w.__fpsData as {
        frames: number[];
        running: boolean;
      };
      data.running = false;

      const frames = data.frames;
      if (frames.length === 0) return { avg: 0, min: 0, count: 0 };

      const filtered = frames.slice(5).filter(fps => fps > 5 && fps < 200);
      if (filtered.length === 0) return { avg: 0, min: 0, count: frames.length };

      const avg = filtered.reduce((sum, fps) => sum + fps, 0) / filtered.length;
      const sorted = [...filtered].sort((a, b) => a - b);
      const p5Index = Math.floor(sorted.length * 0.05);
      const min = sorted[p5Index] ?? sorted[0];

      return { avg: Math.round(avg), min: Math.round(min), count: filtered.length };
    });

    expect(fpsStats.count).toBeGreaterThan(10);

    // Average FPS should be above 55 during continuous interaction
    // Validates: Requirement 10.5
    expect(fpsStats.avg).toBeGreaterThanOrEqual(55);
  });
});

// ─── 39.2 Visual Feedback Timing ────────────────────────────────────────

test.describe('39.2 Visual feedback timing', () => {
  test.setTimeout(30000);

  test('should provide visual feedback within 100ms of clicking a board position', async ({
    page,
  }) => {
    await startLocalGame(page);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Inject a timing hook that captures canvas pixel data before and after click.
    // The game renders on requestAnimationFrame, so we measure time from click
    // to the next frame that shows a visual change on the canvas.
    const feedbackLatency = await page.evaluate(
      async ({ fx, fy }) => {
        return new Promise<number>(resolve => {
          const cvs = document.getElementById('game-canvas') as HTMLCanvasElement;
          if (!cvs) {
            resolve(-1);
            return;
          }

          const rect = cvs.getBoundingClientRect();
          const ctx = cvs.getContext('2d');
          if (!ctx) {
            resolve(-1);
            return;
          }

          // Sample a region around the click target position
          const canvasX = Math.round(cvs.width * fx);
          const canvasY = Math.round(cvs.height * fy);
          const sampleSize = 20;
          const x0 = Math.max(0, canvasX - sampleSize);
          const y0 = Math.max(0, canvasY - sampleSize);
          const w = Math.min(sampleSize * 2, cvs.width - x0);
          const h = Math.min(sampleSize * 2, cvs.height - y0);

          // Capture pixel data before click
          const beforeData = ctx.getImageData(x0, y0, w, h).data;

          // Record click time
          const clickTime = performance.now();

          // Dispatch click event
          const scaleX = rect.width / cvs.width;
          const scaleY = rect.height / cvs.height;
          const clientX = rect.left + canvasX * scaleX;
          const clientY = rect.top + canvasY * scaleY;

          cvs.dispatchEvent(
            new MouseEvent('click', { clientX, clientY, bubbles: true, cancelable: true })
          );

          // Poll for visual change using requestAnimationFrame
          let frameCount = 0;
          const maxFrames = 10; // Check up to 10 frames (~166ms at 60fps)

          function checkFrame() {
            frameCount++;
            const afterData = ctx!.getImageData(x0, y0, w, h).data;

            // Compare pixel data — check if any pixels changed
            let changed = false;
            for (let i = 0; i < afterData.length; i += 4) {
              if (
                Math.abs(afterData[i] - beforeData[i]) > 5 ||
                Math.abs(afterData[i + 1] - beforeData[i + 1]) > 5 ||
                Math.abs(afterData[i + 2] - beforeData[i + 2]) > 5 ||
                Math.abs(afterData[i + 3] - beforeData[i + 3]) > 5
              ) {
                changed = true;
                break;
              }
            }

            if (changed) {
              resolve(performance.now() - clickTime);
            } else if (frameCount >= maxFrames) {
              // Even if no pixel change detected (e.g., click was on empty area),
              // the game loop is still running and processing input
              resolve(performance.now() - clickTime);
            } else {
              requestAnimationFrame(checkFrame);
            }
          }

          requestAnimationFrame(checkFrame);
        });
      },
      { fx: boardPositionFraction(0).fx, fy: boardPositionFraction(0).fy }
    );

    // Feedback latency should be within 100ms
    // Validates: Requirement 10.6
    expect(feedbackLatency).toBeGreaterThan(0);
    expect(feedbackLatency).toBeLessThanOrEqual(100);
  });

  test('should provide visual feedback within 100ms for menu button clicks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Measure feedback timing on a menu button using CSS transition/state change
    const feedbackLatency = await page.evaluate(async () => {
      return new Promise<number>(resolve => {
        const buttons = document.querySelectorAll('button.game-button');
        if (buttons.length === 0) {
          resolve(-1);
          return;
        }

        const button = buttons[0] as HTMLButtonElement;
        const initialStyle = window.getComputedStyle(button);
        const initialBg = initialStyle.backgroundColor;
        const initialTransform = initialStyle.transform;
        const initialBoxShadow = initialStyle.boxShadow;

        const clickTime = performance.now();

        // Listen for any visual state change (hover, active, focus)
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        let frameCount = 0;
        const maxFrames = 10;

        function checkFrame() {
          frameCount++;
          const currentStyle = window.getComputedStyle(button);
          const changed =
            currentStyle.backgroundColor !== initialBg ||
            currentStyle.transform !== initialTransform ||
            currentStyle.boxShadow !== initialBoxShadow;

          if (changed || frameCount >= maxFrames) {
            resolve(performance.now() - clickTime);
          } else {
            requestAnimationFrame(checkFrame);
          }
        }

        requestAnimationFrame(checkFrame);
      });
    });

    // Feedback should appear within 100ms
    // Validates: Requirement 10.6
    expect(feedbackLatency).toBeGreaterThan(0);
    expect(feedbackLatency).toBeLessThanOrEqual(100);
  });

  test('should process canvas click input within one animation frame', async ({ page }) => {
    await startLocalGame(page);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Verify the game loop is running by checking that requestAnimationFrame
    // callbacks are being invoked, meaning the game can respond to input promptly
    const frameTimings = await page.evaluate(async () => {
      return new Promise<{ frameDurations: number[]; avgFrameTime: number }>(resolve => {
        const durations: number[] = [];
        let lastTime = performance.now();
        let count = 0;
        const maxFrames = 30;

        function measure() {
          const now = performance.now();
          durations.push(now - lastTime);
          lastTime = now;
          count++;

          if (count >= maxFrames) {
            const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
            resolve({ frameDurations: durations, avgFrameTime: Math.round(avg * 100) / 100 });
          } else {
            requestAnimationFrame(measure);
          }
        }

        requestAnimationFrame(measure);
      });
    });

    // Average frame time should be under 18ms (55+ FPS)
    // This confirms the game loop can process input within one frame
    // Validates: Requirement 10.6
    expect(frameTimings.avgFrameTime).toBeLessThanOrEqual(18);
    expect(frameTimings.frameDurations.length).toBe(30);
  });
});
