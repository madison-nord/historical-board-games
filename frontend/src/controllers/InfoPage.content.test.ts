import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InfoPage } from './InfoPage.js';

describe('InfoPage content', () => {
  let infoPage: InfoPage;

  beforeEach(() => {
    infoPage = new InfoPage();
  });

  afterEach(() => {
    infoPage.close();
  });

  describe('getHistoryContent', () => {
    it('returns non-empty HTML string', () => {
      const content = infoPage.getHistoryContent();
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('<section');
    });

    it('contains historical references to ancient origins', () => {
      const content = infoPage.getHistoryContent();
      expect(content).toContain('1400 BCE');
      expect(content).toContain('Egyptian');
    });

    it('mentions archaeological finds', () => {
      const content = infoPage.getHistoryContent();
      expect(content).toContain('Roman');
      expect(content).toContain('medieval');
    });

    it('explains the name origin', () => {
      const content = infoPage.getHistoryContent();
      expect(content).toContain('merellus');
    });

    it('mentions international names for the game', () => {
      const content = infoPage.getHistoryContent();
      expect(content).toContain('Mühle');
      expect(content).toContain('Morabaraba');
    });
  });

  describe('getRulesContent', () => {
    it('returns non-empty HTML string', () => {
      const content = infoPage.getRulesContent();
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('<section');
    });

    it('explains all three game phases', () => {
      const content = infoPage.getRulesContent();
      expect(content).toContain('Placement');
      expect(content).toContain('Movement');
      expect(content).toContain('Flying');
    });

    it('explains mill formation', () => {
      const content = infoPage.getRulesContent();
      expect(content).toContain('mill');
      expect(content).toContain('three');
      expect(content).toContain('straight line');
    });

    it('explains piece removal after forming a mill', () => {
      const content = infoPage.getRulesContent();
      expect(content).toContain('remove');
      expect(content).toContain("opponent's piece");
    });

    it('explains the mill protection rule', () => {
      const content = infoPage.getRulesContent();
      expect(content).toContain('cannot remove a piece that is currently part');
    });

    it('explains win conditions', () => {
      const content = infoPage.getRulesContent();
      expect(content).toContain('fewer than three pieces');
      expect(content).toContain('no legal moves');
    });

    it('explains the flying phase ability', () => {
      const content = infoPage.getRulesContent();
      expect(content).toContain('any empty position');
    });

    it('mentions nine pieces per player', () => {
      const content = infoPage.getRulesContent();
      expect(content).toContain('nine pieces');
    });

    it('mentions 24 positions on the board', () => {
      const content = infoPage.getRulesContent();
      expect(content).toContain('24');
    });
  });

  describe('show and close', () => {
    it('opens a page when show is called', () => {
      infoPage.show();
      expect(infoPage.isOpen()).toBe(true);
      const page = document.querySelector('.info-page');
      expect(page).not.toBeNull();
    });

    it('closes the page when close is called', () => {
      infoPage.show();
      infoPage.close();
      expect(infoPage.isOpen()).toBe(false);
      const page = document.querySelector('.info-page');
      expect(page).toBeNull();
    });

    it('page contains history and rules content', () => {
      infoPage.show();
      const body = document.querySelector('.info-page-body');
      expect(body).not.toBeNull();
      expect(body!.innerHTML).toContain('Older Than Empires');
      expect(body!.innerHTML).toContain('How to Play');
    });

    it('page has a Back to Menu button', () => {
      infoPage.show();
      const btn = document.querySelector('.info-page-back');
      expect(btn).not.toBeNull();
      expect(btn!.textContent).toBe('Back to Menu');
    });

    it('diagrams use img elements instead of pre elements', () => {
      infoPage.show();
      const body = document.querySelector('.info-page-body');
      expect(body).not.toBeNull();
      const preElements = body!.querySelectorAll('pre');
      expect(preElements.length).toBe(0);
      const imgElements = body!.querySelectorAll('img.info-diagram');
      expect(imgElements.length).toBe(3);
      imgElements.forEach(img => {
        expect(img.getAttribute('alt')).toBeTruthy();
      });
    });

    it('isOpen returns false before show is called', () => {
      expect(infoPage.isOpen()).toBe(false);
    });
  });
});
