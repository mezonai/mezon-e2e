import express, { json } from 'express';
import { promises as fs } from 'fs';
import { join } from 'path';
import FileDownloader from './fileDownloader.js';

import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store processing status
const processingStatus = new Map();

const app = express();
const PORT = process.env.PORT || 3000;

const REPORTS_DIR = join(__dirname, 'reports');

async function ensureDirectories() {
  try {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    console.log('Reports directory created successfully');
  } catch (error) {
    console.error('Error creating reports directory:', error);
  }
}

app.use(json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

async function processDownload(fileUrl, localFolderId) {
  const startTime = Date.now();
  console.log(`🚀 Processing download: ${fileUrl}`);

  try {
    const extractPath = join(REPORTS_DIR, localFolderId);

    // Update status
    processingStatus.set(localFolderId, {
      status: 'downloading',
      fileUrl,
      localFolderId,
      startTime: Date.now(),
    });

    // Create extraction directory
    await fs.mkdir(extractPath, { recursive: true });

    // Initialize FileDownloader
    const fileDownloader = new FileDownloader();

    // Start download and extraction
    const downloadedPath = await fileDownloader.downloadAndExtract(fileUrl, extractPath);

    // Mark as completed
    const completedTime = Date.now();
    const duration = completedTime - startTime;
    processingStatus.set(localFolderId, {
      status: 'completed',
      fileUrl,
      localFolderId,
      downloadedPath,
      completedTime,
      duration,
    });

    console.log(`✅ Report downloaded successfully to: ${localFolderId}`);
    console.log(`⏱️ Total processing time: ${duration}ms`);
  } catch (error) {
    const errorTime = Date.now();
    const duration = errorTime - startTime;

    console.error(`❌ Download failed:`, error.message);

    processingStatus.set(localFolderId, {
      status: 'error',
      fileUrl,
      localFolderId,
      error: error.message,
      errorTime,
      duration,
    });
  }
}

app.post('/webhook', async (req, res) => {
  console.log(`🌐 Webhook called`);

  try {
    const { url } = req.body;
    console.log(`📁 Received URL: ${url}`);

    if (!url) {
      console.log(`❌ Missing URL in request body`);
      return res.status(400).json({ error: 'URL is required' });
    }

    // Generate unique folder ID from URL
    const localFolderId = url;
    console.log(`📁 Generated folder ID: ${localFolderId}`);

    // Check if this URL is already being processed or exists
    const existingStatus = processingStatus.get(localFolderId);

    if (existingStatus) {
      console.log(`♻️ Found existing entry for URL`);

      const reportUrl = `${req.protocol}://${req.get('host')}/${localFolderId}/`;

      return res.json({
        success: true,
        message: 'Report already exists or is being processed',
        folderId: localFolderId,
        reportUrl: reportUrl,
        status: existingStatus.status,
        existing: true,
      });
    }

    const reportUrl = `${req.protocol}://${req.get('host')}/${localFolderId}/`;

    console.log(`✅ Sending immediate response to client`);
    res.json({
      success: true,
      message: 'Download request received and processing started',
      folderId: localFolderId,
      reportUrl: reportUrl,
      status: 'processing',
    });

    console.log(`🚀 Starting background processing`);
    setImmediate(() => processDownload(url, localFolderId));
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook request',
      details: error.message,
    });
  }
});

// Status check endpoint
app.get('/status/:folderId', (req, res) => {
  const { folderId } = req.params;
  const status = processingStatus.get(folderId);

  if (!status) {
    return res.status(404).json({
      error: 'Folder not found',
      folderId: folderId,
    });
  }

  res.json({
    folderId: folderId,
    ...status,
  });
});

// Serve trace files directly for trace viewer
app.get('/:folderId/trace/*', (req, res) => {
  const folderId = req.params.folderId;
  const tracePath = req.params[0]; // Everything after /trace/
  const filePath = join(REPORTS_DIR, folderId, 'trace', tracePath);

  // Set appropriate headers for trace files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (tracePath.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html');
  } else if (tracePath.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (tracePath.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }

  res.sendFile(filePath, err => {
    if (err) {
      console.error('Error serving trace file:', err);
      res.status(404).send('Trace file not found');
    }
  });
});

// Serve data files directly for trace viewer
app.get('/:folderId/data/*', (req, res) => {
  const folderId = req.params.folderId;
  const dataPath = req.params[0]; // Everything after /data/
  const filePath = join(REPORTS_DIR, folderId, 'data', dataPath);

  // Set appropriate headers for data files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (dataPath.endsWith('.zip')) {
    res.setHeader('Content-Type', 'application/zip');
  } else if (dataPath.endsWith('.dat')) {
    res.setHeader('Content-Type', 'application/octet-stream');
  } else if (dataPath.endsWith('.json')) {
    res.setHeader('Content-Type', 'application/json');
  }

  res.sendFile(filePath, err => {
    if (err) {
      console.error('Error serving data file:', err);
      res.status(404).send('Data file not found');
    }
  });
});

// Serve other static files from reports directory
app.use('/:folderId', (req, res, next) => {
  const folderId = req.params.folderId;
  const folderPath = join(REPORTS_DIR, folderId);

  // Set CORS headers for all static files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Create a custom static middleware for this folder
  express.static(folderPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      }
    },
  })(req, res, next);
});

// Handle specific folder requests
app.get('/:folderId/', (req, res) => {
  const folderId = req.params.folderId;
  const folderPath = join(REPORTS_DIR, folderId);

  // Check if folder exists
  fs.access(folderPath)
    .then(() => {
      // Look for index.html or similar entry point
      const possibleIndexFiles = ['index.html', 'report.html', 'index.htm'];

      Promise.all(
        possibleIndexFiles.map(fileName =>
          fs
            .access(join(folderPath, fileName))
            .then(() => fileName)
            .catch(() => null)
        )
      ).then(results => {
        const indexFile = results.find(file => file !== null);

        if (indexFile) {
          res.sendFile(join(folderPath, indexFile));
        } else {
          // If no index file found in root, send 404
          res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Report Not Found</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                    h1 { color: #e74c3c; }
                    p { color: #666; }
                  </style>
                </head>
                <body>
                  <h1>❌ No Report Found</h1>
                  <p>No index.html found in report folder: <code>${folderId}</code></p>
                  <a href="/">← Back to Upload</a>
                </body>
                </html>`);
        }
      });
    })
    .catch(() => {
      res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Report Not Found</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                    h1 { color: #e74c3c; }
                    p { color: #666; }
                  </style>
                </head>
                <body>
                  <h1>❌ Report Not Found</h1>
                  <p>No report found with ID: <code>${folderId}</code></p>
                  <a href="/">← Back to Upload</a>
                </body>
                </html>`);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint with upload form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Playwright Report Server</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 800px; 
          margin: 50px auto; 
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; text-align: center; }
        .upload-form {
          border: 2px dashed #ccc;
          border-radius: 10px;
          padding: 30px;
          text-align: center;
          margin: 20px 0;
        }
        input[type="url"] {
          margin: 10px;
          padding: 10px;
        }
        button {
          background-color: #4CAF50;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          background-color: #45a049;
        }
        .result {
          margin-top: 20px;
          padding: 15px;
          border-radius: 5px;
          display: none;
        }
        .success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎭 Playwright Report Server</h1>
        <p>Enter file URL to download and serve Playwright reports.</p>
        
        <form class="upload-form" id="webhookForm">
          <p>🔗 Enter File URL:</p>
          <input type="url" id="urlInput" placeholder="e.g.,https://transfer.adttemp.com.br/abc123/report.zip" required style="width: 400px; padding: 10px; margin: 10px; border: 1px solid #ccc; border-radius: 5px;">
          <br><br>
          <button type="submit">Download Report</button>
        </form>
        
        <div id="result" class="result"></div>
      </div>

      <script>
        document.getElementById('webhookForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const urlInput = document.getElementById('urlInput');
          const resultDiv = document.getElementById('result');
          
          if (!urlInput.value.trim()) {
            showResult('Please enter a file URL', 'error');
            return;
          }
          
          try {
            showResult('Starting download...', 'success');
            
            const response = await fetch('/webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url: urlInput.value.trim() })
            });
            
            const data = await response.json();
            
            if (data.success) {
              showResult(\`
                ✅ Download started successfully!<br>
                <strong>Folder ID:</strong> \${data.folderId}<br>
                <strong>Report URL:</strong> <a href="\${data.reportUrl}" target="_blank">\${data.reportUrl}</a><br>
                <strong>Status:</strong> \${data.status}<br>
                <small>Note: Report will be available once download completes</small>
              \`, 'success');
              
              // Start polling for status
              pollStatus(data.folderId);
            } else {
              showResult('❌ ' + data.error, 'error');
            }
          } catch (error) {
            showResult('❌ Download failed: ' + error.message, 'error');
          }
        });
        
        function showResult(message, type) {
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = message;
          resultDiv.className = \`result \${type}\`;
          resultDiv.style.display = 'block';
        }

        function pollStatus(folderId) {
          const poll = async () => {
            try {
              const response = await fetch(\`/status/\${folderId}\`);
              const data = await response.json();
              
              if (data.status === 'completed') {
                showResult(\`
                  ✅ Download completed!<br>
                  <strong>Report URL:</strong> <a href="/\${folderId}/" target="_blank">View Report</a><br>
                  <strong>Duration:</strong> \${data.duration}ms
                \`, 'success');
              } else if (data.status === 'error') {
                showResult(\`❌ Download failed: \${data.error}\`, 'error');
              } else {
                // Still processing, poll again
                setTimeout(poll, 2000);
              }
            } catch (error) {
              console.error('Polling error:', error);
              setTimeout(poll, 2000);
            }
          };
          
          setTimeout(poll, 2000);
        }
      </script>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);

  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
});

// Start server
async function startServer() {
  await ensureDirectories();

  app.listen(PORT, () => {
    console.log(`🚀 Playwright Report Server running on port ${PORT}`);
    console.log(`📁 Webhook endpoint: http://localhost:${PORT}/webhook`);
    console.log(`📊 Status endpoint: http://localhost:${PORT}/status/<folder-id>`);
    console.log(`🌐 Web interface: http://localhost:${PORT}/`);
    console.log(`📊 Reports will be served at: http://localhost:${PORT}/<folder-id>/`);
  });
}

startServer().catch(console.error);

export default app;
