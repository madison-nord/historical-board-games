// Main entry point for Nine Men's Morris game
import { logger } from './utils/logger.js';
import { GameController } from './controllers/GameController.js';
import { BoardRenderer } from './rendering/BoardRenderer.js';
import { UIManager } from './controllers/UIManager.js';
import { TutorialController } from './controllers/TutorialController.js';
import { GameMode, PlayerColor } from './models/index.js';
import { LocalStorage } from './utils/LocalStorage.js';
import { startOnlineMultiplayer } from './onlineMultiplayer.js';
import { InfoPanel } from './controllers/InfoPanel.js';
import { AnnouncementBanner } from './controllers/AnnouncementBanner.js';

logger.info("Nine Men's Morris - Game Loading...");

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

// Initialize Info Panel and Announcement Banner
const infoPanel = new InfoPanel();
infoPanel.create();
const announcementBanner = new AnnouncementBanner();
announcementBanner.create();

// Disable canvas game info text since InfoPanel is active
boardRenderer.setInfoPanelActive(true);

// Global game controller reference
let gameController: GameController | null = null;
let tutorialController: TutorialController | null = null;

// Set up UI manager callbacks
uiManager.setOnGameModeSelected((mode: string) => {
  logger.info(`Game mode selected: ${mode}`);

  switch (mode) {
    case 'single-player':
      uiManager.showColorSelection();
      break;
    case 'local-two-player':
      startGame(GameMode.LOCAL_TWO_PLAYER, PlayerColor.WHITE);
      break;
    case 'tutorial':
      startTutorial();
      break;
    case 'online-multiplayer':
      startOnlineMultiplayer(uiManager, boardRenderer, gc => {
        gameController = gc;
        if (gc) {
          gc.setInfoPanel(infoPanel);
          gc.setAnnouncementBanner(announcementBanner);
        }
      }, infoPanel);
      break;
  }
});

uiManager.setOnColorSelected((color: PlayerColor) => {
  logger.info(`Player selected color: ${color}`);
  startGame(GameMode.SINGLE_PLAYER, color);
});

uiManager.setOnResumeGame(() => {
  logger.info('Resuming saved game');
  const savedGame = LocalStorage.loadGameState();
  if (savedGame) {
    gameController = new GameController(savedGame.gameMode, boardRenderer, savedGame.playerColor);
    gameController.setInfoPanel(infoPanel);
    gameController.setAnnouncementBanner(announcementBanner);
    gameController.startGame();
  }
});

uiManager.setOnNewGame(() => {
  logger.info('Starting new game instead of resuming');
  LocalStorage.clearGameState();
  uiManager.showMainMenu();
});

// Check for saved game
const savedGame = LocalStorage.loadGameState();
if (savedGame && savedGame.gameMode !== GameMode.ONLINE_MULTIPLAYER) {
  // Show resume dialog
  uiManager.showResumeGameDialog();
} else {
  // Show main menu
  uiManager.showMainMenu();
}

function startGame(mode: GameMode, playerColor: PlayerColor): void {
  logger.info(`Starting game: ${mode}`);
  gameController = new GameController(mode, boardRenderer, playerColor);
  gameController.setInfoPanel(infoPanel);
  gameController.setAnnouncementBanner(announcementBanner);

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
  tutorialController = new TutorialController();
  gameController = new GameController(GameMode.TUTORIAL, boardRenderer, PlayerColor.WHITE);

  // Wire InfoPanel and AnnouncementBanner for tutorial mode
  gameController.setInfoPanel(infoPanel);
  gameController.setAnnouncementBanner(announcementBanner);

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
