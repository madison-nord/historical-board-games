import { PlayerColor, GamePhase } from '../models/index.js';
import { AnimationQueue } from './AnimationQueue.js';
import { PlacementAnimation } from './PlacementAnimation.js';
import { MovementAnimation } from './MovementAnimation.js';
import { RemovalAnimation } from './RemovalAnimation.js';
import { MillAnimation } from './MillAnimation.js';

/**
 * Coordinates for a position on the board
 */
export interface PositionCoordinates {
  x: number;
  y: number;
}

/**
 * BoardRenderer handles the visual rendering of the Nine Men's Morris game board
 * using HTML5 Canvas API for optimal performance
 */
export class BoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private boardSize: number = 400; // Default size, will be adjusted for responsive design
  private pieceRadius: number = 12;
  private lineWidth: number = 2;

  // Board layout constants - Nine Men's Morris has 3 concentric squares
  private readonly positions: PositionCoordinates[] = [];

  // Highlighting state
  private highlightedPositions: Set<number> = new Set();
  private hoveredPosition: number | null = null;

  // Animation system
  private animationQueue: AnimationQueue = new AnimationQueue();

  // Input handling
  // eslint-disable-next-line no-unused-vars
  private onPositionClick: ((position: number) => void) | null = null;
  private isInputEnabled: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context from canvas');
    }
    this.ctx = context;

    this.initializePositions();
    this.setupCanvas();
    this.setupInputHandling();
  }

  /**
   * Initialize the 24 position coordinates for Nine Men's Morris board
   * Positions are numbered 0-23 following Board.java layout:
   *
   * Outer square (0-8):     Middle square (9-17):    Inner square (18-23):
  /**
   * Initialize the 24 position coordinates for Nine Men's Morris board
   * Following STANDARD layout: 8 positions per square (4 corners + 4 midpoints)
   * 
   * Outer (0-7):    Middle (8-15):   Inner (16-23):
   * 0---1---2       8---9--10        16--17--18
   * |       |       |       |        |       |
   * 7       3       15      11       23      19
   * |       |       |       |        |       |
   * 6---5---4       14--13--12       22--21--20
   */
  private initializePositions(): void {
    const center = this.boardSize / 2;
    const outerSize = this.boardSize * 0.4;
    const middleSize = this.boardSize * 0.27;
    const innerSize = this.boardSize * 0.14;

    // Outer square (positions 0-7) - clockwise from top-left
    this.positions[0] = { x: center - outerSize, y: center - outerSize }; // Top-left corner
    this.positions[1] = { x: center, y: center - outerSize }; // Top midpoint
    this.positions[2] = { x: center + outerSize, y: center - outerSize }; // Top-right corner
    this.positions[3] = { x: center + outerSize, y: center }; // Right midpoint
    this.positions[4] = { x: center + outerSize, y: center + outerSize }; // Bottom-right corner
    this.positions[5] = { x: center, y: center + outerSize }; // Bottom midpoint
    this.positions[6] = { x: center - outerSize, y: center + outerSize }; // Bottom-left corner
    this.positions[7] = { x: center - outerSize, y: center }; // Left midpoint

    // Middle square (positions 8-15) - clockwise from top-left
    this.positions[8] = { x: center - middleSize, y: center - middleSize }; // Top-left corner
    this.positions[9] = { x: center, y: center - middleSize }; // Top midpoint
    this.positions[10] = { x: center + middleSize, y: center - middleSize }; // Top-right corner
    this.positions[11] = { x: center + middleSize, y: center }; // Right midpoint
    this.positions[12] = { x: center + middleSize, y: center + middleSize }; // Bottom-right corner
    this.positions[13] = { x: center, y: center + middleSize }; // Bottom midpoint
    this.positions[14] = { x: center - middleSize, y: center + middleSize }; // Bottom-left corner
    this.positions[15] = { x: center - middleSize, y: center }; // Left midpoint

    // Inner square (positions 16-23) - clockwise from top-left
    this.positions[16] = { x: center - innerSize, y: center - innerSize }; // Top-left corner
    this.positions[17] = { x: center, y: center - innerSize }; // Top midpoint
    this.positions[18] = { x: center + innerSize, y: center - innerSize }; // Top-right corner
    this.positions[19] = { x: center + innerSize, y: center }; // Right midpoint
    this.positions[20] = { x: center + innerSize, y: center + innerSize }; // Bottom-right corner
    this.positions[21] = { x: center, y: center + innerSize }; // Bottom midpoint
    this.positions[22] = { x: center - innerSize, y: center + innerSize }; // Bottom-left corner
    this.positions[23] = { x: center - innerSize, y: center }; // Left midpoint
  }

  /**
   * Set up canvas for responsive design
   */
  private setupCanvas(): void {
    this.updateCanvasSize();

    // Set up high DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  /**
   * Update canvas size based on container and maintain aspect ratio
   */
  private updateCanvasSize(): void {
    const container = this.canvas.parentElement;
    if (!container) {
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const size = Math.min(containerWidth, containerHeight) * 0.9; // 90% of container

    this.boardSize = size;
    this.pieceRadius = size * 0.03; // Scale piece size with board
    this.lineWidth = Math.max(1, size * 0.005); // Scale line width

    // Make canvas wider to accommodate text on the right
    const textWidth = 200; // Space for text on the right
    this.canvas.style.width = size + textWidth + 'px';
    this.canvas.style.height = size + 'px';

    // Recalculate positions with new size
    this.initializePositions();
  }

  /**
   * Draw the complete Nine Men's Morris board
   */
  public drawBoard(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Set line style
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.drawSquares();
    this.drawConnectingLines();
    this.drawPositionMarkers();
  }

  /**
   * Draw the three concentric squares
   */
  private drawSquares(): void {
    const center = this.boardSize / 2;
    const sizes = [
      this.boardSize * 0.4, // Outer square
      this.boardSize * 0.27, // Middle square
      this.boardSize * 0.14, // Inner square
    ];

    sizes.forEach(size => {
      this.ctx.beginPath();
      this.ctx.rect(center - size, center - size, size * 2, size * 2);
      this.ctx.stroke();
    });
  }

  /**
   * Draw the connecting lines between squares
   */
  private drawConnectingLines(): void {
    const center = this.boardSize / 2;
    const outerSize = this.boardSize * 0.4;
    const innerSize = this.boardSize * 0.14;

    // Horizontal connecting lines
    this.drawLine(center - outerSize, center, center - innerSize, center); // Left
    this.drawLine(center + innerSize, center, center + outerSize, center); // Right

    // Vertical connecting lines
    this.drawLine(center, center - outerSize, center, center - innerSize); // Top
    this.drawLine(center, center + innerSize, center, center + outerSize); // Bottom
  }

  /**
   * Draw a line between two points
   */
  private drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  /**
   * Draw small markers at each position
   */
  private drawPositionMarkers(): void {
    this.ctx.fillStyle = '#666666';

    this.positions.forEach(pos => {
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 3, 0, 2 * Math.PI);
      this.ctx.fill();
    });
  }

  /**
   * Draw game pieces on the board
   * @param board Array of 24 positions with PlayerColor or null
   */
  public drawPieces(board: (PlayerColor | null)[]): void {
    if (board.length !== 24) {
      throw new Error('Board must have exactly 24 positions');
    }

    board.forEach((piece, index) => {
      if (piece !== null) {
        this.drawPiece(index, piece);
      }
    });
  }

  /**
   * Draw a single piece at the specified position
   */
  private drawPiece(position: number, color: PlayerColor): void {
    if (position < 0 || position >= 24) {
      throw new Error(`Invalid position: ${position}. Must be 0-23.`);
    }

    const pos = this.positions[position];
    const pieceColor = color === PlayerColor.WHITE ? '#ffffff' : '#333333';
    const borderColor = color === PlayerColor.WHITE ? '#cccccc' : '#000000';

    // Draw piece shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(pos.x + 2, pos.y + 2, this.pieceRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw piece
    this.ctx.fillStyle = pieceColor;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, this.pieceRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw piece border
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  /**
   * Get the coordinates for a specific position
   */
  public getPositionCoordinates(position: number): PositionCoordinates {
    if (position < 0 || position >= 24) {
      throw new Error(`Invalid position: ${position}. Must be 0-23.`);
    }
    return { ...this.positions[position] };
  }

  /**
   * Highlight valid move positions
   * @param positions Array of position indices to highlight
   */
  public highlightValidMoves(positions: number[]): void {
    this.highlightedPositions.clear();
    positions.forEach(pos => {
      if (pos >= 0 && pos < 24) {
        this.highlightedPositions.add(pos);
      }
    });
  }

  /**
   * Clear all position highlights
   */
  public clearHighlights(): void {
    this.highlightedPositions.clear();
    this.hoveredPosition = null;
  }

  /**
   * Set hover effect for a position
   * @param position Position index to hover, or null to clear hover
   */
  public setHoverPosition(position: number | null): void {
    this.hoveredPosition = position;
  }

  /**
   * Draw highlighting effects for valid moves and hover
   */
  private drawHighlights(): void {
    // Draw highlighted positions (valid moves)
    this.highlightedPositions.forEach(position => {
      this.drawPositionHighlight(position, 'rgba(0, 255, 0, 0.3)', 'rgba(0, 255, 0, 0.6)');
    });

    // Draw hover effect
    if (this.hoveredPosition !== null && this.hoveredPosition >= 0 && this.hoveredPosition < 24) {
      this.drawPositionHighlight(
        this.hoveredPosition,
        'rgba(255, 255, 0, 0.2)',
        'rgba(255, 255, 0, 0.5)'
      );
    }
  }

  /**
   * Draw highlight effect at a specific position
   */
  private drawPositionHighlight(position: number, fillColor: string, strokeColor: string): void {
    const pos = this.positions[position];
    const highlightRadius = this.pieceRadius + 8;

    // Draw highlight background
    this.ctx.fillStyle = fillColor;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, highlightRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw highlight border
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, highlightRadius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  /**
   * Animate placing a piece at the specified position
   */
  public animatePlacement(
    position: number,
    playerColor: PlayerColor,
    onComplete?: () => void
  ): void {
    if (position < 0 || position >= 24) {
      throw new Error(`Invalid position: ${position}. Must be 0-23.`);
    }

    const coordinates = this.getPositionCoordinates(position);
    const animation = new PlacementAnimation(
      position,
      coordinates,
      playerColor,
      this.pieceRadius,
      onComplete
    );

    this.animationQueue.addAnimation(animation);
  }

  /**
   * Animate moving a piece from one position to another
   */
  public animateMovement(
    fromPosition: number,
    toPosition: number,
    playerColor: PlayerColor,
    onComplete?: () => void
  ): void {
    if (fromPosition < 0 || fromPosition >= 24 || toPosition < 0 || toPosition >= 24) {
      throw new Error(`Invalid positions: ${fromPosition} to ${toPosition}. Must be 0-23.`);
    }

    const fromCoordinates = this.getPositionCoordinates(fromPosition);
    const toCoordinates = this.getPositionCoordinates(toPosition);
    const animation = new MovementAnimation(
      fromPosition,
      toPosition,
      fromCoordinates,
      toCoordinates,
      playerColor,
      this.pieceRadius,
      onComplete
    );

    this.animationQueue.addAnimation(animation);
  }

  /**
   * Animate removing a piece from the specified position
   */
  public animateRemoval(position: number, playerColor: PlayerColor, onComplete?: () => void): void {
    if (position < 0 || position >= 24) {
      throw new Error(`Invalid position: ${position}. Must be 0-23.`);
    }

    const coordinates = this.getPositionCoordinates(position);
    const animation = new RemovalAnimation(
      position,
      coordinates,
      playerColor,
      this.pieceRadius,
      onComplete
    );

    this.animationQueue.addAnimation(animation);
  }

  /**
   * Animate mill formation highlighting
   */
  public animateMill(millPositions: number[], onComplete?: () => void): void {
    if (millPositions.length !== 3) {
      throw new Error('Mill must contain exactly 3 positions');
    }

    for (const pos of millPositions) {
      if (pos < 0 || pos >= 24) {
        throw new Error(`Invalid mill position: ${pos}. Must be 0-23.`);
      }
    }

    const animation = new MillAnimation(
      millPositions,
      this.positions,
      this.pieceRadius,
      onComplete
    );

    this.animationQueue.addAnimation(animation);
  }

  /**
   * Clear all active animations
   */
  public clearAnimations(): void {
    this.animationQueue.clearAll();
  }

  /**
   * Check if any animations are currently running
   */
  public hasActiveAnimations(): boolean {
    return this.animationQueue.hasActiveAnimations();
  }

  /**
   * Render the complete board with pieces, highlights, animations, and UI feedback
   * @param board Array of 24 positions with PlayerColor or null
   * @param currentPlayer Current player's turn
   * @param phase Current game phase
   * @param whitePiecesRemaining Remaining white pieces to place
   * @param blackPiecesRemaining Remaining black pieces to place
   * @param isAiThinking Whether AI is currently thinking
   */
  public render(
    board: (PlayerColor | null)[],
    currentPlayer?: PlayerColor,
    phase?: GamePhase,
    whitePiecesRemaining?: number,
    blackPiecesRemaining?: number,
    isAiThinking?: boolean,
    isGameOver?: boolean,
    winner?: PlayerColor | null
  ): void {
    this.updateCanvasSize();
    this.drawBoard();
    this.drawHighlights();
    this.drawPieces(board);

    // Render animations on top of everything else
    this.animationQueue.renderAnimations(this.ctx);

    if (currentPlayer !== undefined && phase !== undefined) {
      this.drawGameInfo(
        currentPlayer,
        phase,
        whitePiecesRemaining,
        blackPiecesRemaining,
        isAiThinking,
        isGameOver,
        winner
      );
    }
  }

  /**
   * Draw game information (current player, phase, remaining pieces)
   * Text is positioned to the RIGHT of the board
   */
  private drawGameInfo(
    currentPlayer: PlayerColor,
    phase: GamePhase,
    whitePiecesRemaining?: number,
    blackPiecesRemaining?: number,
    isAiThinking?: boolean,
    isGameOver?: boolean,
    winner?: PlayerColor | null
  ): void {
    const padding = 20;
    const fontSize = Math.max(14, this.boardSize * 0.035);

    this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Position text to the RIGHT of the board
    const textX = this.boardSize + padding;
    let yOffset = padding;

    // Game Over message (most important, show first)
    if (isGameOver && winner) {
      const winnerText = winner === PlayerColor.WHITE ? 'White' : 'Black';
      this.ctx.font = `bold ${fontSize * 1.5}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      this.ctx.fillStyle = '#00ff00';
      this.ctx.fillText('GAME OVER!', textX, yOffset);
      yOffset += fontSize * 1.5 + 10;

      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillText(`${winnerText} Wins!`, textX, yOffset);

      // Reset font for remaining text
      this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      return; // Don't show other info when game is over
    }

    // AI thinking indicator
    if (isAiThinking) {
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.fillText('AI thinking...', textX, yOffset);
      yOffset += fontSize + 10;
    }

    // Current player indicator
    const playerColor = currentPlayer === PlayerColor.WHITE ? '#ffffff' : '#333333';
    const playerText = currentPlayer === PlayerColor.WHITE ? 'White' : 'Black';

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`Player: ${playerText}`, textX, yOffset);

    // Draw current player indicator circle
    this.ctx.fillStyle = playerColor;
    this.ctx.strokeStyle = playerColor === '#ffffff' ? '#cccccc' : '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(textX + 80, yOffset + fontSize / 2, 8, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();

    yOffset += fontSize + 10;

    // Game phase
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`Phase: ${phase}`, textX, yOffset);
    yOffset += fontSize + 10;

    // Remaining pieces (only during placement phase)
    if (
      phase === GamePhase.PLACEMENT &&
      whitePiecesRemaining !== undefined &&
      blackPiecesRemaining !== undefined
    ) {
      this.ctx.fillText(`White left: ${whitePiecesRemaining}`, textX, yOffset);
      yOffset += fontSize + 10;
      this.ctx.fillText(`Black left: ${blackPiecesRemaining}`, textX, yOffset);
    }
  }

  /**
   * Get position index from canvas coordinates
   * @param x Canvas x coordinate
   * @param y Canvas y coordinate
   * @returns Position index (0-23) or null if no position found
   */
  public getPositionFromCoordinates(x: number, y: number): number | null {
    const clickRadius = this.pieceRadius + 10; // Allow some tolerance for clicking

    for (let i = 0; i < this.positions.length; i++) {
      const pos = this.positions[i];
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

      if (distance <= clickRadius) {
        return i;
      }
    }

    return null;
  }

  /**
   * Handle window resize events
   */
  public handleResize(): void {
    this.setupCanvas();
  }

  /**
   * Set up input event listeners for click and touch events
   */
  private setupInputHandling(): void {
    // Check if canvas has addEventListener method (not available in test mocks)
    if (typeof this.canvas.addEventListener !== 'function') {
      return;
    }

    // Mouse events
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Touch events for mobile support
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Prevent default touch behaviors that might interfere with game
    this.canvas.addEventListener('touchmove', e => e.preventDefault());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  /**
   * Handle mouse click events
   */
  private handleClick(event: MouseEvent): void {
    console.log(`[handleClick] isInputEnabled=${this.isInputEnabled}`);
    if (!this.isInputEnabled) {
      console.log('[handleClick] Input disabled, ignoring click');
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const position = this.getPositionFromCoordinates(x, y);
    console.log(`[handleClick] position=${position}, hasCallback=${!!this.onPositionClick}`);
    if (position !== null && this.onPositionClick) {
      this.onPositionClick(position);
    }
  }

  /**
   * Handle mouse move events for hover effects
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isInputEnabled) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const position = this.getPositionFromCoordinates(x, y);
    this.setHoverPosition(position);
  }

  /**
   * Handle mouse leave events
   */
  private handleMouseLeave(): void {
    this.setHoverPosition(null);
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault(); // Prevent mouse events from firing
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isInputEnabled) {
      return;
    }

    event.preventDefault();

    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const position = this.getPositionFromCoordinates(x, y);
      if (position !== null && this.onPositionClick) {
        this.onPositionClick(position);
      }
    }
  }

  /**
   * Set the callback function for position clicks
   */
  // eslint-disable-next-line no-unused-vars
  public setOnPositionClick(callback: (position: number) => void): void {
    this.onPositionClick = callback;
  }

  /**
   * Enable or disable input handling
   */
  public setInputEnabled(enabled: boolean): void {
    console.log(`[BoardRenderer] setInputEnabled(${enabled})`);
    this.isInputEnabled = enabled;
    if (!enabled) {
      this.setHoverPosition(null);
    }
  }

  /**
   * Check if input is currently enabled
   */
  public isInputEnabledState(): boolean {
    return this.isInputEnabled;
  }

  /**
   * Handle position click with validation and feedback
   */
  public handlePositionClick(position: number): void {
    if (!this.isInputEnabled) {
      return;
    }

    // Provide immediate visual feedback
    this.setHoverPosition(position);

    // Call the registered callback if available
    if (this.onPositionClick) {
      this.onPositionClick(position);
    }
  }
}
