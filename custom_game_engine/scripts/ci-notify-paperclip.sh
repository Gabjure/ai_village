#!/usr/bin/env bash
# Post CI results to a Paperclip issue if an issue ID is found in
# the branch name or recent commit messages.
#
# Expected env vars (set by GHA workflow):
#   PAPERCLIP_API_URL, PAPERCLIP_CI_TOKEN
#   TEST_BASELINE, TEST_CURRENT, TEST_PASSED, TEST_FAILED (from ci-check-regression.sh)
#   GITHUB_REF_NAME, GITHUB_SHA, GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID
#
# Issue ID pattern: MUL-\d+ in branch name or last 5 commit messages.

set -euo pipefail

# --- Extract issue identifier ---
BRANCH="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')}"
COMMITS="$(git log --oneline -5 2>/dev/null || echo '')"
SEARCH_TEXT="$BRANCH $COMMITS"

ISSUE_ID=$(echo "$SEARCH_TEXT" | grep -oE 'MUL-[0-9]+' | head -1 || true)

if [[ -z "$ISSUE_ID" ]]; then
  echo "No Paperclip issue ID (MUL-NNN) found in branch or commits. Skipping notification."
  exit 0
fi

echo "Found issue: $ISSUE_ID"

# --- Resolve issue UUID ---
API_URL="${PAPERCLIP_API_URL:-}"
API_TOKEN="${PAPERCLIP_CI_TOKEN:-}"
COMPANY_ID="${PAPERCLIP_COMPANY_ID:-}"

if [[ -z "$API_URL" || -z "$API_TOKEN" || -z "$COMPANY_ID" ]]; then
  echo "::warning::PAPERCLIP_API_URL, PAPERCLIP_CI_TOKEN, or PAPERCLIP_COMPANY_ID not set. Skipping notification."
  exit 0
fi

# Search for the issue by identifier
ISSUE_RESPONSE=$(curl -sf \
  -H "Authorization: Bearer $API_TOKEN" \
  "$API_URL/api/companies/$COMPANY_ID/issues?q=$ISSUE_ID" 2>/dev/null || echo '[]')

ISSUE_UUID=$(echo "$ISSUE_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    items = data if isinstance(data, list) else data.get('items', data.get('data', []))
    for item in items:
        if item.get('identifier') == '$ISSUE_ID':
            print(item['id'])
            break
except: pass
" 2>/dev/null || true)

if [[ -z "$ISSUE_UUID" ]]; then
  echo "Could not resolve $ISSUE_ID to a UUID. Skipping notification."
  exit 0
fi

# --- Build comment ---
BUILD_STATUS="${CI_BUILD_STATUS:-unknown}"
RUN_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-unknown}/actions/runs/${GITHUB_RUN_ID:-0}"
SHA_SHORT="${GITHUB_SHA:0:7}"

if [[ "$BUILD_STATUS" == "success" ]]; then
  STATUS_LINE="CI passed"
else
  STATUS_LINE="CI failed"
fi

COMMENT="## CI Report — $STATUS_LINE

- **Commit:** \`$SHA_SHORT\` on \`$BRANCH\`
- **Build:** $BUILD_STATUS — [View run]($RUN_URL)"

# Add test stats if available
if [[ -n "${TEST_CURRENT:-}" ]]; then
  COMMENT="$COMMENT
- **Tests:** $TEST_PASSED passed, $TEST_FAILED failed ($TEST_CURRENT total, baseline: $TEST_BASELINE)"
fi

# --- Post comment ---
PAYLOAD=$(python3 -c "import json,sys; print(json.dumps({'body': sys.stdin.read()}))" <<< "$COMMENT")

HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/api/issues/$ISSUE_UUID/comments" \
  -d "$PAYLOAD" \
  2>/dev/null || echo "000")

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  echo "Posted CI result to $ISSUE_ID"
else
  echo "::warning::Failed to post to Paperclip (HTTP $HTTP_CODE). Non-fatal."
fi
