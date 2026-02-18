import { Animation, Easing } from './Animation.js';
import { PlayerColor } from '../models/index.js';
import type { PositionCoordinates } from './BoardRenderer.js';

/**
 * Animation for moving a piece from one position to another (slide effect)
 */
export class MovementAnimation implements Animation {
  public id: string;
  public duration: number = 300; // 300ms slide
  public elapsed: number = 0;
  public completed: boolean = false;

  constructor(
    private fromPosition: number,
    private toPosition: number,
    private fromCoordinates: PositionCoordinates,
    private toCoordinates: PositionCoordinates,
    private playerColor: PlayerColor,
    private pieceRadius: number,
    public onComplete?: () => void
  ) {
    this.id = `movement-${fromPosition}-${toPosition}-${Date.now()}`;
  }

  update(deltaTime: number): boolean {
    this.elapsed += deltaTime;

    if (this.elapsed >= this.duration) {
      this.completed = true;
      if (this.onComplete) {
        this.onComplete();
      }
      return false;
    }

    return true;
  }

  render(ctx: CanvasRenderingContext2D, progress: number): void {
    const easedProgress = Easing.easeInOut(progress);

    // Interpolate position
    const currentX =
      this.fromCoordinates.x + (this.toCoordinates.x - this.fromCoordinates.x) * easedProgress;
    const currentY =
      this.fromCoordinates.y + (this.toCoordinates.y - this.fromCoordinates.y) * easedProgress;

    const pieceColor = this.playerColor === PlayerColor.WHITE ? '#ffffff' : '#333333';
    const borderColor = this.playerColor === PlayerColor.WHITE ? '#cccccc' : '#000000';

    // Add slight elevation effect during movement
    const elevation = Math.sin(easedProgress * Math.PI) * 3; // 3px max elevation

    ctx.save();

    // Draw piece shadow with elevation
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(currentX + 2, currentY + 2 + elevation, this.pieceRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw piece
    ctx.fillStyle = pieceColor;
    ctx.beginPath();
    ctx.arc(currentX, currentY, this.pieceRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw piece border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}
