# BAR File Watcher for IBM App Connect

A Node.js application that monitors a directory for BAR (Broker Archive) file changes and automatically uploads them to IBM App Connect via the REST API.

## Features

- 🔍 **Real-time monitoring** - Watches for new and modified BAR files
- ⏱️ **Debouncing** - Prevents multiple uploads during rapid file changes
- 🔄 **Automatic retry** - Handles file write completion before uploading
- 📝 **Detailed logging** - Clear console output for all operations
- ⚙️ **Configurable** - Easy configuration via environment variables

## Prerequisites

- Node.js 18+ (for ES modules support)
- IBM App Connect account with API access
- Client ID, Client Secret, and API Key from IBM App Connect Public API
- Instance ID and Integration Server ID

## Installation

1. Navigate to the project directory:
```bash
cd bar-file-watcher
```

2. Install dependencies:
```bash
npm install
```

3. Install dev dependencies (for testing):
```bash
npm install --save-dev @jest/globals jest
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and configure your settings:
```env
# IBM App Connect API Configuration
API_BASE_URL=https://api.appconnect.ibmcloud.com
CLIENT_ID=your-client-id-here
CLIENT_SECRET=your-client-secret-here
API_KEY=your-api-key-here
INSTANCE_ID=your-instance-id-here
INTEGRATION_SERVER_ID=your-integration-server-id

# File Watcher Configuration
WATCH_DIRECTORY=full-path-to-directory-to-watch (i.e. /Users/johnreeve/IBM/ACET13/privatelink/BARfiles)
FILE_EXTENSION=.bar

# Optional: Debounce time in milliseconds
DEBOUNCE_MS=1000
```

## Configuration

### Required Environment Variables

- `CLIENT_ID` - Your IBM App Connect Public API Client ID
- `CLIENT_SECRET` - Your IBM App Connect Public API Client Secret
- `API_KEY` - Your IBM App Connect API Key (used to generate authentication tokens)
- `INSTANCE_ID` - Your IBM App Connect Instance ID
- `INTEGRATION_SERVER_ID` - The ID of your integration server

### Optional Environment Variables

- `API_BASE_URL` - API base URL (default: `https://api.appconnect.ibmcloud.com`)
- `WATCH_DIRECTORY` - Directory to watch (default: `/Users/johnreeve/IBM/ACET13/privatelink/BARfiles`)
- `FILE_EXTENSION` - File extension to monitor (default: `.bar`)
- `DEBOUNCE_MS` - Milliseconds to wait after file change before uploading (default: `1000`)

## Usage

### Start the watcher:
```bash
npm start
```

### Development mode (with auto-restart on code changes):
```bash
npm run dev
```

### Stop the watcher:
Press `Ctrl+C`

### Run tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run tests with coverage:
```bash
npm run test:coverage
```

## How It Works

1. The application starts monitoring the configured directory
2. When a `.bar` file is added or modified:
   - The change is detected
   - A debounce timer starts (default 1 second)
   - After the timer expires, the upload process begins
3. **Authentication Token Generation**:
   - Generates a token using `POST /api/v1/tokens` with Client ID, Client Secret, API Key, and Instance ID
   - Token is cached for 50 minutes to avoid unnecessary API calls
   - Automatically refreshes if token expires (401 response)
4. The BAR file is uploaded using the generated token
5. Success or error messages are logged to the console

## API Endpoints

The application uses two IBM App Connect Public API endpoints:

### 1. Token Generation
```
POST /api/v1/tokens
Headers:
  - X-IBM-Instance-Id: {instance_id}
  - X-IBM-Client-Id: {client_id}
  - X-IBM-Client-Secret: {client_secret}
  - Content-Type: application/json
Body:
  { "apiKey": "{api_key}" }
```

### 2. BAR File Upload
```
POST /v1/integration_servers/{id}/bar_files
Headers:
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data
```

Reference: [Introducing the App Connect Public API](https://community.ibm.com/community/user/blogs/adam-roberts/2023/07/27/introducing-the-app-connect-public-api)

## Example Output

```
🚀 BAR File Watcher Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Watching directory: /Users/johnreeve/IBM/ACET13/privatelink/BARfiles
📄 File extension: .bar
🌐 API Base URL: https://api.appconnect.ibmcloud.com/v1
🔑 Integration Server ID: abc123
⏱️  Debounce time: 1000ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👀 Watching for BAR file changes...

📝 File modified: myapp.bar
⏱️  File change detected: myapp.bar (waiting 1000ms before upload)
📤 Uploading myapp.bar...
✅ Successfully uploaded myapp.bar
   Response: {
     "status": "success",
     "message": "BAR file uploaded successfully"
   }
```

## Troubleshooting

### "CLIENT_ID/CLIENT_SECRET/API_KEY/INSTANCE_ID is not set in .env file"
- Make sure you've created a `.env` file
- Verify all required variables are set: `CLIENT_ID`, `CLIENT_SECRET`, `API_KEY`, `INSTANCE_ID`
- Obtain credentials from IBM App Connect Public API

### "Watch directory does not exist"
- Check that the `WATCH_DIRECTORY` path is correct
- Ensure the directory exists and you have read permissions

### "Token generation failed" or 401 response
- Verify your Client ID, Client Secret, and API Key are valid
- Check that the Instance ID is correct
- Ensure all credentials have the necessary permissions
- The application will automatically retry with a new token if it expires

### "404 Not Found"
- Verify the `INTEGRATION_SERVER_ID` is correct
- Check that the `API_BASE_URL` is correct for your region

## Testing

The project includes a comprehensive test suite using Jest. Tests cover:

- Configuration validation
- Token generation and caching
- BAR file upload functionality
- File change handling and debouncing
- Error handling and retry logic
- Watcher initialization
- Integration scenarios

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are located in `index.test.js` and include:

- **Configuration Validation**: Ensures all required environment variables are set
- **Token Generation**: Tests token creation, caching, and error handling
- **BAR File Upload**: Tests file upload with proper authentication and retry logic
- **File Change Handling**: Tests debouncing and timer management
- **File Watcher Initialization**: Tests watcher setup and configuration
- **Graceful Shutdown**: Tests cleanup on SIGINT
- **Integration Tests**: End-to-end flow testing

## Dependencies

### Production Dependencies
- **chokidar** - Efficient file watching
- **dotenv** - Environment variable management
- **form-data** - Multipart form data for file uploads
- **node-fetch** - HTTP client for API requests

### Development Dependencies
- **jest** - Testing framework
- **@jest/globals** - Jest global functions for ES modules

## License

ISC