import { GameController, GameState } from './GameController';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { PlayerColor, GamePhase } from '../models';
import { logger } from '../utils/logger.js';

/**
 * Tutorial step definition
 */
export interface TutorialStep {
  stepNumber: number;
  type: 'informational' | 'interactive';
  title: string;
  instructions: string;
  highlightPositions: number[];
  allowedPositions: number[]; // Positions that are clickable for this step
  expectedAction: TutorialAction | null;
  boardStateConfig: Partial<{
    board: (PlayerColor | null)[];
    currentPlayer: PlayerColor;
    phase: GamePhase;
    whitePiecesRemaining: number;
    blackPiecesRemaining: number;
    whitePiecesOnBoard: number;
    blackPiecesOnBoard: number;
  }> | null;
  errorMessage: string;
  opponentMove: number | null; // Position for opponent to place/move after player's action
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
 * Tutorial state for tracking progress
 */
interface TutorialState {
  currentStep: number;
  enabledPositions: number[];
  selectedPosition: number | null;
  awaitingAction: 'select' | 'move' | 'remove' | 'place' | null;
  boardStateHistory: GameState[];
}

/**
 * TutorialController manages the interactive tutorial system
 * Guides users through learning Nine Men's Morris rules and gameplay
 *
 * CRITICAL: This implementation follows the complete design specification
 * in .kiro/steering/tutorial-system-design.md
 */
export class TutorialController {
  private currentStepIndex: number = 0;
  private tutorialSteps: TutorialStep[] = [];
  private gameController: GameController | null = null;
  private boardRenderer: BoardRenderer | null = null;
  private tutorialOverlay: HTMLElement | null = null;
  private isActive: boolean = false;
  private onTutorialComplete: (() => void) | null = null;

  // Tutorial state management
  private tutorialState: TutorialState = {
    currentStep: 0,
    enabledPositions: [],
    selectedPosition: null,
    awaitingAction: null,
    boardStateHistory: [],
  };

  constructor() {
    this.initializeTutorialSteps();
  }

  /**
   * Initialize all 15 tutorial steps according to design specification
   */
  private initializeTutorialSteps(): void {
    this.tutorialSteps = [
      // PHASE 1: INTRODUCTION (Steps 1-2)

      // Step 1: Welcome
      {
        stepNumber: 1,
        type: 'informational',
        title: "Welcome to Nine Men's Morris",
        instructions:
          'Nine Men\'s Morris is an ancient strategy board game. The goal is to form "mills" (three pieces in a row) to remove opponent pieces. Reduce your opponent to fewer than 3 pieces or block all their moves to win!',
        highlightPositions: [],
        allowedPositions: [], // No positions clickable
        expectedAction: null,
        boardStateConfig: null,
        errorMessage: '',
        opponentMove: null,
      },

      // Step 2: Board Layout
      {
        stepNumber: 2,
        type: 'informational',
        title: 'The Board',
        instructions:
          'The board has 24 positions arranged in three concentric squares. Pieces can be placed on any intersection point. Lines show which positions are connected.',
        highlightPositions: [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7, // Outer square
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15, // Middle square
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23, // Inner square
        ],
        allowedPositions: [], // No positions clickable
        expectedAction: null,
        boardStateConfig: null,
        errorMessage: '',
        opponentMove: null,
      },

      // PHASE 2: PLACEMENT & MILLS (Steps 3-8)

      // Step 3: First Placement
      {
        stepNumber: 3,
        type: 'interactive',
        title: 'Placing Your First Piece',
        instructions:
          'You are WHITE. Click the highlighted spot at the top-left corner to place your first piece.',
        highlightPositions: [0],
        allowedPositions: [0], // Only position 0 clickable
        expectedAction: { type: 'place', position: 0 },
        boardStateConfig: null,
        errorMessage: 'Please click the highlighted spot at the top-left corner',
        opponentMove: 8, // Black places at 8
      },

      // Step 4: Second Placement
      {
        stepNumber: 4,
        type: 'interactive',
        title: 'Continue Placing',
        instructions:
          'Players alternate turns. Black just placed a piece. Now place your piece at the highlighted spot on the top edge.',
        highlightPositions: [1],
        allowedPositions: [1], // Only position 1 clickable
        expectedAction: { type: 'place', position: 1 },
        boardStateConfig: null,
        errorMessage: 'Please click the highlighted spot on the top edge',
        opponentMove: 9, // Black places at 9
      },

      // Step 5: Forming a Mill
      {
        stepNumber: 5,
        type: 'interactive',
        title: 'Forming a Mill',
        instructions:
          'A "mill" is 3 pieces in a row. Complete the top row by placing at the highlighted spot in the top-right corner.',
        highlightPositions: [0, 1, 2],
        allowedPositions: [2], // Only position 2 clickable
        expectedAction: { type: 'place', position: 2 },
        boardStateConfig: null,
        errorMessage: 'Place your piece at the highlighted spot to complete the mill',
        opponentMove: null, // No opponent move - player removes piece next
      },

      // Step 6: Removing Opponent Piece
      {
        stepNumber: 6,
        type: 'interactive',
        title: 'Removing Opponent Pieces',
        instructions:
          'You formed a mill! Now remove one of the highlighted black pieces by clicking on it.',
        highlightPositions: [8, 9],
        allowedPositions: [8, 9], // Only positions 8 and 9 clickable
        expectedAction: { type: 'remove' },
        boardStateConfig: null,
        errorMessage: 'Click on one of the highlighted black pieces to remove it',
        opponentMove: null,
      },

      // Step 7: Placement Practice
      {
        stepNumber: 7,
        type: 'interactive',
        title: 'Placement Practice',
        instructions:
          "Let's practice placing a few more pieces. Place at the highlighted spot on the left edge.",
        highlightPositions: [7],
        allowedPositions: [7], // Only position 7 clickable
        expectedAction: { type: 'place', position: 7 },
        boardStateConfig: {
          // Ensure WHITE is the current player
          currentPlayer: PlayerColor.WHITE,
        },
        errorMessage: 'Place your piece at the highlighted spot',
        opponentMove: 15, // Black places at 15
      },

      // Step 8: Complete Placement Phase
      {
        stepNumber: 8,
        type: 'informational',
        title: 'Placement Phase Complete',
        instructions:
          "Great! In a real game, you'd place all 9 pieces. Now let's learn about moving pieces.",
        highlightPositions: [],
        allowedPositions: [], // No positions clickable
        expectedAction: null,
        boardStateConfig: {
          // Reset board to movement phase scenario
          board: Array(24).fill(null),
          currentPlayer: PlayerColor.WHITE,
          phase: GamePhase.MOVEMENT,
          whitePiecesRemaining: 0,
          blackPiecesRemaining: 0,
          whitePiecesOnBoard: 5,
          blackPiecesOnBoard: 4,
        },
        errorMessage: '',
        opponentMove: null,
      },

      // PHASE 3: MOVEMENT (Steps 9-11)

      // Step 9: Movement Phase Introduction
      {
        stepNumber: 9,
        type: 'informational',
        title: 'Movement Phase',
        instructions:
          'After all pieces are placed, you move them to adjacent empty positions along the lines.',
        highlightPositions: [0, 1, 7], // Show some adjacency
        allowedPositions: [], // No positions clickable
        expectedAction: null,
        boardStateConfig: null,
        errorMessage: '',
        opponentMove: null,
      },

      // Step 10: First Move
      {
        stepNumber: 10,
        type: 'interactive',
        title: 'Moving a Piece',
        instructions:
          'Click your highlighted piece at the top-left corner, then click an adjacent empty spot to move it there.',
        highlightPositions: [0],
        allowedPositions: [0], // Only position 0 clickable initially
        expectedAction: { type: 'move', from: 0 }, // Allow any valid destination
        boardStateConfig: null,
        errorMessage: 'Select the highlighted piece at the top-left corner',
        opponentMove: null, // No opponent move needed - Step 11 will reset player
      },

      // Step 11: Movement Practice
      {
        stepNumber: 11,
        type: 'interactive',
        title: 'Practice Moving',
        instructions:
          'Now move your highlighted piece at the top-right corner to an adjacent empty spot.',
        highlightPositions: [2],
        allowedPositions: [2], // Only position 2 clickable
        expectedAction: { type: 'move', from: 2 }, // Allow any valid destination
        boardStateConfig: {
          // Ensure WHITE is the current player
          currentPlayer: PlayerColor.WHITE,
        },
        errorMessage: 'Select the highlighted piece, then move to an adjacent empty spot',
        opponentMove: null,
      },

      // PHASE 4: FLYING (Steps 12-13)

      // Step 12: Flying Phase Introduction
      {
        stepNumber: 12,
        type: 'informational',
        title: 'Flying Phase',
        instructions:
          'When you have only 3 pieces left, you can move to ANY empty position, not just adjacent ones!',
        highlightPositions: [],
        allowedPositions: [], // No positions clickable
        expectedAction: null,
        boardStateConfig: {
          // Reset board to flying phase scenario
          board: Array(24).fill(null),
          currentPlayer: PlayerColor.WHITE,
          phase: GamePhase.FLYING,
          whitePiecesRemaining: 0,
          blackPiecesRemaining: 0,
          whitePiecesOnBoard: 3,
          blackPiecesOnBoard: 3,
        },
        errorMessage: '',
        opponentMove: null,
      },

      // Step 13: Flying Practice
      {
        stepNumber: 13,
        type: 'interactive',
        title: 'Practice Flying',
        instructions:
          'You have 3 pieces, so you can fly! Move your highlighted piece to any empty spot on the board (not just adjacent ones).',
        highlightPositions: [0],
        allowedPositions: [0], // Only position 0 clickable
        expectedAction: { type: 'move', from: 0 }, // Allow any valid destination
        boardStateConfig: null,
        errorMessage: 'Select the highlighted piece, then click any empty spot to fly there',
        opponentMove: null,
      },

      // PHASE 5: WRAP-UP (Steps 14-15)

      // Step 14: Win Conditions
      {
        stepNumber: 14,
        type: 'informational',
        title: 'How to Win',
        instructions:
          'You win by: 1) Reducing opponent to fewer than 3 pieces, OR 2) Blocking all their moves. Strategy: Form mills to remove pieces!',
        highlightPositions: [],
        allowedPositions: [], // No positions clickable
        expectedAction: null,
        boardStateConfig: null,
        errorMessage: '',
        opponentMove: null,
      },

      // Step 15: Tutorial Complete
      {
        stepNumber: 15,
        type: 'informational',
        title: 'Tutorial Complete!',
        instructions:
          "Congratulations! You now know how to play Nine Men's Morris. Ready to practice against the AI?",
        highlightPositions: [],
        allowedPositions: [], // No positions clickable
        expectedAction: null,
        boardStateConfig: null,
        errorMessage: '',
        opponentMove: null,
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

    // Reset tutorial state
    this.tutorialState = {
      currentStep: 0,
      enabledPositions: [],
      selectedPosition: null,
      awaitingAction: null,
      boardStateHistory: [],
    };

    // Start the actual game for interactive tutorial
    if (this.gameController) {
      this.gameController.startGame();
    }

    this.createTutorialOverlay();
    this.executeCurrentStep();
  }

  /**
   * Execute the current tutorial step
   * This is the core step execution flow from the design specification
   */
  private executeCurrentStep(): void {
    const step = this.tutorialSteps[this.currentStepIndex];

    // 1. Save current board state for back navigation
    if (this.gameController) {
      this.tutorialState.boardStateHistory.push(this.gameController.getBoardState());
    }

    // 2. Update tutorial panel (title, instructions)
    this.updateOverlayContent(step);

    // 3. Set board state (may reset board completely)
    if (step.boardStateConfig && this.gameController) {
      const currentState = this.gameController.getBoardState();
      const newState = {
        ...currentState,
        ...step.boardStateConfig,
      };

      // Apply board configuration if specified
      if (step.boardStateConfig.board) {
        newState.board = [...step.boardStateConfig.board];
      }

      // For step 8 (movement phase), set up specific board
      if (step.stepNumber === 8) {
        const board = Array(24).fill(null);
        // White pieces: 0, 2, 7, 16, 17 (position 1 is empty - adjacent to 0)
        board[0] = PlayerColor.WHITE;
        board[2] = PlayerColor.WHITE;
        board[7] = PlayerColor.WHITE;
        board[16] = PlayerColor.WHITE;
        board[17] = PlayerColor.WHITE;
        // Black pieces: 8, 9, 15, 23
        board[8] = PlayerColor.BLACK;
        board[9] = PlayerColor.BLACK;
        board[15] = PlayerColor.BLACK;
        board[23] = PlayerColor.BLACK;
        newState.board = board;
        // Ensure WHITE is the current player for movement phase
        newState.currentPlayer = PlayerColor.WHITE;
      }

      // For step 12 (flying phase), set up specific board
      if (step.stepNumber === 12) {
        const board = Array(24).fill(null);
        board[0] = PlayerColor.WHITE;
        board[8] = PlayerColor.WHITE;
        board[16] = PlayerColor.WHITE;
        board[4] = PlayerColor.BLACK;
        board[12] = PlayerColor.BLACK;
        board[20] = PlayerColor.BLACK;
        newState.board = board;
      }

      this.gameController.setBoardState(newState);
    }

    // 4. Update highlights based on step type
    if (this.boardRenderer) {
      if (step.highlightPositions.length > 0) {
        this.boardRenderer.highlightValidMoves(step.highlightPositions);
      } else {
        this.boardRenderer.clearHighlights();
      }
    }

    // 5. Configure input control (enable/disable positions)
    if (this.boardRenderer) {
      if (step.type === 'interactive') {
        // Interactive step: enable only allowed positions
        this.boardRenderer.setClickablePositions(step.allowedPositions);
        this.tutorialState.enabledPositions = step.allowedPositions;
      } else {
        // Informational step: disable all positions
        this.boardRenderer.setClickablePositions([]);
        this.tutorialState.enabledPositions = [];
      }
    }

    // 6. Update tutorial state
    this.tutorialState.currentStep = this.currentStepIndex;
    this.tutorialState.selectedPosition = null;

    if (step.type === 'interactive' && step.expectedAction) {
      // Map tutorial action types to awaiting action types
      const actionType = step.expectedAction.type;
      if (actionType === 'place' || actionType === 'move' || actionType === 'remove') {
        this.tutorialState.awaitingAction = actionType;
      } else if (actionType === 'next' || actionType === 'skip') {
        this.tutorialState.awaitingAction = null;
      } else {
        this.tutorialState.awaitingAction = null;
      }
    } else {
      this.tutorialState.awaitingAction = null;
    }
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

      // Restore previous board state
      if (this.tutorialState.boardStateHistory.length > 0 && this.gameController) {
        const previousState = this.tutorialState.boardStateHistory.pop();
        this.gameController.setBoardState(previousState);
      }

      this.executeCurrentStep();
    }
  }

  /**
   * Skip tutorial
   */
  public skip(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.removeTutorialOverlay();

    // Re-enable all positions
    if (this.boardRenderer) {
      this.boardRenderer.setClickablePositions(null);
    }

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

    // If no validation needed, any action is valid
    if (!currentStep.expectedAction) {
      return true;
    }

    // Validate the action
    let isValid = false;

    if (action.type === 'place' && currentStep.expectedAction.type === 'place') {
      isValid = action.position === currentStep.expectedAction.position;
    } else if (action.type === 'remove' && currentStep.expectedAction.type === 'remove') {
      // For removal, check if position is in allowed positions
      isValid = currentStep.allowedPositions.includes(action.position || -1);
    } else if (action.type === 'move' && currentStep.expectedAction.type === 'move') {
      // For movement, validate from position only
      // Allow moving to any valid position (better UX - user doesn't need to guess which position number)
      isValid = action.from === currentStep.expectedAction.from;
    }

    if (isValid) {
      // Correct action - show success feedback
      this.showFeedback('Perfect! Well done!', 'success');

      // Reset clickable positions for movement steps
      if (action.type === 'move' && this.boardRenderer) {
        this.boardRenderer.setClickablePositions(currentStep.allowedPositions);
        this.tutorialState.enabledPositions = currentStep.allowedPositions;
      }

      // Simulate opponent move if needed, then advance
      setTimeout(() => {
        this.simulateOpponentMove();
        setTimeout(() => {
          this.nextStep();
        }, 400);
      }, 800);

      return true;
    } else {
      // Incorrect action - provide feedback
      this.showFeedback(currentStep.errorMessage, 'error');

      // Reset clickable positions for movement steps on error
      if (action.type === 'move' && this.boardRenderer) {
        this.boardRenderer.setClickablePositions(currentStep.allowedPositions);
        this.tutorialState.enabledPositions = currentStep.allowedPositions;
      }

      return false;
    }
  }

  /**
   * Simulate opponent move after player's correct action
   */
  private simulateOpponentMove(): void {
    if (!this.gameController || !this.isActive) {
      return;
    }

    const currentStep = this.tutorialSteps[this.currentStepIndex];

    if (currentStep.opponentMove !== null && this.gameController) {
      // Get current game state to verify player has switched
      const gameState = this.gameController.getCurrentGameState();
      if (!gameState) {
        return;
      }

      // Verify the current player is BLACK (opponent) before simulating
      if (gameState.currentPlayer !== PlayerColor.BLACK) {
        logger.warn('Tutorial: Cannot simulate opponent move - current player is not BLACK');
        logger.debug(`Tutorial: Current player=${gameState.currentPlayer}, Expected=BLACK`);
        return;
      }
      logger.debug(`Tutorial: Simulating opponent move at position ${currentStep.opponentMove}`);

      // Temporarily disable tutorial validation for opponent move
      const wasActive = this.isActive;
      this.isActive = false;

      setTimeout(() => {
        if (this.gameController) {
          // Simulate opponent placement using public API
          this.gameController.handlePositionClick(currentStep.opponentMove);
        }
        this.isActive = wasActive;
      }, 200);
    }
  }

  /**
   * Handle a game action (called by GameController)
   */
  public handleGameAction(
    type: 'place' | 'move' | 'remove',
    position?: number,
    from?: number,
    to?: number
  ): boolean {
    if (!this.isActive) {
      return true; // Not in tutorial, allow action
    }

    const currentStep = this.tutorialSteps[this.currentStepIndex];

    // If this step doesn't require game action, allow it
    if (currentStep.type !== 'interactive') {
      return true;
    }

    // Special handling for movement steps
    if (type === 'move' && currentStep.expectedAction?.type === 'move') {
      // If this is the first click (selecting a piece)
      if (from !== undefined && to === undefined) {
        // Check if the selected piece is correct
        if (from === currentStep.expectedAction.from) {
          // Correct piece selected
          // Note: We don't update clickable positions here because validMoves hasn't been calculated yet
          // GameController will call onPieceSelected() after calculating validMoves
          return true; // Allow the selection
        } else {
          // Wrong piece selected
          this.showFeedback(currentStep.errorMessage, 'error');
          return false;
        }
      }
      // If this is the second click (moving to destination), fall through to validation
    }

    // Create action object
    const action: TutorialAction = {
      type,
      position,
      from,
      to,
    };

    // Validate the action
    return this.validateAction(action);
  }

  /**
   * Called by GameController after a piece is selected and valid moves are calculated
   * This allows the tutorial to update clickable positions with the valid destinations
   */
  public onPieceSelected(_position: number, validMoves: number[]): void {
    if (!this.isActive) {
      return;
    }

    const currentStep = this.tutorialSteps[this.currentStepIndex];

    // Only update clickable positions for movement steps
    if (currentStep.type === 'interactive' && currentStep.expectedAction?.type === 'move') {
      // Enable all valid move positions as clickable
      if (validMoves.length > 0 && this.boardRenderer) {
        logger.debug(`Tutorial: Enabling valid move positions - ${validMoves.join(', ')}`);
        this.boardRenderer.setClickablePositions(validMoves);
        this.tutorialState.enabledPositions = validMoves;
      }
    }
  }

  /**
   * Complete the tutorial
   */
  private complete(): void {
    this.isActive = false;
    this.removeTutorialOverlay();

    // Re-enable all positions
    if (this.boardRenderer) {
      this.boardRenderer.setClickablePositions(null);
    }

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
          <h2 class="tutorial-title tutorial-step-title"></h2>
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
    if (!this.tutorialOverlay) {
      return;
    }

    const titleEl = this.tutorialOverlay.querySelector('.tutorial-title');
    const instructionsEl = this.tutorialOverlay.querySelector('.tutorial-instructions');
    const progressEl = this.tutorialOverlay.querySelector('.tutorial-progress');
    const backBtn = this.tutorialOverlay.querySelector('.tutorial-back-btn') as HTMLButtonElement;
    const nextBtn = this.tutorialOverlay.querySelector('.tutorial-next-btn') as HTMLButtonElement;

    if (titleEl) {
      titleEl.textContent = step.title;
    }
    if (instructionsEl) {
      instructionsEl.textContent = step.instructions;
    }
    if (progressEl) {
      progressEl.textContent = `Step ${step.stepNumber} of ${this.tutorialSteps.length}`;
    }

    // Update button states
    if (backBtn) {
      backBtn.disabled = this.currentStepIndex === 0;
    }
    if (nextBtn) {
      // Disable next button if this step requires a game action
      nextBtn.disabled = step.type === 'interactive';
      nextBtn.textContent =
        this.currentStepIndex === this.tutorialSteps.length - 1 ? 'Finish' : 'Next';
    }

    // Clear feedback
    const feedbackEl = this.tutorialOverlay.querySelector('.tutorial-feedback');
    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'tutorial-feedback';
    }
  }

  /**
   * Show feedback message
   */
  private showFeedback(message: string, type: 'success' | 'error'): void {
    if (!this.tutorialOverlay) {
      return;
    }

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
