#!/usr/bin/env bash
# =============================================================================
# allure-daily.sh
# Generates a daily Allure report, stores history by YYYY-MM/YYYY-MM-DD,
# and deploys to Vercel.
#
# Required environment variables:
#   ALLURE_VERCEL_ROOT  - Root directory for all reports (default below)
#   VERCEL_TOKEN        - Vercel API token (mandatory, do NOT hardcode)
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Utility: print message with timestamp
# ---------------------------------------------------------------------------
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# ---------------------------------------------------------------------------
# 1. Read environment variables & compute paths
# ---------------------------------------------------------------------------
ALLURE_VERCEL_ROOT="${ALLURE_VERCEL_ROOT:-/home/nccsoft/allure-vercel-reports}"
YEAR_MONTH="$(date +%Y-%m)"
DAY="$(date +%Y-%m-%d)"

REPORT_DIR="$ALLURE_VERCEL_ROOT/reports/$YEAR_MONTH/$DAY"
LOGS_DIR="$ALLURE_VERCEL_ROOT/logs"
LAST_HISTORY_DIR="$ALLURE_VERCEL_ROOT/reports/.last-history"

log "=== Starting allure-daily.sh ==="
log "ALLURE_VERCEL_ROOT : $ALLURE_VERCEL_ROOT"
log "YEAR_MONTH         : $YEAR_MONTH"
log "DAY                : $DAY"
log "REPORT_DIR         : $REPORT_DIR"

# ---------------------------------------------------------------------------
# 2. Create required directories (no sudo)
# ---------------------------------------------------------------------------
log "📁 Creating output directories..."

# Check write permission before attempting to create
if ! mkdir -p "$REPORT_DIR" 2>/dev/null; then
  echo "ERROR: No write permission to $ALLURE_VERCEL_ROOT."
  echo "       Please create this directory manually before running the script:"
  echo "       sudo mkdir -p $ALLURE_VERCEL_ROOT && sudo chown \$(whoami):\$(whoami) $ALLURE_VERCEL_ROOT"
  exit 1
fi

mkdir -p "$LOGS_DIR"
log "✅ Directories are ready"

# ---------------------------------------------------------------------------
# Setup dual logging: stdout + daily log file
# From this point, all output is written to LOG_FILE AND stdout
# ---------------------------------------------------------------------------
LOG_FILE="$LOGS_DIR/$DAY.log"
exec > >(tee -a "$LOG_FILE") 2>&1

log "📝 Log file: $LOG_FILE"
log "=== Full logging started ==="

# ---------------------------------------------------------------------------
# 3. Check Java runtime (required by allure-commandline)
# ---------------------------------------------------------------------------
log "☕ Checking Java runtime..."
if ! command -v java &>/dev/null; then
  log "ERROR: Java not found. Please install Java before running this script."
  log "       On the CI runner, this is handled by the 'Check Java' step."
  log "       For local runs: sudo apt-get install -y default-jre"
  exit 1
fi
log "✅ Java: $(java -version 2>&1 | head -1)"

# ---------------------------------------------------------------------------
# 4. Carry-over history (keeps trend continuous across days, even skipped ones)
# ---------------------------------------------------------------------------
log "📜 Processing Allure history..."

if [ -d "$LAST_HISTORY_DIR" ]; then
  log "   Found last history at: $LAST_HISTORY_DIR"
  mkdir -p "./allure-results/history"
  cp -r "$LAST_HISTORY_DIR/." "./allure-results/history/"
  log "   ✅ History copied into allure-results/history"
else
  log "   ℹ️  No .last-history found — first run or history was cleared"
fi

# ---------------------------------------------------------------------------
# 5. Generate Allure report
# ---------------------------------------------------------------------------
log "📊 Generating Allure report..."
log "   Input : ./allure-results"
log "   Output: $REPORT_DIR"

# Prefer allure binary from node_modules (already in devDependencies)
ALLURE_BIN="$(pwd)/node_modules/.bin/allure"
if [ ! -f "$ALLURE_BIN" ]; then
  # Fallback: use via npx
  ALLURE_BIN="npx allure"
  log "   ⚠️  node_modules/.bin/allure not found, falling back to npx allure"
fi

$ALLURE_BIN generate allure-results --clean -o "$REPORT_DIR"
log "✅ Report generated successfully"

# ---------------------------------------------------------------------------
# 6. Update .last-history pointer
# ---------------------------------------------------------------------------
log "🔄 Updating .last-history pointer..."

if [ -d "$LAST_HISTORY_DIR" ]; then
  rm -rf "$LAST_HISTORY_DIR"
fi

if [ -d "$REPORT_DIR/history" ]; then
  cp -r "$REPORT_DIR/history" "$LAST_HISTORY_DIR"
  log "✅ .last-history updated from the new report"
else
  log "⚠️  No history directory found in the generated report — skipping .last-history update"
fi

# ---------------------------------------------------------------------------
# 7. Clean up: remove allure-results from workspace after generation
# ---------------------------------------------------------------------------
log "🧹 Cleaning up allure-results from workspace..."
rm -rf ./allure-results
log "✅ ./allure-results removed"

# ---------------------------------------------------------------------------
# 8. Ensure vercel.json exists in the reports directory
# ---------------------------------------------------------------------------
VERCEL_JSON="$ALLURE_VERCEL_ROOT/reports/vercel.json"
if [ ! -f "$VERCEL_JSON" ]; then
  log "📄 Creating vercel.json..."
  cat > "$VERCEL_JSON" <<'EOF'
{
  "cleanUrls": true,
  "trailingSlash": false
}
EOF
  log "✅ vercel.json created"
else
  log "ℹ️  vercel.json already exists, skipping"
fi

# ---------------------------------------------------------------------------
# 9. Rebuild the index page before deploying
# ---------------------------------------------------------------------------
log "🏗️  Building index page..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/build-index.sh"
log "✅ Index build complete"

# ---------------------------------------------------------------------------
# 10. Deploy to Vercel
# ---------------------------------------------------------------------------
log "🚀 Preparing Vercel deployment..."

# Mandatory: check VERCEL_TOKEN is set and non-empty
if [ -z "${VERCEL_TOKEN:-}" ]; then
  log "ERROR: VERCEL_TOKEN environment variable is not set or is empty."
  log "       Set it via GitHub Secrets or export it before running this script."
  exit 1
fi

log "   Deploying $ALLURE_VERCEL_ROOT/reports to Vercel (--prod)..."
# Pass token via environment variable — NOT via --token flag
# to avoid exposure through process list or shell history
export VERCEL_TOKEN
npx vercel deploy --prod --yes "$ALLURE_VERCEL_ROOT/reports"

log "✅ Deployed to Vercel successfully!"
log "=== allure-daily.sh finished ==="
