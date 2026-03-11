import { describe, it, expect, beforeEach } from 'vitest';
import { BoardRenderer } from './BoardRenderer';
import { PlayerColor, GamePhase } from '../models/index.js';

describe('BoardRenderer', () => {
  let canvas: HTMLCanvasElement;
  let renderer: BoardRenderer;

  beforeEach(() => {
    // Create a container for the canvas
    const container = document.createElement('div');

    // Mock clientWidth and clientHeight since they return 0 in test environment
    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(container, 'clientHeight', {
      configurable: true,
      value: 600,
    });

    document.body.appendChild(container);

    // Create canvas and add to container
    canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Create renderer
    renderer = new BoardRenderer(canvas);
  });

  describe('initialization', () => {
    it('should initialize with correct canvas dimensions', () => {
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });

    it('should initialize 24 position coordinates', () => {
      // Test that we can get coordinates for all 24 positions
      for (let i = 0; i < 24; i++) {
        const coords = renderer.getPositionCoordinates(i);
        expect(coords).toBeDefined();
        expect(coords.x).toBeGreaterThanOrEqual(0);
        expect(coords.y).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('clickable positions', () => {
    it('should allow setting clickable positions', () => {
      renderer.setClickablePositions([0, 1, 2]);
      expect(renderer.isPositionClickable(0)).toBe(true);
      expect(renderer.isPositionClickable(1)).toBe(true);
      expect(renderer.isPositionClickable(2)).toBe(true);
      expect(renderer.isPositionClickable(3)).toBe(false);
    });

    it('should allow all positions when set to null', () => {
      renderer.setClickablePositions(null);
      for (let i = 0; i < 24; i++) {
        expect(renderer.isPositionClickable(i)).toBe(true);
      }
    });

    it('should return correct clickable positions', () => {
      const positions = [5, 10, 15];
      renderer.setClickablePositions(positions);
      expect(renderer.getClickablePositions()).toEqual(positions);
    });
  });

  describe('render', () => {
    it('should render without errors', () => {
      const emptyBoard = new Array(24).fill(null);
      expect(() => {
        renderer.render(emptyBoard, PlayerColor.WHITE, GamePhase.PLACEMENT, 9, 9, 16);
      }).not.toThrow();
    });

    it('should render with pieces on board', () => {
      const board = new Array(24).fill(null);
      board[0] = PlayerColor.WHITE;
      board[8] = PlayerColor.BLACK;

      expect(() => {
        renderer.render(board, PlayerColor.WHITE, GamePhase.PLACEMENT, 8, 8, 16);
      }).not.toThrow();
    });
  });

  describe('input handling', () => {
    it('should enable and disable input', () => {
      renderer.setInputEnabled(true);
      expect(renderer.isInputEnabledState()).toBe(true);

      renderer.setInputEnabled(false);
      expect(renderer.isInputEnabledState()).toBe(false);
    });

    it('should set position click callback', () => {
      let clickedPosition: number | null = null;
      renderer.setOnPositionClick(pos => {
        clickedPosition = pos;
      });

      // Simulate a click by calling handlePositionClick directly
      renderer.handlePositionClick(5);
      expect(clickedPosition).toBe(5);
    });
  });

  describe('animations', () => {
    it('should track active animations', () => {
      expect(renderer.hasActiveAnimations()).toBe(false);

      // Start an animation
      renderer.animatePlacement(0, PlayerColor.WHITE);
      expect(renderer.hasActiveAnimations()).toBe(true);
    });

    it('should clear animations', () => {
      renderer.animatePlacement(0, PlayerColor.WHITE);
      expect(renderer.hasActiveAnimations()).toBe(true);

      renderer.clearAnimations();
      expect(renderer.hasActiveAnimations()).toBe(false);
    });
  });

  describe('position coordinates', () => {
    it('should return valid coordinates for all positions', () => {
      for (let i = 0; i < 24; i++) {
        const coords = renderer.getPositionCoordinates(i);
        expect(coords.x).toBeGreaterThan(0);
        expect(coords.y).toBeGreaterThan(0);
        expect(coords.x).toBeLessThan(canvas.width);
        expect(coords.y).toBeLessThan(canvas.height);
      }
    });

    it('should have different coordinates for different positions', () => {
      const coords0 = renderer.getPositionCoordinates(0);
      const coords1 = renderer.getPositionCoordinates(1);

      expect(coords0.x !== coords1.x || coords0.y !== coords1.y).toBe(true);
    });
  });

  describe('highlights', () => {
    it('should set valid moves for highlighting', () => {
      expect(() => {
        renderer.highlightValidMoves([0, 1, 2]);
      }).not.toThrow();
    });

    it('should clear highlights', () => {
      renderer.highlightValidMoves([0, 1, 2]);
      expect(() => {
        renderer.clearHighlights();
      }).not.toThrow();
    });

    it('should set hover position', () => {
      expect(() => {
        renderer.setHoverPosition(5);
        renderer.setHoverPosition(null);
      }).not.toThrow();
    });
  });
});
