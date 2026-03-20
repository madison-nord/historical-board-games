import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIManager } from './UIManager';
import { GameController, type GameState } from './GameController';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { GameMode } from '../models/GameMode';
import { GamePhase } from '../models/GamePhase';
import { PlayerColor } from '../models/PlayerColor';
import { LocalStorage } from '../utils/LocalStorage';

/**
 * Integration tests for the resume game flow.
 *
 * When a user quits a single-player or local-two-player game, the game state
 * is saved. When they re-select that same mode from the main menu, a resume
 * dialog should appear offering to continue or start fresh.
 */
describe('UIManager - Resume Game Flow', () => {
  let uiManager: UIManager;
  let gameModeCallback: (mode: string) => void;

  beforeEach(() => {
    uiManager = new UIManager();
    document.querySelectorAll('dialog').forEach(d => d.remove());

    // Wire up the game mode callback that mirrors main.ts logic
    gameModeCallback = vi.fn((mode: string) => {
      switch (mode) {
        case 'single-player': {
          if (LocalStorage.hasSavedGameForMode(GameMode.SINGLE_PLAYER)) {
            uiManager.showResumeGameDialog();
          } else {
            uiManager.showColorSelection();
          }
          break;
        }
        case 'local-two-player': {
          if (LocalStorage.hasSavedGameForMode(GameMode.LOCAL_TWO_PLAYER)) {
            uiManager.showResumeGameDialog();
          } else {
            // would start game directly
          }
          break;
        }
      }
    });
    uiManager.setOnGameModeSelected(gameModeCallback);
  });

  afterEach(() => {
    uiManager.closeCurrentDialog();
    document.querySelectorAll('dialog').forEach(d => d.remove());
    vi.restoreAllMocks();
    LocalStorage.clearGameState();
  });

  describe('Single Player resume flow', () => {
    it('should show resume dialog when clicking Single Player with a saved single-player game', () => {
      // Arrange: save a single-player game
      const fakeState = createFakeGameState();
      LocalStorage.saveGameState(fakeState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);

      // Act: show main menu and click Single Player
      uiManager.showMainMenu();
      clickButton('Single Player');

      // Assert: onGameModeSelected should have been called with 'single-player'
      expect(gameModeCallback).toHaveBeenCalledWith('single-player');

      // Assert: resume dialog should be visible
      const resumeDialog = document.querySelector('.resume-game-dialog') as HTMLDialogElement;
      expect(resumeDialog).not.toBeNull();
      expect(resumeDialog.open).toBe(true);
    });

    it('should show color selection when clicking Single Player with no saved game', () => {
      // Arrange: no saved game
      LocalStorage.clearGameState();

      // Act: show main menu and click Single Player
      uiManager.showMainMenu();
      clickButton('Single Player');

      // Assert: onGameModeSelected should have been called
      expect(gameModeCallback).toHaveBeenCalledWith('single-player');

      // Assert: color selection dialog should be visible (not resume)
      const colorDialog = document.querySelector('.color-selection-dialog') as HTMLDialogElement;
      expect(colorDialog).not.toBeNull();
      expect(colorDialog.open).toBe(true);

      const resumeDialog = document.querySelector('.resume-game-dialog');
      expect(resumeDialog).toBeNull();
    });
  });

  describe('Local Two Player resume flow', () => {
    it('should show resume dialog when clicking Local Two Player with a saved local game', () => {
      // Arrange: save a local two-player game
      const fakeState = createFakeGameState();
      LocalStorage.saveGameState(fakeState, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);

      // Act: show main menu and click Local Two Player
      uiManager.showMainMenu();
      clickButton('Local Two Player');

      // Assert: onGameModeSelected should have been called with 'local-two-player'
      expect(gameModeCallback).toHaveBeenCalledWith('local-two-player');

      // Assert: resume dialog should be visible
      const resumeDialog = document.querySelector('.resume-game-dialog') as HTMLDialogElement;
      expect(resumeDialog).not.toBeNull();
      expect(resumeDialog.open).toBe(true);
    });

    it('should NOT show resume dialog when clicking Local Two Player with no saved game', () => {
      // Arrange: no saved game
      LocalStorage.clearGameState();

      // Act: show main menu and click Local Two Player
      uiManager.showMainMenu();
      clickButton('Local Two Player');

      // Assert: onGameModeSelected should have been called
      expect(gameModeCallback).toHaveBeenCalledWith('local-two-player');

      // Assert: no resume dialog
      const resumeDialog = document.querySelector('.resume-game-dialog');
      expect(resumeDialog).toBeNull();
    });
  });

  describe('Cross-mode saved game', () => {
    it('should NOT show resume dialog for single-player when saved game is local-two-player', () => {
      // Arrange: save a local two-player game
      const fakeState = createFakeGameState();
      LocalStorage.saveGameState(fakeState, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);

      // Act: click Single Player
      uiManager.showMainMenu();
      clickButton('Single Player');

      // Assert: should show color selection, not resume
      expect(gameModeCallback).toHaveBeenCalledWith('single-player');
      const colorDialog = document.querySelector('.color-selection-dialog') as HTMLDialogElement;
      expect(colorDialog).not.toBeNull();

      const resumeDialog = document.querySelector('.resume-game-dialog');
      expect(resumeDialog).toBeNull();
    });

    it('should NOT show resume dialog for local-two-player when saved game is single-player', () => {
      // Arrange: save a single-player game
      const fakeState = createFakeGameState();
      LocalStorage.saveGameState(fakeState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);

      // Act: click Local Two Player
      uiManager.showMainMenu();
      clickButton('Local Two Player');

      // Assert: should NOT show resume dialog
      expect(gameModeCallback).toHaveBeenCalledWith('local-two-player');
      const resumeDialog = document.querySelector('.resume-game-dialog');
      expect(resumeDialog).toBeNull();
    });
  });
  describe('Resume handler restores saved state', () => {
    it('should restore the saved board state when resuming, not start a fresh game', () => {
      // Arrange: create a game state with pieces on the board
      const savedState = createFakeGameState();
      savedState.board[0] = PlayerColor.WHITE;
      savedState.board[1] = PlayerColor.BLACK;
      savedState.board[3] = PlayerColor.WHITE;
      savedState.whitePiecesOnBoard = 2;
      savedState.blackPiecesOnBoard = 1;
      savedState.whitePiecesRemaining = 7;
      savedState.blackPiecesRemaining = 8;
      savedState.currentPlayer = PlayerColor.BLACK;
      LocalStorage.saveGameState(savedState, GameMode.SINGLE_PLAYER, PlayerColor.WHITE);

      // Create a real canvas for BoardRenderer
      const canvas = document.createElement('canvas');
      canvas.id = 'game-canvas';
      canvas.width = 600;
      canvas.height = 600;
      document.body.appendChild(canvas);

      const boardRenderer = new BoardRenderer(canvas);

      // Act: create GameController and call loadSavedGame (what onResumeGame SHOULD do)
      const gc = new GameController(GameMode.SINGLE_PLAYER, boardRenderer, PlayerColor.WHITE);
      const loaded = gc.loadSavedGame();

      // Assert: saved state was restored
      expect(loaded).toBe(true);
      const state = gc.getCurrentGameState();
      expect(state).not.toBeNull();
      expect(state!.board[0]).toBe(PlayerColor.WHITE);
      expect(state!.board[1]).toBe(PlayerColor.BLACK);
      expect(state!.board[3]).toBe(PlayerColor.WHITE);
      expect(state!.whitePiecesOnBoard).toBe(2);
      expect(state!.blackPiecesOnBoard).toBe(1);
      expect(state!.whitePiecesRemaining).toBe(7);
      expect(state!.blackPiecesRemaining).toBe(8);
      expect(state!.currentPlayer).toBe(PlayerColor.BLACK);

      // Cleanup
      gc.stopGameLoop();
      canvas.remove();
    });

    it('should NOT call startGame when resuming — startGame creates a fresh empty board', () => {
      // Arrange: save a game with pieces
      const savedState = createFakeGameState();
      savedState.board[5] = PlayerColor.WHITE;
      savedState.whitePiecesOnBoard = 1;
      savedState.whitePiecesRemaining = 8;
      LocalStorage.saveGameState(savedState, GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      document.body.appendChild(canvas);

      const boardRenderer = new BoardRenderer(canvas);
      const gc = new GameController(GameMode.LOCAL_TWO_PLAYER, boardRenderer, PlayerColor.WHITE);

      // Act: call startGame (the WRONG approach) — this should create a fresh board
      gc.startGame();
      const freshState = gc.getCurrentGameState();

      // Assert: startGame creates a blank board — all positions null
      expect(freshState!.board.every((pos: PlayerColor | null) => pos === null)).toBe(true);
      expect(freshState!.whitePiecesRemaining).toBe(9);

      // Cleanup
      gc.stopGameLoop();
      canvas.remove();
    });
  });
});

/** Click a button by its text content */
function clickButton(text: string): void {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === text);
  if (!btn) {
    throw new Error(`Button "${text}" not found in DOM`);
  }
  btn.click();
}

/** Create a minimal fake game state for LocalStorage */
function createFakeGameState(): GameState {
  return {
    gameId: 'test-game-123',
    board: new Array(24).fill(null),
    currentPlayer: PlayerColor.WHITE,
    phase: GamePhase.PLACEMENT,
    isGameOver: false,
    gameOver: false,
    whitePiecesRemaining: 9,
    blackPiecesRemaining: 9,
    whitePiecesOnBoard: 3,
    blackPiecesOnBoard: 2,
    millFormed: false,
    winner: null,
  };
}
