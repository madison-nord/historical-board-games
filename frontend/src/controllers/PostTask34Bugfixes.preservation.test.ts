/**
 * Post-Task 34 Bugfixes — Preservation Property Tests
 *
 * These tests capture EXISTING correct behavior that must be preserved
 * after the bug fixes. They should PASS on the current unfixed code.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13**
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { GameController } from './GameController';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { InfoPanel, deriveActionInstruction, deriveTurnMessage, deriveGameEndMessage } from './InfoPanel';
import type { InfoPanelData } from './InfoPanel';
import { ChatPanel } from './ChatPanel';
import type { ChatMessage } from './ChatPanel';
import { GameMode, GamePhase, PlayerColor } from '../models';

// --- Generators ---

const arbPlayerColor = fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK);
const arbGamePhase = fc.constantFrom(GamePhase.PLACEMENT, GamePhase.MOVEMENT, GamePhase.FLYING);
const arbGameMode = fc.constantFrom(
  GameMode.SINGLE_PLAYER,
  GameMode.LOCAL_TWO_PLAYER,
  GameMode.ONLINE_MULTIPLAYER
);
const arbPieceCount = fc.integer({ min: 0, max: 9 });
const arbPosition = fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 23 }));
const arbWinReason = fc.constantFrom(
  'Black has fewer than 3 pieces',
  'White has fewer than 3 pieces',
  'Black has no legal moves',
  'White has no legal moves',
  'Opponent disconnected'
);

// =========================================================================
// 1. deriveActionInstruction preservation
// Validates: Requirements 3.1
// =========================================================================
describe('Preservation: deriveActionInstruction', () => {
  it('should return correct non-empty strings for all valid non-game-over InfoPanelData inputs', () => {
    fc.assert(
      fc.property(
        arbPlayerColor,
        arbGamePhase,
        arbGameMode,
        arbPlayerColor,
        arbPosition,
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (currentPlayer, phase, gameMode, playerColor, selectedPosition, isOpponentTurn, isAiThinking, millFormed) => {
          const data: InfoPanelData = {
            currentPlayer,
            phase,
            whitePiecesRemaining: 5,
            blackPiecesRemaining: 5,
            gameMode,
            playerColor,
            isGameOver: false,
            winner: null,
            millFormed,
            selectedPosition,
            isOpponentTurn,
            isAiThinking,
          };

          const result = deriveActionInstruction(data);

          // For non-game-over states, result should always be a non-empty string
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should return empty string when game is over', () => {
    fc.assert(
      fc.property(
        arbPlayerColor,
        arbGamePhase,
        arbGameMode,
        arbPlayerColor,
        (currentPlayer, phase, gameMode, playerColor) => {
          const data: InfoPanelData = {
            currentPlayer,
            phase,
            whitePiecesRemaining: 0,
            blackPiecesRemaining: 0,
            gameMode,
            playerColor,
            isGameOver: true,
            winner: currentPlayer,
            millFormed: false,
            selectedPosition: null,
            isOpponentTurn: false,
            isAiThinking: false,
          };

          expect(deriveActionInstruction(data)).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return "Waiting for opponent..." when opponent turn or AI thinking', () => {
    // Opponent turn branch
    const opponentData: InfoPanelData = {
      currentPlayer: PlayerColor.BLACK,
      phase: GamePhase.PLACEMENT,
      whitePiecesRemaining: 5,
      blackPiecesRemaining: 5,
      gameMode: GameMode.ONLINE_MULTIPLAYER,
      playerColor: PlayerColor.WHITE,
      isGameOver: false,
      winner: null,
      millFormed: false,
      selectedPosition: null,
      isOpponentTurn: true,
      isAiThinking: false,
    };
    expect(deriveActionInstruction(opponentData)).toBe('Waiting for opponent...');

    // AI thinking branch
    const aiData: InfoPanelData = {
      ...opponentData,
      isOpponentTurn: false,
      isAiThinking: true,
    };
    expect(deriveActionInstruction(aiData)).toBe('Waiting for opponent...');
  });

  it('should return mill formed instruction when mill is formed', () => {
    const data: InfoPanelData = {
      currentPlayer: PlayerColor.WHITE,
      phase: GamePhase.PLACEMENT,
      whitePiecesRemaining: 5,
      blackPiecesRemaining: 5,
      gameMode: GameMode.LOCAL_TWO_PLAYER,
      playerColor: PlayerColor.WHITE,
      isGameOver: false,
      winner: null,
      millFormed: true,
      selectedPosition: null,
      isOpponentTurn: false,
      isAiThinking: false,
    };
    expect(deriveActionInstruction(data)).toBe("Remove an opponent's piece");
  });

  it('should return placement instruction during placement phase', () => {
    const data: InfoPanelData = {
      currentPlayer: PlayerColor.WHITE,
      phase: GamePhase.PLACEMENT,
      whitePiecesRemaining: 5,
      blackPiecesRemaining: 5,
      gameMode: GameMode.LOCAL_TWO_PLAYER,
      playerColor: PlayerColor.WHITE,
      isGameOver: false,
      winner: null,
      millFormed: false,
      selectedPosition: null,
      isOpponentTurn: false,
      isAiThinking: false,
    };
    expect(deriveActionInstruction(data)).toBe('Place a piece on an empty position');
  });

  it('should return destination instruction when piece is selected in movement', () => {
    const data: InfoPanelData = {
      currentPlayer: PlayerColor.WHITE,
      phase: GamePhase.MOVEMENT,
      whitePiecesRemaining: 0,
      blackPiecesRemaining: 0,
      gameMode: GameMode.LOCAL_TWO_PLAYER,
      playerColor: PlayerColor.WHITE,
      isGameOver: false,
      winner: null,
      millFormed: false,
      selectedPosition: 5,
      isOpponentTurn: false,
      isAiThinking: false,
    };
    expect(deriveActionInstruction(data)).toBe('Select a destination for your piece');
  });

  it('should return select piece instruction in movement without selection', () => {
    const data: InfoPanelData = {
      currentPlayer: PlayerColor.WHITE,
      phase: GamePhase.MOVEMENT,
      whitePiecesRemaining: 0,
      blackPiecesRemaining: 0,
      gameMode: GameMode.LOCAL_TWO_PLAYER,
      playerColor: PlayerColor.WHITE,
      isGameOver: false,
      winner: null,
      millFormed: false,
      selectedPosition: null,
      isOpponentTurn: false,
      isAiThinking: false,
    };
    expect(deriveActionInstruction(data)).toBe('Select a piece to move');
  });
});

// =========================================================================
// 2. deriveGameEndMessage preservation for LOCAL_TWO_PLAYER
// Validates: Requirements 3.5
// =========================================================================
describe('Preservation: deriveGameEndMessage for LOCAL_TWO_PLAYER', () => {
  it('should return color-based messages for LOCAL_TWO_PLAYER, never "You Won/Lost"', () => {
    fc.assert(
      fc.property(
        arbPlayerColor, // winner
        arbWinReason,
        arbPlayerColor, // localPlayerColor
        (winner, reason, localPlayerColor) => {
          const result = deriveGameEndMessage(
            winner,
            reason,
            GameMode.LOCAL_TWO_PLAYER,
            localPlayerColor
          );

          const colorName = winner === PlayerColor.WHITE ? 'White' : 'Black';
          expect(result.message).toBe(`${colorName} Wins!`);
          expect(result.subtitle).toBe(reason);

          // Must NOT contain perspective-based messages
          expect(result.message).not.toContain('You Won');
          expect(result.message).not.toContain('You Lost');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =========================================================================
// 3. deriveGameEndMessage preservation for ONLINE_MULTIPLAYER
// Validates: Requirements 3.5 (inverse — online uses perspective)
// =========================================================================
describe('Preservation: deriveGameEndMessage for ONLINE_MULTIPLAYER', () => {
  it('should return perspective-based messages for ONLINE_MULTIPLAYER', () => {
    fc.assert(
      fc.property(
        arbPlayerColor, // winner
        arbWinReason,
        arbPlayerColor, // localPlayerColor
        (winner, reason, localPlayerColor) => {
          const result = deriveGameEndMessage(
            winner,
            reason,
            GameMode.ONLINE_MULTIPLAYER,
            localPlayerColor
          );

          if (winner === localPlayerColor) {
            expect(result.message).toBe('You Won!');
          } else {
            expect(result.message).toBe('You Lost!');
          }
          expect(result.subtitle).toBe(reason);

          // Must NOT contain color-based messages
          expect(result.message).not.toContain('White Wins');
          expect(result.message).not.toContain('Black Wins');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return perspective-based messages for SINGLE_PLAYER too', () => {
    fc.assert(
      fc.property(
        arbPlayerColor,
        arbWinReason,
        arbPlayerColor,
        (winner, reason, localPlayerColor) => {
          const result = deriveGameEndMessage(
            winner,
            reason,
            GameMode.SINGLE_PLAYER,
            localPlayerColor
          );

          if (winner === localPlayerColor) {
            expect(result.message).toBe('You Won!');
          } else {
            expect(result.message).toBe('You Lost!');
          }
          expect(result.subtitle).toBe(reason);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =========================================================================
// 4. deriveTurnMessage preservation
// Validates: Requirements 3.1
// =========================================================================
describe('Preservation: deriveTurnMessage', () => {
  it('should return color-based turn messages for LOCAL_TWO_PLAYER', () => {
    fc.assert(
      fc.property(
        arbPlayerColor,
        arbPlayerColor,
        (newPlayer, localPlayerColor) => {
          const result = deriveTurnMessage(newPlayer, GameMode.LOCAL_TWO_PLAYER, localPlayerColor);
          const colorName = newPlayer === PlayerColor.WHITE ? 'White' : 'Black';
          expect(result).toBe(`${colorName}'s Turn`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return perspective-based turn messages for ONLINE_MULTIPLAYER', () => {
    fc.assert(
      fc.property(
        arbPlayerColor,
        arbPlayerColor,
        (newPlayer, localPlayerColor) => {
          const result = deriveTurnMessage(
            newPlayer,
            GameMode.ONLINE_MULTIPLAYER,
            localPlayerColor
          );
          if (newPlayer === localPlayerColor) {
            expect(result).toBe('Your Turn');
          } else {
            expect(result).toBe("Opponent's Turn");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return perspective-based turn messages for SINGLE_PLAYER', () => {
    fc.assert(
      fc.property(
        arbPlayerColor,
        arbPlayerColor,
        (newPlayer, localPlayerColor) => {
          const result = deriveTurnMessage(newPlayer, GameMode.SINGLE_PLAYER, localPlayerColor);
          if (newPlayer === localPlayerColor) {
            expect(result).toBe('Your Turn');
          } else {
            expect(result).toBe("Opponent's Turn");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =========================================================================
// 5. ChatPanel collapse/mute preservation
// Validates: Requirements 3.3, 3.4
// =========================================================================
describe('Preservation: ChatPanel collapse/mute', () => {
  let appContainer: HTMLElement;

  beforeEach(() => {
    appContainer = document.createElement('div');
    appContainer.id = 'app';
    document.body.appendChild(appContainer);
  });

  afterEach(() => {
    appContainer.remove();
  });

  it('should toggle collapse state and update button text correctly', () => {
    const panel = new ChatPanel();
    panel.show();

    try {
      const container = document.querySelector('.chat-panel') as HTMLElement;
      const collapseBtn = document.querySelector('.chat-collapse-button') as HTMLButtonElement;

      expect(container).toBeTruthy();
      expect(collapseBtn).toBeTruthy();

      // Initially expanded
      expect(container.classList.contains('collapsed')).toBe(false);
      expect(collapseBtn.textContent).toBe('▼');

      // Collapse
      panel.toggleCollapse();
      expect(container.classList.contains('collapsed')).toBe(true);
      expect(collapseBtn.textContent).toBe('▲');

      // Expand
      panel.toggleCollapse();
      expect(container.classList.contains('collapsed')).toBe(false);
      expect(collapseBtn.textContent).toBe('▼');
    } finally {
      panel.destroy();
    }
  });

  it('should toggle mute state and update button text correctly', () => {
    const panel = new ChatPanel();
    panel.show();

    try {
      const muteBtn = document.querySelector('.chat-mute-button') as HTMLButtonElement;
      expect(muteBtn).toBeTruthy();

      // Initially unmuted
      expect(muteBtn.textContent).toBe('🔊 Mute');
      expect(muteBtn.classList.contains('muted')).toBe(false);

      // Mute
      panel.toggleMute();
      expect(muteBtn.textContent).toBe('🔇 Unmute');
      expect(muteBtn.classList.contains('muted')).toBe(true);

      // Unmute
      panel.toggleMute();
      expect(muteBtn.textContent).toBe('🔊 Mute');
      expect(muteBtn.classList.contains('muted')).toBe(false);
    } finally {
      panel.destroy();
    }
  });

  it('should track unread messages when collapsed and clear badge on expand', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }),
        (messageCount) => {
          const panel = new ChatPanel();
          panel.show();

          try {
            // Collapse first
            panel.toggleCollapse();

            // Send messages while collapsed
            for (let i = 0; i < messageCount; i++) {
              panel.addMessage({
                senderId: 'player1',
                senderColor: PlayerColor.WHITE,
                content: `Message ${i}`,
                timestamp: new Date().toISOString(),
              });
            }

            const badge = document.querySelector('.chat-notification-badge') as HTMLElement;
            expect(badge).toBeTruthy();
            expect(badge.style.display).toBe('block');

            const expectedText = messageCount > 9 ? '9+' : String(messageCount);
            expect(badge.textContent).toBe(expectedText);

            // Expand should clear badge
            panel.toggleCollapse();
            expect(badge.style.display).toBe('none');
            expect(badge.textContent).toBe('');
          } finally {
            panel.destroy();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not add messages when muted', () => {
    const panel = new ChatPanel();
    panel.show();

    try {
      const messagesContainer = document.querySelector('.chat-messages') as HTMLElement;
      expect(messagesContainer).toBeTruthy();

      // Mute the panel
      panel.toggleMute();

      // Try to add a message
      panel.addMessage({
        senderId: 'player1',
        senderColor: PlayerColor.WHITE,
        content: 'This should not appear',
        timestamp: new Date().toISOString(),
      });

      // No messages should be added
      expect(messagesContainer.children.length).toBe(0);
    } finally {
      panel.destroy();
    }
  });
});

// =========================================================================
// 6. getRemovablePieces preservation
// Validates: Requirements 3.7, 3.8, 3.9
// =========================================================================
describe('Preservation: getRemovablePieces (via mill formation flow)', () => {
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

  it('should highlight non-mill opponent pieces for removal after mill formation', () => {
    const boardRenderer = new BoardRenderer(canvas);
    const highlightSpy = vi.spyOn(boardRenderer, 'highlightValidMoves');

    const gc = new GameController(
      GameMode.LOCAL_TWO_PLAYER,
      boardRenderer,
      PlayerColor.WHITE
    );
    gc.startGame();

    // Set up board: WHITE about to form mill at 0-1-2 by placing at 2
    // BLACK has pieces at 8 (not in mill) and 9 (not in mill)
    const state = gc.getCurrentGameState()!;
    state.phase = GamePhase.PLACEMENT;
    state.currentPlayer = PlayerColor.WHITE;
    state.whitePiecesRemaining = 7;
    state.blackPiecesRemaining = 7;

    // White at 0, 1 — placing at 2 completes mill
    state.board[0] = PlayerColor.WHITE;
    state.board[1] = PlayerColor.WHITE;
    state.whitePiecesOnBoard = 2;

    // Black at 8, 9 — neither in a mill
    state.board[8] = PlayerColor.BLACK;
    state.board[9] = PlayerColor.BLACK;
    state.blackPiecesOnBoard = 2;

    highlightSpy.mockClear();

    // Place at 2 to form mill 0-1-2
    gc.handlePositionClick(2);

    // After mill formation, highlightValidMoves should be called with removable pieces
    // Both black pieces (8, 9) are not in mills, so both should be removable
    expect(highlightSpy).toHaveBeenCalled();
    const lastCall = highlightSpy.mock.calls[highlightSpy.mock.calls.length - 1];
    const highlightedPositions = lastCall[0] as number[];

    expect(highlightedPositions).toContain(8);
    expect(highlightedPositions).toContain(9);
    expect(highlightedPositions.length).toBe(2);

    gc.stopGameLoop();
  });

  it('should allow removal of any piece when all opponent pieces are in mills', () => {
    const boardRenderer = new BoardRenderer(canvas);
    const highlightSpy = vi.spyOn(boardRenderer, 'highlightValidMoves');

    const gc = new GameController(
      GameMode.LOCAL_TWO_PLAYER,
      boardRenderer,
      PlayerColor.WHITE
    );
    gc.startGame();

    // Set up board: WHITE about to form mill at 0-1-2 by placing at 2
    // BLACK has pieces at 8, 9, 10 — which form a mill (8-9-10)
    const state = gc.getCurrentGameState()!;
    state.phase = GamePhase.PLACEMENT;
    state.currentPlayer = PlayerColor.WHITE;
    state.whitePiecesRemaining = 7;
    state.blackPiecesRemaining = 6;

    state.board[0] = PlayerColor.WHITE;
    state.board[1] = PlayerColor.WHITE;
    state.whitePiecesOnBoard = 2;

    // Black pieces all in a mill: 8-9-10
    state.board[8] = PlayerColor.BLACK;
    state.board[9] = PlayerColor.BLACK;
    state.board[10] = PlayerColor.BLACK;
    state.blackPiecesOnBoard = 3;

    highlightSpy.mockClear();

    // Place at 2 to form mill 0-1-2
    gc.handlePositionClick(2);

    // All black pieces are in mills, so ALL should be removable
    expect(highlightSpy).toHaveBeenCalled();
    const lastCall = highlightSpy.mock.calls[highlightSpy.mock.calls.length - 1];
    const highlightedPositions = lastCall[0] as number[];

    expect(highlightedPositions).toContain(8);
    expect(highlightedPositions).toContain(9);
    expect(highlightedPositions).toContain(10);
    expect(highlightedPositions.length).toBe(3);

    gc.stopGameLoop();
  });

  it('should only highlight non-mill pieces when some are in mills and some are not', () => {
    const boardRenderer = new BoardRenderer(canvas);
    const highlightSpy = vi.spyOn(boardRenderer, 'highlightValidMoves');

    const gc = new GameController(
      GameMode.LOCAL_TWO_PLAYER,
      boardRenderer,
      PlayerColor.WHITE
    );
    gc.startGame();

    // WHITE about to form mill at 0-1-2 by placing at 2
    // BLACK has pieces at 8, 9, 10 (mill) and 14 (not in mill)
    const state = gc.getCurrentGameState()!;
    state.phase = GamePhase.PLACEMENT;
    state.currentPlayer = PlayerColor.WHITE;
    state.whitePiecesRemaining = 7;
    state.blackPiecesRemaining = 5;

    state.board[0] = PlayerColor.WHITE;
    state.board[1] = PlayerColor.WHITE;
    state.whitePiecesOnBoard = 2;

    // Black: 8-9-10 (mill), 14 (not in mill)
    state.board[8] = PlayerColor.BLACK;
    state.board[9] = PlayerColor.BLACK;
    state.board[10] = PlayerColor.BLACK;
    state.board[14] = PlayerColor.BLACK;
    state.blackPiecesOnBoard = 4;

    highlightSpy.mockClear();

    // Place at 2 to form mill 0-1-2
    gc.handlePositionClick(2);

    // Only position 14 (not in mill) should be removable
    expect(highlightSpy).toHaveBeenCalled();
    const lastCall = highlightSpy.mock.calls[highlightSpy.mock.calls.length - 1];
    const highlightedPositions = lastCall[0] as number[];

    expect(highlightedPositions).toContain(14);
    expect(highlightedPositions).not.toContain(8);
    expect(highlightedPositions).not.toContain(9);
    expect(highlightedPositions).not.toContain(10);
    expect(highlightedPositions.length).toBe(1);

    gc.stopGameLoop();
  });
});
