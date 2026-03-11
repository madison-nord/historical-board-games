// Test setup file for Vitest
// Polyfill for HTMLDialogElement methods that are not available in JSDOM
import { vi } from 'vitest';

// Mock showModal and close methods for dialog elements
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal =
    HTMLDialogElement.prototype.showModal ||
    // eslint-disable-next-line no-unused-vars
    function (this: HTMLDialogElement) {
      this.open = true;
    };

  HTMLDialogElement.prototype.close =
    HTMLDialogElement.prototype.close ||
    // eslint-disable-next-line no-unused-vars
    function (this: HTMLDialogElement) {
      this.open = false;
    };
}

// Mock HTMLCanvasElement methods for testing
if (typeof HTMLCanvasElement !== 'undefined') {
  // Store original getContext
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  // Override getContext to return a comprehensive mock for 2D context
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextType: string,
    options?: any
  ): any {
    if (contextType === '2d') {
      // Create a mock context with all necessary Canvas2D methods
      const mockContext: any = {
        canvas: this,
        // Properties
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        miterLimit: 10,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        direction: 'ltr',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'low',
        shadowBlur: 0,
        shadowColor: 'rgba(0, 0, 0, 0)',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        // Drawing rectangles
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        // Drawing paths
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        ellipse: vi.fn(),
        rect: vi.fn(),
        // Drawing paths
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        isPointInPath: vi.fn(() => false),
        isPointInStroke: vi.fn(() => false),
        // Transformations
        rotate: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        getTransform: vi.fn(() => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })),
        // Drawing text
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        // Line styles
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
        // Drawing images
        drawImage: vi.fn(),
        // Pixel manipulation
        createImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(),
          width: 0,
          height: 0,
        })),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(),
          width: 0,
          height: 0,
        })),
        putImageData: vi.fn(),
        // Compositing
        save: vi.fn(),
        restore: vi.fn(),
        // Gradients and patterns
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        createRadialGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
        createPattern: vi.fn(() => null),
        createConicGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
      };

      return mockContext;
    }
    return originalGetContext?.call(this, contextType as any, options);
  };

  // Mock addEventListener if not present
  if (!HTMLCanvasElement.prototype.addEventListener) {
    HTMLCanvasElement.prototype.addEventListener = function () {
      // No-op for tests
    };
  }

  // Mock removeEventListener if not present
  if (!HTMLCanvasElement.prototype.removeEventListener) {
    HTMLCanvasElement.prototype.removeEventListener = function () {
      // No-op for tests
    };
  }

  // Mock getBoundingClientRect if not present
  if (!HTMLCanvasElement.prototype.getBoundingClientRect) {
    HTMLCanvasElement.prototype.getBoundingClientRect = function () {
      return {
        top: 0,
        left: 0,
        right: this.width || 800,
        bottom: this.height || 600,
        width: this.width || 800,
        height: this.height || 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    };
  }
}
