import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TutorialController, TutorialAction } from './TutorialController.js';
import { GameController } from './GameController.js';
import { BoardRenderer } from '../rendering/BoardRenderer.js';
import { GameMode, PlayerColor } from '../models/index.js';

/**
 * Unit Tests for TutorialController
 *
 * These tests validate specific tutorial navigation scenarios and edge cases.
 */

// Mock canvas and context
const mockContext = {
  clearRect: vi.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
  lineCap: '',
  lineJoin: '',
  font: '',
  textAlign: '',
  textBaseline: '',
  globalAlpha: 1,
  beginPath: vi.fn(),
  rect: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  scale: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
};

const createMockCanvas = () => ({
  getContext: vi.fn(() => mockContext),
  width: 800,
  height: 800,
  style: { width: '', height: '' },
  parentElement: {
    clientWidth: 800,
    clientHeight: 800,
  },
  getBoundingClientRect: vi.fn(() => ({
    width: 800,
    height: 800,
    top: 0,
    left: 0,
    right: 800,
    bottom: 800,
    x: 0,
    y: 0,
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as unknown as HTMLCanvasElement);

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

describe('TutorialController Unit Tests', () => {
  let tutorialController: TutorialController;
  let mockGameController: GameController;
  let mockBoardRenderer: BoardRenderer;
  let mockOnComplete: vi.Mock;

  beforeEach(() => {
    // Create mock canvas element
    const canvas = createMockCanvas();

    // Create mock board renderer
    mockBoardRenderer = new BoardRenderer(canvas);

    // Create mock game controller
    mockGameController = new GameController(GameMode.TUTORIAL, mockBoardRenderer, PlayerColor.WHITE);

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

      expect(tutorialController.getTotalSteps()).toBe(10);
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
      for (let i = 1; i < 10; i++) {
        expect(tutorialController.getCurrentStep()).toBe(i);
        tutorialController.nextStep();
      }

      expect(tutorialController.getCurrentStep()).toBe(10);
    });

    it('should complete tutorial when advancing from last step', () => {
      // Navigate to last step
      for (let i = 1; i < 10; i++) {
        tutorialController.nextStep();
      }

      expect(tutorialController.getCurrentStep()).toBe(10);
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

      // Correct action (any remove action)
      const correctAction: TutorialAction = { type: 'remove', position: 10 };
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

    it('should validate move action on step 7', () => {
      // Navigate to step 7 (expects move action)
      for (let i = 1; i < 7; i++) {
        tutorialController.nextStep();
      }

      // Correct action (any move action)
      const correctAction: TutorialAction = { type: 'move', from: 0, to: 1 };
      expect(tutorialController.validateAction(correctAction)).toBe(true);

      // Restart to test incorrect action
      tutorialController.skip();
      tutorialController.start(mockGameController, mockBoardRenderer, mockOnComplete);
      for (let i = 1; i < 7; i++) {
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
      expect(totalSteps).toBe(10);

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
      for (let i = 1; i < 10; i++) {
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
      for (let i = 1; i < 10; i++) {
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
