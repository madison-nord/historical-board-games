/**
 * Post-Task 34 Bugfixes — Bug Condition Exploration Tests
 *
 * These tests encode the EXPECTED (correct) behavior for all 6 bugs.
 * They are written BEFORE any fixes and should FAIL on the current unfixed code,
 * proving the bugs exist.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameController } from './GameController';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { UIManager } from './UIManager';
import { InfoPanel } from './InfoPanel';
import { ChatPanel } from './ChatPanel';
import { GameMode, GamePhase, PlayerColor } from '../models';

describe('Post-Task 34 Bug Condition Exploration Tests', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    if (canvas.parentNode) {
      document.body.removeChild(canvas);
    }
  });

  // =========================================================================
  // Bug 1 — InfoPanel Initial Content
  // Validates: Requirements 1.1, 1.2
  // =========================================================================
  describe('Bug 1 — InfoPanel Initial Content on Online Game Start', () => {
    it('should have non-empty text content after creation and update with initial game state', () => {
      // Simulate what onlineMultiplayer.ts does: create GC, setBoardState, setInfoPanel
      const boardRenderer = new BoardRenderer(canvas);
      const infoPanel = new InfoPanel();
      infoPanel.create();

      const gc = new GameController(GameMode.ONLINE_MULTIPLAYER, boardRenderer, PlayerColor.WHITE);

      // Set initial board state (what onlineMultiplayer.ts does on game start)
      gc.setBoardState({
        gameId: 'test-game',
        phase: GamePhase.PLACEMENT,
        currentPlayer: PlayerColor.WHITE,
        whitePiecesRemaining: 9,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 0,
        blackPiecesOnBoard: 0,
        board: new Array(24).fill(null),
        isGameOver: false,
        winner: null,
        millFormed: false,
      });

      // Wire up InfoPanel AFTER setBoardState (matches onlineMultiplayer.ts flow)
      gc.setInfoPanel(infoPanel);

      // At this point in the unfixed code, no explicit infoPanel.update() is called.
      // The InfoPanel should have content, but on unfixed code it will be empty.
      const turnEl = document.querySelector('.info-panel-turn');
      const phaseEl = document.querySelector('.info-panel-phase');
      const actionEl = document.querySelector('.info-panel-action');

      // Expected: non-empty text content immediately after setup
      expect(turnEl?.textContent).toBeTruthy();
      expect(turnEl?.textContent).not.toBe('');
      expect(phaseEl?.textContent).toBeTruthy();
      expect(phaseEl?.textContent).not.toBe('');
      expect(actionEl?.textContent).toBeTruthy();
      expect(actionEl?.textContent).not.toBe('');

      gc.stopGameLoop();
      infoPanel.destroy();
    });
  });

  // =========================================================================
  // Bug 2 — ChatPanel Overflow
  // Validates: Requirements 1.3, 1.4
  // =========================================================================
  describe('Bug 2 — ChatPanel Overflow', () => {
    it('should have proper DOM structure with overflow constraints on chat-panel', () => {
      // Create a container simulating the grid column width
      const container = document.createElement('div');
      container.id = 'app';
      container.style.width = '280px';
      document.body.appendChild(container);

      const chatPanel = new ChatPanel();
      chatPanel.show();

      const panelEl = document.querySelector('.chat-panel') as HTMLElement;
      expect(panelEl).toBeTruthy();

      // The chat-panel should have overflow constraints to prevent growth
      // On unfixed code, the panel lacks overflow: hidden
      const computedStyle = window.getComputedStyle(panelEl);

      // Check that the panel has overflow hidden or a fixed height to prevent growth
      // The CSS bug means the panel can grow unbounded
      const hasOverflowConstraint =
        computedStyle.overflow === 'hidden' ||
        computedStyle.overflowY === 'hidden' ||
        (computedStyle.height !== '' && computedStyle.height !== 'auto');

      expect(hasOverflowConstraint).toBe(true);

      chatPanel.destroy();
      container.remove();
    });
  });

  // =========================================================================
  // Bug 3 — Online Game Result Message
  // Validates: Requirement 1.5
  // =========================================================================
  describe('Bug 3 — Online Game Result Message', () => {
    it('should accept gameMode and localPlayerColor parameters in showGameResult', () => {
      const uiManager = new UIManager();

      // The fixed showGameResult should accept gameMode and localPlayerColor
      // On unfixed code, the method signature is: showGameResult(winner, isOnlineGame)
      // It does NOT accept gameMode/localPlayerColor, so it always shows "White Wins!"/"Black Wins!"

      // Call showGameResult with mode-aware parameters
      // If the method accepts these params, it should show "You Won!" for the local player
      // Check the method signature accepts at least 4 parameters (winner, isOnline, gameMode, localPlayerColor)
      // On unfixed code, showGameResult only accepts 2 params: (winner, isOnlineGame)
      // We test that calling with mode-aware params produces "You Won!" instead of "White Wins!"
      (uiManager as any).showGameResult(
        PlayerColor.WHITE,
        true,
        GameMode.ONLINE_MULTIPLAYER,
        PlayerColor.WHITE
      );

      // Check the dialog title
      const resultTitle = document.querySelector('.result-title');
      expect(resultTitle).toBeTruthy();

      // Expected: "You Won!" for online game where local player (WHITE) wins
      // On unfixed code: shows "White Wins!" because it ignores gameMode/localPlayerColor
      expect(resultTitle?.textContent).toBe('You Won!');

      uiManager.closeCurrentDialog();
    });

    it('should show "You Lost!" when opponent wins in online mode', () => {
      const uiManager = new UIManager();

      // Local player is WHITE, but BLACK wins
      (uiManager as any).showGameResult(
        PlayerColor.BLACK,
        true,
        GameMode.ONLINE_MULTIPLAYER,
        PlayerColor.WHITE
      );

      const resultTitle = document.querySelector('.result-title');
      expect(resultTitle).toBeTruthy();

      // Expected: "You Lost!" for online game where opponent wins
      // On unfixed code: shows "Black Wins!"
      expect(resultTitle?.textContent).toBe('You Lost!');

      uiManager.closeCurrentDialog();
    });
  });

  // =========================================================================
  // Bug 4 — Local Mill Highlighting
  // Validates: Requirement 1.6
  // =========================================================================
  describe('Bug 4 — Local Mill Highlighting', () => {
    it('should NOT clear highlights after mill formation via MOVE in local two-player mode', () => {
      const boardRenderer = new BoardRenderer(canvas);

      // Spy on boardRenderer methods
      const highlightSpy = vi.spyOn(boardRenderer, 'highlightValidMoves');
      const clearHighlightsSpy = vi.spyOn(boardRenderer, 'clearHighlights');

      const gc = new GameController(GameMode.LOCAL_TWO_PLAYER, boardRenderer, PlayerColor.WHITE);
      gc.startGame();

      // Set up a MOVEMENT phase board where WHITE can form a mill by moving
      // White has pieces at 0, 1, and 7 (moving 7→6 won't form mill, but moving
      // a piece to complete 0-1-2 will). We need WHITE at 0, 1 and a piece that
      // can move to 2. Position 3 is adjacent to 2, so WHITE at 3 can move to 2.
      const state = gc.getCurrentGameState()!;
      state.phase = GamePhase.MOVEMENT;
      state.whitePiecesRemaining = 0;
      state.blackPiecesRemaining = 0;

      // White pieces: 0, 1, 3, 7, 16 (5 pieces)
      state.board[0] = PlayerColor.WHITE;
      state.board[1] = PlayerColor.WHITE;
      state.board[3] = PlayerColor.WHITE;
      state.board[7] = PlayerColor.WHITE;
      state.board[16] = PlayerColor.WHITE;
      state.whitePiecesOnBoard = 5;

      // Black pieces: 8, 9, 14, 15, 22 (5 pieces)
      state.board[8] = PlayerColor.BLACK;
      state.board[9] = PlayerColor.BLACK;
      state.board[14] = PlayerColor.BLACK;
      state.board[15] = PlayerColor.BLACK;
      state.board[22] = PlayerColor.BLACK;
      state.blackPiecesOnBoard = 5;

      state.currentPlayer = PlayerColor.WHITE;

      // Reset spies after setup
      highlightSpy.mockClear();
      clearHighlightsSpy.mockClear();

      // WHITE selects piece at position 3, then moves to position 2 to form mill 0-1-2
      gc.handlePositionClick(3); // select piece at 3
      highlightSpy.mockClear(); // clear the "valid moves" highlight from selection
      clearHighlightsSpy.mockClear();

      gc.handlePositionClick(2); // move to 2, forming mill 0-1-2

      // After mill formation, highlightValidMoves should have been called with removable pieces
      expect(highlightSpy).toHaveBeenCalled();

      // The key bug: in handleMovementClick, after applyMove(move), clearSelection() is called.
      // clearSelection() calls boardRenderer.clearHighlights(), which clears the mill highlights
      // that were just set by handleMillFormed().
      // On unfixed code: clearSelection() in handleMovementClick clears highlights AFTER
      // handleMillFormed() set them inside applyMove().
      const highlightCallOrder =
        highlightSpy.mock.invocationCallOrder[highlightSpy.mock.invocationCallOrder.length - 1];

      // Check if clearHighlights was called AFTER the last highlightValidMoves call
      const clearCallsAfterHighlight = clearHighlightsSpy.mock.invocationCallOrder.filter(
        (order: number) => order > highlightCallOrder
      );

      // Expected: no clearHighlights calls after the mill highlight
      // On unfixed code: clearSelection() after applyMove() clears them
      expect(clearCallsAfterHighlight.length).toBe(0);

      gc.stopGameLoop();
    });
  });

  // =========================================================================
  // Bug 5 — Local Game-Over Dialog
  // Validates: Requirement 1.7
  // =========================================================================
  describe('Bug 5 — Local Game-Over Dialog', () => {
    it('should have a setOnGameEnd callback mechanism that endGame invokes', () => {
      const boardRenderer = new BoardRenderer(canvas);
      const gc = new GameController(GameMode.LOCAL_TWO_PLAYER, boardRenderer, PlayerColor.WHITE);

      // The fixed GameController should have a setOnGameEnd method
      // On unfixed code, this method does not exist
      expect(typeof (gc as any).setOnGameEnd).toBe('function');

      gc.stopGameLoop();
    });

    it('should invoke onGameEnd callback when endGame is called', async () => {
      vi.useFakeTimers();
      const boardRenderer = new BoardRenderer(canvas);
      const gc = new GameController(GameMode.LOCAL_TWO_PLAYER, boardRenderer, PlayerColor.WHITE);
      gc.startGame();

      const onGameEndCallback = vi.fn();

      // Set the callback — on unfixed code, setOnGameEnd doesn't exist
      (gc as any).setOnGameEnd(onGameEndCallback);

      // Set up a game-over scenario: BLACK has fewer than 3 pieces in movement phase
      const state = gc.getCurrentGameState()!;
      state.phase = GamePhase.MOVEMENT;
      state.whitePiecesRemaining = 0;
      state.blackPiecesRemaining = 0;
      state.whitePiecesOnBoard = 4;
      state.blackPiecesOnBoard = 2; // Less than 3 — triggers game end

      // Place pieces on board to match counts
      state.board[0] = PlayerColor.WHITE;
      state.board[1] = PlayerColor.WHITE;
      state.board[2] = PlayerColor.WHITE;
      state.board[7] = PlayerColor.WHITE;
      state.board[8] = PlayerColor.BLACK;
      state.board[9] = PlayerColor.BLACK;

      // Trigger a move that will cause checkGameEnd to fire
      // WHITE moves piece from 7 to 6 (adjacent)
      state.currentPlayer = PlayerColor.WHITE;
      state.board[7] = PlayerColor.WHITE;
      gc.handlePositionClick(7); // select piece at 7
      gc.handlePositionClick(6); // move to 6

      // Expected: onGameEnd callback should have been invoked with the winner
      // On unfixed code: endGame() only shows AnnouncementBanner, no callback
      // onGameEnd is now called after a 3s delay via setTimeout
      await vi.advanceTimersByTimeAsync(3000);
      expect(onGameEndCallback).toHaveBeenCalled();
      expect(onGameEndCallback).toHaveBeenCalledWith(expect.any(String));

      gc.stopGameLoop();
      vi.useRealTimers();
    });
  });

  // =========================================================================
  // Bug 6 — AI Failure Recovery
  // Validates: Requirement 1.8
  // =========================================================================
  describe('Bug 6 — AI Failure Recovery', () => {
    it('should recover when AI backend returns failure (fetch rejects)', async () => {
      // Mock fetch to simulate backend failure
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const boardRenderer = new BoardRenderer(canvas);
      const gc = new GameController(GameMode.SINGLE_PLAYER, boardRenderer, PlayerColor.WHITE);
      gc.startGame();

      // Player (WHITE) places a piece
      gc.handlePositionClick(0);

      // Now it's BLACK's turn (AI). The AI move will be triggered via setTimeout.
      // Wait for the AI move attempt to complete
      await vi.waitFor(
        () => {
          // After AI failure, the game should recover:
          // Either a fallback move was applied (board changed) or input is re-enabled
          const state = gc.getCurrentGameState()!;

          // Check recovery: either AI made a fallback move or input is re-enabled
          const aiMadeMove = state.board.some(
            (piece, idx) => idx !== 0 && piece === PlayerColor.BLACK
          );
          const inputReEnabled = state.currentPlayer === PlayerColor.WHITE && !gc.isAIThinking();

          // On unfixed code: neither happens — game is stuck
          // AI didn't make a move AND input is not re-enabled for the player
          expect(aiMadeMove || inputReEnabled).toBe(true);
        },
        { timeout: 3000 }
      );

      gc.stopGameLoop();
      globalThis.fetch = originalFetch;
    });
  });
});
