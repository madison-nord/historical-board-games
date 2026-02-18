import { Animation, Easing } from './Animation.js';
import type { PositionCoordinates } from './BoardRenderer.js';

/**
 * Animation for highlighting mill formation (brief highlight effect)
 */
export class MillAnimation implements Animation {
  public id: string;
  public duration: number = 600; // 600ms highlight
  public elapsed: number = 0;
  public completed: boolean = false;

  constructor(
    private millPositions: number[],
    private positionCoordinates: PositionCoordinates[],
    private pieceRadius: number,
    public onComplete?: () => void
  ) {
    this.id = `mill-${millPositions.join('-')}-${Date.now()}`;
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
    // Create a pulsing effect that peaks at 50% progress
    const pulseProgress = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    const easedProgress = Easing.easeInOut(pulseProgress);

    const alpha = 0.3 + 0.4 * easedProgress; // Alpha between 0.3 and 0.7
    const highlightRadius = this.pieceRadius + 8 + 6 * easedProgress; // Expanding highlight

    ctx.save();
    ctx.globalAlpha = alpha;

    // Draw mill highlight for each position
    this.millPositions.forEach(position => {
      if (position >= 0 && position < this.positionCoordinates.length) {
        const coords = this.positionCoordinates[position];

        // Draw golden highlight for mill
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, highlightRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw golden border
        ctx.strokeStyle = '#FFA500'; // Orange border
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });

    ctx.restore();
  }
}
