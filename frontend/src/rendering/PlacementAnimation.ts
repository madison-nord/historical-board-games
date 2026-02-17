import { Animation, Easing } from './Animation.js';
import { PlayerColor } from '../models/index.js';
import type { PositionCoordinates } from './BoardRenderer.js';

/**
 * Animation for placing a piece on the board (fade in effect)
 */
export class PlacementAnimation implements Animation {
  public id: string;
  public duration: number = 300; // 300ms fade in
  public elapsed: number = 0;
  public completed: boolean = false;
  
  constructor(
    private position: number,
    private coordinates: PositionCoordinates,
    private playerColor: PlayerColor,
    private pieceRadius: number,
    public onComplete?: () => void
  ) {
    this.id = `placement-${position}-${Date.now()}`;
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
    const easedProgress = Easing.easeOut(progress);
    const alpha = easedProgress;
    const scale = 0.3 + (0.7 * easedProgress); // Scale from 30% to 100%
    
    const pieceColor = this.playerColor === PlayerColor.WHITE ? '#ffffff' : '#333333';
    const borderColor = this.playerColor === PlayerColor.WHITE ? '#cccccc' : '#000000';
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Draw piece shadow with scaling
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(
      this.coordinates.x + 2, 
      this.coordinates.y + 2, 
      this.pieceRadius * scale, 
      0, 
      2 * Math.PI
    );
    ctx.fill();
    
    // Draw piece with scaling
    ctx.fillStyle = pieceColor;
    ctx.beginPath();
    ctx.arc(
      this.coordinates.x, 
      this.coordinates.y, 
      this.pieceRadius * scale, 
      0, 
      2 * Math.PI
    );
    ctx.fill();
    
    // Draw piece border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  }
}