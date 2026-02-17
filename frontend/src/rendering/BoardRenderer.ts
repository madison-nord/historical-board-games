import { PlayerColor } from '../models/index.js';

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
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context from canvas');
    }
    this.ctx = context;
    
    this.initializePositions();
    this.setupCanvas();
  }

  /**
   * Initialize the 24 position coordinates for Nine Men's Morris board
   * Positions are numbered 0-23 following the standard layout
   */
  private initializePositions(): void {
    const center = this.boardSize / 2;
    const outerSize = this.boardSize * 0.4;
    const middleSize = this.boardSize * 0.27;
    const innerSize = this.boardSize * 0.14;
    
    // Outer square (positions 0-7)
    this.positions[0] = { x: center - outerSize, y: center - outerSize }; // Top-left
    this.positions[1] = { x: center, y: center - outerSize };             // Top-center
    this.positions[2] = { x: center + outerSize, y: center - outerSize }; // Top-right
    this.positions[3] = { x: center + outerSize, y: center };             // Right-center
    this.positions[4] = { x: center + outerSize, y: center + outerSize }; // Bottom-right
    this.positions[5] = { x: center, y: center + outerSize };             // Bottom-center
    this.positions[6] = { x: center - outerSize, y: center + outerSize }; // Bottom-left
    this.positions[7] = { x: center - outerSize, y: center };             // Left-center
    
    // Middle square (positions 8-15)
    this.positions[8] = { x: center - middleSize, y: center - middleSize }; // Top-left
    this.positions[9] = { x: center, y: center - middleSize };              // Top-center
    this.positions[10] = { x: center + middleSize, y: center - middleSize }; // Top-right
    this.positions[11] = { x: center + middleSize, y: center };              // Right-center
    this.positions[12] = { x: center + middleSize, y: center + middleSize }; // Bottom-right
    this.positions[13] = { x: center, y: center + middleSize };              // Bottom-center
    this.positions[14] = { x: center - middleSize, y: center + middleSize }; // Bottom-left
    this.positions[15] = { x: center - middleSize, y: center };              // Left-center
    
    // Inner square (positions 16-23)
    this.positions[16] = { x: center - innerSize, y: center - innerSize }; // Top-left
    this.positions[17] = { x: center, y: center - innerSize };             // Top-center
    this.positions[18] = { x: center + innerSize, y: center - innerSize }; // Top-right
    this.positions[19] = { x: center + innerSize, y: center };             // Right-center
    this.positions[20] = { x: center + innerSize, y: center + innerSize }; // Bottom-right
    this.positions[21] = { x: center, y: center + innerSize };             // Bottom-center
    this.positions[22] = { x: center - innerSize, y: center + innerSize }; // Bottom-left
    this.positions[23] = { x: center - innerSize, y: center };             // Left-center
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
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const size = Math.min(containerWidth, containerHeight) * 0.9; // 90% of container
    
    this.boardSize = size;
    this.pieceRadius = size * 0.03; // Scale piece size with board
    this.lineWidth = Math.max(1, size * 0.005); // Scale line width
    
    this.canvas.style.width = size + 'px';
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
      this.boardSize * 0.4,  // Outer square
      this.boardSize * 0.27, // Middle square
      this.boardSize * 0.14  // Inner square
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
   * Render the complete board with pieces
   * @param board Array of 24 positions with PlayerColor or null
   */
  public render(board: (PlayerColor | null)[]): void {
    this.updateCanvasSize();
    this.drawBoard();
    this.drawPieces(board);
  }

  /**
   * Handle window resize events
   */
  public handleResize(): void {
    this.setupCanvas();
  }
}