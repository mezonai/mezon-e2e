# @mezon/playwright-reporter

A Playwright reporter that sends test notifications to Mezon via webhooks.

## Features

- 🚀 Real-time test notifications
- 📊 Progress tracking and statistics
- 💬 Mezon webhook integration
- 🎯 Configurable notification settings
- 📈 Test result summaries
- ⚡ Smart notification filtering

## Installation

```bash
npm install @mezon/playwright-reporter
```

## Usage

### Basic Configuration

Add the reporter to your `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [['@mezon/playwright-reporter']],
  // ... other config
});
```

### Environment Variables

Configure the reporter using environment variables:

```bash
# Required: Mezon webhook URL
MEZON_WEBHOOK_URL=https://webhook.mezon.ai/webhooks/your-webhook-url

# Optional: Disable notifications (default: true)
MEZON_NOTIFICATIONS=false

# Optional: User ID to mention in notifications
MEZON_MENTION_USER_ID=your-user-id

# Optional: Environment name (default: development)
NODE_ENV=production
```

### Advanced Configuration

You can also use the reporter programmatically:

```typescript
import { MezonReporter } from '@mezon/playwright-reporter';

// Custom usage
const reporter = new MezonReporter();
```

## Notification Types

The reporter sends notifications for:

- ✅ Test suite start
- ❌ Failed tests (immediately)
- 📊 Progress milestones (every 25% or 10 tests)
- 🎉 Test suite completion with summary

## Message Format

Notifications include:

- Test status with emojis
- Progress tracking
- Execution duration
- Error details (for failures)
- File names
- Test summaries with statistics

## Example Output

```
🚀 Playwright test suite started
📊 Progress: 5/20
⏱️ Duration: 2.5s
🌍 Environment: production

❌ FAILED: User login test
📁 File: auth.spec.ts
⏱️ Duration: 1.2s
❌ Error: Expected element to be visible...

🎉 Playwright test suite finished
📈 Summary:
✅ Passed: 18
❌ Failed: 2
⏭️ Skipped: 0
📊 Total: 20
🎯 Success Rate: 90%
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch mode for development
npm run dev

# Clean build files
npm run clean
```

## License

MIT
