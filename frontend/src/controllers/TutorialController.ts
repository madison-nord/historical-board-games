import { GameController } from './GameController';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { PlayerColor, GamePhase } from '../models/GameState';

/**
 * Tutorial step definition
 */
export interface TutorialStep {
  stepNumber: number;
  title: string;
  instructions: string;
  highlightPositions: number[];
  expectedAction: TutorialAction | null;
  validationFn: ((action: TutorialAction) => boolean) | null;
  onComplete: (() => void) | null;
}

/**
 * User action in tutorial
 */
export interface TutorialAction {
  type: 'place' | 'move' | 'remove' | 'next' | 'skip';
  position?: number;
  from?: number;
  to?: number;
}

/**
 * TutorialController manages the interactive tutorial system
 * Guides users through learning Nine Men's Morris rules and gameplay
 */
export class TutorialController {
  private currentStepIndex: number = 0;
  private tutorialSteps: TutorialStep[] = [];
  private gameController: GameController | null = null;
  private boardRenderer: BoardRenderer | null = null;
  private tutorialOverlay: HTMLElement | null = null;
  private isActive: boolean = false;
  private onTutorialComplete: (() => void) | null = null;

  constructor() {
    this.initializeTutorialSteps();
  }

  /**
   * Initialize all tutorial steps
   */
  private initializeTutorialSteps(): void {
    this.tutorialSteps = [
      // Step 1: Introduction
      {
        stepNumber: 1,
        title: 'Welcome to Nine Men\'s Morris',
        instructions:
          'Nine Men\'s Morris is an ancient strategy board game. The goal is to form "mills" (three pieces in a row) to remove opponent pieces. Reduce your opponent to fewer than 3 pieces or block all their moves to win!',
        highlightPositions: [],
        expectedAction: null,
        validationFn: null,
        onComplete: null,
      },

      // Step 2: Board layout
      {
        stepNumber: 2,
        title: 'The Board',
        instructions:
          'The board has 24 positions arranged in three concentric squares. Pieces can be placed on any intersection point. Lines show which positions are connected.',
        highlightPositions: [0, 1, 2, 3, 4, 5, 6, 7], // Highlight outer square
        expectedAction: null,
        validationFn: null,
        onComplete: null,
      },

      // Step 3: Placement phase - first piece
      {
        stepNumber: 3,
        title: 'Placement Phase',
        instructions:
          'The game starts with the Placement Phase. Each player has 9 pieces to place. White goes first. Try placing a piece on position 0 (top-left corner).',
        highlightPositions: [0],
        expectedAction: { type: 'place', position: 0 },
        validationFn: (action: TutorialAction) =>
          action.type === 'place' && action.position === 0,
        onComplete: null,
      },

      // Step 4: More placement practice
      {
        stepNumber: 4,
        title: 'Continue Placing',
        instructions:
          'Good! Players alternate placing pieces. Now place another piece on position 1 (top middle).',
        highlightPositions: [1],
        expectedAction: { type: 'place', position: 1 },
        validationFn: (action: TutorialAction) =>
          action.type === 'place' && action.position === 1,
        onComplete: null,
      },

      // Step 5: Forming a mill
      {
        stepNumber: 5,
        title: 'Forming a Mill',
        instructions:
          'A "mill" is three pieces of the same color in a straight line. Let\'s form your first mill! Place a piece on position 2 to complete the top row.',
        highlightPositions: [0, 1, 2],
        expectedAction: { type: 'place', position: 2 },
        validationFn: (action: TutorialAction) =>
          action.type === 'place' && action.position === 2,
        onComplete: null,
      },

      // Step 6: Removing opponent piece
      {
        stepNumber: 6,
        title: 'Removing Opponent Pieces',
        instructions:
          'Excellent! When you form a mill, you can remove one opponent piece. You cannot remove pieces that are part of a mill (unless all opponent pieces are in mills). Click on an opponent piece to remove it.',
        highlightPositions: [],
        expectedAction: { type: 'remove' },
        validationFn: (action: TutorialAction) => action.type === 'remove',
        onComplete: null,
      },

      // Step 7: Movement phase
      {
        stepNumber: 7,
        title: 'Movement Phase',
        instructions:
          'After all pieces are placed, the Movement Phase begins. You can move your pieces to adjacent empty positions along the lines. Try moving a piece to an adjacent position.',
        highlightPositions: [],
        expectedAction: { type: 'move' },
        validationFn: (action: TutorialAction) => action.type === 'move',
        onComplete: null,
      },

      // Step 8: Flying phase
      {
        stepNumber: 8,
        title: 'Flying Phase',
        instructions:
          'When a player has only 3 pieces left, they enter the Flying Phase. In this phase, pieces can move to ANY empty position, not just adjacent ones. This gives you more flexibility!',
        highlightPositions: [],
        expectedAction: null,
        validationFn: null,
        onComplete: null,
      },

      // Step 9: Win conditions
      {
        stepNumber: 9,
        title: 'How to Win',
        instructions:
          'You win by: 1) Reducing your opponent to fewer than 3 pieces, OR 2) Blocking all their legal moves. Strategy tip: Form mills to remove opponent pieces and control key positions!',
        highlightPositions: [],
        expectedAction: null,
        validationFn: null,
        onComplete: null,
      },

      // Step 10: Completion
      {
        stepNumber: 10,
        title: 'Tutorial Complete!',
        instructions:
          'Congratulations! You now know how to play Nine Men\'s Morris. Ready to practice against the AI?',
        highlightPositions: [],
        expectedAction: null,
        validationFn: null,
        onComplete: null,
      },
    ];
  }

  /**
   * Start the tutorial
   */
  public start(
    gameController: GameController,
    boardRenderer: BoardRenderer,
    onComplete: () => void
  ): void {
    this.gameController = gameController;
    this.boardRenderer = boardRenderer;
    this.onTutorialComplete = onComplete;
    this.currentStepIndex = 0;
    this.isActive = true;

    this.createTutorialOverlay();
    this.executeCurrentStep();
  }

  /**
   * Advance to next step
   */
  public nextStep(): void {
    if (this.currentStepIndex < this.tutorialSteps.length - 1) {
      this.currentStepIndex++;
      this.executeCurrentStep();
    } else {
      this.complete();
    }
  }

  /**
   * Go back to previous step
   */
  public previousStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.executeCurrentStep();
    }
  }

  /**
   * Skip tutorial
   */
  public skip(): void {
    if (!this.isActive) {
      return; // Already inactive, don't call callback again
    }

    this.isActive = false;
    this.removeTutorialOverlay();
    if (this.onTutorialComplete) {
      this.onTutorialComplete();
    }
  }

  /**
   * Validate user action against current step expectations
   */
  public validateAction(action: TutorialAction): boolean {
    if (!this.isActive) {
      return true; // Not in tutorial mode
    }

    const currentStep = this.tutorialSteps[this.currentStepIndex];

    // If no validation function, any action is valid
    if (!currentStep.validationFn) {
      return true;
    }

    // Validate the action
    const isValid = currentStep.validationFn(action);

    if (isValid) {
      // Correct action - advance to next step
      setTimeout(() => this.nextStep(), 500);
      return true;
    } else {
      // Incorrect action - provide feedback
      this.showFeedback('That\'s not quite right. Try again!', 'error');
      return false;
    }
  }

  /**
   * Execute the current tutorial step
   */
  private executeCurrentStep(): void {
    const step = this.tutorialSteps[this.currentStepIndex];

    // Update overlay content
    this.updateOverlayContent(step);

    // Highlight positions if specified
    if (this.boardRenderer && step.highlightPositions.length > 0) {
      this.boardRenderer.highlightValidMoves(step.highlightPositions);
    } else if (this.boardRenderer) {
      this.boardRenderer.clearHighlights();
    }

    // Execute step completion callback if provided
    if (step.onComplete) {
      step.onComplete();
    }
  }

  /**
   * Complete the tutorial
   */
  private complete(): void {
    this.isActive = false;
    this.removeTutorialOverlay();

    if (this.onTutorialComplete) {
      this.onTutorialComplete();
    }
  }

  /**
   * Create tutorial overlay UI
   */
  private createTutorialOverlay(): void {
    this.tutorialOverlay = document.createElement('div');
    this.tutorialOverlay.className = 'tutorial-overlay';
    this.tutorialOverlay.innerHTML = `
      <div class="tutorial-panel">
        <div class="tutorial-header">
          <h2 class="tutorial-title"></h2>
          <button class="tutorial-skip-btn">Skip Tutorial</button>
        </div>
        <div class="tutorial-content">
          <p class="tutorial-instructions"></p>
        </div>
        <div class="tutorial-feedback"></div>
        <div class="tutorial-navigation">
          <button class="tutorial-back-btn">Back</button>
          <span class="tutorial-progress"></span>
          <button class="tutorial-next-btn">Next</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.tutorialOverlay);

    // Add event listeners
    const skipBtn = this.tutorialOverlay.querySelector('.tutorial-skip-btn');
    const backBtn = this.tutorialOverlay.querySelector('.tutorial-back-btn');
    const nextBtn = this.tutorialOverlay.querySelector('.tutorial-next-btn');

    skipBtn?.addEventListener('click', () => this.skip());
    backBtn?.addEventListener('click', () => this.previousStep());
    nextBtn?.addEventListener('click', () => this.nextStep());
  }

  /**
   * Update overlay content for current step
   */
  private updateOverlayContent(step: TutorialStep): void {
    if (!this.tutorialOverlay) return;

    const titleEl = this.tutorialOverlay.querySelector('.tutorial-title');
    const instructionsEl = this.tutorialOverlay.querySelector('.tutorial-instructions');
    const progressEl = this.tutorialOverlay.querySelector('.tutorial-progress');
    const backBtn = this.tutorialOverlay.querySelector(
      '.tutorial-back-btn'
    ) as HTMLButtonElement;
    const nextBtn = this.tutorialOverlay.querySelector(
      '.tutorial-next-btn'
    ) as HTMLButtonElement;

    if (titleEl) titleEl.textContent = step.title;
    if (instructionsEl) instructionsEl.textContent = step.instructions;
    if (progressEl)
      progressEl.textContent = `Step ${step.stepNumber} of ${this.tutorialSteps.length}`;

    // Update button states
    if (backBtn) backBtn.disabled = this.currentStepIndex === 0;
    if (nextBtn) {
      // Only enable next button if step doesn't require validation
      nextBtn.disabled = step.validationFn !== null;
      nextBtn.textContent =
        this.currentStepIndex === this.tutorialSteps.length - 1 ? 'Finish' : 'Next';
    }

    // Clear feedback
    const feedbackEl = this.tutorialOverlay.querySelector('.tutorial-feedback');
    if (feedbackEl) feedbackEl.textContent = '';
  }

  /**
   * Show feedback message
   */
  private showFeedback(message: string, type: 'success' | 'error'): void {
    if (!this.tutorialOverlay) return;

    const feedbackEl = this.tutorialOverlay.querySelector('.tutorial-feedback');
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = `tutorial-feedback tutorial-feedback-${type}`;

      // Clear feedback after 3 seconds
      setTimeout(() => {
        feedbackEl.textContent = '';
        feedbackEl.className = 'tutorial-feedback';
      }, 3000);
    }
  }

  /**
   * Remove tutorial overlay
   */
  private removeTutorialOverlay(): void {
    if (this.tutorialOverlay) {
      this.tutorialOverlay.remove();
      this.tutorialOverlay = null;
    }

    // Clear highlights
    if (this.boardRenderer) {
      this.boardRenderer.clearHighlights();
    }
  }

  /**
   * Check if tutorial is currently active
   */
  public isActiveTutorial(): boolean {
    return this.isActive;
  }

  /**
   * Get current step number
   */
  public getCurrentStep(): number {
    return this.currentStepIndex + 1;
  }

  /**
   * Get total number of steps
   */
  public getTotalSteps(): number {
    return this.tutorialSteps.length;
  }
}
