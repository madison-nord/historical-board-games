import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoardRenderer } from './BoardRenderer.js';
import { PlayerColor } from '../models/index.js';

// Mock canvas and context
const mockContext = {
  clearRect: vi.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
  lineCap: '',
  lineJoin: '',
  beginPath: vi.fn(),
  rect: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  scale: vi.fn(),
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
});