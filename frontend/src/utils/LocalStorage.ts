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
  private static readonly THEME_KEY = 'ninemensmorris_theme';
  private static readonly SP_STORAGE_KEY = 'ninemensmorris_saved_game_sp';
  private static readonly TP_STORAGE_KEY = 'ninemensmorris_saved_game_tp';

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
      const key = this.getStorageKeyForMode(gameMode);
      window.localStorage.setItem(key, serialized);
      logger.info(`Game state saved: ${gameState.gameId} (key: ${key})`);
      return true;
    } catch (e) {
      logger.error('Failed to save game state', e);
      return false;
    }
  }

  /**
   * Load saved game state from localStorage.
   * Checks mode-specific keys first, then falls back to legacy key.
   *
   * @returns The saved game state, or null if no saved game exists or loading fails
   */
  public static loadGameState(): SavedGameState | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      // Check mode-specific keys first (SP, then TP)
      for (const key of [this.SP_STORAGE_KEY, this.TP_STORAGE_KEY]) {
        const serialized = window.localStorage.getItem(key);
        if (serialized) {
          const savedGame = JSON.parse(serialized) as SavedGameState;
          if (this.isValidSavedGame(savedGame)) {
            logger.info(`Loaded saved game: ${savedGame.gameId}`);
            return savedGame;
          }
        }
      }

      // Fall back to legacy key
      const serialized = window.localStorage.getItem(this.STORAGE_KEY);
      if (!serialized) {
        logger.info('No saved game found');
        return null;
      }

      const savedGame = JSON.parse(serialized) as SavedGameState;
      if (!this.isValidSavedGame(savedGame)) {
        logger.warn('Invalid saved game data, clearing');
        this.clearGameState();
        return null;
      }

      logger.info(`Loaded saved game: ${savedGame.gameId}`);
      return savedGame;
    } catch (e) {
      logger.error('Failed to load game state', e);
      this.clearGameState();
      return null;
    }
  }

  /**
   * Validate that a parsed saved game has all required fields
   */
  private static isValidSavedGame(savedGame: SavedGameState): boolean {
    return !!(
      savedGame.gameId &&
      savedGame.phase !== undefined &&
      savedGame.currentPlayer !== undefined &&
      Array.isArray(savedGame.board) &&
      savedGame.board.length === 24
    );
  }

  /**
   * Clear saved game state from localStorage.
   * Clears both mode-specific keys and the legacy key.
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
      window.localStorage.removeItem(this.SP_STORAGE_KEY);
      window.localStorage.removeItem(this.TP_STORAGE_KEY);
      logger.info('Saved game state cleared');
    } catch (e) {
      logger.error('Failed to clear game state', e);
    }
  }

  /**
   * Check if a saved game exists (any mode)
   *
   * @returns true if a saved game exists, false otherwise
   */
  public static hasSavedGame(): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      return (
        window.localStorage.getItem(this.SP_STORAGE_KEY) !== null ||
        window.localStorage.getItem(this.TP_STORAGE_KEY) !== null ||
        window.localStorage.getItem(this.STORAGE_KEY) !== null
      );
    } catch (e) {
      logger.error('Failed to check for saved game', e);
      return false;
    }
  }

  /**
   * Get the storage key for a specific game mode
   */
  private static getStorageKeyForMode(mode: GameMode): string {
    switch (mode) {
      case GameMode.SINGLE_PLAYER:
        return this.SP_STORAGE_KEY;
      case GameMode.LOCAL_TWO_PLAYER:
        return this.TP_STORAGE_KEY;
      default:
        return this.STORAGE_KEY;
    }
  }

  /**
   * Load saved game state for a specific game mode.
   * Falls back to the legacy key and migrates if found.
   */
  public static loadGameStateForMode(mode: GameMode): SavedGameState | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      const key = this.getStorageKeyForMode(mode);
      let serialized = window.localStorage.getItem(key);

      // If not found under mode-specific key, check legacy key for migration
      if (!serialized) {
        const legacySerialized = window.localStorage.getItem(this.STORAGE_KEY);
        if (legacySerialized) {
          try {
            const legacyData = JSON.parse(legacySerialized) as SavedGameState;
            if (legacyData.gameMode === mode) {
              // Migrate: save to new key, remove legacy key
              window.localStorage.setItem(key, legacySerialized);
              window.localStorage.removeItem(this.STORAGE_KEY);
              serialized = legacySerialized;
              logger.info(`Migrated legacy save to mode-specific key: ${key}`);
            }
          } catch {
            // Legacy data is corrupted, ignore
          }
        }
      }

      if (!serialized) {
        return null;
      }

      const savedGame = JSON.parse(serialized) as SavedGameState;

      if (
        !savedGame.gameId ||
        savedGame.phase === undefined ||
        savedGame.currentPlayer === undefined ||
        !Array.isArray(savedGame.board) ||
        savedGame.board.length !== 24
      ) {
        logger.warn('Invalid saved game data for mode, clearing');
        window.localStorage.removeItem(key);
        return null;
      }

      return savedGame;
    } catch (e) {
      logger.error('Failed to load game state for mode', e);
      return null;
    }
  }

  /**
   * Check if a saved game exists for a specific game mode
   */
  public static hasSavedGameForMode(mode: GameMode): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      const key = this.getStorageKeyForMode(mode);
      if (window.localStorage.getItem(key) !== null) {
        return true;
      }
      // Also check legacy key
      const legacySerialized = window.localStorage.getItem(this.STORAGE_KEY);
      if (legacySerialized) {
        try {
          const legacyData = JSON.parse(legacySerialized) as SavedGameState;
          return legacyData.gameMode === mode;
        } catch {
          return false;
        }
      }
      return false;
    } catch (e) {
      logger.error('Failed to check for saved game for mode', e);
      return false;
    }
  }

  /**
   * Clear saved game state for a specific game mode
   */
  public static clearGameStateForMode(mode: GameMode): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      const key = this.getStorageKeyForMode(mode);
      window.localStorage.removeItem(key);
      // Also clear legacy key if it matches this mode
      const legacySerialized = window.localStorage.getItem(this.STORAGE_KEY);
      if (legacySerialized) {
        try {
          const legacyData = JSON.parse(legacySerialized) as SavedGameState;
          if (legacyData.gameMode === mode) {
            window.localStorage.removeItem(this.STORAGE_KEY);
          }
        } catch {
          // Ignore corrupted legacy data
        }
      }
      logger.info(`Saved game state cleared for mode: ${mode}`);
    } catch (e) {
      logger.error('Failed to clear game state for mode', e);
    }
  }

  /**
   * Save theme preference to localStorage
   */
  public static saveThemePreference(theme: 'dark' | 'light'): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    try {
      window.localStorage.setItem(this.THEME_KEY, theme);
    } catch (e) {
      logger.error('Failed to save theme preference', e);
    }
  }

  /**
   * Load theme preference from localStorage
   *
   * @returns The saved theme preference, defaults to 'dark'
   */
  public static loadThemePreference(): 'dark' | 'light' {
    if (!this.isLocalStorageAvailable()) {
      return 'dark';
    }
    try {
      const theme = window.localStorage.getItem(this.THEME_KEY);
      if (theme === 'light' || theme === 'dark') {
        return theme;
      }
      return 'dark';
    } catch (e) {
      logger.error('Failed to load theme preference', e);
      return 'dark';
    }
  }
}
