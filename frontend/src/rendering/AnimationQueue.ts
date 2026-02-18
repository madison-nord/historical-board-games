import type { Animation } from './Animation.js';

/**
 * Manages a queue of animations and handles their execution
 */
export class AnimationQueue {
  private animations: Animation[] = [];
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  /**
   * Add an animation to the queue
   */
  public addAnimation(animation: Animation): void {
    this.animations.push(animation);

    // Start the animation loop if not already running
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Remove an animation from the queue
   */
  public removeAnimation(animationId: string): void {
    this.animations = this.animations.filter(anim => anim.id !== animationId);

    // Stop the loop if no animations remain
    if (this.animations.length === 0) {
      this.stop();
    }
  }

  /**
   * Clear all animations
   */
  public clearAll(): void {
    this.animations = [];
    this.stop();
  }

  /**
   * Check if any animations are currently running
   */
  public hasActiveAnimations(): boolean {
    return this.animations.length > 0;
  }

  /**
   * Get all active animations
   */
  public getActiveAnimations(): Animation[] {
    return [...this.animations];
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop the animation loop
   */
  private stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = false;
  }

  /**
   * Main game loop using requestAnimationFrame
   */
  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update all animations
    this.updateAnimations(deltaTime);

    // Continue the loop if there are active animations
    if (this.animations.length > 0) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    } else {
      this.stop();
    }
  };

  /**
   * Update all active animations
   */
  private updateAnimations(deltaTime: number): void {
    // Update animations and remove completed ones
    this.animations = this.animations.filter(animation => {
      const shouldContinue = animation.update(deltaTime);

      if (!shouldContinue && animation.onComplete) {
        animation.onComplete();
      }

      return shouldContinue;
    });
  }

  /**
   * Render all active animations
   */
  public renderAnimations(ctx: CanvasRenderingContext2D): void {
    this.animations.forEach(animation => {
      const progress = Math.min(animation.elapsed / animation.duration, 1.0);
      animation.render(ctx, progress);
    });
  }
}
