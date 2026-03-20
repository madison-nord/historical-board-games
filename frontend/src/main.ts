// Main entry point for Nine Men's Morris game
import { logger } from './utils/logger.js';
import { GameController } from './controllers/GameController.js';
import { BoardRenderer } from './rendering/BoardRenderer.js';
import { UIManager } from './controllers/UIManager.js';
import { TutorialController } from './controllers/TutorialController.js';
import { GameMode, PlayerColor } from './models/index.js';
import { LocalStorage } from './utils/LocalStorage.js';
// Lazy-load online multiplayer module — only fetched when user selects online mode
const loadOnlineMultiplayer = () =>
  import('./onlineMultiplayer.js').then(m => m.startOnlineMultiplayer);
import { InfoPanel } from './controllers/InfoPanel.js';
import { AnnouncementBanner } from './controllers/AnnouncementBanner.js';
import { InfoPage } from './controllers/InfoPage.js';
import { SoundManager } from './utils/SoundManager.js';

logger.info("Nine Men's Morris - Game Loading...");

// Load and apply saved theme preference (default: dark)
const savedTheme = LocalStorage.loadThemePreference();
document.documentElement.dataset.theme = savedTheme;

// Get canvas element
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  logger.error('Canvas element not found!');
  throw new Error('Canvas element #game-canvas not found');
}

// Initialize board renderer
const boardRenderer = new BoardRenderer(canvas);

// Initialize UI manager
const uiManager = new UIManager();

// Initialize SoundManager for game audio
const soundManager = new SoundManager();
uiManager.setSoundManager(soundManager);

// Initialize Info Panel and Announcement Banner
const infoPanel = new InfoPanel();
infoPanel.create();
const announcementBanner = new AnnouncementBanner();
announcementBanner.create();

// Disable canvas game info text since InfoPanel is active
boardRenderer.setInfoPanelActive(true);

// Initialize Info Page (accessible from main menu without starting a game)
const infoPage = new InfoPage();
infoPage.setOnBackToMenu(() => {
  infoPage.close();
  announcementBanner.dismiss();
  uiManager.closeCurrentDialog();
  uiManager.showMainMenu();
});
uiManager.setOnInfoPageRequested(() => {
  uiManager.closeCurrentDialog();
  announcementBanner.dismiss();
  infoPage.show();
});

// Global game controller reference
let gameController: GameController | null = null;
let tutorialController: TutorialController | null = null;
// Tracks which mode the user selected when a resume dialog is shown
let pendingNewGameMode: string | null = null;

// Set up UI manager callbacks
uiManager.setOnGameModeSelected((mode: string) => {
  logger.info(`Game mode selected: ${mode}`);

  switch (mode) {
    case 'single-player': {
      // Check for saved single-player game before showing color selection
      if (LocalStorage.hasSavedGameForMode(GameMode.SINGLE_PLAYER)) {
        pendingNewGameMode = 'single-player';
        uiManager.showResumeGameDialog();
      } else {
        uiManager.showColorSelection();
      }
      break;
    }
    case 'local-two-player': {
      // Check for saved local two-player game before starting
      if (LocalStorage.hasSavedGameForMode(GameMode.LOCAL_TWO_PLAYER)) {
        pendingNewGameMode = 'local-two-player';
        uiManager.showResumeGameDialog();
      } else {
        startGame(GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);
      }
      break;
    }
    case 'tutorial':
      startTutorial();
      break;
    case 'online-multiplayer':
      announcementBanner.dismiss();
      uiManager.showGameplayThemeToggle();
      uiManager.showQuitButton(GameMode.ONLINE_MULTIPLAYER);
      loadOnlineMultiplayer().then(startOnline => {
        startOnline(
          uiManager,
          boardRenderer,
          gc => {
            gameController = gc;
            if (gc) {
              gc.setInfoPanel(infoPanel);
              gc.setAnnouncementBanner(announcementBanner);
              gc.setSoundManager(soundManager);
            }
          },
          infoPanel
        );
      });
      uiManager.showMuteButton();
      break;
  }
});

uiManager.setOnColorSelected((color: PlayerColor) => {
  logger.info(`Player selected color: ${color}`);
  startGame(GameMode.SINGLE_PLAYER, color);
});

uiManager.setOnResumeGame(() => {
  logger.info('Resuming saved game');
  const resumeMode =
    pendingNewGameMode === 'single-player' ? GameMode.SINGLE_PLAYER : GameMode.LOCAL_TWO_PLAYER;
  const savedGame = LocalStorage.loadGameStateForMode(resumeMode);
  if (savedGame) {
    announcementBanner.dismiss();
    uiManager.showGameplayThemeToggle();
    uiManager.showQuitButton(savedGame.gameMode);
    gameController = new GameController(savedGame.gameMode, boardRenderer, savedGame.playerColor);
    gameController.setInfoPanel(infoPanel);
    gameController.setAnnouncementBanner(announcementBanner);
    gameController.setSoundManager(soundManager);
    uiManager.showMuteButton();

    // Wire onGameEnd callback for result dialog
    if (savedGame.gameMode === GameMode.SINGLE_PLAYER) {
      gameController.setOnGameEnd(winner =>
        uiManager.showGameResult(winner, false, GameMode.SINGLE_PLAYER, savedGame.playerColor)
      );
    } else if (savedGame.gameMode === GameMode.LOCAL_TWO_PLAYER) {
      gameController.setOnGameEnd(winner => uiManager.showGameResult(winner));
    }

    // Restore saved state instead of starting fresh
    gameController.loadSavedGame();
  }
});

uiManager.setOnNewGame(() => {
  logger.info('Starting new game instead of resuming');
  announcementBanner.dismiss();
  uiManager.hideGameplayThemeToggle();
  uiManager.hideQuitButton();
  uiManager.hideMuteButton();
  // Only clear the save for the mode the user declined to resume
  const mode = pendingNewGameMode;
  if (mode === 'single-player') {
    LocalStorage.clearGameStateForMode(GameMode.SINGLE_PLAYER);
  } else if (mode === 'local-two-player') {
    LocalStorage.clearGameStateForMode(GameMode.LOCAL_TWO_PLAYER);
  }
  // If user declined resume from a mode selection, start that mode fresh
  pendingNewGameMode = null;
  if (mode === 'single-player') {
    uiManager.showColorSelection();
  } else if (mode === 'local-two-player') {
    startGame(GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);
  } else {
    uiManager.showMainMenu();
  }
});

// Quit game handler — cleans up current game and returns to main menu
uiManager.setOnQuitGame(() => {
  logger.info('Player quit the current game');
  announcementBanner.dismiss();

  // Save game state before stopping (only for saveable modes)
  if (gameController) {
    const state = gameController.getCurrentGameState();
    const mode = gameController.getGameMode();
    if (
      state &&
      !state.isGameOver &&
      (mode === GameMode.SINGLE_PLAYER || mode === GameMode.LOCAL_TWO_PLAYER)
    ) {
      LocalStorage.saveGameState(state, mode, gameController.getPlayerColor());
    }
    gameController.stopGameLoop();
    gameController = null;
  }

  // Clear the board canvas so pieces don't linger on the main menu
  boardRenderer.drawBoard();

  // Clean up tutorial if active
  if (tutorialController) {
    tutorialController.skip();
    tutorialController = null;
  }

  uiManager.hideGameplayThemeToggle();
  uiManager.hideQuitButton();
  uiManager.hideMuteButton();
  uiManager.showMainMenu();
});

// Always show main menu on startup — resume is offered when selecting a game mode
uiManager.showMainMenu();

function startGame(mode: GameMode, playerColor: PlayerColor): void {
  logger.info(`Starting game: ${mode}`);
  announcementBanner.dismiss();
  uiManager.showGameplayThemeToggle();
  uiManager.showQuitButton(mode);
  gameController = new GameController(mode, boardRenderer, playerColor);
  gameController.setInfoPanel(infoPanel);
  gameController.setAnnouncementBanner(announcementBanner);
  gameController.setSoundManager(soundManager);
  uiManager.showMuteButton();

  // Wire onGameEnd callback so the result dialog appears after game ends
  if (mode === GameMode.SINGLE_PLAYER) {
    gameController.setOnGameEnd(winner =>
      uiManager.showGameResult(winner, false, GameMode.SINGLE_PLAYER, playerColor)
    );
  } else if (mode === GameMode.LOCAL_TWO_PLAYER) {
    gameController.setOnGameEnd(winner => uiManager.showGameResult(winner));
  }

  gameController.startGame();
}

function startTutorial(): void {
  logger.info('Starting tutorial');
  announcementBanner.dismiss();
  uiManager.showGameplayThemeToggle();
  uiManager.showQuitButton(GameMode.TUTORIAL);
  tutorialController = new TutorialController();
  gameController = new GameController(GameMode.TUTORIAL, boardRenderer, PlayerColor.WHITE);

  // Wire InfoPanel and AnnouncementBanner for tutorial mode
  gameController.setInfoPanel(infoPanel);
  gameController.setAnnouncementBanner(announcementBanner);
  gameController.setSoundManager(soundManager);
  uiManager.showMuteButton();

  // Set tutorial controller on game controller so it can validate actions
  gameController.setTutorialController(tutorialController);

  tutorialController.start(gameController, boardRenderer, () => {
    logger.info('Tutorial completed');
    uiManager.showMainMenu();
  });
}

// Handle window resize events
// This ensures the canvas scales properly while preserving game state
let resizeTimeout: number | null = null;

window.addEventListener('resize', () => {
  // Debounce resize events to avoid excessive re-rendering
  if (resizeTimeout !== null) {
    clearTimeout(resizeTimeout);
  }

  resizeTimeout = window.setTimeout(() => {
    logger.info('Window resized - updating canvas size');

    // Update canvas size and re-render
    // The BoardRenderer.handleResize() method will recalculate positions
    // but will NOT modify the game state
    boardRenderer.handleResize();

    // Re-render the current game state with the new canvas size
    if (gameController) {
      gameController.updateDisplay();
    }

    resizeTimeout = null;
  }, 150); // 150ms debounce delay
});

// Handle orientation change events on mobile devices
window.addEventListener('orientationchange', () => {
  logger.info('Orientation changed - updating canvas size');

  // Wait for orientation change to complete
  window.setTimeout(() => {
    boardRenderer.handleResize();
    if (gameController) {
      gameController.updateDisplay();
    }
  }, 200);
});

logger.info('Game initialized successfully');
