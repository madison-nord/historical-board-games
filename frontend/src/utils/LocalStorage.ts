import { GameState } from '../controllers/GameController.js';
import { GameMode, PlayerColor } from '../models/index.js';
import { logger } from './logger.js';

/**
 * Interface for saved game data in localStorage
 */
export interface SavedGameState extends GameState {
  gameMode: GameMode;
  playerColor: PlayerColor;
  savedAt: string; // ISO timestamp
}

/**
 * LocalStorage utility class for persisting game state
 *
 * Handles saving and loading game state to/from browser localStorage.
 * Only persists local games (single-player and local two-player).
 * Does NOT persist online multiplayer games.
 */
export class LocalStorage {
  private static readonly STORAGE_KEY = 'ninemensmorris_saved_game';

  /**
   * Check if localStorage is available in the browser
   */
  private static isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      logger.warn('localStorage is not available', e);
      return false;
    }
  }

  /**
   * Save game state to localStorage
   *
   * @param gameState - The current game state to save
   * @param gameMode - The game mode (only local games are saved)
   * @param playerColor - The player's color in single-player mode
   * @returns true if save was successful, false otherwise
   */
  public static saveGameState(
    gameState: GameState,
    gameMode: GameMode,
    playerColor: PlayerColor
  ): boolean {
    // Don't save online multiplayer games
    if (gameMode === GameMode.ONLINE_MULTIPLAYER) {
      logger.info('Skipping save for online multiplayer game');
      return false;
    }

    // Don't save completed games
    if (gameState.isGameOver) {
      logger.info('Skipping save for completed game');
      return false;
    }

    if (!this.isLocalStorageAvailable()) {
      logger.warn('Cannot save game state: localStorage unavailable');
      return false;
    }

    try {
      const savedGame: SavedGameState = {
        ...gameState,
        gameMode,
        playerColor,
        savedAt: new Date().toISOString(),
      };

      const serialized = JSON.stringify(savedGame);
      window.localStorage.setItem(this.STORAGE_KEY, serialized);
      logger.info(`Game state saved: ${gameState.gameId}`);
      return true;
    } catch (e) {
      logger.error('Failed to save game state', e);
      return false;
    }
  }

  /**
   * Load saved game state from localStorage
   *
   * @returns The saved game state, or null if no saved game exists or loading fails
   */
  public static loadGameState(): SavedGameState | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      const serialized = window.localStorage.getItem(this.STORAGE_KEY);
      if (!serialized) {
        logger.info('No saved game found');
        return null;
      }

      const savedGame = JSON.parse(serialized) as SavedGameState;

      // Validate the loaded data has required fields
      if (
        !savedGame.gameId ||
        savedGame.phase === undefined ||
        savedGame.currentPlayer === undefined ||
        !Array.isArray(savedGame.board) ||
        savedGame.board.length !== 24
      ) {
        logger.warn('Invalid saved game data, clearing');
        this.clearGameState();
        return null;
      }

      logger.info(`Loaded saved game: ${savedGame.gameId}`);
      return savedGame;
    } catch (e) {
      logger.error('Failed to load game state', e);
      // Clear corrupted data
      this.clearGameState();
      return null;
    }
  }

  /**
   * Clear saved game state from localStorage
   *
   * Should be called when:
   * - Game is completed
   * - Game is explicitly abandoned
   * - User starts a new game
   */
  public static clearGameState(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      window.localStorage.removeItem(this.STORAGE_KEY);
      logger.info('Saved game state cleared');
    } catch (e) {
      logger.error('Failed to clear game state', e);
    }
  }

  /**
   * Check if a saved game exists
   *
   * @returns true if a saved game exists, false otherwise
   */
  public static hasSavedGame(): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      const serialized = window.localStorage.getItem(this.STORAGE_KEY);
      return serialized !== null;
    } catch (e) {
      logger.error('Failed to check for saved game', e);
      return false;
    }
  }
}
