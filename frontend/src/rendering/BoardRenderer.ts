import { PlayerColor, GamePhase } from '../models/index.js';

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
  private positions: PositionCoordinates[] = [];
  private boardSize: number = 0;
  private padding: number = 20;
  private highlightedPositions: number[] = [];
  private hoverPosition: number | null = null;
  // eslint-disable-next-line no-unused-vars
  private onPositionClick: ((position: number) => void) | null = null;
  private inputEnabled: boolean = true;

  // Tutorial mode: clickable positions control
  private clickablePositions: number[] | null = null; // null = all positions clickable

  // Animation properties
  private animations: Array<{
    type: 'placement' | 'movement' | 'removal' | 'mill';
    progress: number;
    duration: number;
    data: any;
    onComplete?: () => void;
  }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;

    // Initialize positions array (will be populated by calculatePositionCoordinates)
    this.initializePositions();

    // Initialize board (this calls calculatePositionCoordinates)
    this.setupCanvas();
    this.setupInputHandling();

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Set which positions are clickable (for tutorial mode)
   * @param positions Array of position indices that should be clickable, or null for all positions
   */
  public setClickablePositions(positions: number[] | null): void {
    this.clickablePositions = positions;
  }

  /**
   * Check if a position is currently clickable
   * @param position Position index to check
   * @returns true if position is clickable, false otherwise
   */
  public isPositionClickable(position: number): boolean {
    // If no restriction, all positions are clickable
    if (this.clickablePositions === null) {
      return true;
    }

    // Check if position is in the allowed list
    return this.clickablePositions.includes(position);
  }

  /**
   * Get currently clickable positions
   * @returns Array of clickable position indices, or null if all positions are clickable
   */
  public getClickablePositions(): number[] | null {
    return this.clickablePositions;
  }

  /**
   * Initialize the 24 board positions (8 per square)
   * Standard Nine Men's Morris layout: 3 concentric squares
   */
  private initializePositions(): void {
    // Initialize with empty objects to prevent undefined errors
    this.positions = new Array(24).fill(null).map(() => ({ x: 0, y: 0 }));
  }

  /**
   * Setup canvas and calculate positions
   */
  private setupCanvas(): void {
    this.updateCanvasSize();
  }

  /**
   * Update canvas size and recalculate positions
   */
  /**
   * Update canvas size and recalculate positions
   */
  private updateCanvasSize(): void {
    // Get container size
    const container = this.canvas.parentElement;
    if (!container) {
      // No container (test scenario) - use canvas dimensions directly
      const size = Math.min(this.canvas.width, this.canvas.height);
      if (size > 0) {
        this.padding = size * 0.1; // 10% padding (consistent with normal mode)
        this.boardSize = size - this.padding * 2;
        this.calculatePositionCoordinates();
      }
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // If container has no dimensions (test scenario), use canvas dimensions
    if (containerWidth === 0 || containerHeight === 0) {
      const size = Math.min(this.canvas.width, this.canvas.height);
      if (size > 0) {
        this.padding = size * 0.1; // 10% padding (consistent with normal mode)
        this.boardSize = size - this.padding * 2;
        this.calculatePositionCoordinates();
      }
      return;
    }

    // Use square aspect ratio, with minimum size of 300px
    const size = Math.max(300, Math.min(containerWidth, containerHeight));

    // Only update if size is valid
    if (size <= 0) {
      return;
    }

    this.canvas.width = size;
    this.canvas.height = size;

    // Calculate board size - leave MORE padding for pieces and text
    // The board should fit comfortably within the canvas
    this.padding = size * 0.1; // 10% padding on each side
    this.boardSize = size - this.padding * 2;

    // Calculate position coordinates
    this.calculatePositionCoordinates();
  }

  /**
   * Calculate coordinates for all 24 positions
   */
  private calculatePositionCoordinates(): void {
    const outerSize = this.boardSize;
    const middleSize = this.boardSize * 0.66;
    const innerSize = this.boardSize * 0.33;

    // Helper to create position
    const createPos = (x: number, y: number): PositionCoordinates => ({
      x: this.padding + x,
      y: this.padding + y,
    });

    // Outer square (0-7)
    this.positions[0] = createPos(0, 0); // top-left
    this.positions[1] = createPos(outerSize / 2, 0); // top-middle
    this.positions[2] = createPos(outerSize, 0); // top-right
    this.positions[3] = createPos(outerSize, outerSize / 2); // right-middle
    this.positions[4] = createPos(outerSize, outerSize); // bottom-right
    this.positions[5] = createPos(outerSize / 2, outerSize); // bottom-middle
    this.positions[6] = createPos(0, outerSize); // bottom-left
    this.positions[7] = createPos(0, outerSize / 2); // left-middle

    // Middle square (8-15)
    const middleOffset = (outerSize - middleSize) / 2;
    this.positions[8] = createPos(middleOffset, middleOffset); // top-left
    this.positions[9] = createPos(middleOffset + middleSize / 2, middleOffset); // top-middle
    this.positions[10] = createPos(middleOffset + middleSize, middleOffset); // top-right
    this.positions[11] = createPos(middleOffset + middleSize, middleOffset + middleSize / 2); // right-middle
    this.positions[12] = createPos(middleOffset + middleSize, middleOffset + middleSize); // bottom-right
    this.positions[13] = createPos(middleOffset + middleSize / 2, middleOffset + middleSize); // bottom-middle
    this.positions[14] = createPos(middleOffset, middleOffset + middleSize); // bottom-left
    this.positions[15] = createPos(middleOffset, middleOffset + middleSize / 2); // left-middle

    // Inner square (16-23)
    const innerOffset = (outerSize - innerSize) / 2;
    this.positions[16] = createPos(innerOffset, innerOffset); // top-left
    this.positions[17] = createPos(innerOffset + innerSize / 2, innerOffset); // top-middle
    this.positions[18] = createPos(innerOffset + innerSize, innerOffset); // top-right
    this.positions[19] = createPos(innerOffset + innerSize, innerOffset + innerSize / 2); // right-middle
    this.positions[20] = createPos(innerOffset + innerSize, innerOffset + innerSize); // bottom-right
    this.positions[21] = createPos(innerOffset + innerSize / 2, innerOffset + innerSize); // bottom-middle
    this.positions[22] = createPos(innerOffset, innerOffset + innerSize); // bottom-left
    this.positions[23] = createPos(innerOffset, innerOffset + innerSize / 2); // left-middle
  }

  /**
   * Draw the complete board
   */
  /**
   * Draw the complete board
   */
  public drawBoard(): void {
    // Save context state before drawing
    this.ctx.save();

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw board elements
    this.drawSquares();
    this.drawConnectingLines();
    this.drawPositionMarkers();

    // Restore context state
    this.ctx.restore();
  }

  /**
   * Draw the three concentric squares
   */
  /**
   * Draw the three concentric squares
   */
  private drawSquares(): void {
    this.ctx.save();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;

    // Outer square
    this.ctx.strokeRect(this.padding, this.padding, this.boardSize, this.boardSize);

    // Middle square
    const middleSize = this.boardSize * 0.66;
    const middleOffset = (this.boardSize - middleSize) / 2;
    this.ctx.strokeRect(
      this.padding + middleOffset,
      this.padding + middleOffset,
      middleSize,
      middleSize
    );

    // Inner square
    const innerSize = this.boardSize * 0.33;
    const innerOffset = (this.boardSize - innerSize) / 2;
    this.ctx.strokeRect(
      this.padding + innerOffset,
      this.padding + innerOffset,
      innerSize,
      innerSize
    );

    this.ctx.restore();
  }

  /**
   * Draw lines connecting the squares
   */
  private drawConnectingLines(): void {
    this.ctx.save();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;

    // Top connecting line (1 -> 9 -> 17)
    this.drawLine(
      this.positions[1].x,
      this.positions[1].y,
      this.positions[9].x,
      this.positions[9].y
    );
    this.drawLine(
      this.positions[9].x,
      this.positions[9].y,
      this.positions[17].x,
      this.positions[17].y
    );

    // Right connecting line (3 -> 11 -> 19)
    this.drawLine(
      this.positions[3].x,
      this.positions[3].y,
      this.positions[11].x,
      this.positions[11].y
    );
    this.drawLine(
      this.positions[11].x,
      this.positions[11].y,
      this.positions[19].x,
      this.positions[19].y
    );

    // Bottom connecting line (5 -> 13 -> 21)
    this.drawLine(
      this.positions[5].x,
      this.positions[5].y,
      this.positions[13].x,
      this.positions[13].y
    );
    this.drawLine(
      this.positions[13].x,
      this.positions[13].y,
      this.positions[21].x,
      this.positions[21].y
    );

    // Left connecting line (7 -> 15 -> 23)
    this.drawLine(
      this.positions[7].x,
      this.positions[7].y,
      this.positions[15].x,
      this.positions[15].y
    );
    this.drawLine(
      this.positions[15].x,
      this.positions[15].y,
      this.positions[23].x,
      this.positions[23].y
    );

    this.ctx.restore();
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
   * Draw position markers (small circles at each intersection)
   */
  /**
   * Draw position markers (small circles at each intersection)
   */
  private drawPositionMarkers(): void {
    this.ctx.save();
    this.ctx.fillStyle = '#666';
    const markerRadius = 4;

    for (let i = 0; i < this.positions.length; i++) {
      const pos = this.positions[i];
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, markerRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  /**
   * Draw game pieces on the board
   */
  public drawPieces(board: (PlayerColor | null)[]): void {
    for (let i = 0; i < board.length; i++) {
      const piece = board[i];
      if (piece !== null) {
        this.drawPiece(i, piece);
      }
    }
  }

  /**
   * Draw a single piece at a position
   */
  private drawPiece(position: number, color: PlayerColor): void {
    const pos = this.positions[position];
    const pieceRadius = this.boardSize * 0.025; // 2.5% of board size

    // Draw piece shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(pos.x + 2, pos.y + 2, pieceRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw piece
    if (color === PlayerColor.WHITE) {
      this.ctx.fillStyle = '#f0f0f0';
      this.ctx.strokeStyle = '#333';
    } else {
      this.ctx.fillStyle = '#333';
      this.ctx.strokeStyle = '#000';
    }

    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, pieceRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * Get coordinates for a position
   */
  public getPositionCoordinates(position: number): PositionCoordinates {
    if (position < 0 || position >= this.positions.length) {
      throw new Error(`Invalid position: ${position}`);
    }
    return this.positions[position];
  }

  /**
   * Highlight valid move positions
   */
  public highlightValidMoves(positions: number[]): void {
    this.highlightedPositions = positions;
  }

  /**
   * Clear all highlights
   */
  public clearHighlights(): void {
    this.highlightedPositions = [];
  }

  /**
   * Set hover position for visual feedback
   */
  public setHoverPosition(position: number | null): void {
    this.hoverPosition = position;
  }

  /**
   * Draw highlights for valid moves and hover
   */
  private drawHighlights(): void {
    // Draw highlighted positions (valid moves)
    for (const position of this.highlightedPositions) {
      this.drawPositionHighlight(position, 'rgba(0, 255, 0, 0.2)', 'rgba(0, 255, 0, 0.6)');
    }

    // Draw hover position
    if (this.hoverPosition !== null) {
      this.drawPositionHighlight(
        this.hoverPosition,
        'rgba(100, 150, 255, 0.2)',
        'rgba(100, 150, 255, 0.6)'
      );
    }
  }

  /**
   * Draw a highlight circle at a position
   */
  private drawPositionHighlight(position: number, fillColor: string, strokeColor: string): void {
    const pos = this.positions[position];
    const highlightRadius = this.boardSize * 0.035; // Slightly larger than piece

    this.ctx.fillStyle = fillColor;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, highlightRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * Animate piece placement
   */
  public animatePlacement(
    position: number,
    playerColor: PlayerColor,
    onComplete?: () => void
  ): void {
    this.animations.push({
      type: 'placement',
      progress: 0,
      duration: 300,
      data: { position, playerColor },
      onComplete,
    });
  }

  /**
   * Animate piece movement
   */
  public animateMovement(
    from: number,
    to: number,
    playerColor: PlayerColor,
    onComplete?: () => void
  ): void {
    this.animations.push({
      type: 'movement',
      progress: 0,
      duration: 400,
      data: { from, to, playerColor },
      onComplete,
    });
  }

  /**
   * Animate piece removal
   */
  public animateRemoval(position: number, playerColor: PlayerColor, onComplete?: () => void): void {
    this.animations.push({
      type: 'removal',
      progress: 0,
      duration: 400,
      data: { position, playerColor },
      onComplete,
    });
  }

  /**
   * Animate mill formation
   */
  public animateMill(millPositions: number[], onComplete?: () => void): void {
    this.animations.push({
      type: 'mill',
      progress: 0,
      duration: 600,
      data: { millPositions },
      onComplete,
    });
  }

  /**
   * Clear all animations
   */
  public clearAnimations(): void {
    this.animations = [];
  }

  /**
   * Check if there are active animations
   */
  public hasActiveAnimations(): boolean {
    return this.animations.length > 0;
  }

  /**
   * Render the board with current state
   *
   * Supports two signatures:
   * 1. Full game state (6 params): render(board, currentPlayer, phase, white, black, deltaTime)
   * 2. Simplified for testing (3 params): render(board, selectedPosition, highlightedPositions)
   */
  public render(
    board: (PlayerColor | null)[],
    currentPlayerOrSelected: PlayerColor | number | null = null,
    phaseOrHighlighted: GamePhase | number[] = [],
    whitePiecesRemaining: number = 0,
    blackPiecesRemaining: number = 0,
    deltaTime: number = 0
  ): void {
    // Detect which signature is being used based on parameter types
    const isSimplifiedSignature = Array.isArray(phaseOrHighlighted);

    if (isSimplifiedSignature) {
      // Simplified signature: render(board, selectedPosition, highlightedPositions)
      const selectedPosition = currentPlayerOrSelected as number | null;
      const highlightedPositions = phaseOrHighlighted as number[];

      // Set highlighted positions temporarily
      const previousHighlights = this.highlightedPositions;
      this.highlightedPositions = highlightedPositions;

      // Draw board
      this.drawBoard();
      this.drawHighlights();

      // Draw selected position highlight if provided
      if (selectedPosition !== null && selectedPosition >= 0 && selectedPosition < 24) {
        this.drawPositionHighlight(
          selectedPosition,
          'rgba(255, 255, 0, 0.3)',
          'rgba(255, 255, 0, 0.8)'
        );
      }

      this.drawPieces(board);

      // Restore previous highlights
      this.highlightedPositions = previousHighlights;
      return;
    }

    // Full signature: render(board, currentPlayer, phase, white, black, deltaTime)
    const currentPlayer = currentPlayerOrSelected as PlayerColor;
    const phase = phaseOrHighlighted as GamePhase;

    // Update animations
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      anim.progress += deltaTime / anim.duration;

      if (anim.progress >= 1) {
        // Animation complete
        if (anim.onComplete) {
          anim.onComplete();
        }
        this.animations.splice(i, 1);
      }
    }

    // Draw board
    this.drawBoard();
    this.drawHighlights();
    this.drawPieces(board);

    // Render animations
    this.renderAnimations();

    // Draw game info
    this.drawGameInfo(currentPlayer, phase, whitePiecesRemaining, blackPiecesRemaining);
  }

  /**
   * Render active animations
   */
  private renderAnimations(): void {
    for (const anim of this.animations) {
      const t = Math.min(anim.progress, 1);

      switch (anim.type) {
        case 'placement': {
          const { position, playerColor } = anim.data;
          const scale = t; // Grow from 0 to 1
          const pos = this.positions[position];
          const pieceRadius = this.boardSize * 0.025 * scale;

          this.ctx.save();
          this.ctx.globalAlpha = t;

          if (playerColor === PlayerColor.WHITE) {
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.strokeStyle = '#333';
          } else {
            this.ctx.fillStyle = '#333';
            this.ctx.strokeStyle = '#000';
          }

          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(pos.x, pos.y, pieceRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.restore();
          break;
        }

        case 'movement': {
          const { from, to, playerColor } = anim.data;
          const fromPos = this.positions[from];
          const toPos = this.positions[to];
          const x = fromPos.x + (toPos.x - fromPos.x) * t;
          const y = fromPos.y + (toPos.y - fromPos.y) * t;
          const pieceRadius = this.boardSize * 0.025;

          if (playerColor === PlayerColor.WHITE) {
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.strokeStyle = '#333';
          } else {
            this.ctx.fillStyle = '#333';
            this.ctx.strokeStyle = '#000';
          }

          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(x, y, pieceRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
          break;
        }

        case 'removal': {
          const { position, playerColor } = anim.data;
          const scale = 1 - t; // Shrink from 1 to 0
          const pos = this.positions[position];
          const pieceRadius = this.boardSize * 0.025 * scale;

          this.ctx.save();
          this.ctx.globalAlpha = 1 - t;

          if (playerColor === PlayerColor.WHITE) {
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.strokeStyle = '#333';
          } else {
            this.ctx.fillStyle = '#333';
            this.ctx.strokeStyle = '#000';
          }

          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(pos.x, pos.y, pieceRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.restore();
          break;
        }

        case 'mill': {
          const { millPositions } = anim.data;
          const pulse = Math.sin(t * Math.PI * 4) * 0.5 + 0.5; // Pulse 4 times

          this.ctx.save();
          this.ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
          this.ctx.lineWidth = 4;

          for (const position of millPositions) {
            const pos = this.positions[position];
            const radius = this.boardSize * 0.04;

            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
          }

          this.ctx.restore();
          break;
        }
      }
    }
  }

  /**
   * Draw game information text
   */
  private drawGameInfo(
    currentPlayer: PlayerColor,
    phase: GamePhase,
    whitePiecesRemaining: number,
    blackPiecesRemaining: number
  ): void {
    this.ctx.fillStyle = '#333';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';

    let yOffset = this.boardSize + this.padding + 20; // Position text BELOW the board

    // Current player
    const playerText = `Current Player: ${currentPlayer === PlayerColor.WHITE ? 'White' : 'Black'}`;
    this.ctx.fillText(playerText, this.padding, yOffset);
    yOffset += 25;

    // Game phase
    const phaseText = `Phase: ${phase}`;
    this.ctx.fillText(phaseText, this.padding, yOffset);
    yOffset += 25;

    // Pieces remaining
    const piecesText = `Pieces - White: ${whitePiecesRemaining} | Black: ${blackPiecesRemaining}`;
    this.ctx.fillText(piecesText, this.padding, yOffset);
  }

  /**
   * Get position from mouse/touch coordinates
   */
  /**
   * Get position from mouse/touch coordinates
   * Handles both client coordinates (from events) and canvas coordinates (for testing)
   */
  public getPositionFromCoordinates(x: number, y: number): number | null {
    let canvasX: number;
    let canvasY: number;

    // Check if coordinates are already in canvas space (for testing)
    // Canvas coordinates will be within canvas dimensions
    if (x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height) {
      // Assume these are canvas coordinates
      canvasX = x;
      canvasY = y;
    } else {
      // These are client coordinates, need to convert
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      canvasX = (x - rect.left) * scaleX;
      canvasY = (y - rect.top) * scaleY;
    }

    const clickRadius = this.boardSize * 0.04; // Click tolerance

    for (let i = 0; i < this.positions.length; i++) {
      const pos = this.positions[i];
      const dx = canvasX - pos.x;
      const dy = canvasY - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= clickRadius) {
        return i;
      }
    }

    return null;
  }

  /**
   * Handle window resize
   */
  public handleResize(): void {
    this.updateCanvasSize();
  }
  /**
   * Get the current board size
   */
  public getBoardSize(): number {
    return this.boardSize;
  }

  /**
   * Resize the canvas to new dimensions
   */
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;

    // Recalculate board size and positions with proportional padding
    const size = Math.min(width, height);
    this.padding = size * 0.1; // 10% padding (consistent with normal mode)
    this.boardSize = size - this.padding * 2;
    this.calculatePositionCoordinates();
  }

  /**
   * Setup input event handlers
   */
  private setupInputHandling(): void {
    // Mouse events
    this.canvas.addEventListener('click', e => this.handleClick(e));
    this.canvas.addEventListener('mousemove', e => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());

    // Touch events
    this.canvas.addEventListener('touchstart', e => this.handleTouchStart(e));
    this.canvas.addEventListener('touchend', e => this.handleTouchEnd(e));
  }

  /**
   * Handle canvas click
   */
  private handleClick(event: MouseEvent): void {
    if (!this.inputEnabled) {
      return;
    }

    const position = this.getPositionFromCoordinates(event.clientX, event.clientY);
    if (position !== null) {
      // Check if position is clickable (for tutorial mode)
      if (!this.isPositionClickable(position)) {
        return; // Position not clickable, ignore click
      }

      this.handlePositionClick(position);
    }
  }

  /**
   * Handle mouse move for hover effects
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.inputEnabled) {
      this.setHoverPosition(null);
      this.canvas.style.cursor = 'default';
      return;
    }

    const position = this.getPositionFromCoordinates(event.clientX, event.clientY);

    // If not hovering over any position, reset to default cursor
    if (position === null) {
      this.setHoverPosition(null);
      this.canvas.style.cursor = 'default';
      return;
    }

    // If hovering over a non-clickable position, show not-allowed cursor
    if (!this.isPositionClickable(position)) {
      this.setHoverPosition(null);
      this.canvas.style.cursor = 'not-allowed';
      return;
    }

    // Hovering over a clickable position, show pointer cursor
    this.setHoverPosition(position);
    this.canvas.style.cursor = 'pointer';
  }

  /**
   * Handle mouse leave
   */
  private handleMouseLeave(): void {
    this.setHoverPosition(null);
    this.canvas.style.cursor = 'default';
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
  }

  /**
   * Handle touch end (treat as click)
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    if (!this.inputEnabled || event.changedTouches.length === 0) {
      return;
    }

    const touch = event.changedTouches[0];
    const position = this.getPositionFromCoordinates(touch.clientX, touch.clientY);
    if (position !== null) {
      // Check if position is clickable (for tutorial mode)
      if (!this.isPositionClickable(position)) {
        return; // Position not clickable, ignore touch
      }

      this.handlePositionClick(position);
    }
  }

  /**
   * Set position click callback
   */
  // eslint-disable-next-line no-unused-vars
  public setOnPositionClick(callback: (position: number) => void): void {
    this.onPositionClick = callback;
  }

  /**
   * Enable or disable input
   */
  public setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    if (!enabled) {
      this.setHoverPosition(null);
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * Check if input is enabled
   */
  public isInputEnabledState(): boolean {
    return this.inputEnabled;
  }

  /**
   * Handle position click (internal)
   */
  public handlePositionClick(position: number): void {
    if (this.onPositionClick) {
      this.onPositionClick(position);
    }
  }
}
