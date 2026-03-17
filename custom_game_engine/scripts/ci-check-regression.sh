#!/usr/bin/env bash
# CI test regression gate
# Runs vitest, compares total test count against .test-baseline.json.
# Fails if test count regresses by more than 10% from baseline.
# Usage: scripts/ci-check-regression.sh [--update-baseline]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BASELINE_FILE="$ROOT_DIR/.test-baseline.json"
JSON_OUTPUT="$ROOT_DIR/test-results.json"

cd "$ROOT_DIR"

# --- Update baseline mode ---
if [[ "${1:-}" == "--update-baseline" ]]; then
  echo "Running tests to update baseline..."
  npx vitest run --reporter json > "$JSON_OUTPUT" 2>/dev/null || true

  TOTAL=$(python3 -c "import json; d=json.load(open('$JSON_OUTPUT')); print(d['numTotalTests'])")
  PASSED=$(python3 -c "import json; d=json.load(open('$JSON_OUTPUT')); print(d['numPassedTests'])")
  DATE=$(date +%Y-%m-%d)

  cat > "$BASELINE_FILE" <<EOF
{
  "totalTests": $TOTAL,
  "passedTests": $PASSED,
  "updatedAt": "$DATE",
  "note": "Auto-updated by ci-check-regression.sh --update-baseline"
}
EOF
  echo "Baseline updated: $PASSED passed / $TOTAL total"
  rm -f "$JSON_OUTPUT"
  exit 0
fi

# --- CI regression check mode ---
if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "::warning::No baseline file found at $BASELINE_FILE — skipping regression check"
  exit 0
fi

BASELINE_TOTAL=$(python3 -c "import json; print(json.load(open('$BASELINE_FILE'))['totalTests'])")

if [[ "$BASELINE_TOTAL" -eq 0 ]]; then
  echo "::warning::Baseline is 0 — run 'npm run test:update-baseline' to set it. Skipping regression check."
  exit 0
fi

echo "Running test suite..."
npx vitest run --reporter json > "$JSON_OUTPUT" 2>/dev/null || true

CURRENT_TOTAL=$(python3 -c "import json; d=json.load(open('$JSON_OUTPUT')); print(d['numTotalTests'])")
CURRENT_PASSED=$(python3 -c "import json; d=json.load(open('$JSON_OUTPUT')); print(d['numPassedTests'])")
CURRENT_FAILED=$(python3 -c "import json; d=json.load(open('$JSON_OUTPUT')); print(d['numFailedTests'])")

# Calculate regression threshold (10% of baseline)
THRESHOLD=$(python3 -c "import math; print(math.floor($BASELINE_TOTAL * 0.9))")

echo ""
echo "== Test Regression Report =="
echo "Baseline total:  $BASELINE_TOTAL"
echo "Current total:   $CURRENT_TOTAL"
echo "Current passed:  $CURRENT_PASSED"
echo "Current failed:  $CURRENT_FAILED"
echo "Minimum allowed: $THRESHOLD (90% of baseline)"
echo ""

# Write GitHub step summary if available
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  cat >> "$GITHUB_STEP_SUMMARY" <<EOF
## Test Regression Report
| Metric | Value |
|--------|-------|
| Baseline total | $BASELINE_TOTAL |
| Current total | $CURRENT_TOTAL |
| Passed | $CURRENT_PASSED |
| Failed | $CURRENT_FAILED |
| Min allowed (90%) | $THRESHOLD |
EOF
fi

# Export for downstream steps (Paperclip notification)
# GITHUB_OUTPUT for job outputs, GITHUB_ENV for same-job env
for TARGET in "${GITHUB_OUTPUT:-/dev/null}" "${GITHUB_ENV:-/dev/null}"; do
  echo "test_baseline=$BASELINE_TOTAL" >> "$TARGET"
  echo "test_current=$CURRENT_TOTAL" >> "$TARGET"
  echo "test_passed=$CURRENT_PASSED" >> "$TARGET"
  echo "test_failed=$CURRENT_FAILED" >> "$TARGET"
done

# Check regression
if [[ "$CURRENT_TOTAL" -lt "$THRESHOLD" ]]; then
  echo "::error::Test count regressed by more than 10%: $CURRENT_TOTAL < $THRESHOLD (baseline: $BASELINE_TOTAL)"
  rm -f "$JSON_OUTPUT"
  exit 1
fi

echo "Test regression check passed."
rm -f "$JSON_OUTPUT"
exit 0
