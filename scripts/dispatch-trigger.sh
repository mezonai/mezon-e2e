#!/usr/bin/env bash
# =============================================================================
# dispatch-trigger.sh
# Triggers the "Allure Daily Report" GitHub Actions workflow via
# repository_dispatch, bypassing GitHub's unreliable on:schedule queue.
#
# Usage (called from crontab on the VPS):
#   dispatch-trigger.sh run-web-phase     # 20:00 Vietnam = 13:00 UTC
#   dispatch-trigger.sh run-multi-phase   # 02:00 Vietnam = 19:00 UTC
#
# Setup:
#   1. Copy this script to the VPS: /home/nccsoft/dispatch-trigger.sh
#   2. chmod +x /home/nccsoft/dispatch-trigger.sh
#   3. Create /home/nccsoft/.github-pat with your GitHub PAT (no newline)
#      echo -n "ghp_xxxxxxxxxxxx" > /home/nccsoft/.github-pat
#      chmod 600 /home/nccsoft/.github-pat
#   4. Add crontab entries (see bottom of this file).
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
EVENT_TYPE="${1:?Usage: $0 <run-web-phase|run-multi-phase>}"
REPO="mezonai/mezon-e2e"
PAT_FILE="/home/nccsoft/.github-pat"
LOG_FILE="/var/log/mezon-e2e-trigger.log"
# ---------------------------------------------------------------------------

# Load PAT from file or environment variable
if [ -f "$PAT_FILE" ]; then
  GITHUB_PAT="$(cat "$PAT_FILE")"
elif [ -z "${GITHUB_PAT:-}" ]; then
  echo "[ERROR] GITHUB_PAT not set and $PAT_FILE not found" >&2
  exit 1
fi

NOW="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: token $GITHUB_PAT" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/dispatches" \
  -d "{\"event_type\":\"$EVENT_TYPE\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "204" ]; then
  echo "$NOW [$EVENT_TYPE] OK — workflow dispatched successfully" | tee -a "$LOG_FILE"
else
  echo "$NOW [$EVENT_TYPE] ERROR HTTP $HTTP_CODE: $BODY" | tee -a "$LOG_FILE" >&2
  exit 1
fi

# =============================================================================
# CRONTAB SETUP (run: crontab -e  as nccsoft user on VPS)
# Timezone: UTC (safest — cron -e của user, không phụ thuộc system TZ)
# =============================================================================
#
# CRON_TZ=UTC
# # 20:00 Vietnam (13:00 UTC) — Web phase
# 0 13 * * * /home/nccsoft/dispatch-trigger.sh run-web-phase
# # 02:00 Vietnam (19:00 UTC) — Multi phase
# 0 19 * * * /home/nccsoft/dispatch-trigger.sh run-multi-phase
