// Main entry point for Nine Men's Morris game
import { logger } from './utils/logger.js';
import { GameController } from './controllers/GameController.js';
import { BoardRenderer } from './rendering/BoardRenderer.js';
import { GameMode } from './models/GameMode.js';

logger.info("Nine Men's Morris - Game Loading...");

// Get canvas element
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  logger.error('Canvas element not found!');
  throw new Error('Canvas element #game-canvas not found');
}

// Initialize board renderer
const boardRenderer = new BoardRenderer(canvas);

// Initialize game controller with local two-player mode for testing
const gameController = new GameController(GameMode.LOCAL_TWO_PLAYER, boardRenderer);
gameController.startGame();

// Handle window resize events
// This ensures the canvas scales properly while preserving game state
let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

window.addEventListener('resize', () => {
  // Debounce resize events to avoid excessive re-rendering
  if (resizeTimeout !== null) {
    window.clearTimeout(resizeTimeout);
  }

  resizeTimeout = window.setTimeout(() => {
    logger.info('Window resized - updating canvas size');

    // Update canvas size and re-render
    // The BoardRenderer.handleResize() method will recalculate positions
    // but will NOT modify the game state
    boardRenderer.handleResize();

    // Re-render the current game state with the new canvas size
    gameController.updateDisplay();

    resizeTimeout = null;
  }, 150); // 150ms debounce delay
});

// Handle orientation change events on mobile devices
window.addEventListener('orientationchange', () => {
  logger.info('Orientation changed - updating canvas size');

  // Wait for orientation change to complete
  window.setTimeout(() => {
    boardRenderer.handleResize();
    gameController.updateDisplay();
  }, 200);
});

logger.info('Game initialized successfully');
