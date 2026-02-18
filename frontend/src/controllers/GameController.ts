import { BoardRenderer } from '../rendering/BoardRenderer.js';
import { GameMode, GamePhase, PlayerColor, Move, MoveType } from '../models/index.js';

/**
 * Interface representing the current game state
 */
export interface GameState {
  gameId: string;
  phase: GamePhase;
  currentPlayer: PlayerColor;
  whitePiecesRemaining: number;
  blackPiecesRemaining: number;
  whitePiecesOnBoard: number;
  blackPiecesOnBoard: number;
  board: (PlayerColor | null)[];
  isGameOver: boolean;
  winner: PlayerColor | null;
  millFormed: boolean;
}

/**
 * GameController orchestrates the Nine Men's Morris game logic and user interactions.
 *
 * This class manages:
 * - Game state and phase transitions
 * - User input handling and move validation
 * - Integration with BoardRenderer for visual updates
 * - Mill formation and piece removal logic
 * - Game end condition detection
 *
 * The controller supports different game modes and handles the complete game flow
 * from start to finish.
 */
export class GameController {
  private gameMode: GameMode;
  private boardRenderer: BoardRenderer;
  private currentGameState: GameState | null = null;
  private selectedPosition: number | null = null;
  private validMoves: number[] = [];

  constructor(gameMode: GameMode, boardRenderer: BoardRenderer) {
    this.gameMode = gameMode;
    this.boardRenderer = boardRenderer;

    // Set up input handling
    this.boardRenderer.setOnPositionClick(this.handlePositionClick.bind(this));
  }

  /**
   * Start a new game with the specified mode
   */
  public startGame(): void {
    // Initialize new game state
    this.currentGameState = {
      gameId: this.generateGameId(),
      phase: GamePhase.PLACEMENT,
      currentPlayer: PlayerColor.WHITE,
      whitePiecesRemaining: 9,
      blackPiecesRemaining: 9,
      whitePiecesOnBoard: 0,
      blackPiecesOnBoard: 0,
      board: new Array(24).fill(null),
      isGameOver: false,
      winner: null,
      millFormed: false,
    };

    this.selectedPosition = null;
    this.validMoves = [];

    // Update visual display
    this.updateDisplay();

    // Enable input
    this.boardRenderer.setInputEnabled(true);

    console.log(`Started new ${this.gameMode} game`);
  }

  /**
   * Handle position clicks from the board renderer
   */
  public handlePositionClick(position: number): void {
    if (!this.currentGameState || this.currentGameState.isGameOver) {
      return;
    }

    console.log(`Position clicked: ${position}`);

    // Handle piece removal after mill formation
    if (this.currentGameState.millFormed) {
      this.handleRemovalClick(position);
      return;
    }

    switch (this.currentGameState.phase) {
      case GamePhase.PLACEMENT:
        this.handlePlacementClick(position);
        break;
      case GamePhase.MOVEMENT:
      case GamePhase.FLYING:
        this.handleMovementClick(position);
        break;
    }
  }

  /**
   * Handle clicks during placement phase
   */
  private handlePlacementClick(position: number): void {
    if (!this.currentGameState) {
      return;
    }

    // Check if position is empty
    if (this.currentGameState.board[position] !== null) {
      console.log('Position already occupied');
      return;
    }

    // Check if current player has pieces remaining
    const piecesRemaining =
      this.currentGameState.currentPlayer === PlayerColor.WHITE
        ? this.currentGameState.whitePiecesRemaining
        : this.currentGameState.blackPiecesRemaining;

    if (piecesRemaining <= 0) {
      console.log('No pieces remaining to place');
      return;
    }

    // Create and apply the move
    const move: Move = {
      type: MoveType.PLACE,
      from: -1,
      to: position,
      player: this.currentGameState.currentPlayer,
      removed: -1,
    };

    this.applyMove(move);
  }

  /**
   * Handle clicks during movement/flying phase
   */
  private handleMovementClick(position: number): void {
    if (!this.currentGameState) {
      return;
    }

    const currentPlayer = this.currentGameState.currentPlayer;
    const pieceAtPosition = this.currentGameState.board[position];

    if (this.selectedPosition === null) {
      // First click - select a piece to move
      if (pieceAtPosition === currentPlayer) {
        this.selectedPosition = position;
        this.validMoves = this.getValidMovesFrom(position);
        this.boardRenderer.highlightValidMoves(this.validMoves);
        console.log(`Selected piece at position ${position}`);
      } else {
        console.log('Must select your own piece');
      }
    } else {
      // Second click - move the selected piece
      if (position === this.selectedPosition) {
        // Clicked same position - deselect
        this.clearSelection();
      } else if (this.validMoves.includes(position)) {
        // Valid move
        const move: Move = {
          type: MoveType.MOVE,
          from: this.selectedPosition,
          to: position,
          player: currentPlayer,
          removed: -1,
        };

        this.applyMove(move);
        this.clearSelection();
      } else {
        console.log('Invalid move');
      }
    }
  }

  /**
   * Apply a move to the game state
   */
  private applyMove(move: Move): void {
    if (!this.currentGameState) {
      return;
    }

    console.log(`Applying move:`, move);

    // Update board state
    if (move.type === MoveType.PLACE) {
      this.currentGameState.board[move.to] = move.player;

      // Update piece counts
      if (move.player === PlayerColor.WHITE) {
        this.currentGameState.whitePiecesRemaining--;
        this.currentGameState.whitePiecesOnBoard++;
      } else {
        this.currentGameState.blackPiecesRemaining--;
        this.currentGameState.blackPiecesOnBoard++;
      }

      // Animate placement
      this.boardRenderer.animatePlacement(move.to, move.player);
    } else if (move.type === MoveType.MOVE) {
      this.currentGameState.board[move.from] = null;
      this.currentGameState.board[move.to] = move.player;

      // Animate movement
      this.boardRenderer.animateMovement(move.from, move.to, move.player);
    }

    // Check for mill formation
    const millFormed = this.checkMillFormed(move.to, move.player);
    this.currentGameState.millFormed = millFormed;

    if (millFormed) {
      console.log('Mill formed! Select opponent piece to remove');
      this.handleMillFormed();
    } else {
      // Switch players and continue
      this.switchPlayer();
      this.checkGameEnd();
    }

    this.updateDisplay();
  }

  /**
   * Handle clicks during piece removal after mill formation
   */
  private handleRemovalClick(position: number): void {
    if (!this.currentGameState) {
      return;
    }

    const opponent =
      this.currentGameState.currentPlayer === PlayerColor.WHITE
        ? PlayerColor.BLACK
        : PlayerColor.WHITE;

    // Check if clicked position has an opponent piece that can be removed
    const removablePieces = this.getRemovablePieces(opponent);

    if (removablePieces.includes(position)) {
      this.removePiece(position);
      this.boardRenderer.clearHighlights();
    } else {
      console.log('Must select a removable opponent piece');
    }
  }

  /**
   * Handle mill formation - allow player to remove opponent piece
   */
  private handleMillFormed(): void {
    if (!this.currentGameState) {
      return;
    }

    const opponent =
      this.currentGameState.currentPlayer === PlayerColor.WHITE
        ? PlayerColor.BLACK
        : PlayerColor.WHITE;

    // Find removable opponent pieces
    const removablePieces = this.getRemovablePieces(opponent);

    if (removablePieces.length > 0) {
      this.boardRenderer.highlightValidMoves(removablePieces);
      // Set up temporary click handler for piece removal
      this.setupRemovalMode(removablePieces);
    } else {
      // No pieces can be removed, continue game
      this.currentGameState.millFormed = false;
      this.switchPlayer();
      this.checkGameEnd();
    }
  }

  /**
   * Set up removal mode after mill formation
   */
  private setupRemovalMode(removablePieces: number[]): void {
    // Store original click handler
    const originalHandler = this.handlePositionClick.bind(this);

    // Set temporary removal handler
    this.boardRenderer.setOnPositionClick((position: number) => {
      if (removablePieces.includes(position)) {
        this.removePiece(position);
        // Restore original handler
        this.boardRenderer.setOnPositionClick(originalHandler);
        this.boardRenderer.clearHighlights();
      } else {
        console.log('Must select a removable opponent piece');
      }
    });
  }

  /**
   * Remove a piece from the board
   */
  private removePiece(position: number): void {
    if (!this.currentGameState) {
      return;
    }

    const removedColor = this.currentGameState.board[position];
    if (!removedColor) {
      return;
    }

    this.currentGameState.board[position] = null;

    // Update piece counts
    if (removedColor === PlayerColor.WHITE) {
      this.currentGameState.whitePiecesOnBoard--;
    } else {
      this.currentGameState.blackPiecesOnBoard--;
    }

    // Animate removal
    this.boardRenderer.animateRemoval(position, removedColor);

    console.log(`Removed ${removedColor} piece from position ${position}`);

    // Clear mill formation flag and switch players
    this.currentGameState.millFormed = false;
    this.switchPlayer();
    this.checkGameEnd();
    this.updateDisplay();
  }

  /**
   * Check if a mill is formed at the given position
   */
  private checkMillFormed(position: number, color: PlayerColor): boolean {
    const millPatterns = [
      // Outer square horizontal lines
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      // Middle square horizontal lines
      [9, 10, 11],
      [12, 13, 14],
      [15, 16, 17],
      // Inner square horizontal lines
      [18, 19, 20],
      [21, 22, 23],
      // Vertical lines connecting all three squares
      [0, 9, 21],
      [3, 10, 18],
      [6, 11, 15],
      [1, 4, 7],
      [16, 19, 22],
      [8, 12, 17],
      [5, 13, 20],
      [2, 14, 23],
    ];

    for (const pattern of millPatterns) {
      if (pattern.includes(position)) {
        const allSameColor = pattern.every(pos => this.currentGameState!.board[pos] === color);
        if (allSameColor) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get pieces that can be removed (not in mills unless all pieces are in mills)
   */
  private getRemovablePieces(color: PlayerColor): number[] {
    if (!this.currentGameState) {
      return [];
    }

    const opponentPieces: number[] = [];
    const piecesInMills: number[] = [];

    // Find all opponent pieces and identify which are in mills
    for (let i = 0; i < 24; i++) {
      if (this.currentGameState.board[i] === color) {
        opponentPieces.push(i);
        if (this.checkMillFormed(i, color)) {
          piecesInMills.push(i);
        }
      }
    }

    // If all pieces are in mills, any can be removed
    if (piecesInMills.length === opponentPieces.length) {
      return opponentPieces;
    }

    // Otherwise, only pieces not in mills can be removed
    return opponentPieces.filter(pos => !piecesInMills.includes(pos));
  }

  /**
   * Get valid moves from a given position
   */
  private getValidMovesFrom(position: number): number[] {
    if (!this.currentGameState) {
      return [];
    }

    const validMoves: number[] = [];

    if (this.currentGameState.phase === GamePhase.FLYING) {
      // In flying phase, can move to any empty position
      for (let i = 0; i < 24; i++) {
        if (this.currentGameState.board[i] === null) {
          validMoves.push(i);
        }
      }
    } else {
      // In movement phase, can only move to adjacent empty positions
      const adjacentPositions = this.getAdjacentPositions(position);
      for (const adjPos of adjacentPositions) {
        if (this.currentGameState.board[adjPos] === null) {
          validMoves.push(adjPos);
        }
      }
    }

    return validMoves;
  }

  /**
   * Get adjacent positions for a given position
   */
  private getAdjacentPositions(position: number): number[] {
    const adjacencyMap: { [key: number]: number[] } = {
      // Outer square
      0: [1, 9],
      1: [0, 2, 4],
      2: [1, 14],
      3: [4, 10],
      4: [1, 3, 5, 7],
      5: [4, 13],
      6: [7, 11],
      7: [4, 6, 8],
      8: [7, 12],

      // Middle square
      9: [0, 10, 21],
      10: [3, 9, 11, 18],
      11: [6, 10, 15],
      12: [8, 13, 17],
      13: [5, 12, 14, 20],
      14: [2, 13, 23],
      15: [11, 16],
      16: [15, 17, 19],
      17: [12, 16],

      // Inner square
      18: [10, 19],
      19: [16, 18, 20, 22],
      20: [13, 19],
      21: [9, 22],
      22: [19, 21, 23],
      23: [14, 22],
    };

    return adjacencyMap[position] || [];
  }

  /**
   * Switch to the next player
   */
  private switchPlayer(): void {
    if (!this.currentGameState) {
      return;
    }

    this.currentGameState.currentPlayer =
      this.currentGameState.currentPlayer === PlayerColor.WHITE
        ? PlayerColor.BLACK
        : PlayerColor.WHITE;

    // Update phase if necessary
    this.updateGamePhase();

    // Check for game end conditions after switching players
    this.checkGameEnd();
  }

  /**
   * Update the game phase based on current state
   */
  private updateGamePhase(): void {
    if (!this.currentGameState) {
      return;
    }

    // Still placing pieces
    if (
      this.currentGameState.whitePiecesRemaining > 0 ||
      this.currentGameState.blackPiecesRemaining > 0
    ) {
      this.currentGameState.phase = GamePhase.PLACEMENT;
      return;
    }

    // Flying phase if either player has exactly 3 pieces
    if (
      this.currentGameState.whitePiecesOnBoard === 3 ||
      this.currentGameState.blackPiecesOnBoard === 3
    ) {
      this.currentGameState.phase = GamePhase.FLYING;
      return;
    }

    // Otherwise, movement phase
    this.currentGameState.phase = GamePhase.MOVEMENT;
  }

  /**
   * Check if the game has ended
   */
  private checkGameEnd(): void {
    if (!this.currentGameState) {
      return;
    }

    // Game ends if a player has fewer than 3 pieces (after placement phase)
    if (this.currentGameState.phase !== GamePhase.PLACEMENT) {
      if (this.currentGameState.whitePiecesOnBoard < 3) {
        this.endGame(PlayerColor.BLACK);
        return;
      }
      if (this.currentGameState.blackPiecesOnBoard < 3) {
        this.endGame(PlayerColor.WHITE);
        return;
      }
    }

    // Game ends if current player has no legal moves
    if (!this.hasLegalMoves(this.currentGameState.currentPlayer)) {
      const winner =
        this.currentGameState.currentPlayer === PlayerColor.WHITE
          ? PlayerColor.BLACK
          : PlayerColor.WHITE;
      this.endGame(winner);
    }
  }

  /**
   * Check if a player has legal moves available
   */
  private hasLegalMoves(player: PlayerColor): boolean {
    if (!this.currentGameState) {
      return false;
    }

    if (this.currentGameState.phase === GamePhase.PLACEMENT) {
      // In placement phase, check if there are empty positions and pieces remaining
      const piecesRemaining =
        player === PlayerColor.WHITE
          ? this.currentGameState.whitePiecesRemaining
          : this.currentGameState.blackPiecesRemaining;

      if (piecesRemaining > 0) {
        return this.currentGameState.board.some(pos => pos === null);
      }
    } else {
      // In movement/flying phase, check if any piece can move
      for (let i = 0; i < 24; i++) {
        if (this.currentGameState.board[i] === player) {
          const validMoves = this.getValidMovesFrom(i);
          if (validMoves.length > 0) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * End the game with the specified winner
   */
  private endGame(winner: PlayerColor): void {
    if (!this.currentGameState) {
      return;
    }

    this.currentGameState.isGameOver = true;
    this.currentGameState.winner = winner;

    // Disable input
    this.boardRenderer.setInputEnabled(false);
    this.clearSelection();

    console.log(`Game Over! Winner: ${winner}`);
    this.updateDisplay();
  }

  /**
   * Clear current selection and highlights
   */
  private clearSelection(): void {
    this.selectedPosition = null;
    this.validMoves = [];
    this.boardRenderer.clearHighlights();
  }

  /**
   * Update the visual display
   */
  private updateDisplay(): void {
    if (!this.currentGameState) {
      return;
    }

    // Update board renderer with current state
    this.boardRenderer.render(
      this.currentGameState.board,
      this.currentGameState.currentPlayer,
      this.currentGameState.phase,
      this.currentGameState.whitePiecesRemaining,
      this.currentGameState.blackPiecesRemaining
    );
  }

  /**
   * Generate a unique game ID
   */
  private generateGameId(): string {
    return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the current game state (for testing and external access)
   */
  public getCurrentGameState(): GameState | null {
    return this.currentGameState;
  }

  /**
   * Get the current game mode
   */
  public getGameMode(): GameMode {
    return this.gameMode;
  }
}
