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

logger.info('Game initialized successfully');
