import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TutorialController, TutorialAction } from './TutorialController.js';
import { PlayerColor, GamePhase } from '../models/index.js';

/**
 * Unit Tests for TutorialController
 *
 * These tests validate specific tutorial navigation scenarios and edge cases.
 */

describe('TutorialController Unit Tests', () => {
  let tutorialController: TutorialController;
  let mockGameController: any;
  let mockBoardRenderer: any;
  let mockOnComplete: vi.Mock;

  beforeEach(() => {
    // Mock DOM methods that TutorialController uses
    const mockElement = {
      className: '',
      innerHTML: '',
      textContent: '',
      disabled: false,
      // eslint-disable-next-line no-unused-vars
      querySelector: vi.fn((_selector: string) => mockElement),
      addEventListener: vi.fn(),
      remove: vi.fn(),
    };

    global.document = {
      createElement: vi.fn(() => mockElement),
      body: {
        appendChild: vi.fn(),
      },
      querySelector: vi.fn(() => mockElement),
    } as any;

    // Create mock board renderer with only the methods TutorialController uses
    mockBoardRenderer = {
      highlightValidMoves: vi.fn(),
      clearHighlights: vi.fn(),
      setClickablePositions: vi.fn(),
      render: vi.fn(), // Prevent real rendering during tests
    };

    // Create mock game controller with only the methods TutorialController uses
    mockGameController = {
      startGame: vi.fn(),
      getBoardState: vi.fn(() => ({
        board: Array(24).fill(null),
        currentPlayer: PlayerColor.WHITE,
        phase: GamePhase.PLACEMENT,
        whitePiecesRemaining: 9,
        blackPiecesRemaining: 9,
        whitePiecesOnBoard: 0,
        blackPiecesOnBoard: 0,
        selectedPosition: null,
        millFormed: false,
        gameStatus: 'IN_PROGRESS',
      })),
      setBoardState: vi.fn(),
    };

    // Create mock completion callback
    mockOnComplete = vi.fn();

    // Create tutorial controller
    tutorialController = new TutorialController();
  });

  describe('Tutorial Initialization', () => {
    it('should start at step 1', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);

      expect(tutorialController.getCurrentStep()).toBe(1);
      expect(tutorialController.isActiveTutorial()).toBe(true);
    });

    it('should have 10 total steps', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);

      expect(tutorialController.getTotalSteps()).toBe(15);
    });

    it('should not be active before start', () => {
      expect(tutorialController.isActiveTutorial()).toBe(false);
    });
  });

  describe('Next Step Navigation', () => {
    beforeEach(() => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
    });

    it('should advance to next step when nextStep is called', () => {
      expect(tutorialController.getCurrentStep()).toBe(1);

      tutorialController.nextStep();
      expect(tutorialController.getCurrentStep()).toBe(2);

      tutorialController.nextStep();
      expect(tutorialController.getCurrentStep()).toBe(3);
    });

    it('should advance through all steps', () => {
      for (let i = 1; i < 15; i++) {
        expect(tutorialController.getCurrentStep()).toBe(i);
        tutorialController.nextStep();
      }

      expect(tutorialController.getCurrentStep()).toBe(15);
    });

    it('should complete tutorial when advancing from last step', () => {
      // Navigate to last step
      for (let i = 1; i < 15; i++) {
        tutorialController.nextStep();
      }

      expect(tutorialController.getCurrentStep()).toBe(15);
      expect(tutorialController.isActiveTutorial()).toBe(true);

      // Advance from last step
      tutorialController.nextStep();

      // Tutorial should be complete
      expect(tutorialController.isActiveTutorial()).toBe(false);
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Previous Step Navigation', () => {
    beforeEach(() => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
    });

    it('should go back to previous step when previousStep is called', () => {
      tutorialController.nextStep(); // Step 2
      tutorialController.nextStep(); // Step 3

      expect(tutorialController.getCurrentStep()).toBe(3);

      tutorialController.previousStep();
      expect(tutorialController.getCurrentStep()).toBe(2);

      tutorialController.previousStep();
      expect(tutorialController.getCurrentStep()).toBe(1);
    });

    it('should not go below step 1', () => {
      expect(tutorialController.getCurrentStep()).toBe(1);

      tutorialController.previousStep();
      expect(tutorialController.getCurrentStep()).toBe(1);

      tutorialController.previousStep();
      expect(tutorialController.getCurrentStep()).toBe(1);
    });

    it('should allow back and forth navigation', () => {
      tutorialController.nextStep(); // Step 2
      tutorialController.nextStep(); // Step 3
      expect(tutorialController.getCurrentStep()).toBe(3);

      tutorialController.previousStep(); // Step 2
      expect(tutorialController.getCurrentStep()).toBe(2);

      tutorialController.nextStep(); // Step 3
      expect(tutorialController.getCurrentStep()).toBe(3);

      tutorialController.nextStep(); // Step 4
      expect(tutorialController.getCurrentStep()).toBe(4);
    });
  });

  describe('Skip Functionality', () => {
    beforeEach(() => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
    });

    it('should end tutorial when skip is called', () => {
      expect(tutorialController.isActiveTutorial()).toBe(true);

      tutorialController.skip();

      expect(tutorialController.isActiveTutorial()).toBe(false);
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should allow skip from any step', () => {
      tutorialController.nextStep(); // Step 2
      tutorialController.nextStep(); // Step 3
      tutorialController.nextStep(); // Step 4

      expect(tutorialController.getCurrentStep()).toBe(4);
      expect(tutorialController.isActiveTutorial()).toBe(true);

      tutorialController.skip();

      expect(tutorialController.isActiveTutorial()).toBe(false);
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should call completion callback when skipped', () => {
      tutorialController.skip();

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action Validation', () => {
    beforeEach(() => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
    });

    it('should accept any action when not in tutorial mode', () => {
      tutorialController.skip();

      const action: TutorialAction = { type: 'place', position: 5 };
      const isValid = tutorialController.validateAction(action);

      expect(isValid).toBe(true);
    });

    it('should validate placement action on step 3', () => {
      // Navigate to step 3 (expects place at position 0)
      tutorialController.nextStep(); // Step 2
      tutorialController.nextStep(); // Step 3

      // Correct action
      const correctAction: TutorialAction = { type: 'place', position: 0 };
      expect(tutorialController.validateAction(correctAction)).toBe(true);

      // Restart to test incorrect action
      tutorialController.skip();
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
      tutorialController.nextStep(); // Step 2
      tutorialController.nextStep(); // Step 3

      // Incorrect action (wrong position)
      const incorrectAction: TutorialAction = { type: 'place', position: 5 };
      expect(tutorialController.validateAction(incorrectAction)).toBe(false);
    });

    it('should validate placement action on step 4', () => {
      // Navigate to step 4 (expects place at position 1)
      tutorialController.nextStep(); // Step 2
      tutorialController.nextStep(); // Step 3
      tutorialController.nextStep(); // Step 4

      // Correct action
      const correctAction: TutorialAction = { type: 'place', position: 1 };
      expect(tutorialController.validateAction(correctAction)).toBe(true);
    });

    it('should validate placement action on step 5', () => {
      // Navigate to step 5 (expects place at position 2)
      for (let i = 1; i < 5; i++) {
        tutorialController.nextStep();
      }

      // Correct action
      const correctAction: TutorialAction = { type: 'place', position: 2 };
      expect(tutorialController.validateAction(correctAction)).toBe(true);
    });

    it('should validate remove action on step 6', () => {
      // Navigate to step 6 (expects remove action)
      for (let i = 1; i < 6; i++) {
        tutorialController.nextStep();
      }

      // Correct action (remove at position 8 or 9)
      const correctAction: TutorialAction = { type: 'remove', position: 8 };
      expect(tutorialController.validateAction(correctAction)).toBe(true);

      // Restart to test incorrect action
      tutorialController.skip();
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
      for (let i = 1; i < 6; i++) {
        tutorialController.nextStep();
      }

      // Incorrect action (wrong type)
      const incorrectAction: TutorialAction = { type: 'place', position: 5 };
      expect(tutorialController.validateAction(incorrectAction)).toBe(false);
    });

    it('should validate move action on step 10', () => {
      // Navigate to step 10 (expects move action)
      for (let i = 1; i < 10; i++) {
        tutorialController.nextStep();
      }

      // Correct action (any move action)
      const correctAction: TutorialAction = { type: 'move', from: 0, to: 1 };
      expect(tutorialController.validateAction(correctAction)).toBe(true);

      // Restart to test incorrect action
      tutorialController.skip();
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
      for (let i = 1; i < 10; i++) {
        tutorialController.nextStep();
      }

      // Incorrect action (wrong type)
      const incorrectAction: TutorialAction = { type: 'place', position: 5 };
      expect(tutorialController.validateAction(incorrectAction)).toBe(false);
    });

    it('should accept any action on steps without validation', () => {
      // Step 1 has no validation
      const action1: TutorialAction = { type: 'place', position: 10 };
      expect(tutorialController.validateAction(action1)).toBe(true);

      // Step 2 has no validation
      tutorialController.nextStep();
      const action2: TutorialAction = { type: 'move', from: 0, to: 1 };
      expect(tutorialController.validateAction(action2)).toBe(true);

      // Step 8 has no validation
      for (let i = 2; i < 8; i++) {
        tutorialController.nextStep();
      }
      const action8: TutorialAction = { type: 'remove', position: 5 };
      expect(tutorialController.validateAction(action8)).toBe(true);
    });
  });

  describe('Tutorial State', () => {
    it('should track active state correctly', () => {
      expect(tutorialController.isActiveTutorial()).toBe(false);

      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
      expect(tutorialController.isActiveTutorial()).toBe(true);

      tutorialController.skip();
      expect(tutorialController.isActiveTutorial()).toBe(false);
    });

    it('should track current step correctly', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);

      expect(tutorialController.getCurrentStep()).toBe(1);

      tutorialController.nextStep();
      expect(tutorialController.getCurrentStep()).toBe(2);

      tutorialController.nextStep();
      expect(tutorialController.getCurrentStep()).toBe(3);

      tutorialController.previousStep();
      expect(tutorialController.getCurrentStep()).toBe(2);
    });

    it('should maintain total steps count', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);

      const totalSteps = tutorialController.getTotalSteps();
      expect(totalSteps).toBe(15);

      // Total steps should not change during navigation
      tutorialController.nextStep();
      expect(tutorialController.getTotalSteps()).toBe(totalSteps);

      tutorialController.nextStep();
      expect(tutorialController.getTotalSteps()).toBe(totalSteps);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple start calls', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
      expect(tutorialController.getCurrentStep()).toBe(1);

      tutorialController.nextStep();
      expect(tutorialController.getCurrentStep()).toBe(2);

      // Start again - should reset to step 1
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
      expect(tutorialController.getCurrentStep()).toBe(1);
    });

    it('should handle skip after completion', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);

      // Complete tutorial
      for (let i = 1; i < 15; i++) {
        tutorialController.nextStep();
      }
      tutorialController.nextStep(); // Complete

      expect(tutorialController.isActiveTutorial()).toBe(false);

      // Skip should not cause errors
      tutorialController.skip();
      expect(tutorialController.isActiveTutorial()).toBe(false);
    });

    it('should handle navigation after skip', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
      tutorialController.nextStep();
      tutorialController.skip();

      // Navigation after skip should not cause errors
      tutorialController.nextStep();
      tutorialController.previousStep();

      expect(tutorialController.isActiveTutorial()).toBe(false);
    });
  });

  describe('Completion Callback', () => {
    it('should call completion callback on skip', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);

      expect(mockOnComplete).not.toHaveBeenCalled();

      tutorialController.skip();

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should call completion callback on natural completion', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);

      expect(mockOnComplete).not.toHaveBeenCalled();

      // Navigate to end
      for (let i = 1; i < 15; i++) {
        tutorialController.nextStep();
      }
      tutorialController.nextStep(); // Complete

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should not call completion callback multiple times', () => {
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);

      tutorialController.skip();
      expect(mockOnComplete).toHaveBeenCalledTimes(1);

      tutorialController.skip();
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });
});
