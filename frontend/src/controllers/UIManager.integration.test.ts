import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIManager } from './UIManager';

/**
 * Integration test for the Online Multiplayer flow.
 * Tests the REAL UIManager with REAL DOM to catch dialog visibility bugs.
 *
 * Bug #10: After clicking "Online Multiplayer" in main menu,
 * the matchmaking dialog is not visible - user sees only black canvas.
 */
describe('UIManager - Online Multiplayer Flow Integration', () => {
  let uiManager: UIManager;

  beforeEach(() => {
    uiManager = new UIManager();
    document.querySelectorAll('dialog').forEach(d => d.remove());
  });

  afterEach(() => {
    uiManager.closeCurrentDialog();
    document.querySelectorAll('dialog').forEach(d => d.remove());
    vi.restoreAllMocks();
  });

  it('should show matchmaking dialog after clicking Online Multiplayer', () => {
    // 1. Set up the callback that simulates what main.ts does
    uiManager.setOnGameModeSelected((mode: string) => {
      if (mode === 'online-multiplayer') {
        // This is what startOnlineMultiplayer does FIRST (synchronously)
        uiManager.showMatchmakingDialog();
      }
    });

    // 2. Show main menu
    uiManager.showMainMenu();

    // 3. Verify main menu is visible
    const mainMenuDialog = document.querySelector('.main-menu-dialog') as HTMLDialogElement;
    expect(mainMenuDialog).not.toBeNull();
    expect(mainMenuDialog.open).toBe(true);

    // 4. Click "Online Multiplayer" button
    const onlineBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent === 'Online Multiplayer'
    );
    expect(onlineBtn).not.toBeUndefined();
    onlineBtn!.click();

    // 5. Verify matchmaking dialog is now in the DOM and OPEN
    const matchmakingDialog = document.querySelector('.matchmaking-dialog') as HTMLDialogElement;
    expect(matchmakingDialog).not.toBeNull();
    expect(matchmakingDialog.open).toBe(true);

    // 6. Verify main menu dialog is gone
    const mainMenuAfterClick = document.querySelector('.main-menu-dialog');
    expect(mainMenuAfterClick).toBeNull();

    // 7. Verify matchmaking content is present
    const title = document.querySelector('.matchmaking-title');
    expect(title?.textContent).toBe('Finding Match...');

    const spinner = document.querySelector('.matchmaking-spinner');
    expect(spinner).not.toBeNull();

    const cancelBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent === 'Cancel'
    );
    expect(cancelBtn).not.toBeUndefined();
  });

  it('should only have ONE dialog in the DOM after clicking Online Multiplayer', () => {
    uiManager.setOnGameModeSelected((mode: string) => {
      if (mode === 'online-multiplayer') {
        uiManager.showMatchmakingDialog();
      }
    });

    uiManager.showMainMenu();

    const onlineBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent === 'Online Multiplayer'
    );
    onlineBtn!.click();

    // There should be exactly ONE dialog in the DOM
    const allDialogs = document.querySelectorAll('dialog');
    expect(allDialogs.length).toBe(1);
    expect(allDialogs[0].classList.contains('matchmaking-dialog')).toBe(true);
  });

  it('should show matchmaking dialog even when called rapidly after closeCurrentDialog', () => {
    // Simulate the exact sequence: closeCurrentDialog() then showMatchmakingDialog()
    uiManager.showMainMenu();

    // This is the exact sequence the Online Multiplayer button handler does
    uiManager.closeCurrentDialog();
    uiManager.showMatchmakingDialog();

    const matchmakingDialog = document.querySelector('.matchmaking-dialog') as HTMLDialogElement;
    expect(matchmakingDialog).not.toBeNull();
    expect(matchmakingDialog.open).toBe(true);
  });

  it('should call cancel callback and close matchmaking dialog when cancel is clicked', () => {
    const cancelCallback = vi.fn();
    uiManager.setOnCancelMatchmaking(cancelCallback);

    uiManager.showMatchmakingDialog();

    const cancelBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent === 'Cancel'
    );
    cancelBtn!.click();

    // Cancel callback should have been called
    expect(cancelCallback).toHaveBeenCalled();

    // Matchmaking dialog should be closed and removed
    const matchmakingDialog = document.querySelector('.matchmaking-dialog');
    expect(matchmakingDialog).toBeNull();
  });

  it('should show error dialog when connection fails, replacing matchmaking dialog', () => {
    // Simulate: showMatchmakingDialog → connection fails → showErrorDialog
    uiManager.showMatchmakingDialog();

    const matchmakingBefore = document.querySelector('.matchmaking-dialog');
    expect(matchmakingBefore).not.toBeNull();

    // Connection fails
    uiManager.showErrorDialog('Could not connect to the game server. Please try again later.');

    // Matchmaking dialog should be gone
    const matchmakingAfter = document.querySelector('.matchmaking-dialog');
    expect(matchmakingAfter).toBeNull();

    // Error dialog should be visible
    const errorDialog = document.querySelector('.error-dialog') as HTMLDialogElement;
    expect(errorDialog).not.toBeNull();
    expect(errorDialog.open).toBe(true);
  });

  it('should NOT close dialog when backdrop click handler fires with zero-sized bounding rect', () => {
    // Bug reproduction: When a dialog is opened from a button inside another dialog,
    // the click event propagates to the new dialog. At that point getBoundingClientRect()
    // may return all zeros (dialog not yet laid out in top layer), causing the
    // "click outside" handler to incorrectly close the dialog.

    // Mock requestAnimationFrame to fire immediately so the click handler becomes "ready"
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };

    uiManager.showMatchmakingDialog();

    // Restore rAF
    window.requestAnimationFrame = originalRAF;

    const dialog = document.querySelector('.matchmaking-dialog') as HTMLDialogElement;
    expect(dialog).not.toBeNull();
    expect(dialog.open).toBe(true);

    // Simulate a click event on the dialog where getBoundingClientRect returns zeros
    // This happens in real browsers when the dialog hasn't been laid out yet in the top layer
    const originalGetBCR = dialog.getBoundingClientRect.bind(dialog);
    dialog.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }) as DOMRect;

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      clientX: 274,
      clientY: 308,
    });
    dialog.dispatchEvent(clickEvent);

    // Restore original
    dialog.getBoundingClientRect = originalGetBCR;

    // Dialog should NOT have been closed — zero-sized rect means layout isn't ready
    const dialogAfterClick = document.querySelector('.matchmaking-dialog') as HTMLDialogElement;
    expect(dialogAfterClick).not.toBeNull();
    expect(dialogAfterClick.open).toBe(true);
  });
});
