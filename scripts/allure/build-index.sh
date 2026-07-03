#!/usr/bin/env bash
# =============================================================================
# build-index.sh
# Scans the reports directory for YYYY-MM/YYYY-MM-DD sub-directories,
# then generates a plain HTML/CSS/JS index.html (no build step, no framework).
#
# Environment variables:
#   ALLURE_VERCEL_ROOT  - Root directory (default: /home/nccsoft/allure-vercel-reports)
# =============================================================================
set -euo pipefail

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# ---------------------------------------------------------------------------
# 1. Read environment variable
# ---------------------------------------------------------------------------
ALLURE_VERCEL_ROOT="${ALLURE_VERCEL_ROOT:-/home/nccsoft/allure-vercel-reports}"
REPORTS_DIR="$ALLURE_VERCEL_ROOT/reports"
OUTPUT_FILE="$REPORTS_DIR/index.html"

log "📂 Scanning directory: $REPORTS_DIR"

# ---------------------------------------------------------------------------
# 2. Scan month directories (YYYY-MM) and day directories (YYYY-MM-DD),
#    build JavaScript data object
# ---------------------------------------------------------------------------
# Final JSON shape: {"2026-06":["2026-06-28","2026-06-29"],"2026-07":["2026-07-01"]}

JSON_DATA="{"
FIRST_MONTH=true
LATEST_MONTH=""
LATEST_DAY=""

# Iterate month directories in sorted order
while IFS= read -r -d '' MONTH_DIR; do
  MONTH_NAME="$(basename "$MONTH_DIR")"

  # Only process directories matching YYYY-MM (skip .last-history, .vercel, etc.)
  if [[ ! "$MONTH_NAME" =~ ^[0-9]{4}-[0-9]{2}$ ]]; then
    continue
  fi

  # Scan day directories within the month
  DAYS_JSON=""
  FIRST_DAY=true
  FOUND_DAYS=false

  while IFS= read -r -d '' DAY_DIR; do
    DAY_NAME="$(basename "$DAY_DIR")"
    # Only process directories matching YYYY-MM-DD
    if [[ ! "$DAY_NAME" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      continue
    fi
    # Only count as valid if index.html exists inside — avoids dead links
    if [ ! -f "$DAY_DIR/index.html" ]; then
      continue
    fi

    FOUND_DAYS=true
    if [ "$FIRST_DAY" = true ]; then
      DAYS_JSON="\"$DAY_NAME\""
      FIRST_DAY=false
    else
      DAYS_JSON="$DAYS_JSON,\"$DAY_NAME\""
    fi
    LATEST_DAY="$DAY_NAME"
  done < <(find "$MONTH_DIR" -maxdepth 1 -mindepth 1 -type d -print0 | sort -z)

  # Skip months with no valid day directories
  if [ "$FOUND_DAYS" = false ]; then
    continue
  fi

  if [ "$FIRST_MONTH" = true ]; then
    JSON_DATA="$JSON_DATA\"$MONTH_NAME\":[$DAYS_JSON]"
    FIRST_MONTH=false
  else
    JSON_DATA="$JSON_DATA,\"$MONTH_NAME\":[$DAYS_JSON]"
  fi
  LATEST_MONTH="$MONTH_NAME"
done < <(find "$REPORTS_DIR" -maxdepth 1 -mindepth 1 -type d -print0 | sort -z)

JSON_DATA="$JSON_DATA}"

log "   Scanned data   : $JSON_DATA"
log "   Latest month   : ${LATEST_MONTH:-'(none)'}  Latest day: ${LATEST_DAY:-'(none)'}"

# ---------------------------------------------------------------------------
# 3. Generate index.html (heredoc, fully overwrites any previous version)
#    Idempotent: safe to run multiple times on the same day
# ---------------------------------------------------------------------------
log "✍️  Writing $OUTPUT_FILE..."

if [ -z "$LATEST_MONTH" ] || [ -z "$LATEST_DAY" ]; then
cat > "$OUTPUT_FILE" <<HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>No Reports found</title>
</head>
<body>
  <h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">No reports available</h1>
</body>
</html>
HTMLEOF
else
cat > "$OUTPUT_FILE" <<HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0; url=/${LATEST_MONTH}/${LATEST_DAY}/" />
</head>
<body style="font-family: sans-serif; text-align: center; margin-top: 50px; background: #0f172a; color: #e2e8f0;">
  <p>Redirecting to the latest report (<a href="/${LATEST_MONTH}/${LATEST_DAY}/" style="color: #6366f1;">${LATEST_DAY}</a>)...</p>
  <script>
    window.location.replace("/${LATEST_MONTH}/${LATEST_DAY}/");
  </script>
</body>
</html>
HTMLEOF
fi

log "✅ $OUTPUT_FILE written"

# ---------------------------------------------------------------------------
# 4. Generate app-nav.js for the internal report navigation
# ---------------------------------------------------------------------------
log "⚡ Generating app-nav.js..."
APP_NAV_JS="$REPORTS_DIR/app-nav.js"

cat > "$APP_NAV_JS" <<JSEOF
(function() {
  const DATA = ${JSON_DATA};
  const months = Object.keys(DATA).sort();

  function injectNav() {
    if (document.getElementById('custom-allure-nav')) return;
    const sideNavMenu = document.querySelector('.side-nav__menu');
    if (!sideNavMenu) return;

    let currentMonth = '';
    let currentDay = '';
    const match = window.location.pathname.match(/\\/(\\d{4}-\\d{2})\\/(\\d{4}-\\d{2}-\\d{2})\\/?/);
    if (match) {
       currentMonth = match[1];
       currentDay = match[2];
    }

    const container = document.createElement('li');
    container.id = 'custom-allure-nav';
    container.className = 'side-nav__item';
    container.style.cssText = 'padding: 12px 15px; display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); margin-bottom: 10px;';

    const monthLabel = document.createElement('div');
    monthLabel.textContent = 'Month';
    monthLabel.style.cssText = 'color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;';
    
    const monthSelect = document.createElement('select');
    monthSelect.style.cssText = 'width: 100%; padding: 4px; background: rgba(15, 23, 42, 0.8); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; font-size: 12px; outline: none; cursor: pointer; margin-bottom: 6px;';
    
    months.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === currentMonth) opt.selected = true;
      monthSelect.appendChild(opt);
    });

    const dayLabel = document.createElement('div');
    dayLabel.textContent = 'Day';
    dayLabel.style.cssText = 'color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;';
    
    const daySelect = document.createElement('select');
    daySelect.style.cssText = 'width: 100%; padding: 4px; background: rgba(15, 23, 42, 0.8); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; font-size: 12px; outline: none; cursor: pointer;';

    function updateDayOptions() {
      daySelect.innerHTML = '';
      const selectedMonth = monthSelect.value;
      const days = (DATA[selectedMonth] || []).slice().sort();
      days.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        if (d === currentDay) opt.selected = true;
        daySelect.appendChild(opt);
      });
    }

    updateDayOptions();

    monthSelect.addEventListener('change', () => {
      updateDayOptions();
    });

    daySelect.addEventListener('change', () => {
      const m = monthSelect.value;
      const d = daySelect.value;
      if (m && d) {
        window.location.href = '/' + m + '/' + d + '/';
      }
    });

    container.appendChild(monthLabel);
    container.appendChild(monthSelect);
    container.appendChild(dayLabel);
    container.appendChild(daySelect);

    sideNavMenu.insertBefore(container, sideNavMenu.firstChild);
  }

  const observer = new MutationObserver(() => injectNav());
  observer.observe(document.body, { childList: true, subtree: true });
  injectNav();
})();
JSEOF

log "✅ app-nav.js written"

# ---------------------------------------------------------------------------
# 5. Inject app-nav.js script tag into all generated report index.html files
# ---------------------------------------------------------------------------
log "💉 Injecting app-nav.js into all report index.html files..."
# Find all index.html inside month/day directories
find "$REPORTS_DIR" -maxdepth 3 -mindepth 3 -name index.html | while read -r REPORT_HTML; do
  if ! grep -q 'src="/app-nav.js"' "$REPORT_HTML"; then
    # Inject just before </body> using sed
    sed -i -e 's|</body>|<script src="/app-nav.js"></script></body>|' "$REPORT_HTML"
  fi
done
log "✅ Injection complete"

log "=== build-index.sh finished ==="
