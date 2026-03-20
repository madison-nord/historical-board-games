import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  describe('piece shadow centering', () => {
    it('should draw piece shadow at same center as piece position (no offset)', () => {
      // Access the private drawPiece method via the renderer's context
      // We verify by spying on the context's arc method before rendering
      const ctx = (renderer as any).ctx as CanvasRenderingContext2D;
      const arcCalls: { x: number; y: number; radius: number }[] = [];
      const originalArc = ctx.arc.bind(ctx);
      vi.spyOn(ctx, 'arc').mockImplementation(
        (x: number, y: number, radius: number, ...rest: unknown[]) => {
          arcCalls.push({ x, y, radius });
          return originalArc(x, y, radius, ...(rest as [number, number, boolean?]));
        }
      );

      const board = new Array(24).fill(null);
      board[0] = PlayerColor.WHITE;
      renderer.render(board, null, []);

      const pos = renderer.getPositionCoordinates(0);

      // All arc calls for this piece should be centered on pos.x, pos.y
      // (the shadow, the piece fill, and the stroke are all at the same center)
      // Filter arcs that are near position 0's coordinates
      const pieceArcs = arcCalls.filter(
        c => Math.abs(c.x - pos.x) < 1 && Math.abs(c.y - pos.y) < 1
      );
      // At minimum: shadow arc + piece arc (gradient try/catch may skip highlight)
      expect(pieceArcs.length).toBeGreaterThanOrEqual(2);

      // Verify NO arcs are drawn at the old offset position (+2, +3)
      const oldOffsetArcs = arcCalls.filter(
        c => Math.abs(c.x - (pos.x + 2)) < 0.5 && Math.abs(c.y - (pos.y + 3)) < 0.5
      );
      expect(oldOffsetArcs.length).toBe(0);
    });
  });

  describe('infoPanelActive flag', () => {
    it('should skip drawGameInfo when infoPanelActive is true', () => {
      const drawGameInfoSpy = vi.spyOn(renderer as any, 'drawGameInfo');
      const board = new Array(24).fill(null);

      renderer.setInfoPanelActive(true);
      renderer.render(board, PlayerColor.WHITE, GamePhase.PLACEMENT, 9, 9, 16);

      expect(drawGameInfoSpy).not.toHaveBeenCalled();
    });

    it('should call drawGameInfo when infoPanelActive is set back to false', () => {
      const drawGameInfoSpy = vi.spyOn(renderer as any, 'drawGameInfo');
      const board = new Array(24).fill(null);

      // Activate info panel, then deactivate
      renderer.setInfoPanelActive(true);
      renderer.setInfoPanelActive(false);
      renderer.render(board, PlayerColor.WHITE, GamePhase.PLACEMENT, 9, 9, 16);

      expect(drawGameInfoSpy).toHaveBeenCalled();
    });
  });
});
