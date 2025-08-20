// Global teardown function

async function globalTeardown() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    if (fs.existsSync(screenshotsDir)) {
      const files = fs.readdirSync(screenshotsDir);
      if (files.length === 0) {
        fs.rmSync(screenshotsDir, { recursive: true, force: true });
      }
    }
    
    if (process.env.CI) {
      
      const testResultsDir = path.join(process.cwd(), 'test-results');
      const playwrightReportDir = path.join(process.cwd(), 'playwright-report');
      
      const archiveDir = path.join(process.cwd(), 'test-archive');
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      if (fs.existsSync(testResultsDir)) {
        const archiveTestResults = path.join(archiveDir, `test-results-${timestamp}`);
        fs.cpSync(testResultsDir, archiveTestResults, { recursive: true });
      }
      
      if (fs.existsSync(playwrightReportDir)) {
        const archiveReport = path.join(archiveDir, `playwright-report-${timestamp}`);
        fs.cpSync(playwrightReportDir, archiveReport, { recursive: true });
      }
    }
    
    if (process.env.CI) {
      const endTime = Date.now();
      const startTime = parseInt(process.env.TEST_START_TIME || '0');
      if (startTime > 0) {
        Math.round((endTime - startTime) / 1000);
      }
    }
    
  } catch {
    // Ignore cleanup errors
  }
}

export default globalTeardown;