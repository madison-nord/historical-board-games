import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/e2e/**', // Exclude Playwright E2E tests
    ],
    coverage: {
      // Use V8 for fast, accurate coverage
      provider: 'v8',

      // Output formats
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],

      // Include all source files
      all: true,

      // Include patterns
      include: ['src/**/*.{ts,tsx}'],

      // Exclude patterns
      exclude: [
        'node_modules/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test-setup.ts',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        '**/types/**',
        // Exclude model enums (simple types)
        'src/models/GameMode.ts',
        'src/models/GamePhase.ts',
        'src/models/MoveType.ts',
        'src/models/PlayerColor.ts',
      ],

      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },

      // Report directory
      reportsDirectory: './coverage',
    },
  },
});
