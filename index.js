import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  watchDirectory: process.env.WATCH_DIRECTORY,
  fileExtension: process.env.FILE_EXTENSION || '.bar',
  apiBaseUrl: process.env.API_BASE_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  apiKey: process.env.API_KEY,
  instanceId: process.env.INSTANCE_ID,
  integrationServerId: process.env.INTEGRATION_SERVER_ID,
  debounceMs: parseInt(process.env.DEBOUNCE_MS || '1000', 10)
};

// Validate configuration
if (!config.clientId) {
  console.error('❌ ERROR: CLIENT_ID is not set in .env file');
  process.exit(1);
}

if (!config.clientSecret) {
  console.error('❌ ERROR: CLIENT_SECRET is not set in .env file');
  process.exit(1);
}

if (!config.apiKey) {
  console.error('❌ ERROR: API_KEY is not set in .env file');
  process.exit(1);
}

if (!config.instanceId) {
  console.error('❌ ERROR: INSTANCE_ID is not set in .env file');
  process.exit(1);
}

if (!config.integrationServerId) {
  console.error('❌ ERROR: INTEGRATION_SERVER_ID is not set in .env file');
  process.exit(1);
}

// Debounce map to prevent multiple uploads for rapid file changes
const debounceTimers = new Map();

// Token cache
let cachedToken = null;
let tokenExpiry = null;

/**
 * Generate authentication token from IBM App Connect API
 * @returns {Promise<string>} Authentication token
 */
export async function generateToken() {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('🔑 Using cached authentication token');
    return cachedToken;
  }

  try {
    console.log('🔑 Generating new authentication token...');
    
    const tokenUrl = `${config.apiBaseUrl}/api/v1/tokens`;
    const requestBody = {
      apiKey: config.apiKey
    };
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'X-IBM-Instance-Id': config.instanceId,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-IBM-Client-Id': config.clientId,
        'X-IBM-Client-Secret': config.clientSecret
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token generation failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const tokenData = await response.json();
    cachedToken = tokenData.access_token;
    
    // Cache token for 50 minutes (tokens typically expire after 1 hour)
    tokenExpiry = Date.now() + (50 * 60 * 1000);
    
    console.log('✅ Authentication token generated successfully');
    return cachedToken;
  } catch (error) {
    console.error('❌ Error generating token:', error.message);
    throw error;
  }
}

/**
 * Upload BAR file to IBM App Connect API
 * @param {string} filePath - Full path to the BAR file
 */
export async function uploadBarFile(filePath) {
  const fileName = path.basename(filePath);
  
  try {
    console.log(`📤 Uploading ${fileName}...`);
    
    // Generate authentication token
    const token = await generateToken();
    
    // Read the file
    const fileStream = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileStream, {
      filename: fileName,
      contentType: 'application/octet-stream',
      knownLength: stats.size
    });
    
    // Construct API endpoint
    // Based on IBM App Connect Public API: POST /v1/integration_servers/{id}/bar_files
    // Reference: https://community.ibm.com/community/user/blogs/adam-roberts/2023/07/27/introducing-the-app-connect-public-api
    const apiUrl = `${config.apiBaseUrl}/api/v1/bar-files/${fileName}.bar`;
    
    // Make API request
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'X-IBM-Instance-Id': config.instanceId,
        'X-IBM-Client-Id': config.clientId,
        'authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream'
      },
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Successfully uploaded ${fileName}`);
      console.log(`   Response:`, JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to upload ${fileName}`);
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Error: ${errorText}`);
      
      // If token expired, clear cache and retry once
      if (response.status === 401 && cachedToken) {
        console.log('🔄 Token may have expired, clearing cache and retrying...');
        cachedToken = null;
        tokenExpiry = null;
        // Retry upload once
        return uploadBarFile(filePath);
      }
    }
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Handle file change with debouncing
 * @param {string} filePath - Full path to the changed file
 */
export function handleFileChange(filePath) {
  const fileName = path.basename(filePath);
  
  // Clear existing timer for this file
  if (debounceTimers.has(filePath)) {
    clearTimeout(debounceTimers.get(filePath));
  }
  
  // Set new timer
  const timer = setTimeout(() => {
    debounceTimers.delete(filePath);
    uploadBarFile(filePath);
  }, config.debounceMs);
  
  debounceTimers.set(filePath, timer);
  console.log(`⏱️  File change detected: ${fileName} (waiting ${config.debounceMs}ms before upload)`);
}

/**
 * Initialize file watcher
 */
export function initializeWatcher() {
  console.log('🚀 BAR File Watcher Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📁 Watching directory: ${config.watchDirectory}`);
  console.log(`📄 File extension: ${config.fileExtension}`);
  console.log(`🌐 API Base URL: ${config.apiBaseUrl}`);
  console.log(`🔑 Integration Server ID: ${config.integrationServerId}`);
  console.log(`⏱️  Debounce time: ${config.debounceMs}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check if watch directory exists
  if (!fs.existsSync(config.watchDirectory)) {
    console.error(`❌ ERROR: Watch directory does not exist: ${config.watchDirectory}`);
    process.exit(1);
  }
  
  // Initialize chokidar watcher
  const watcher = chokidar.watch(config.watchDirectory, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // don't trigger on initial scan
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });
  
  // Watch for file changes
  watcher
    .on('add', (filePath) => {
      if (path.extname(filePath) === config.fileExtension) {
        console.log(`➕ New file detected: ${path.basename(filePath)}`);
        handleFileChange(filePath);
      }
    })
    .on('change', (filePath) => {
      if (path.extname(filePath) === config.fileExtension) {
        console.log(`📝 File modified: ${path.basename(filePath)}`);
        handleFileChange(filePath);
      }
    })
    .on('error', (error) => {
      console.error('❌ Watcher error:', error);
    })
    .on('ready', () => {
      console.log('👀 Watching for BAR file changes...\n');
    });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down file watcher...');
    watcher.close();
    process.exit(0);
  });
}

// Start the watcher (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  initializeWatcher();
}

// Export config and state for testing
export { config, debounceTimers, cachedToken, tokenExpiry };

// Made with Bob
