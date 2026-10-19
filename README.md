# Mezon Automation Framework

Comprehensive test automation framework built with **Playwright + BDD** pattern for

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd mezon-automation

# Install dependencies
npm install

# Install browsers
npx playwright install
```

### Environment Setup

```bash
# Default environment variables (in playwright.config.ts)
BASE_URL=https://dev-mezon.nccsoft.vn
NODE_ENV=development
```

## 🧪 Running Tests

### BDD Test Commands

```bash
# Run all BDD tests (recommended)
npm run test

# Run authentication setup
npm run test:setup

# Run specific test groups
npm run test:bdd:login       # Login flow tests (no auth required)
npm run test:bdd             # All BDD tests

# Run traditional tests (with auth)
npm run test:traditional

# Debug mode
npm run test:debug
npm run test:ui
```

### DM voice call tests

```bash
npm run test:dm-call

# Run locally without sending reporter notifications
TEST_GAP_MS=0 npm run test:dm-call -- --reporter=list
```

The `Multi` project opens two isolated browser sessions with fake media devices. These four
tests cover accepting a call and hanging up from either side, rejecting an incoming call,
and cancelling a ringing call. Accepted calls must play remote audio on both sides; rejection
and cancellation also verify that another call can be started.

Set `BASE_URL` to the running frontend. When using the default local URL, start the frontend
on port 4200 first. Authentication uses the dev environment and requires access to its services.

## 📊 Test Reporting

This project uses multiple reporting mechanisms:

### GitHub Actions Reporter

- **@estruyf/github-actions-reporter**: Automatically generates test summaries in GitHub Actions
- Provides detailed test results with expandable sections
- Shows errors, annotations, and test tags
- Includes links to artifacts

### Playwright Reports

- Standard Playwright HTML reports
- Available at `playwright-report/index.html`

### View Reports

```bash
# Open Ortoni report
npm run report

# Open Playwright report
npm run report:playwright
```
