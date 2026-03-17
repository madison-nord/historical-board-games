import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoardRenderer } from './BoardRenderer';
import { PlayerColor, GamePhase } from '../models/index.js';

/**
 * Tests for BoardRenderer online multiplayer fixes:
 * 1. Position coordinate mapping (client coords → canvas coords)
 * 2. Player color indicator display
 * 3. Click radius adequacy
 */
describe('BoardRenderer - Online Multiplayer Fixes', () => {
  let canvas: HTMLCanvasElement;
  let renderer: BoardRenderer;

  beforeEach(() => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(container, 'clientHeight', {
      configurable: true,
      value: 600,
    });
    document.body.appendChild(container);

    canvas = document.createElement('canvas');
    container.appendChild(canvas);
    renderer = new BoardRenderer(canvas);
  });

  describe('getPositionFromCoordinates - client coordinate conversion', () => {
    it('should always use getBoundingClientRect for coordinate conversion', () => {
      // Position 0 is at top-left of the board
      const pos0 = renderer.getPositionCoordinates(0);

      // Mock getBoundingClientRect to simulate canvas at (100, 50) in viewport
      const originalGetBoundingClientRect = canvas.getBoundingClientRect;
      canvas.getBoundingClientRect = () =>
        ({
          left: 100,
          top: 50,
          width: canvas.width,
          height: canvas.height,
          right: 100 + canvas.width,
          bottom: 50 + canvas.height,
          x: 100,
          y: 50,
          toJSON: () => ({}),
        }) as DOMRect;

      // Client coordinates = canvas position + offset from canvas origin
      const clientX = 100 + pos0.x;
      const clientY = 50 + pos0.y;

      const result = renderer.getPositionFromCoordinates(clientX, clientY);
      expect(result).toBe(0);

      // Restore
      canvas.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('should detect all 24 positions when using client coordinates', () => {
      // Mock canvas at origin for simplicity
      canvas.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: canvas.width,
          height: canvas.height,
          right: canvas.width,
          bottom: canvas.height,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;

      for (let i = 0; i < 24; i++) {
        const pos = renderer.getPositionCoordinates(i);
        const result = renderer.getPositionFromCoordinates(pos.x, pos.y);
        expect(result).toBe(i);
      }
    });

    it('should not confuse client coordinates with canvas coordinates', () => {
      // Simulate canvas positioned at (200, 200) in viewport
      canvas.getBoundingClientRect = () =>
        ({
          left: 200,
          top: 200,
          width: canvas.width,
          height: canvas.height,
          right: 200 + canvas.width,
          bottom: 200 + canvas.height,
          x: 200,
          y: 200,
          toJSON: () => ({}),
        }) as DOMRect;

      // Position 2 is top-right of outer square
      const pos2 = renderer.getPositionCoordinates(2);

      // Correct client coordinates (canvas offset + position)
      const correctResult = renderer.getPositionFromCoordinates(200 + pos2.x, 200 + pos2.y);
      expect(correctResult).toBe(2);

      // Raw canvas coordinates WITHOUT offset should NOT match position 2
      // because the method should always apply the rect conversion
      // (pos2.x, pos2.y) as client coords would map to a different canvas location
      const rawResult = renderer.getPositionFromCoordinates(pos2.x, pos2.y);
      // This should NOT be position 2 since canvas is at (200,200)
      // The raw coords would map to canvas position (pos2.x - 200, pos2.y - 200) which is negative
      expect(rawResult).not.toBe(2);
    });
  });

  describe('click radius', () => {
    it('should have a click radius of at least 5% of board size for usability', () => {
      // Position 0 coordinates
      const pos0 = renderer.getPositionCoordinates(0);
      const boardSize = renderer.getBoardSize();
      const expectedMinRadius = boardSize * 0.05;

      canvas.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: canvas.width,
          height: canvas.height,
          right: canvas.width,
          bottom: canvas.height,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;

      // Click slightly off-center should still register
      const offsetX = pos0.x + expectedMinRadius * 0.9;
      const offsetY = pos0.y;
      const result = renderer.getPositionFromCoordinates(offsetX, offsetY);
      expect(result).toBe(0);
    });
  });

  describe('player color indicator', () => {
    it('should accept playerColor parameter in render for online mode', () => {
      const emptyBoard = new Array(24).fill(null);
      // render should accept an optional playerColor parameter for online mode
      expect(() => {
        renderer.render(
          emptyBoard,
          PlayerColor.WHITE,
          GamePhase.PLACEMENT,
          9,
          9,
          16,
          PlayerColor.BLACK // "You are BLACK"
        );
      }).not.toThrow();
    });

    it('should display player color info when playerColor is provided', () => {
      const emptyBoard = new Array(24).fill(null);

      // Access the renderer's internal context via the canvas
      // In jsdom, getContext('2d') may return a new object each time,
      // so we need to spy before the renderer is created
      // Instead, verify by accessing the renderer's ctx through a known method
      const fillTextCalls: string[] = [];

      // Override fillText on the renderer's actual context by patching it
      // We can access it indirectly: the renderer stores ctx from canvas.getContext('2d')
      // In jsdom, repeated getContext('2d') calls return the same object
      // Let's verify by patching before render
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const origFillText = ctx.fillText;
        vi.spyOn(ctx, 'fillText').mockImplementation(
          (text: string, _x: number, _y: number, _maxWidth?: number) => {
            fillTextCalls.push(String(text));
            origFillText.call(ctx, text, _x, _y);
          }
        );
      }

      renderer.render(
        emptyBoard,
        PlayerColor.WHITE,
        GamePhase.PLACEMENT,
        9,
        9,
        16,
        PlayerColor.WHITE
      );

      // If fillTextCalls is empty, the context objects differ between getContext calls
      // In that case, verify the feature works by checking render doesn't throw
      // and the parameter is accepted (covered by previous test)
      if (fillTextCalls.length > 0) {
        const hasPlayerColorInfo = fillTextCalls.some(
          text => text.includes('You are') || text.includes('You:')
        );
        expect(hasPlayerColorInfo).toBe(true);
      } else {
        // jsdom returns different context objects - verify via a different approach
        // Create a fresh renderer where we can intercept the context
        const canvas2 = document.createElement('canvas');
        canvas2.width = 600;
        canvas2.height = 600;
        const container2 = document.createElement('div');
        Object.defineProperty(container2, 'clientWidth', { value: 600, configurable: true });
        Object.defineProperty(container2, 'clientHeight', { value: 600, configurable: true });
        document.body.appendChild(container2);
        container2.appendChild(canvas2);

        // Patch getContext to intercept the context before BoardRenderer stores it
        const realGetContext = canvas2.getContext.bind(canvas2);
        const calls2: string[] = [];
        canvas2.getContext = function (contextId: string, ...args: unknown[]) {
          const ctx2 = realGetContext(contextId, ...args);
          if (ctx2 && contextId === '2d') {
            const origFT = (ctx2 as CanvasRenderingContext2D).fillText;
            (ctx2 as CanvasRenderingContext2D).fillText = function (
              text: string,
              x: number,
              y: number,
              maxWidth?: number
            ) {
              calls2.push(String(text));
              origFT.call(this, text, x, y, maxWidth);
            };
          }
          return ctx2;
        } as typeof canvas2.getContext;

        const renderer2 = new BoardRenderer(canvas2);
        renderer2.render(
          emptyBoard,
          PlayerColor.WHITE,
          GamePhase.PLACEMENT,
          9,
          9,
          16,
          PlayerColor.WHITE
        );

        const hasInfo = calls2.some(text => text.includes('You are') || text.includes('You:'));
        expect(hasInfo).toBe(true);
      }
    });
  });
});
