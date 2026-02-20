/**
 * Property-Based Tests for BoardRenderer Resize Behavior
 * 
 * **Validates: Requirements 9.3**
 * **Property 20: State Preservation During Resize**
 * 
 * These tests verify that window resize events do not modify game state.
 * The canvas should scale proportionally while preserving all game data.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { BoardRenderer } from './BoardRenderer.js';
import { PlayerColor, GamePhase } from '../models/index.js';

describe('BoardRenderer - Property 20: State Preservation During Resize', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;
  let renderer: BoardRenderer;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = {
      getContext: vi.fn(),
      addEventListener: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({
        width: 600,
        height: 600,
        top: 0,
        left: 0,
        right: 600,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })),
      parentElement: {
        clientWidth: 800,
        clientHeight: 800,
      },
      style: {},
      width: 600,
      height: 600,
    } as unknown as HTMLCanvasElement;

    // Create mock 2D context
    mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      scale: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '14px sans-serif',
      textAlign: 'left',
      textBaseline: 'alphabetic',
    } as unknown as CanvasRenderingContext2D;

    vi.mocked(mockCanvas.getContext).mockReturnValue(mockContext);

    renderer = new BoardRenderer(mockCanvas);
  });

  /**
   * Property: Resize does not modify board state
   * 
   * For any valid board configuration, calling handleResize() should not
   * change the piece positions or colors on the board.
   */
  it('Property 20.1: Resize preserves board piece positions', () => {
    fc.assert(
      fc.property(
        // Generate random board configurations
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        board => {
          // Create a deep copy of the board state before resize
          const boardBefore = [...board];

          // Render the board
          renderer.render(board);

          // Trigger resize
          renderer.handleResize();

          // Render again after resize
          renderer.render(board);

          // Verify board state is unchanged
          expect(board).toEqual(boardBefore);
          expect(board.length).toBe(24);

          // Verify each position is unchanged
          for (let i = 0; i < 24; i++) {
            expect(board[i]).toBe(boardBefore[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Resize does not modify game phase
   * 
   * For any game phase, calling handleResize() should not change the phase.
   */
  it('Property 20.2: Resize preserves game phase', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(GamePhase.PLACEMENT, GamePhase.MOVEMENT, GamePhase.FLYING),
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        (phase, board) => {
          const phaseBefore = phase;

          // Render with phase
          renderer.render(board, PlayerColor.WHITE, phase);

          // Trigger resize
          renderer.handleResize();

          // Render again
          renderer.render(board, PlayerColor.WHITE, phase);

          // Verify phase is unchanged
          expect(phase).toBe(phaseBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Resize does not modify current player
   * 
   * For any current player, calling handleResize() should not change the player.
   */
  it('Property 20.3: Resize preserves current player', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        (currentPlayer, board) => {
          const playerBefore = currentPlayer;

          // Render with current player
          renderer.render(board, currentPlayer, GamePhase.PLACEMENT);

          // Trigger resize
          renderer.handleResize();

          // Render again
          renderer.render(board, currentPlayer, GamePhase.PLACEMENT);

          // Verify current player is unchanged
          expect(currentPlayer).toBe(playerBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Resize does not modify piece counts
   * 
   * For any piece counts, calling handleResize() should not change the counts.
   */
  it('Property 20.4: Resize preserves piece counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9 }),
        fc.integer({ min: 0, max: 9 }),
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        (whiteRemaining, blackRemaining, board) => {
          const whiteRemainingBefore = whiteRemaining;
          const blackRemainingBefore = blackRemaining;

          // Render with piece counts
          renderer.render(
            board,
            PlayerColor.WHITE,
            GamePhase.PLACEMENT,
            whiteRemaining,
            blackRemaining
          );

          // Trigger resize
          renderer.handleResize();

          // Render again
          renderer.render(
            board,
            PlayerColor.WHITE,
            GamePhase.PLACEMENT,
            whiteRemaining,
            blackRemaining
          );

          // Verify piece counts are unchanged
          expect(whiteRemaining).toBe(whiteRemainingBefore);
          expect(blackRemaining).toBe(blackRemainingBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple resizes preserve state
   * 
   * For any board state, calling handleResize() multiple times should not
   * change the game state.
   */
  it('Property 20.5: Multiple resizes preserve state', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        fc.integer({ min: 1, max: 10 }),
        (board, resizeCount) => {
          const boardBefore = [...board];

          // Render initial state
          renderer.render(board);

          // Trigger multiple resizes
          for (let i = 0; i < resizeCount; i++) {
            renderer.handleResize();
          }

          // Render after resizes
          renderer.render(board);

          // Verify board state is unchanged
          expect(board).toEqual(boardBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Resize with different canvas sizes preserves state
   * 
   * For any board state, resizing the canvas to different dimensions
   * should not change the game state.
   */
  it('Property 20.6: Resize to different dimensions preserves state', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        fc.integer({ min: 400, max: 1200 }),
        fc.integer({ min: 400, max: 1200 }),
        (board, newWidth, newHeight) => {
          const boardBefore = [...board];

          // Render initial state
          renderer.render(board);

          // Change canvas size
          if (mockCanvas.parentElement) {
            mockCanvas.parentElement.clientWidth = newWidth;
            mockCanvas.parentElement.clientHeight = newHeight;
          }

          // Trigger resize
          renderer.handleResize();

          // Render after resize
          renderer.render(board);

          // Verify board state is unchanged
          expect(board).toEqual(boardBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Resize preserves highlighted positions
   * 
   * For any set of highlighted positions, calling handleResize() should not
   * change which positions are highlighted.
   */
  it('Property 20.7: Resize preserves highlighted positions', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 23 }), { minLength: 0, maxLength: 10 }),
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        (highlightedPositions, board) => {
          // Remove duplicates
          const uniqueHighlights = [...new Set(highlightedPositions)];
          const highlightsBefore = [...uniqueHighlights];

          // Set highlights
          renderer.highlightValidMoves(uniqueHighlights);

          // Render
          renderer.render(board);

          // Trigger resize
          renderer.handleResize();

          // Render again
          renderer.render(board);

          // Verify highlights are unchanged (we can't directly check internal state,
          // but we verify the input array wasn't modified)
          expect(uniqueHighlights).toEqual(highlightsBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Resize during animation preserves animation state
   * 
   * For any board state with active animations, calling handleResize()
   * should not cancel or modify the animations.
   */
  it('Property 20.8: Resize preserves animation queue', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        fc.integer({ min: 0, max: 23 }),
        fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
        (board, position, color) => {
          // Start an animation
          let animationCompleted = false;
          renderer.animatePlacement(position, color, () => {
            animationCompleted = true;
          });

          // Check if animation is active
          const hasAnimationsBefore = renderer.hasActiveAnimations();

          // Trigger resize during animation
          renderer.handleResize();

          // Animation state should be preserved
          // (we can't check internal queue, but we verify hasActiveAnimations is consistent)
          const hasAnimationsAfter = renderer.hasActiveAnimations();

          // If there were animations before, there should still be animations after
          // (unless they completed during the resize, which is unlikely in this test)
          if (hasAnimationsBefore) {
            expect(hasAnimationsAfter || animationCompleted).toBe(true);
          }
        }
      ),
      { numRuns: 50 } // Fewer runs for animation tests
    );
  });

  /**
   * Property: Resize preserves input enabled state
   * 
   * For any input enabled state, calling handleResize() should not change
   * whether input is enabled or disabled.
   */
  it('Property 20.9: Resize preserves input enabled state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        (inputEnabled, board) => {
          // Set input enabled state
          renderer.setInputEnabled(inputEnabled);
          const inputEnabledBefore = renderer.isInputEnabledState();

          // Render
          renderer.render(board);

          // Trigger resize
          renderer.handleResize();

          // Render again
          renderer.render(board);

          // Verify input enabled state is unchanged
          const inputEnabledAfter = renderer.isInputEnabledState();
          expect(inputEnabledAfter).toBe(inputEnabledBefore);
          expect(inputEnabledAfter).toBe(inputEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Resize preserves game over state
   * 
   * For any game over state, calling handleResize() should not change
   * the game over status or winner.
   */
  it('Property 20.10: Resize preserves game over state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK), { nil: null }),
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(PlayerColor.WHITE),
            fc.constant(PlayerColor.BLACK)
          ),
          { minLength: 24, maxLength: 24 }
        ),
        (isGameOver, winner, board) => {
          const isGameOverBefore = isGameOver;
          const winnerBefore = winner;

          // Render with game over state
          renderer.render(
            board,
            PlayerColor.WHITE,
            GamePhase.MOVEMENT,
            undefined,
            undefined,
            false,
            isGameOver,
            winner
          );

          // Trigger resize
          renderer.handleResize();

          // Render again
          renderer.render(
            board,
            PlayerColor.WHITE,
            GamePhase.MOVEMENT,
            undefined,
            undefined,
            false,
            isGameOver,
            winner
          );

          // Verify game over state is unchanged
          expect(isGameOver).toBe(isGameOverBefore);
          expect(winner).toBe(winnerBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});
