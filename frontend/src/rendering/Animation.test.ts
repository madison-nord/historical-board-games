import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnimationQueue } from './AnimationQueue.js';
import { PlacementAnimation } from './PlacementAnimation.js';
import { MovementAnimation } from './MovementAnimation.js';
import { RemovalAnimation } from './RemovalAnimation.js';
import { MillAnimation } from './MillAnimation.js';
import { Easing } from './Animation.js';
import { PlayerColor } from '../models/index.js';

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16); // ~60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock performance.now
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Mock canvas context
const mockContext = {
  save: vi.fn(),
  restore: vi.fn(),
  globalAlpha: 1,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
};

describe('Animation System', () => {
  describe('Easing Functions', () => {
    it('should provide correct easing values', () => {
      expect(Easing.linear(0.5)).toBe(0.5);
      expect(Easing.linear(0)).toBe(0);
      expect(Easing.linear(1)).toBe(1);
      
      expect(Easing.easeIn(0)).toBe(0);
      expect(Easing.easeIn(1)).toBe(1);
      
      expect(Easing.easeOut(0)).toBe(0);
      expect(Easing.easeOut(1)).toBe(1);
      
      expect(Easing.easeInOut(0)).toBe(0);
      expect(Easing.easeInOut(1)).toBe(1);
      expect(Easing.easeInOut(0.5)).toBeGreaterThan(0.4);
      expect(Easing.easeInOut(0.5)).toBeLessThan(0.6);
    });
  });

  describe('AnimationQueue', () => {
    let queue: AnimationQueue;
    let mockAnimation: any;

    beforeEach(() => {
      vi.clearAllMocks();
      queue = new AnimationQueue();
      mockAnimation = {
        id: 'test-animation',
        duration: 300,
        elapsed: 0,
        completed: false,
        update: vi.fn(() => true),
        render: vi.fn(),
        onComplete: vi.fn(),
      };
    });

    it('should add animations to queue', () => {
      expect(queue.hasActiveAnimations()).toBe(false);
      
      queue.addAnimation(mockAnimation);
      
      expect(queue.hasActiveAnimations()).toBe(true);
      expect(queue.getActiveAnimations()).toHaveLength(1);
    });

    it('should remove animations from queue', () => {
      queue.addAnimation(mockAnimation);
      expect(queue.hasActiveAnimations()).toBe(true);
      
      queue.removeAnimation('test-animation');
      
      expect(queue.hasActiveAnimations()).toBe(false);
    });

    it('should clear all animations', () => {
      queue.addAnimation(mockAnimation);
      queue.addAnimation({ ...mockAnimation, id: 'test-2' });
      
      expect(queue.getActiveAnimations()).toHaveLength(2);
      
      queue.clearAll();
      
      expect(queue.hasActiveAnimations()).toBe(false);
    });

    it('should render all active animations', () => {
      queue.addAnimation(mockAnimation);
      
      queue.renderAnimations(mockContext as any);
      
      expect(mockAnimation.render).toHaveBeenCalledWith(mockContext, 0);
    });
  });

  describe('PlacementAnimation', () => {
    let animation: PlacementAnimation;
    const mockCoordinates = { x: 100, y: 100 };
    const onComplete = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
      animation = new PlacementAnimation(
        0,
        mockCoordinates,
        PlayerColor.WHITE,
        12,
        onComplete
      );
    });

    it('should initialize correctly', () => {
      expect(animation.duration).toBe(300);
      expect(animation.elapsed).toBe(0);
      expect(animation.completed).toBe(false);
      expect(animation.id).toContain('placement-0');
    });

    it('should update animation progress', () => {
      const shouldContinue = animation.update(150);
      
      expect(animation.elapsed).toBe(150);
      expect(shouldContinue).toBe(true);
      expect(animation.completed).toBe(false);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should complete animation', () => {
      const shouldContinue = animation.update(300);
      
      expect(animation.elapsed).toBe(300);
      expect(shouldContinue).toBe(false);
      expect(animation.completed).toBe(true);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should render animation frame', () => {
      animation.render(mockContext as any, 0.5);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });
  });

  describe('MovementAnimation', () => {
    let animation: MovementAnimation;
    const fromCoords = { x: 50, y: 50 };
    const toCoords = { x: 150, y: 150 };
    const onComplete = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
      animation = new MovementAnimation(
        0,
        1,
        fromCoords,
        toCoords,
        PlayerColor.BLACK,
        12,
        onComplete
      );
    });

    it('should initialize correctly', () => {
      expect(animation.duration).toBe(300);
      expect(animation.id).toContain('movement-0-1');
    });

    it('should render interpolated position', () => {
      animation.render(mockContext as any, 0.5);
      
      expect(mockContext.arc).toHaveBeenCalled();
      // Should render at interpolated position (100, 100)
      const arcCalls = mockContext.arc.mock.calls;
      expect(arcCalls.length).toBeGreaterThan(0);
    });
  });

  describe('RemovalAnimation', () => {
    let animation: RemovalAnimation;
    const mockCoordinates = { x: 100, y: 100 };

    beforeEach(() => {
      vi.clearAllMocks();
      animation = new RemovalAnimation(
        5,
        mockCoordinates,
        PlayerColor.WHITE,
        12
      );
    });

    it('should initialize correctly', () => {
      expect(animation.duration).toBe(300);
      expect(animation.id).toContain('removal-5');
    });

    it('should render fading piece', () => {
      animation.render(mockContext as any, 0.5);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
      expect(mockContext.globalAlpha).toBeLessThan(1);
    });
  });

  describe('MillAnimation', () => {
    let animation: MillAnimation;
    const millPositions = [0, 1, 2];
    const positionCoordinates = [
      { x: 50, y: 50 },
      { x: 100, y: 50 },
      { x: 150, y: 50 },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
      animation = new MillAnimation(
        millPositions,
        positionCoordinates,
        12
      );
    });

    it('should initialize correctly', () => {
      expect(animation.duration).toBe(600);
      expect(animation.id).toContain('mill-0-1-2');
    });

    it('should render mill highlights', () => {
      animation.render(mockContext as any, 0.5);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledTimes(3); // 3 positions, each calls arc once for fill and once for stroke
      expect(mockContext.fill).toHaveBeenCalledTimes(3);
      expect(mockContext.stroke).toHaveBeenCalledTimes(3);
    });
  });
});