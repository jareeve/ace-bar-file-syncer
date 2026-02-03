export default {
  testEnvironment: 'node',
  transform: {},
  collectCoverageFrom: [
    'index.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  testMatch: [
    '**/*.test.js'
  ],
  moduleFileExtensions: ['js'],
  verbose: true
};


