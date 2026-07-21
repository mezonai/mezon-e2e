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
  if command -v allure >/dev/null 2>&1; then
    ALLURE_BIN="allure"
    log "   ℹ️  node_modules/.bin/allure not found, using global allure ($(allure --version))"
  else
    ALLURE_BIN="npx allure"
    log "   ⚠️  node_modules/.bin/allure and global allure not found, falling back to npx allure"
  fi
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
  "trailingSlash": true
}
EOF
  log "✅ vercel.json created"
else
  # Always overwrite to ensure latest config is applied
  log "♻️  Overwriting vercel.json to ensure clean config..."
  cat > "$VERCEL_JSON" <<'EOF'
{
  "trailingSlash": true
}
EOF
  log "✅ vercel.json updated"
fi

# ---------------------------------------------------------------------------
# 9. Remove reports from previous weeks
# ---------------------------------------------------------------------------
log "🧹 Removing reports from previous weeks..."

CURRENT_WEEK=$(date +%G-%V)

find "$ALLURE_VERCEL_ROOT/reports" \
  -mindepth 2 \
  -maxdepth 2 \
  -type d | while read -r REPORT_DIR; do

    REPORT_DATE=$(basename "$REPORT_DIR")

    if ! date -d "$REPORT_DATE" >/dev/null 2>&1; then
        continue
    fi

    REPORT_WEEK=$(date -d "$REPORT_DATE" +%G-%V)

    if [ "$REPORT_WEEK" != "$CURRENT_WEEK" ]; then
        log "🗑️ Removing old report: $REPORT_DATE"
        rm -rf "$REPORT_DIR"
    fi
done

log "✅ Old reports removed"

# ---------------------------------------------------------------------------
# 10. Rebuild the index page before deploying
# ---------------------------------------------------------------------------
log "🏗️  Building index page..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/build-index.sh"
log "✅ Index build complete"

# ---------------------------------------------------------------------------
# 11. Zip daily report and upload to GitHub Release (monthly tag)
# ---------------------------------------------------------------------------
log "📦 Zip & upload to GitHub Release"

RELEASE_TAG="allure-report-$YEAR_MONTH"
RELEASE_NAME="Allure Report $YEAR_MONTH"
ZIP_FILE="/tmp/allure-report-${DAY}.zip"
UPLOAD_FAILED=0

# -- Pre-check: zip --
log "🔍 Checking zip command..."
if ! command -v zip &>/dev/null; then
  log "❌ ERROR: 'zip' not found — install with: sudo apt-get install -y zip"
  UPLOAD_FAILED=1
else
  log "   zip: $(zip --version 2>&1 | head -1)"
fi

# -- Pre-check: gh --
log "🔍 Checking gh command..."
if ! command -v gh &>/dev/null; then
  log "❌ ERROR: 'gh' not found — install with: sudo apt-get install -y gh"
  UPLOAD_FAILED=1
else
  log "   gh: $(gh --version | head -1)"
fi

# -- Pre-check: GITHUB_TOKEN --
if [ "$UPLOAD_FAILED" -eq 0 ]; then
  log "🔍 Checking GITHUB_TOKEN..."
  if [ -z "${GITHUB_TOKEN:-}" ]; then
    log "❌ ERROR: GITHUB_TOKEN env var is empty"
    UPLOAD_FAILED=1
  else
    log "   GITHUB_TOKEN is set (${#GITHUB_TOKEN} chars)"
  fi
fi

# -- Pre-check: GITHUB_REPOSITORY --
if [ "$UPLOAD_FAILED" -eq 0 ]; then
  log "🔍 Checking GITHUB_REPOSITORY..."
  if [ -z "${GITHUB_REPOSITORY:-}" ]; then
    log "❌ ERROR: GITHUB_REPOSITORY env var is empty"
    UPLOAD_FAILED=1
  else
    log "   GITHUB_REPOSITORY=$GITHUB_REPOSITORY"
  fi
fi

# -- Pre-check: gh auth --
if [ "$UPLOAD_FAILED" -eq 0 ]; then
  log "🔍 Checking gh auth status..."
  GH_AUTH_OUT=$(gh auth status 2>&1) && {
    log "   gh auth OK:"
    log "   $GH_AUTH_OUT"
  } || {
    log "❌ ERROR: gh auth failed:"
    log "   $GH_AUTH_OUT"
    UPLOAD_FAILED=1
  }
fi

# -- Zip the daily report --
if [ "$UPLOAD_FAILED" -eq 0 ]; then
  log "🗜️  Zipping $ALLURE_VERCEL_ROOT/reports/$YEAR_MONTH/$DAY/ ..."
  rm -f "$ZIP_FILE"

  if (cd "$ALLURE_VERCEL_ROOT/reports" && zip -qr "$ZIP_FILE" "$YEAR_MONTH/$DAY/"); then
    ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
    ZIP_COUNT=$(zipinfo -1 "$ZIP_FILE" 2>/dev/null | wc -l)
    log "✅ Zip created: $ZIP_FILE ($ZIP_SIZE, $ZIP_COUNT files)"
  else
    log "❌ ERROR: Failed to create zip file"
    UPLOAD_FAILED=1
  fi
fi

# -- Upload to GitHub Release --
if [ "$UPLOAD_FAILED" -eq 0 ]; then
  set +e

  log "🔍 Checking if release '$RELEASE_TAG' exists..."
  GH_VIEW_OUT=$(gh release view "$RELEASE_TAG" --repo "$GITHUB_REPOSITORY" 2>&1)
  VIEW_RC=$?

  if [ "$VIEW_RC" -eq 0 ]; then
    log "   Release exists — uploading $ZIP_FILE ..."
    GH_UP_OUT=$(gh release upload "$RELEASE_TAG" "$ZIP_FILE" \
      --clobber --repo "$GITHUB_REPOSITORY" 2>&1)
    UPLOAD_RC=$?
  else
    log "   Release not found — creating new release '$RELEASE_TAG'..."
    GH_UP_OUT=$(gh release create "$RELEASE_TAG" "$ZIP_FILE" \
      --repo "$GITHUB_REPOSITORY" \
      --title "$RELEASE_NAME" \
      --notes "Allure daily reports for $YEAR_MONTH" \
      --latest=false 2>&1)
    UPLOAD_RC=$?
  fi

  set -e

  if [ "$UPLOAD_RC" -ne 0 ]; then
    log "❌ ERROR: GitHub Release upload failed (exit code: $UPLOAD_RC)"
    log "   $GH_UP_OUT"
    UPLOAD_FAILED=1
  else
    log "✅ GitHub Release upload succeeded"
    log "   $GH_UP_OUT"
  fi
fi

# Export for workflow step
echo "UPLOAD_FAILED=$UPLOAD_FAILED" >> "${GITHUB_OUTPUT:-/dev/null}"

if [ "$UPLOAD_FAILED" -ne 0 ]; then
  log "⚠️  Step 11 finished with errors (UPLOAD_FAILED=1)"
else
  log "🎉 Step 11 finished successfully"
fi

# ---------------------------------------------------------------------------
# 12. Deploy to Vercel
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
