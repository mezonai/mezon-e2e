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

cat > "$OUTPUT_FILE" <<HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mezon Automation — Allure Reports</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1rem;
      padding: 2.5rem;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.4);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 1.75rem;
    }

    .logo-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #6366f1;
    }

    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #f8fafc;
    }

    .subtitle {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
      margin-top: 1.25rem;
    }

    select {
      width: 100%;
      padding: 0.625rem 0.875rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      color: #e2e8f0;
      font-size: 0.9375rem;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.875rem center;
      padding-right: 2.5rem;
      transition: border-color 0.15s;
    }

    select:focus {
      outline: none;
      border-color: #6366f1;
    }

    .btn {
      display: block;
      width: 100%;
      margin-top: 1.75rem;
      padding: 0.75rem;
      background: #6366f1;
      color: #fff;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: background 0.15s, transform 0.1s;
    }

    .btn:hover { background: #4f46e5; }
    .btn:active { transform: scale(0.98); }
    .btn:disabled {
      background: #334155;
      color: #64748b;
      cursor: not-allowed;
    }

    .divider {
      border: none;
      border-top: 1px solid #334155;
      margin: 1.75rem 0 0;
    }

    .meta {
      font-size: 0.75rem;
      color: #475569;
      margin-top: 1rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-dot"></div>
      <div>
        <h1>Mezon E2E — Allure Reports</h1>
        <p class="subtitle">Daily automated test results</p>
      </div>
    </div>

    <label for="select-month">Month</label>
    <select id="select-month"></select>

    <label for="select-day">Day</label>
    <select id="select-day"></select>

    <a id="view-btn" class="btn" href="#" target="_blank" rel="noopener noreferrer">
      View report &rarr;
    </a>

    <hr class="divider" />
    <p class="meta" id="meta-text">Select a month and day to view the report</p>
  </div>

  <script>
    // -------------------------------------------------------------------------
    // Data object generated automatically by build-index.sh
    // Shape: { "YYYY-MM": ["YYYY-MM-DD", ...], ... }
    // -------------------------------------------------------------------------
    const DATA = ${JSON_DATA};

    const monthSel = document.getElementById('select-month');
    const daySel   = document.getElementById('select-day');
    const viewBtn  = document.getElementById('view-btn');
    const metaText = document.getElementById('meta-text');

    const months = Object.keys(DATA).sort();

    function populateMonths() {
      monthSel.innerHTML = '';
      if (months.length === 0) {
        monthSel.innerHTML = '<option value="">-- No data available --</option>';
        return;
      }
      months.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        monthSel.appendChild(opt);
      });
      // Default: select the most recent month
      monthSel.value = months[months.length - 1];
    }

    function populateDays(month) {
      daySel.innerHTML = '';
      const days = (DATA[month] || []).slice().sort();
      if (days.length === 0) {
        daySel.innerHTML = '<option value="">-- No days available --</option>';
        updateButton(null, null);
        return;
      }
      days.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        daySel.appendChild(opt);
      });
      // Default: select the most recent day
      daySel.value = days[days.length - 1];
      updateButton(month, days[days.length - 1]);
    }

    function updateButton(month, day) {
      if (!month || !day) {
        viewBtn.href = '#';
        viewBtn.setAttribute('disabled', 'disabled');
        metaText.textContent = 'No data to display';
        return;
      }
      const href = './' + month + '/' + day + '/index.html';
      viewBtn.href = href;
      viewBtn.removeAttribute('disabled');
      metaText.textContent = 'Report for ' + day;
    }

    monthSel.addEventListener('change', () => {
      populateDays(monthSel.value);
    });

    daySel.addEventListener('change', () => {
      updateButton(monthSel.value, daySel.value);
    });

    // Initialise on page load
    populateMonths();
    if (months.length > 0) {
      populateDays(months[months.length - 1]);
    } else {
      daySel.innerHTML = '<option value="">-- No data available --</option>';
      updateButton(null, null);
    }
  </script>
</body>
</html>
HTMLEOF

log "✅ $OUTPUT_FILE written"
log "=== build-index.sh finished ==="
