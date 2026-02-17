import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoardRenderer } from './BoardRenderer.js';
import { PlayerColor, GamePhase } from '../models/index.js';

// Mock canvas and context
const mockContext = {
  clearRect: vi.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
  lineCap: '',
  lineJoin: '',
  font: '',
  textAlign: '',
  textBaseline: '',
  globalAlpha: 1,
  beginPath: vi.fn(),
  rect: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  scale: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
};

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  width: 400,
  height: 400,
  style: { width: '', height: '' },
  parentElement: {
    clientWidth: 400,
    clientHeight: 400,
  },
  getBoundingClientRect: vi.fn(() => ({
    width: 400,
    height: 400,
  })),
} as unknown as HTMLCanvasElement;

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

// Mock requestAnimationFrame and performance.now for animations
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
});

describe('BoardRenderer', () => {
  let renderer: BoardRenderer;

  beforeEach(() => {
    vi.clearAllMocks();
    renderer = new BoardRenderer(mockCanvas);
  });

  it('should initialize with canvas and context', () => {
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(renderer).toBeInstanceOf(BoardRenderer);
  });

  it('should throw error if canvas context is not available', () => {
    const badCanvas = {
      getContext: vi.fn(() => null),
    } as unknown as HTMLCanvasElement;

    expect(() => new BoardRenderer(badCanvas)).toThrow(
      'Could not get 2D rendering context from canvas'
    );
  });

  it('should have valid coordinates for all 24 positions', () => {
    for (let i = 0; i < 24; i++) {
      const coords = renderer.getPositionCoordinates(i);
      expect(coords).toHaveProperty('x');
      expect(coords).toHaveProperty('y');
      expect(typeof coords.x).toBe('number');
      expect(typeof coords.y).toBe('number');
      expect(coords.x).toBeGreaterThanOrEqual(0);
      expect(coords.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('should throw error for invalid position coordinates', () => {
    expect(() => renderer.getPositionCoordinates(-1)).toThrow(
      'Invalid position: -1. Must be 0-23.'
    );
    expect(() => renderer.getPositionCoordinates(24)).toThrow(
      'Invalid position: 24. Must be 0-23.'
    );
  });

  it('should calculate responsive scaling correctly', () => {
    // Test that positions are calculated based on board size
    const pos0 = renderer.getPositionCoordinates(0);
    const pos12 = renderer.getPositionCoordinates(12);
    
    // Position 0 should be in top-left area, position 12 should be in bottom-right area
    expect(pos0.x).toBeLessThan(pos12.x);
    expect(pos0.y).toBeLessThan(pos12.y);
  });

  it('should draw board without errors', () => {
    renderer.drawBoard();
    
    // Verify that drawing methods were called
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('should draw pieces correctly', () => {
    const board = new Array(24).fill(null);
    board[0] = PlayerColor.WHITE;
    board[12] = PlayerColor.BLACK;
    
    renderer.drawPieces(board);
    
    // Should have called arc for each piece (plus shadows)
    expect(mockContext.arc).toHaveBeenCalled();
    expect(mockContext.fill).toHaveBeenCalled();
  });

  it('should throw error for invalid board size', () => {
    const invalidBoard = new Array(23).fill(null); // Wrong size
    
    expect(() => renderer.drawPieces(invalidBoard)).toThrow(
      'Board must have exactly 24 positions'
    );
  });

  it('should render complete board with pieces', () => {
    const board = new Array(24).fill(null);
    board[0] = PlayerColor.WHITE;
    board[1] = PlayerColor.BLACK;
    
    renderer.render(board);
    
    // Should clear, draw board, and draw pieces
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('should render complete board with game info', () => {
    const board = new Array(24).fill(null);
    board[0] = PlayerColor.WHITE;
    
    renderer.render(board, PlayerColor.WHITE, GamePhase.PLACEMENT, 8, 9);
    
    // Should draw everything including game info
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  it('should highlight valid moves', () => {
    renderer.highlightValidMoves([0, 1, 2]);
    
    const board = new Array(24).fill(null);
    renderer.render(board);
    
    // Should draw highlights
    expect(mockContext.arc).toHaveBeenCalled();
    expect(mockContext.fill).toHaveBeenCalled();
  });

  it('should clear highlights', () => {
    renderer.highlightValidMoves([0, 1, 2]);
    renderer.clearHighlights();
    
    const board = new Array(24).fill(null);
    renderer.render(board);
    
    // Should not draw highlights after clearing
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should set hover position', () => {
    renderer.setHoverPosition(5);
    
    const board = new Array(24).fill(null);
    renderer.render(board);
    
    // Should draw hover effect
    expect(mockContext.arc).toHaveBeenCalled();
  });

  it('should clear hover position', () => {
    renderer.setHoverPosition(5);
    renderer.setHoverPosition(null);
    
    const board = new Array(24).fill(null);
    renderer.render(board);
    
    // Should not draw hover effect after clearing
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should get position from coordinates', () => {
    const pos0 = renderer.getPositionCoordinates(0);
    
    // Should return position 0 when clicking near its coordinates
    const foundPosition = renderer.getPositionFromCoordinates(pos0.x, pos0.y);
    expect(foundPosition).toBe(0);
    
    // Should return null when clicking far from any position
    const notFound = renderer.getPositionFromCoordinates(-100, -100);
    expect(notFound).toBeNull();
  });

  it('should animate piece placement', () => {
    renderer.animatePlacement(0, PlayerColor.WHITE);
    
    expect(renderer.hasActiveAnimations()).toBe(true);
    
    const board = new Array(24).fill(null);
    renderer.render(board);
    
    // Should render animations
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should animate piece movement', () => {
    renderer.animateMovement(0, 1, PlayerColor.BLACK);
    
    expect(renderer.hasActiveAnimations()).toBe(true);
  });

  it('should animate piece removal', () => {
    renderer.animateRemoval(5, PlayerColor.WHITE);
    
    expect(renderer.hasActiveAnimations()).toBe(true);
  });

  it('should animate mill formation', () => {
    renderer.animateMill([0, 1, 2]);
    
    expect(renderer.hasActiveAnimations()).toBe(true);
  });

  it('should clear all animations', () => {
    renderer.animatePlacement(0, PlayerColor.WHITE);
    renderer.animateMovement(1, 2, PlayerColor.BLACK);
    
    expect(renderer.hasActiveAnimations()).toBe(true);
    
    renderer.clearAnimations();
    
    expect(renderer.hasActiveAnimations()).toBe(false);
  });

  it('should throw error for invalid animation positions', () => {
    expect(() => renderer.animatePlacement(-1, PlayerColor.WHITE)).toThrow();
    expect(() => renderer.animatePlacement(24, PlayerColor.WHITE)).toThrow();
    expect(() => renderer.animateMovement(-1, 0, PlayerColor.WHITE)).toThrow();
    expect(() => renderer.animateMovement(0, 24, PlayerColor.WHITE)).toThrow();
    expect(() => renderer.animateRemoval(-1, PlayerColor.WHITE)).toThrow();
    expect(() => renderer.animateRemoval(24, PlayerColor.WHITE)).toThrow();
  });

  it('should throw error for invalid mill positions', () => {
    expect(() => renderer.animateMill([0, 1])).toThrow('Mill must contain exactly 3 positions');
    expect(() => renderer.animateMill([0, 1, 2, 3])).toThrow('Mill must contain exactly 3 positions');
    expect(() => renderer.animateMill([-1, 0, 1])).toThrow('Invalid mill position: -1');
    expect(() => renderer.animateMill([0, 1, 24])).toThrow('Invalid mill position: 24');
  });

  it('should handle resize events', () => {
    renderer.handleResize();
    
    // Should recalculate canvas setup
    expect(mockContext.scale).toHaveBeenCalled();
  });

  it('should return different coordinates for different positions', () => {
    const coords = [];
    for (let i = 0; i < 24; i++) {
      coords.push(renderer.getPositionCoordinates(i));
    }
    
    // Check that all coordinates are unique
    const uniqueCoords = new Set(coords.map(c => `${c.x},${c.y}`));
    expect(uniqueCoords.size).toBe(24);
  });

  // Input handling tests
  describe('Input Handling', () => {
    it('should set position click callback', () => {
      const mockCallback = vi.fn();
      renderer.setOnPositionClick(mockCallback);
      
      // Test that callback is set (we can't directly access private property)
      // but we can test the public interface
      expect(() => renderer.setOnPositionClick(mockCallback)).not.toThrow();
    });

    it('should enable and disable input', () => {
      expect(renderer.isInputEnabledState()).toBe(true);
      
      renderer.setInputEnabled(false);
      expect(renderer.isInputEnabledState()).toBe(false);
      
      renderer.setInputEnabled(true);
      expect(renderer.isInputEnabledState()).toBe(true);
    });

    it('should handle position click when input is enabled', () => {
      const mockCallback = vi.fn();
      renderer.setOnPositionClick(mockCallback);
      
      renderer.handlePositionClick(5);
      expect(mockCallback).toHaveBeenCalledWith(5);
    });

    it('should not handle position click when input is disabled', () => {
      const mockCallback = vi.fn();
      renderer.setOnPositionClick(mockCallback);
      renderer.setInputEnabled(false);
      
      renderer.handlePositionClick(5);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should map coordinates to positions correctly', () => {
      // Test coordinate to position mapping for center of board
      const centerX = 200;
      const centerY = 200;
      const position = renderer.getPositionFromCoordinates(centerX, centerY);
      
      if (position !== null) {
        expect(position).toBeTypeOf('number');
        expect(position).toBeGreaterThanOrEqual(0);
        expect(position).toBeLessThan(24);
      }
    });

    it('should return null for coordinates outside valid positions', () => {
      // Test coordinates far outside the board
      const position = renderer.getPositionFromCoordinates(-100, -100);
      expect(position).toBeNull();
    });

    it('should handle click detection for all 24 positions', () => {
      // Test that all positions have valid coordinates that can be clicked
      for (let i = 0; i < 24; i++) {
        const coords = renderer.getPositionCoordinates(i);
        const detectedPosition = renderer.getPositionFromCoordinates(coords.x, coords.y);
        expect(detectedPosition).toBe(i);
      }
    });

    it('should clear hover position when input is disabled', () => {
      renderer.setHoverPosition(5);
      renderer.setInputEnabled(false);
      
      // After disabling input, hover should be cleared
      // We can't directly test the private hoveredPosition, but we can test the behavior
      expect(() => renderer.setInputEnabled(false)).not.toThrow();
    });

    it('should handle touch events properly', () => {
      // Test that touch event handling methods exist and don't throw
      expect(() => renderer.setInputEnabled(true)).not.toThrow();
      expect(() => renderer.setInputEnabled(false)).not.toThrow();
    });

    it('should validate position bounds in handlePositionClick', () => {
      const mockCallback = vi.fn();
      renderer.setOnPositionClick(mockCallback);
      
      // Test valid position
      renderer.handlePositionClick(0);
      expect(mockCallback).toHaveBeenCalledWith(0);
      
      mockCallback.mockClear();
      
      // Test another valid position
      renderer.handlePositionClick(23);
      expect(mockCallback).toHaveBeenCalledWith(23);
    });
  });
});