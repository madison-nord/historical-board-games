import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIManager } from './UIManager';
import { InfoPage } from './InfoPage';

describe('InfoPage integration', () => {
  let uiManager: UIManager;
  let infoPage: InfoPage;

  beforeEach(() => {
    uiManager = new UIManager();
    infoPage = new InfoPage();
    document.querySelectorAll('.info-page').forEach(el => el.remove());
    document.querySelectorAll('dialog').forEach(d => d.remove());
  });

  afterEach(() => {
    infoPage.close();
    uiManager.closeCurrentDialog();
    document.querySelectorAll('.info-page').forEach(el => el.remove());
    document.querySelectorAll('dialog').forEach(d => d.remove());
  });

  describe('accessibility from main menu', () => {
    it('clicking History & Rules button triggers the info page callback', () => {
      const callback = vi.fn();
      uiManager.setOnInfoPageRequested(callback);
      uiManager.showMainMenu();

      const btn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent === 'History & Rules'
      );
      expect(btn).not.toBeUndefined();
      btn?.click();

      expect(callback).toHaveBeenCalledOnce();
    });

    it('info page can be opened from main menu without starting a game', () => {
      uiManager.setOnInfoPageRequested(() => {
        uiManager.closeCurrentDialog();
        infoPage.show();
      });
      uiManager.showMainMenu();

      const btn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent === 'History & Rules'
      );
      btn?.click();

      expect(infoPage.isOpen()).toBe(true);
      const page = document.querySelector('.info-page');
      expect(page).not.toBeNull();
    });

    it('main menu dialog is closed when info page opens', () => {
      uiManager.setOnInfoPageRequested(() => {
        uiManager.closeCurrentDialog();
        infoPage.show();
      });
      uiManager.showMainMenu();

      const btn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent === 'History & Rules'
      );
      btn?.click();

      // Main menu dialog should be closed
      const mainMenu = document.querySelector('.main-menu-dialog');
      expect(mainMenu).toBeNull();
      // Info page should be open
      const page = document.querySelector('.info-page');
      expect(page).not.toBeNull();
    });

    it('no open dialog elements exist when info page is displayed', () => {
      uiManager.setOnInfoPageRequested(() => {
        uiManager.closeCurrentDialog();
        infoPage.show();
      });
      uiManager.showMainMenu();

      const btn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent === 'History & Rules'
      );
      btn?.click();

      const openDialogs = document.querySelectorAll('dialog[open]');
      expect(openDialogs.length).toBe(0);
    });

    it('clicking Back to Menu removes info page and restores main menu', () => {
      infoPage.setOnBackToMenu(() => {
        infoPage.close();
        uiManager.showMainMenu();
      });
      infoPage.show();

      expect(infoPage.isOpen()).toBe(true);

      const backBtn = document.querySelector('.info-page-back') as HTMLButtonElement;
      expect(backBtn).not.toBeNull();
      backBtn.click();

      expect(infoPage.isOpen()).toBe(false);
      // Main menu should be restored
      const mainMenu = document.querySelector('.main-menu-dialog');
      expect(mainMenu).not.toBeNull();
    });

    it('after navigating back, main menu contains all game mode buttons', () => {
      infoPage.setOnBackToMenu(() => {
        infoPage.close();
        uiManager.showMainMenu();
      });
      infoPage.show();

      const backBtn = document.querySelector('.info-page-back') as HTMLButtonElement;
      backBtn.click();

      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent);
      expect(buttons).toContain('Single Player');
      expect(buttons).toContain('Local Two Player');
      expect(buttons).toContain('Tutorial');
      expect(buttons).toContain('History & Rules');
    });
  });

  describe('required sections present', () => {
    it('contains both history and rules sections when shown', () => {
      infoPage.show();
      const body = document.querySelector('.info-page-body');
      expect(body).not.toBeNull();

      const sections = body!.querySelectorAll('.info-section');
      expect(sections.length).toBe(2);
    });

    it('history section has proper heading', () => {
      infoPage.show();
      const heading = document.getElementById('history-heading');
      expect(heading).not.toBeNull();
      expect(heading!.textContent).toContain('Older Than Empires');
    });

    it('rules section has proper heading', () => {
      infoPage.show();
      const heading = document.getElementById('rules-heading');
      expect(heading).not.toBeNull();
      expect(heading!.textContent).toContain('How to Play');
    });

    it('rules section contains all game phase subsections', () => {
      infoPage.show();
      const body = document.querySelector('.info-page-body')!;
      const subsections = body.querySelectorAll('.info-subsection-title');
      const titles = Array.from(subsections).map(el => el.textContent);

      expect(titles).toContain('Phase 1 — Placement');
      expect(titles).toContain('Phase 2 — Movement');
      expect(titles).toContain('Phase 3 — Flying');
      expect(titles).toContain('Forming a Mill');
      expect(titles).toContain('Winning the Game');
    });
  });

  describe('diagrams present', () => {
    it('contains the board layout diagram as an img element', () => {
      infoPage.show();
      const imgs = document.querySelectorAll('img.info-diagram');
      const boardImg = Array.from(imgs).find(img =>
        img.getAttribute('alt')?.includes('Board layout diagram')
      );
      expect(boardImg).not.toBeUndefined();
    });

    it('contains the movement diagram as an img element', () => {
      infoPage.show();
      const imgs = document.querySelectorAll('img.info-diagram');
      const movementImg = Array.from(imgs).find(img =>
        img.getAttribute('alt')?.includes('Movement diagram')
      );
      expect(movementImg).not.toBeUndefined();
    });

    it('contains the mill example diagram as an img element', () => {
      infoPage.show();
      const imgs = document.querySelectorAll('img.info-diagram');
      const millImg = Array.from(imgs).find(img =>
        img.getAttribute('alt')?.includes('Mill example')
      );
      expect(millImg).not.toBeUndefined();
    });

    it('has exactly three diagram images with alt text', () => {
      infoPage.show();
      const imgs = document.querySelectorAll('img.info-diagram[alt]');
      expect(imgs.length).toBe(3);
    });

    it('diagrams have associated captions', () => {
      infoPage.show();
      const captions = document.querySelectorAll('.info-diagram-caption');
      expect(captions.length).toBe(3);
    });

    it('no pre elements exist in the page body', () => {
      infoPage.show();
      const body = document.querySelector('.info-page-body');
      expect(body).not.toBeNull();
      const preElements = body!.querySelectorAll('pre');
      expect(preElements.length).toBe(0);
    });
  });
});
