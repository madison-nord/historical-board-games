/**
 * Base interface for all animations in the Nine Men's Morris game
 */
export interface Animation {
  /** Unique identifier for the animation */
  id: string;

  /** Duration of the animation in milliseconds */
  duration: number;

  /** Current elapsed time in milliseconds */
  elapsed: number;

  /** Whether the animation has completed */
  completed: boolean;

  /**
   * Update the animation state
   * @param deltaTime Time elapsed since last update in milliseconds
   * @returns true if animation should continue, false if completed
   */
  update(deltaTime: number): boolean;

  /**
   * Render the animation frame
   * @param ctx Canvas rendering context
   * @param progress Animation progress (0.0 to 1.0)
   */
  render(ctx: CanvasRenderingContext2D, progress: number): void;

  /** Called when animation completes */
  onComplete?(): void;
}

/**
 * Easing functions for smooth animations
 */
export class Easing {
  static easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeIn(t: number): number {
    return t * t * t;
  }

  static linear(t: number): number {
    return t;
  }
}
