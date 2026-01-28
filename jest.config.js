module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/routes.ts',
    '!src/shared/database/**',
    '!src/shared/config/**',
    '!src/scripts/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 15000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  maxWorkers: process.env.CI ? 2 : 1,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  ci: process.env.CI === 'true',
  reporters: process.env.CI 
    ? ['default']
    : ['default']
};
