import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { BoardRenderer } from './BoardRenderer';
import { PlayerColor } from '../models';

/**
 * Property-Based Tests for BoardRenderer Responsive Behavior
 *
 * Tests cover:
 * - Canvas resizing with arbitrary dimensions
 * - Position calculation accuracy across different sizes
 * - Rendering consistency at various scales
 * - Touch/click coordinate mapping
 * - Board layout preservation during resize
 */

describe('BoardRenderer - Responsive Behavior (Property-Based)', () => {
  let canvas: HTMLCanvasElement;
  let boardRenderer: BoardRenderer;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    document.body.removeChild(canvas);
  });

  describe('Canvas Resizing Properties', () => {
    it('should maintain square aspect ratio for any canvas size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 2000 }),
          fc.integer({ min: 200, max: 2000 }),
          (width, height) => {
            canvas.width = width;
            canvas.height = height;
            boardRenderer = new BoardRenderer(canvas);

            const boardSize = boardRenderer.getBoardSize();
            const size = Math.min(width, height);
            const padding = size * 0.1; // 10% padding
            const expectedSize = size - padding * 2;

            expect(boardSize).toBe(expectedSize);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle resize to smaller dimensions without errors', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 600, max: 1000 }),
          fc.integer({ min: 200, max: 599 }),
          (initialSize, newSize) => {
            canvas.width = initialSize;
            canvas.height = initialSize;
            boardRenderer = new BoardRenderer(canvas);

            // Resize to smaller
            canvas.width = newSize;
            canvas.height = newSize;
            boardRenderer.resize(newSize, newSize);

            const boardSize = boardRenderer.getBoardSize();
            expect(boardSize).toBeGreaterThan(0);
            expect(boardSize).toBeLessThanOrEqual(newSize);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle resize to larger dimensions without errors', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 599 }),
          fc.integer({ min: 600, max: 1500 }),
          (initialSize, newSize) => {
            canvas.width = initialSize;
            canvas.height = initialSize;
            boardRenderer = new BoardRenderer(canvas);

            // Resize to larger
            canvas.width = newSize;
            canvas.height = newSize;
            boardRenderer.resize(newSize, newSize);

            const boardSize = boardRenderer.getBoardSize();
            expect(boardSize).toBeGreaterThan(0);
            expect(boardSize).toBeLessThanOrEqual(newSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Position Calculation Properties', () => {
    it('should map all 24 positions to valid coordinates for any board size', () => {
      fc.assert(
        fc.property(fc.integer({ min: 300, max: 1200 }), size => {
          canvas.width = size;
          canvas.height = size;
          boardRenderer = new BoardRenderer(canvas);

          const board = Array(24).fill(null);
          boardRenderer.render(board, null, []);

          // All positions should be calculable
          for (let i = 0; i < 24; i++) {
            const coords = boardRenderer.getPositionCoordinates(i);
            expect(coords).toBeDefined();
            expect(coords.x).toBeGreaterThanOrEqual(0);
            expect(coords.y).toBeGreaterThanOrEqual(0);
            expect(coords.x).toBeLessThanOrEqual(size);
            expect(coords.y).toBeLessThanOrEqual(size);
          }
        }),
        { numRuns: 50 }
      );
    });

    it('should maintain relative position distances across different sizes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 800 }),
          fc.integer({ min: 800, max: 1200 }),
          (smallSize, largeSize) => {
            // Render at small size
            canvas.width = smallSize;
            canvas.height = smallSize;
            const smallRenderer = new BoardRenderer(canvas);
            const board = Array(24).fill(null);
            smallRenderer.render(board, null, []);

            const smallCoords0 = smallRenderer.getPositionCoordinates(0);
            const smallCoords1 = smallRenderer.getPositionCoordinates(1);
            const smallDistance = Math.sqrt(
              Math.pow(smallCoords1.x - smallCoords0.x, 2) +
                Math.pow(smallCoords1.y - smallCoords0.y, 2)
            );

            // Render at large size
            canvas.width = largeSize;
            canvas.height = largeSize;
            const largeRenderer = new BoardRenderer(canvas);
            largeRenderer.render(board, null, []);

            const largeCoords0 = largeRenderer.getPositionCoordinates(0);
            const largeCoords1 = largeRenderer.getPositionCoordinates(1);
            const largeDistance = Math.sqrt(
              Math.pow(largeCoords1.x - largeCoords0.x, 2) +
                Math.pow(largeCoords1.y - largeCoords0.y, 2)
            );

            // Distance should scale proportionally based on board size (not canvas size)
            // Board size = canvas size - 2 * padding, where padding = canvas size * 0.1
            const smallBoardSize = smallSize - smallSize * 0.1 * 2;
            const largeBoardSize = largeSize - largeSize * 0.1 * 2;
            const ratio = largeDistance / smallDistance;
            const expectedRatio = largeBoardSize / smallBoardSize;

            expect(Math.abs(ratio - expectedRatio)).toBeLessThan(0.1);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Click Coordinate Mapping Properties', () => {
    it('should map click coordinates to valid positions or null', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 1000 }),
          fc.integer({ min: 0, max: 999 }),
          fc.integer({ min: 0, max: 999 }),
          (size, clickX, clickY) => {
            canvas.width = size;
            canvas.height = size;
            boardRenderer = new BoardRenderer(canvas);

            const board = Array(24).fill(null);
            boardRenderer.render(board, null, []);

            const position = boardRenderer.getPositionFromCoordinates(clickX, clickY);

            // Position should be valid index or null
            if (position !== null) {
              expect(position).toBeGreaterThanOrEqual(0);
              expect(position).toBeLessThan(24);
            }
          }
        ),
        { numRuns: 200 }
      );
    });

    it('should consistently map position center coordinates back to same position', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 1000 }),
          fc.integer({ min: 0, max: 23 }),
          (size, position) => {
            canvas.width = size;
            canvas.height = size;
            boardRenderer = new BoardRenderer(canvas);

            const board = Array(24).fill(null);
            boardRenderer.render(board, null, []);

            const coords = boardRenderer.getPositionCoordinates(position);
            const mappedPosition = boardRenderer.getPositionFromCoordinates(coords.x, coords.y);

            expect(mappedPosition).toBe(position);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Rendering Consistency Properties', () => {
    it('should render board with any valid piece configuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 800 }),
          fc.array(fc.constantFrom(null, PlayerColor.WHITE, PlayerColor.BLACK), {
            minLength: 24,
            maxLength: 24,
          }),
          (size, board) => {
            canvas.width = size;
            canvas.height = size;
            boardRenderer = new BoardRenderer(canvas);

            // Should not throw
            expect(() => {
              boardRenderer.render(board, null, []);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle highlighting any subset of positions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 800 }),
          fc.array(fc.integer({ min: 0, max: 23 }), { maxLength: 24 }),
          (size, highlightedPositions) => {
            canvas.width = size;
            canvas.height = size;
            boardRenderer = new BoardRenderer(canvas);

            const board = Array(24).fill(null);
            const uniquePositions = [...new Set(highlightedPositions)];

            // Should not throw
            expect(() => {
              boardRenderer.render(board, null, uniquePositions);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle selecting any valid position', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 800 }),
          fc.integer({ min: 0, max: 23 }),
          (size, selectedPosition) => {
            canvas.width = size;
            canvas.height = size;
            boardRenderer = new BoardRenderer(canvas);

            const board = Array(24).fill(null);
            board[selectedPosition] = PlayerColor.WHITE;

            // Should not throw
            expect(() => {
              boardRenderer.render(board, selectedPosition, []);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle minimum viable canvas size', () => {
      fc.assert(
        fc.property(fc.integer({ min: 100, max: 199 }), size => {
          canvas.width = size;
          canvas.height = size;
          boardRenderer = new BoardRenderer(canvas);

          const board = Array(24).fill(null);

          // Should render without errors even at small sizes
          expect(() => {
            boardRenderer.render(board, null, []);
          }).not.toThrow();

          const boardSize = boardRenderer.getBoardSize();
          expect(boardSize).toBeGreaterThan(0);
        }),
        { numRuns: 50 }
      );
    });

    it('should handle non-square canvas dimensions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 300, max: 1000 }),
          fc.integer({ min: 300, max: 1000 }),
          (width, height) => {
            fc.pre(width !== height); // Only test non-square

            canvas.width = width;
            canvas.height = height;
            boardRenderer = new BoardRenderer(canvas);

            const board = Array(24).fill(null);

            // Should render without errors
            expect(() => {
              boardRenderer.render(board, null, []);
            }).not.toThrow();

            // Board should fit within smaller dimension
            const boardSize = boardRenderer.getBoardSize();
            expect(boardSize).toBeLessThanOrEqual(Math.min(width, height));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid resize sequences', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 300, max: 1000 }), { minLength: 3, maxLength: 10 }),
          sizes => {
            canvas.width = sizes[0];
            canvas.height = sizes[0];
            boardRenderer = new BoardRenderer(canvas);

            const board = Array(24).fill(null);

            // Perform rapid resizes
            for (const size of sizes) {
              canvas.width = size;
              canvas.height = size;
              boardRenderer.resize(size, size);
              boardRenderer.render(board, null, []);
            }

            // Final state should be valid
            const finalBoardSize = boardRenderer.getBoardSize();
            expect(finalBoardSize).toBeGreaterThan(0);
            expect(finalBoardSize).toBeLessThanOrEqual(sizes[sizes.length - 1]);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Correctness Properties', () => {
    it('Property: Board size is always positive and less than canvas size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 2000 }),
          fc.integer({ min: 200, max: 2000 }),
          (width, height) => {
            canvas.width = width;
            canvas.height = height;
            boardRenderer = new BoardRenderer(canvas);

            const boardSize = boardRenderer.getBoardSize();

            expect(boardSize).toBeGreaterThan(0);
            expect(boardSize).toBeLessThanOrEqual(Math.min(width, height));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Position coordinates are within canvas bounds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 300, max: 1200 }),
          fc.integer({ min: 0, max: 23 }),
          (size, position) => {
            canvas.width = size;
            canvas.height = size;
            boardRenderer = new BoardRenderer(canvas);

            const board = Array(24).fill(null);
            boardRenderer.render(board, null, []);

            const coords = boardRenderer.getPositionCoordinates(position);

            expect(coords.x).toBeGreaterThanOrEqual(0);
            expect(coords.y).toBeGreaterThanOrEqual(0);
            expect(coords.x).toBeLessThanOrEqual(size);
            expect(coords.y).toBeLessThanOrEqual(size);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Resize preserves position mapping consistency', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 800 }),
          fc.integer({ min: 400, max: 800 }),
          fc.integer({ min: 0, max: 23 }),
          (size1, size2, position) => {
            // Render at first size
            canvas.width = size1;
            canvas.height = size1;
            boardRenderer = new BoardRenderer(canvas);
            const board = Array(24).fill(null);
            boardRenderer.render(board, null, []);

            // Resize to second size
            canvas.width = size2;
            canvas.height = size2;
            boardRenderer.resize(size2, size2);
            boardRenderer.render(board, null, []);

            // Position should still be valid
            const coords = boardRenderer.getPositionCoordinates(position);
            expect(coords).toBeDefined();
            expect(coords.x).toBeGreaterThanOrEqual(0);
            expect(coords.y).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
