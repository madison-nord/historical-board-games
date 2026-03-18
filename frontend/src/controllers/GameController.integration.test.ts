import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameController } from './GameController';
import { GameMode, GamePhase, PlayerColor } from '../models';

// Mock BoardRenderer
vi.mock('../rendering/BoardRenderer');

describe('GameController - InfoPanel & AnnouncementBanner Integration', () => {
  let gameController: GameController;
  let mockBoardRenderer: any;
  let mockInfoPanel: any;
  let mockBanner: any;

  beforeEach(() => {
    mockBoardRenderer = {
      setOnPositionClick: vi.fn(),
      render: vi.fn(),
      setInputEnabled: vi.fn(),
      highlightValidMoves: vi.fn(),
      clearHighlights: vi.fn(),
      animatePlacement: vi.fn(),
      animateMovement: vi.fn(),
      animateRemoval: vi.fn(),
    };

    mockInfoPanel = {
      create: vi.fn(),
      update: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      destroy: vi.fn(),
    };

    mockBanner = {
      create: vi.fn(),
      show: vi.fn(),
      dismiss: vi.fn(),
      destroy: vi.fn(),
    };

    gameController = new GameController(
      GameMode.LOCAL_TWO_PLAYER,
      mockBoardRenderer,
      PlayerColor.WHITE
    );

    gameController.setInfoPanel(mockInfoPanel);
    gameController.setAnnouncementBanner(mockBanner);
  });

  afterEach(() => {
    gameController.stopGameLoop();
    vi.clearAllMocks();
  });

  describe('updateDisplay() calls infoPanel.update() with correct state', () => {
    it('should call infoPanel.update() with current game state after startGame', () => {
      gameController.startGame();

      // startGame calls updateDisplay internally
      expect(mockInfoPanel.update).toHaveBeenCalled();

      const lastCall = mockInfoPanel.update.mock.calls[mockInfoPanel.update.mock.calls.length - 1];
      const [gameState, gameMode, playerColor, selectedPosition, isAiThinking] = lastCall;

      expect(gameState.currentPlayer).toBe(PlayerColor.WHITE);
      expect(gameState.phase).toBe(GamePhase.PLACEMENT);
      expect(gameState.whitePiecesRemaining).toBe(9);
      expect(gameState.blackPiecesRemaining).toBe(9);
      expect(gameMode).toBe(GameMode.LOCAL_TWO_PLAYER);
      expect(playerColor).toBe(PlayerColor.WHITE);
      expect(selectedPosition).toBeNull();
      expect(isAiThinking).toBe(false);
    });

    it('should call infoPanel.update() after a placement move', () => {
      gameController.startGame();
      mockInfoPanel.update.mockClear();

      gameController.handlePositionClick(0); // WHITE places at 0

      expect(mockInfoPanel.update).toHaveBeenCalled();
      const lastCall = mockInfoPanel.update.mock.calls[mockInfoPanel.update.mock.calls.length - 1];
      const [gameState] = lastCall;

      expect(gameState.board[0]).toBe(PlayerColor.WHITE);
      expect(gameState.currentPlayer).toBe(PlayerColor.BLACK); // switched after placement
    });
  });

  describe('switchPlayer() triggers turn announcement via announcementBanner.show()', () => {
    it('should show turn announcement after a placement that does not form a mill', () => {
      gameController.startGame();
      mockBanner.show.mockClear();

      // WHITE places at position 0 (no mill formed) → switchPlayer triggers announcement
      gameController.handlePositionClick(0);

      expect(mockBanner.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'turn',
          message: "Black's Turn", // LOCAL_TWO_PLAYER mode shows color name
        })
      );
    });

    it('should show correct turn message for each player in local two-player mode', () => {
      gameController.startGame();
      mockBanner.show.mockClear();

      // WHITE places at 0 → turn switches to BLACK
      gameController.handlePositionClick(0);
      expect(mockBanner.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'turn', message: "Black's Turn" })
      );

      mockBanner.show.mockClear();

      // BLACK places at 8 → turn switches to WHITE
      gameController.handlePositionClick(8);
      expect(mockBanner.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'turn', message: "White's Turn" })
      );
    });
  });

  describe('updateGamePhase() triggers phase announcement and suppresses turn announcement', () => {
    it('should show phase announcement and NOT turn announcement when phase changes from PLACEMENT to MOVEMENT', () => {
      gameController.startGame();

      // Set up a state where the last placement triggers phase change to MOVEMENT.
      // Both players have 1 piece remaining, 8 on board each.
      const state = gameController.getCurrentGameState()!;
      state.phase = GamePhase.PLACEMENT;
      state.whitePiecesRemaining = 1;
      state.blackPiecesRemaining = 0;
      state.whitePiecesOnBoard = 8;
      state.blackPiecesOnBoard = 9;
      state.currentPlayer = PlayerColor.WHITE;
      state.board = new Array(24).fill(null);
      // Place 8 WHITE pieces (no mills)
      state.board[0] = PlayerColor.WHITE;
      state.board[2] = PlayerColor.WHITE;
      state.board[4] = PlayerColor.WHITE;
      state.board[6] = PlayerColor.WHITE;
      state.board[10] = PlayerColor.WHITE;
      state.board[12] = PlayerColor.WHITE;
      state.board[14] = PlayerColor.WHITE;
      state.board[16] = PlayerColor.WHITE;
      // Place 9 BLACK pieces (no mills)
      state.board[1] = PlayerColor.BLACK;
      state.board[3] = PlayerColor.BLACK;
      state.board[5] = PlayerColor.BLACK;
      state.board[7] = PlayerColor.BLACK;
      state.board[9] = PlayerColor.BLACK;
      state.board[11] = PlayerColor.BLACK;
      state.board[13] = PlayerColor.BLACK;
      state.board[15] = PlayerColor.BLACK;
      state.board[17] = PlayerColor.BLACK;
      gameController.setBoardState(state);

      mockBanner.show.mockClear();

      // WHITE places last piece at position 18 (no mill: 16,17,18 would need all WHITE)
      // Position 18 is empty and adjacent to 17 (BLACK) and 19 (empty)
      gameController.handlePositionClick(18);

      // Should have phase announcement but NOT turn announcement
      const showCalls = mockBanner.show.mock.calls;
      const phaseCall = showCalls.find(
        (call: any[]) => call[0].type === 'phase'
      );
      const turnCall = showCalls.find(
        (call: any[]) => call[0].type === 'turn'
      );

      expect(phaseCall).toBeDefined();
      expect(phaseCall![0].message).toContain('Movement');
      expect(turnCall).toBeUndefined();
    });
  });

  describe('endGame() triggers game-end announcement with persistent duration', () => {
    it('should show game-end announcement with duration 0 when a player has fewer than 3 pieces', () => {
      gameController.startGame();

      // Set up a state where removing one BLACK piece triggers game end
      const state = gameController.getCurrentGameState()!;
      state.phase = GamePhase.MOVEMENT;
      state.whitePiecesRemaining = 0;
      state.blackPiecesRemaining = 0;
      state.whitePiecesOnBoard = 4;
      state.blackPiecesOnBoard = 3; // Will become 2 after removal → game end
      state.currentPlayer = PlayerColor.WHITE;
      state.millFormed = true; // WHITE just formed a mill
      state.board = new Array(24).fill(null);
      // WHITE pieces forming a mill at 0-1-2
      state.board[0] = PlayerColor.WHITE;
      state.board[1] = PlayerColor.WHITE;
      state.board[2] = PlayerColor.WHITE;
      state.board[6] = PlayerColor.WHITE;
      // BLACK pieces (3 on board, not in mills)
      state.board[8] = PlayerColor.BLACK;
      state.board[10] = PlayerColor.BLACK;
      state.board[12] = PlayerColor.BLACK;
      gameController.setBoardState(state);

      mockBanner.show.mockClear();

      // Remove BLACK piece at 8 → BLACK drops to 2 pieces → game end
      gameController.handlePositionClick(8);

      const gameEndCall = mockBanner.show.mock.calls.find(
        (call: any[]) => call[0].type === 'game-end'
      );

      expect(gameEndCall).toBeDefined();
      expect(gameEndCall![0].duration).toBe(0);
      expect(gameEndCall![0].message).toContain('White Wins!'); // LOCAL_TWO_PLAYER mode
      expect(gameEndCall![0].subtitle).toBeDefined();
    });
  });

  describe('Phase transition takes priority over turn change (Req 3.4)', () => {
    it('should only show phase announcement when both phase transition and turn change happen', () => {
      gameController.startGame();

      // Set up state where last placement triggers PLACEMENT → MOVEMENT transition
      const state = gameController.getCurrentGameState()!;
      state.phase = GamePhase.PLACEMENT;
      state.whitePiecesRemaining = 0;
      state.blackPiecesRemaining = 1;
      state.whitePiecesOnBoard = 9;
      state.blackPiecesOnBoard = 8;
      state.currentPlayer = PlayerColor.BLACK;
      state.board = new Array(24).fill(null);
      // Place 9 WHITE pieces
      state.board[0] = PlayerColor.WHITE;
      state.board[2] = PlayerColor.WHITE;
      state.board[4] = PlayerColor.WHITE;
      state.board[6] = PlayerColor.WHITE;
      state.board[8] = PlayerColor.WHITE;
      state.board[10] = PlayerColor.WHITE;
      state.board[14] = PlayerColor.WHITE;
      state.board[16] = PlayerColor.WHITE;
      state.board[18] = PlayerColor.WHITE;
      // Place 8 BLACK pieces
      state.board[1] = PlayerColor.BLACK;
      state.board[3] = PlayerColor.BLACK;
      state.board[5] = PlayerColor.BLACK;
      state.board[7] = PlayerColor.BLACK;
      state.board[9] = PlayerColor.BLACK;
      state.board[11] = PlayerColor.BLACK;
      state.board[13] = PlayerColor.BLACK;
      state.board[15] = PlayerColor.BLACK;
      gameController.setBoardState(state);

      mockBanner.show.mockClear();

      // BLACK places last piece at position 20 (empty, no mill)
      gameController.handlePositionClick(20);

      const showCalls = mockBanner.show.mock.calls;
      const types = showCalls.map((call: any[]) => call[0].type);

      // Phase announcement should be present
      expect(types).toContain('phase');
      // Turn announcement should NOT be present (suppressed by phase transition)
      expect(types).not.toContain('turn');

      // Verify the phase message is about Movement
      const phaseCall = showCalls.find((call: any[]) => call[0].type === 'phase');
      expect(phaseCall![0].message).toContain('Movement');
    });
  });
});
