# Test Documentation

This document provides detailed information about the test suite for the BAR File Watcher application.

## Overview

The test suite uses Jest as the testing framework and includes comprehensive unit tests and integration tests for all major functionality.

## Test Structure

### Test File: `index.test.js`

The test file is organized into the following test suites:

## Test Suites

### 1. Configuration Validation

Tests that ensure the application properly validates required environment variables.

**Tests:**
- Validates that the application exits if `CLIENT_ID` is not set
- Confirms configuration is loaded from environment variables correctly

**Key Assertions:**
- All required environment variables are present
- Application exits gracefully with error message when configuration is missing

### 2. Token Generation

Tests the authentication token generation flow with the IBM App Connect API.

**Tests:**
- `should generate a new token when cache is empty` - Verifies initial token generation
- `should use cached token if still valid` - Tests token caching mechanism
- `should handle token generation errors` - Tests error handling for failed token requests
- `should make correct API call for token generation` - Validates API request structure

**Key Assertions:**
- Token is generated with correct API endpoint (`/api/v1/tokens`)
- Proper headers are sent (`X-IBM-Instance-Id`, `X-IBM-Client-Id`, `X-IBM-Client-Secret`)
- Request body contains the API key
- Token is cached for 50 minutes
- Errors are handled gracefully

### 3. BAR File Upload

Tests the file upload functionality to the IBM App Connect API.

**Tests:**
- `should upload BAR file with correct headers` - Validates upload request structure
- `should retry upload on 401 error` - Tests automatic retry on token expiration
- `should handle upload errors gracefully` - Tests error handling
- `should construct correct API URL` - Validates endpoint construction
- `should read file stats correctly` - Tests file system operations

**Key Assertions:**
- Upload uses correct endpoint (`/api/v1/bar-files/{filename}`)
- Authorization header contains Bearer token
- File is read and sent as multipart/form-data
- 401 errors trigger token refresh and retry
- Other errors are logged appropriately

### 4. File Change Handling

Tests the debouncing mechanism for file changes.

**Tests:**
- `should debounce rapid file changes` - Validates debounce timer functionality
- `should clear existing timer when file changes again` - Tests timer management

**Key Assertions:**
- Multiple rapid changes result in single upload
- Previous timers are cleared when new changes occur
- Debounce delay is respected

### 5. File Watcher Initialization

Tests the chokidar file watcher setup and configuration.

**Tests:**
- `should initialize chokidar with correct options` - Validates watcher configuration
- `should exit if watch directory does not exist` - Tests directory validation
- `should watch for .bar files only` - Tests file filtering
- `should handle watcher errors` - Tests error handling

**Key Assertions:**
- Watcher ignores dotfiles
- `ignoreInitial` is set to true
- `awaitWriteFinish` is configured correctly
- Only `.bar` files trigger uploads
- Directory existence is validated before starting

### 6. Graceful Shutdown

Tests the application's cleanup on termination.

**Tests:**
- `should close watcher on SIGINT` - Validates cleanup on Ctrl+C

**Key Assertions:**
- Watcher is properly closed
- Process exits cleanly

### 7. Integration Tests

End-to-end tests that validate complete workflows.

**Tests:**
- `should complete full upload flow` - Tests successful token generation and file upload
- `should handle complete failure scenario` - Tests failure handling from start to finish

**Key Assertions:**
- Token generation and file upload work together
- Failures at any stage are handled appropriately
- Application state remains consistent

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Coverage

The test suite aims for high coverage of:
- ✅ Configuration validation
- ✅ Token generation and caching
- ✅ File upload functionality
- ✅ Error handling and retry logic
- ✅ File watching and debouncing
- ✅ Graceful shutdown

## Mocking Strategy

The tests use Jest mocks for external dependencies:

- **chokidar**: Mocked to avoid actual file system watching
- **fs**: Mocked to avoid actual file operations
- **node-fetch**: Mocked to avoid actual HTTP requests
- **form-data**: Mocked to avoid actual form data creation
- **dotenv**: Mocked to control environment variables

## Test Environment

- **Node.js**: Tests run in Node.js environment
- **ES Modules**: Tests use ES module syntax
- **Jest**: Version 29.7.0 or higher

## Adding New Tests

When adding new functionality, follow these guidelines:

1. **Create a new describe block** for the feature
2. **Write descriptive test names** that explain what is being tested
3. **Mock external dependencies** to isolate the code under test
4. **Test both success and failure cases**
5. **Verify error handling** and edge cases
6. **Update this documentation** with new test descriptions

## Example Test Pattern

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup mocks and test data
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  it('should do something specific', async () => {
    // Arrange
    const mockData = { /* ... */ };
    
    // Act
    const result = await functionUnderTest(mockData);
    
    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

- No external dependencies required
- All network calls are mocked
- Tests run in isolation
- Fast execution time

## Troubleshooting

### Tests Failing Due to ES Modules

If you encounter module errors, ensure you're running tests with:
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

This is already configured in `package.json` scripts.

### Mock Not Working

Ensure mocks are set up before importing the module under test:
```javascript
jest.unstable_mockModule('module-name', () => ({
  default: mockImplementation
}));
```

### Coverage Not Generated

Run with the coverage flag:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Future Improvements

Potential enhancements to the test suite:

- [ ] Add performance benchmarks
- [ ] Add integration tests with test API server
- [ ] Add E2E tests with actual file system
- [ ] Add load testing for concurrent file changes
- [ ] Add mutation testing
- [ ] Add visual regression tests for console output

## Contributing

When contributing tests:

1. Follow the existing test structure
2. Maintain high code coverage (>80%)
3. Test edge cases and error conditions
4. Update this documentation
5. Ensure all tests pass before submitting PR

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)