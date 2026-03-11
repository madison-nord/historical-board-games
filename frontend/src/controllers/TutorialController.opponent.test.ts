import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TutorialController } from './TutorialController';
import { GameController } from './GameController';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { PlayerColor, GameMode, GamePhase } from '../models';

describe('TutorialController - Bug Fixes', () => {
  let tutorialController: TutorialController;
  let gameController: GameController;
  let boardRenderer: BoardRenderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Create instances
    boardRenderer = new BoardRenderer(canvas);
    gameController = new GameController(GameMode.LOCAL_TWO_PLAYER, boardRenderer);
    tutorialController = new TutorialController();

    // Link them together
    gameController.setTutorialController(tutorialController);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(canvas);
  });

  describe('Issue 1: Opponent piece color at Step 7', () => {
    it('should place opponent piece with BLACK color immediately', async () => {
      // Start tutorial
      tutorialController.start(gameController, boardRenderer, () => {});

      // Advance to Step 7 (placement at position 7)
      for (let i = 0; i < 6; i++) {
        tutorialController.nextStep();
      }

      // Verify we're at Step 7
      const currentStep = (tutorialController as any).currentStepIndex;
      expect(currentStep).toBe(6); // 0-indexed, so step 7 is index 6

      // Get initial board state
      const initialState = gameController.getCurrentGameState();
      expect(initialState?.currentPlayer).toBe(PlayerColor.WHITE);

      // Player places at position 7
      gameController.handlePositionClick(7);

      // Wait a bit for the move to be applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that position 7 has WHITE piece
      const afterPlacement = gameController.getCurrentGameState();
      expect(afterPlacement?.board[7]).toBe(PlayerColor.WHITE);
      expect(afterPlacement?.currentPlayer).toBe(PlayerColor.BLACK);

      // Wait for opponent simulation (800ms + 200ms)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Check final state
      const finalState = gameController.getCurrentGameState();

      // Position 7 should still have WHITE piece
      expect(finalState?.board[7]).toBe(PlayerColor.WHITE);

      // Position 15 should have BLACK piece (opponent move)
      expect(finalState?.board[15]).toBe(PlayerColor.BLACK);

      // Current player should be WHITE again
      expect(finalState?.currentPlayer).toBe(PlayerColor.WHITE);
    });
  });

  describe('Issue 2: Position 2 not selectable at Step 11', () => {
    it('should allow selecting position 2 at Step 11', async () => {
      // Start tutorial
      tutorialController.start(gameController, boardRenderer, () => {});

      // Advance to Step 11
      for (let i = 0; i < 10; i++) {
        tutorialController.nextStep();
      }

      // Verify we're at Step 11
      const currentStep = (tutorialController as any).currentStepIndex;
      expect(currentStep).toBe(10); // 0-indexed, so step 11 is index 10

      const step = (tutorialController as any).tutorialSteps[currentStep];
      expect(step.stepNumber).toBe(11);
      expect(step.title).toBe('Practice Moving');

      // Check board state - position 2 should have a WHITE piece
      const gameState = gameController.getCurrentGameState();
      expect(gameState?.board[2]).toBe(PlayerColor.WHITE);
      expect(gameState?.currentPlayer).toBe(PlayerColor.WHITE);
      expect(gameState?.phase).toBe(GamePhase.MOVEMENT);

      // Check that position 2 is clickable
      const clickablePositions = boardRenderer.getClickablePositions();
      expect(clickablePositions).toEqual([2]);

      // Click position 2 to select the piece
      gameController.handlePositionClick(2);

      // Wait a bit for the selection to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the piece is selected (selectedPosition should be 2)
      const selectedPosition = (gameController as any).selectedPosition;
      expect(selectedPosition).toBe(2);

      // With the new UX improvement, any valid adjacent position should be allowed
      // Position 2 has valid moves to positions 1 and 3 (adjacent on outer square)
      // The tutorial no longer restricts to a specific destination
    });

    it('should complete the move from position 2 to 3', async () => {
      // Start tutorial and advance to Step 11
      tutorialController.start(gameController, boardRenderer, () => {});
      for (let i = 0; i < 10; i++) {
        tutorialController.nextStep();
      }

      // Select position 2
      gameController.handlePositionClick(2);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Move to position 3
      gameController.handlePositionClick(3);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that the move was applied
      const gameState = gameController.getCurrentGameState();
      expect(gameState?.board[2]).toBe(null); // Position 2 should be empty
      expect(gameState?.board[3]).toBe(PlayerColor.WHITE); // Position 3 should have WHITE piece
    });
  });
});
