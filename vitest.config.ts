import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',

    // Global setup
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/dist/',
        '**/build/',
        '**/*.config.{js,ts}',
        '**/coverage/',
        'src-tauri/',
      ],
      // Enforce 70% coverage threshold
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
      // Fail if thresholds not met
      thresholds: {
        autoUpdate: false,
        perFile: false,
        100: false,
      },
    },

    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'src-tauri',
    ],

    // Watch mode configuration
    watch: false,

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter configuration
    reporters: ['verbose'],

    // Parallel execution
    threads: true,
    maxThreads: 4,

    // Mocking
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  // Resolve configuration for tests
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
});
