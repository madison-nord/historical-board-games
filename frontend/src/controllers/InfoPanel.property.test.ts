import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PlayerColor, GamePhase, GameMode } from '../models/index.js';
import type { GameState } from '../models/index.js';
import {
  deriveActionInstruction,
  deriveTurnMessage,
  derivePhaseMessage,
  deriveGameEndMessage,
  InfoPanelData,
  InfoPanel,
} from '../controllers/InfoPanel.js';
import { ChatPanel } from '../controllers/ChatPanel.js';
import type { ChatMessage } from '../controllers/ChatPanel.js';

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

const arbGameState = fc.record({
  currentPlayer: arbPlayerColor,
  phase: arbGamePhase,
  whitePiecesRemaining: arbPieceCount,
  blackPiecesRemaining: arbPieceCount,
  gameMode: arbGameMode,
  playerColor: arbPlayerColor,
  isGameOver: fc.boolean(),
  winner: fc.oneof(fc.constant(null), arbPlayerColor),
  millFormed: fc.boolean(),
  selectedPosition: arbPosition,
  isOpponentTurn: fc.boolean(),
  isAiThinking: fc.boolean(),
}) as fc.Arbitrary<InfoPanelData>;

describe('InfoPanel Derivation Functions - Property-Based Tests', () => {
  // Feature: game-status-display, Property 1: InfoPanel update renders correct game state
  // **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 4.6**
  it('Property 1: InfoPanel update renders correct game state — DOM content reflects current player, phase, piece counts, and player color', () => {
    fc.assert(
      fc.property(
        arbPlayerColor,
        arbGamePhase,
        arbPieceCount,
        arbPieceCount,
        arbGameMode,
        arbPlayerColor,
        arbPosition,
        fc.boolean(),
        (
          currentPlayer,
          phase,
          whitePiecesRemaining,
          blackPiecesRemaining,
          gameMode,
          playerColor,
          selectedPosition,
          isAiThinking
        ) => {
          const panel = new InfoPanel();
          panel.create();

          try {
            const gameState: GameState = {
              gameId: 'test-game',
              phase,
              currentPlayer,
              board: new Array(24).fill(null),
              whitePiecesRemaining,
              blackPiecesRemaining,
              whitePiecesOnBoard: 9 - whitePiecesRemaining,
              blackPiecesOnBoard: 9 - blackPiecesRemaining,
              gameOver: false,
              winner: null,
              millFormed: false,
            };

            panel.update(gameState, gameMode, playerColor, selectedPosition, isAiThinking);

            // Req 1.1: Turn indicator contains current player's color name
            const turnIndicator = document.querySelector('.info-panel-turn');
            expect(turnIndicator).not.toBeNull();
            const colorName = currentPlayer === PlayerColor.WHITE ? 'White' : 'Black';
            expect(turnIndicator!.textContent).toContain(colorName);

            // Req 1.2: Phase display contains phase name
            const phaseDisplay = document.querySelector('.info-panel-phase');
            expect(phaseDisplay).not.toBeNull();
            const phaseNames: Record<GamePhase, string> = {
              [GamePhase.PLACEMENT]: 'Placement',
              [GamePhase.MOVEMENT]: 'Movement',
              [GamePhase.FLYING]: 'Flying',
            };
            expect(phaseDisplay!.textContent).toContain(phaseNames[phase]);

            // Req 1.3: During PLACEMENT phase, pieces display is visible and contains both piece counts
            const piecesDisplay = document.querySelector('.info-panel-pieces') as HTMLElement;
            expect(piecesDisplay).not.toBeNull();
            if (phase === GamePhase.PLACEMENT) {
              expect(piecesDisplay.style.display).not.toBe('none');
              expect(piecesDisplay.textContent).toContain(String(whitePiecesRemaining));
              expect(piecesDisplay.textContent).toContain(String(blackPiecesRemaining));
            }

            // Req 1.4: When game mode is ONLINE_MULTIPLAYER, player color display contains local player's color name
            const playerColorDisplay = document.querySelector(
              '.info-panel-player-color'
            ) as HTMLElement;
            expect(playerColorDisplay).not.toBeNull();
            if (gameMode === GameMode.ONLINE_MULTIPLAYER) {
              expect(playerColorDisplay.style.display).not.toBe('none');
              const localColorName = playerColor === PlayerColor.WHITE ? 'White' : 'Black';
              expect(playerColorDisplay.textContent).toContain(localColorName);
            }
          } finally {
            panel.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-status-display, Property 2: Action instruction derivation correctness
  // **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
  it('Property 2: Action instruction derivation correctness — validates all 6 instruction branches', () => {
    fc.assert(
      fc.property(arbGameState, (data: InfoPanelData) => {
        const result = deriveActionInstruction(data);

        // Branch 1: game over → empty string
        if (data.isGameOver) {
          expect(result).toBe('');
          return;
        }

        // Branch 2: opponent's turn or AI thinking → waiting
        if (data.isOpponentTurn || data.isAiThinking) {
          expect(result).toBe('Waiting for opponent...');
          return;
        }

        // Branch 3: mill formed → remove instruction
        if (data.millFormed) {
          expect(result).toBe("Remove an opponent's piece");
          return;
        }

        // Branch 4: placement phase → place instruction
        if (data.phase === GamePhase.PLACEMENT) {
          expect(result).toBe('Place a piece on an empty position');
          return;
        }

        // Branch 5: movement/flying with piece selected → destination instruction
        if (data.selectedPosition !== null) {
          expect(result).toBe('Select a destination for your piece');
          return;
        }

        // Branch 6: movement/flying with no piece selected → select instruction
        expect(result).toBe('Select a piece to move');
      }),
      { numRuns: 100 }
    );
  });

  // Feature: game-status-display, Property 3: Turn announcement message correctness
  // **Validates: Requirements 2.1, 2.2, 2.3**
  it("Property 3: Turn announcement message correctness — validates Your Turn / Opponent's Turn / [Color]'s Turn", () => {
    fc.assert(
      fc.property(
        arbPlayerColor,
        arbGameMode,
        arbPlayerColor,
        (newPlayer, gameMode, localColor) => {
          const result = deriveTurnMessage(newPlayer, gameMode, localColor);

          if (gameMode === GameMode.LOCAL_TWO_PLAYER) {
            // Req 2.3: "[Color]'s Turn" in local two-player mode
            const expectedColor = newPlayer === PlayerColor.WHITE ? 'White' : 'Black';
            expect(result).toBe(`${expectedColor}'s Turn`);
          } else {
            // Req 2.1 & 2.2: "Your Turn" or "Opponent's Turn" in single-player and online modes
            if (newPlayer === localColor) {
              expect(result).toBe('Your Turn');
            } else {
              expect(result).toBe("Opponent's Turn");
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-status-display, Property 4: Game end announcement message correctness
  // **Validates: Requirements 5.1, 5.2, 5.5, 5.6, 5.7**
  it('Property 4: Game end announcement message correctness — validates personalized and color-based messages', () => {
    fc.assert(
      fc.property(
        arbGameMode,
        arbPlayerColor,
        arbWinReason,
        arbPlayerColor,
        (gameMode, winner, reason, localColor) => {
          const result = deriveGameEndMessage(winner, reason, gameMode, localColor);

          // Req 5.2: subtitle always contains the reason
          expect(result.subtitle).toBe(reason);

          if (gameMode === GameMode.LOCAL_TWO_PLAYER) {
            // Req 5.1: "[Color] Wins!" in local two-player mode
            const colorName = winner === PlayerColor.WHITE ? 'White' : 'Black';
            expect(result.message).toBe(`${colorName} Wins!`);
          } else {
            // Req 5.6 & 5.7: "You Won!" / "You Lost!" in online and single-player modes
            if (winner === localColor) {
              expect(result.message).toBe('You Won!');
            } else {
              expect(result.message).toBe('You Lost!');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-status-display, Property 5: Phase transition message correctness
  // **Validates: Requirements 3.1, 3.2, 3.3**
  it('Property 5: Phase transition message correctness — validates Movement and Flying messages', () => {
    fc.assert(
      fc.property(arbGamePhase, (phase: GamePhase) => {
        const result = derivePhaseMessage(phase);

        if (phase === GamePhase.MOVEMENT) {
          // Req 3.1: Movement phase message
          expect(result.message).toContain('Movement');
          expect(result.subtitle).toContain('adjacent');
          expect(result.message.length).toBeGreaterThan(0);
          expect(result.subtitle.length).toBeGreaterThan(0);
        } else if (phase === GamePhase.FLYING) {
          // Req 3.2: Flying phase message
          expect(result.message).toContain('Flying');
          expect(result.subtitle).toContain('any empty position');
          expect(result.message.length).toBeGreaterThan(0);
          expect(result.subtitle.length).toBeGreaterThan(0);
        } else {
          // PLACEMENT phase — no phase transition message
          expect(result.message).toBe('');
          expect(result.subtitle).toBe('');
        }
      }),
      { numRuns: 100 }
    );
  });
});

// --- ChatPanel Notification Badge Property Test ---

// Generator for a ChatMessage
const arbChatMessage: fc.Arbitrary<ChatMessage> = fc.record({
  senderId: fc.string({ minLength: 1, maxLength: 10 }),
  senderColor: fc.constantFrom(PlayerColor.WHITE, PlayerColor.BLACK),
  content: fc.string({ minLength: 1, maxLength: 50 }),
  timestamp: fc.constant(new Date().toISOString()),
});

describe('ChatPanel Notification Badge - Property-Based Tests', () => {
  let appContainer: HTMLElement;

  beforeEach(() => {
    appContainer = document.createElement('div');
    appContainer.id = 'app';
    document.body.appendChild(appContainer);
  });

  afterEach(() => {
    appContainer.remove();
  });

  // Feature: game-status-display, Property 6: Chat notification badge on collapsed panel
  // **Validates: Requirements 6.5**
  it('Property 6: Chat notification badge on collapsed panel — badge count equals messages received since last expand; expanding resets to zero', () => {
    fc.assert(
      fc.property(
        fc.array(arbChatMessage, { minLength: 1, maxLength: 20 }),
        (messages: ChatMessage[]) => {
          const panel = new ChatPanel();
          panel.show();

          // Collapse the panel
          panel.toggleCollapse();

          try {
            // Send all messages while collapsed
            for (const msg of messages) {
              panel.addMessage(msg);
            }

            // Badge count should equal number of messages sent while collapsed
            const badge = document.querySelector('.chat-notification-badge') as HTMLElement;
            expect(badge).not.toBeNull();
            expect(badge.style.display).toBe('block');

            const expectedCount = messages.length;
            const expectedText = expectedCount > 9 ? '9+' : String(expectedCount);
            expect(badge.textContent).toBe(expectedText);

            // Expanding the panel should reset badge to zero
            panel.toggleCollapse(); // expand

            expect(badge.style.display).toBe('none');
            expect(badge.textContent).toBe('');
          } finally {
            panel.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
