import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { TutorialController } from './TutorialController.js';
import { GameController } from './GameController.js';
import { BoardRenderer } from '../rendering/BoardRenderer.js';
import { GameMode, PlayerColor } from '../models/index.js';

describe('TutorialController - Property-Based Tests', () => {
  let canvas: HTMLCanvasElement;
  let boardRenderer: BoardRenderer;
  let gameController: GameController;
  let tutorialController: TutorialController;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    document.body.appendChild(canvas);

    boardRenderer = new BoardRenderer(canvas);
    gameController = new GameController(
      GameMode.LOCAL_TWO_PLAYER,
      boardRenderer,
      PlayerColor.WHITE
    );
    tutorialController = new TutorialController();
  });

  afterEach(() => {
    document.body.removeChild(canvas);
  });

  it('Property: Current step is always within valid range', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 20 }), advanceCount => {
        tutorialController.start(gameController, boardRenderer, () => {});

        for (let i = 0; i < advanceCount; i++) {
          const currentStep = tutorialController.getCurrentStep();
          if (currentStep < 15) {
            tutorialController.nextStep();
          }
        }

        const finalStep = tutorialController.getCurrentStep();
        expect(finalStep).toBeGreaterThanOrEqual(1);
        expect(finalStep).toBeLessThanOrEqual(15);
      }),
      { numRuns: 100 }
    );
  });

  it('Property: Board always has 24 positions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 15 }), targetStep => {
        tutorialController.start(gameController, boardRenderer, () => {});

        while (tutorialController.getCurrentStep() < targetStep) {
          tutorialController.nextStep();
        }

        const gameState = gameController.getCurrentGameState();
        expect(gameState).not.toBeNull();
        expect(gameState!.board).toHaveLength(24);
      }),
      { numRuns: 100 }
    );
  });

  it('Property: Piece count never exceeds 18 total', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 15 }), targetStep => {
        tutorialController.start(gameController, boardRenderer, () => {});

        while (tutorialController.getCurrentStep() < targetStep) {
          tutorialController.nextStep();
        }

        const gameState = gameController.getCurrentGameState();
        expect(gameState).not.toBeNull();

        const board = gameState!.board;
        let whiteCount = 0;
        let blackCount = 0;

        for (const piece of board) {
          if (piece === PlayerColor.WHITE) {
            whiteCount++;
          }
          if (piece === PlayerColor.BLACK) {
            blackCount++;
          }
        }

        expect(whiteCount).toBeLessThanOrEqual(9);
        expect(blackCount).toBeLessThanOrEqual(9);
        expect(whiteCount + blackCount).toBeLessThanOrEqual(18);
      }),
      { numRuns: 100 }
    );
  });
});
