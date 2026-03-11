import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TutorialController } from './TutorialController';
import { GameController } from './GameController';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { PlayerColor, GameMode, GamePhase } from '../models';

/**
 * Integration test for Step 10 movement flow
 * This test reproduces the exact user flow: select piece at position 0, then move to position 1
 */
describe('TutorialController - Step 10 Movement Flow', () => {
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
    gameController = new GameController(GameMode.TUTORIAL, boardRenderer);
    tutorialController = new TutorialController();

    // Link them together
    gameController.setTutorialController(tutorialController);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(canvas);
  });

  it('should allow moving from position 0 to position 1 in Step 10', async () => {
    // Start tutorial
    tutorialController.start(gameController, boardRenderer, () => {});

    // Advance to Step 10 (Movement Phase - First Move)
    for (let i = 0; i < 9; i++) {
      tutorialController.nextStep();
    }

    // Verify we're at Step 10
    const currentStep = (tutorialController as any).currentStepIndex;
    expect(currentStep).toBe(9); // 0-indexed, so step 10 is index 9

    const step = (tutorialController as any).tutorialSteps[currentStep];
    expect(step.stepNumber).toBe(10);
    expect(step.title).toBe('Moving a Piece');

    // Verify board state - position 0 should have a WHITE piece
    const gameState = gameController.getCurrentGameState();
    expect(gameState?.board[0]).toBe(PlayerColor.WHITE);
    expect(gameState?.currentPlayer).toBe(PlayerColor.WHITE);
    expect(gameState?.phase).toBe(GamePhase.MOVEMENT);

    // Verify only position 0 is clickable initially
    const clickablePositions = boardRenderer.getClickablePositions();
    expect(clickablePositions).toEqual([0]);

    // STEP 1: Click position 0 to select the piece
    console.log('[TEST] Clicking position 0 to select piece');
    gameController.handlePositionClick(0);

    // Wait for selection to be processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the piece is selected
    const selectedPosition = (gameController as any).selectedPosition;
    expect(selectedPosition).toBe(0);
    console.log('[TEST] Selected position:', selectedPosition);

    // CRITICAL: After selecting position 0, position 1 should be clickable
    // Position 1 is adjacent to position 0 and is empty
    const clickableAfterSelection = boardRenderer.getClickablePositions();
    console.log('[TEST] Clickable positions after selection:', clickableAfterSelection);
    expect(clickableAfterSelection).toContain(1);

    // STEP 2: Click position 1 to complete the move
    console.log('[TEST] Clicking position 1 to complete move');
    gameController.handlePositionClick(1);

    // Wait for move to be processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the move was completed
    const finalState = gameController.getCurrentGameState();
    expect(finalState?.board[0]).toBe(null); // Position 0 should be empty
    expect(finalState?.board[1]).toBe(PlayerColor.WHITE); // Position 1 should have WHITE piece
    console.log('[TEST] Move completed successfully');
  });

  it('should only allow moving to empty adjacent positions in Step 10', async () => {
    // Start tutorial
    tutorialController.start(gameController, boardRenderer, () => {});

    // Advance to Step 10
    for (let i = 0; i < 9; i++) {
      tutorialController.nextStep();
    }

    // Verify board setup: position 0 has WHITE, position 7 has WHITE, position 1 is empty
    const gameState = gameController.getCurrentGameState();
    expect(gameState?.board[0]).toBe(PlayerColor.WHITE);
    expect(gameState?.board[7]).toBe(PlayerColor.WHITE); // Position 7 is occupied
    expect(gameState?.board[1]).toBe(null); // Position 1 is empty

    // Click position 0 to select
    gameController.handlePositionClick(0);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Only position 1 should be clickable (position 7 is occupied by WHITE piece)
    const clickableAfterSelection = boardRenderer.getClickablePositions();
    expect(clickableAfterSelection).toEqual([1]);
    expect(clickableAfterSelection).not.toContain(7); // Position 7 is not a valid move

    // Click position 1 to complete move
    gameController.handlePositionClick(1);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the move was completed
    const finalState = gameController.getCurrentGameState();
    expect(finalState?.board[0]).toBe(null);
    expect(finalState?.board[1]).toBe(PlayerColor.WHITE);
  });
});
