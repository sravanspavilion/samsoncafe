#!/usr/bin/env bash
# =============================================================================
# One-command deployment of the updated Google Apps Script (with doPost/createOrder)
# to your existing web app, keeping the SAME URL.
#
# Requirements:
#   - Node.js 14+ installed locally
#   - You own / can edit the Apps Script project bound to your menu spreadsheet
#   - One-time Google authorization in your browser (only once per machine)
#
# Usage:
#   ./scripts/deploy-apps-script.sh
#
# It will:
#   1. Log you into Google Apps Script (opens browser)
#   2. Ask for your Apps Script project's script ID
#   3. Push google-apps-script-samsons-cafe-updated.gs to the project
#   4. Point the EXISTING deployment (the URL in .env.local) at the new version
#   5. Run a live health + test-order check against the same URL
#
# Where to find the script ID:
#   Apps Script editor (Extensions > Apps Script) -> URL looks like
#   https://script.google.com/home/projects/<SCRIPT_ID>/edit
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GS_FILE="${ROOT_DIR}/google-apps-script-samsons-cafe-updated.gs"
ENV_FILE="${ROOT_DIR}/.env.local"

if [[ ! -f "${GS_FILE}" ]]; then
  echo "ERROR: Could not find ${GS_FILE}" >&2
  exit 1
fi

echo "==> Checking Node.js..."
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required (https://nodejs.org)." >&2
  exit 1
fi

echo "==> Logging you into Google Apps Script (a browser window will open)..."
npx --yes @google/clasp login

# --- Script ID ---------------------------------------------------------------
SCRIPT_ID=""
if [[ -f "${ROOT_DIR}/.clasp.json" ]]; then
  SCRIPT_ID="$(node -p "require('${ROOT_DIR}/.clasp.json').scriptId || ''" 2>/dev/null || true)"
fi
if [[ -n "${CLASP_SCRIPT_ID:-}" ]]; then
  SCRIPT_ID="${CLASP_SCRIPT_ID}"
fi
if [[ -z "${SCRIPT_ID}" ]]; then
  echo ""
  echo "Open your Apps Script project (Extensions > Apps Script) and copy the"
  echo "SCRIPT ID from the URL:  https://script.google.com/home/projects/<SCRIPT_ID>/edit"
  read -r -p "Paste the Apps Script script ID: " SCRIPT_ID
  SCRIPT_ID="$(echo "${SCRIPT_ID}" | tr -d '[:space:]')"
fi
if [[ -z "${SCRIPT_ID}" ]]; then
  echo "ERROR: No script ID provided." >&2
  exit 1
fi

# --- Existing deployment (keep URL) ------------------------------------------
DEPLOYMENT_ID=""
GOOGLE_URL_RE='https://script[.]google[.]com/macros/s/([A-Za-z0-9_-]+)/exec'
if [[ -f "${ENV_FILE}" ]]; then
  env_url="$(grep '^GOOGLE_APPS_SCRIPT_URL=' "${ENV_FILE}" | head -1 | cut -d= -f2- || true)"
  if [[ "${env_url}" =~ ${GOOGLE_URL_RE} ]]; then
    DEPLOYMENT_ID="${BASH_REMATCH[1]}"
    echo "==> Existing web app URL found in .env.local; will keep it."
  fi
fi
if [[ -z "${DEPLOYMENT_ID}" ]]; then
  echo ""
  echo "No existing URL found. Running 'clasp deployments' to list your deployments..."
  (cd "${ROOT_DIR}" && npx --yes @google/clasp deployments)
  read -r -p "Paste the deployment ID you want to update (leave empty to create a NEW URL): " DEPLOYMENT_ID
  DEPLOYMENT_ID="$(echo "${DEPLOYMENT_ID}" | tr -d '[:space:]')"
fi

# --- Clone the project into a temp dir ----------------------------------------
WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/samson-apps-script.XXXXXX")"
trap 'rm -rf "${WORKDIR}"' EXIT

echo "==> Cloning Apps Script project ${SCRIPT_ID} ..."
npx --yes @google/clasp clone "${SCRIPT_ID}" --rootDir "${WORKDIR}"

echo "==> Replacing project code with the updated script..."
if [[ ! -f "${WORKDIR}/Code.gs" && ! -f "${WORKDIR}/appsscript.json" ]]; then
  echo "ERROR: Clasp clone did not produce a valid project." >&2
  exit 1
fi
cp "${GS_FILE}" "${WORKDIR}/Code.gs"
echo "    (code from $(basename "${GS_FILE}") copied to Code.gs)"

echo "==> Pushing updated code to Apps Script..."
(cd "${WORKDIR}" && npx --yes @google/clasp push --force)

# --- Deploy -------------------------------------------------------------------
echo "==> Deploying..."
if [[ -n "${DEPLOYMENT_ID}" ]]; then
  echo "    Updating existing deployment ${DEPLOYMENT_ID} (URL stays the same)..."
  (cd "${WORKDIR}" && npx --yes @google/clasp deploy --deploymentId "${DEPLOYMENT_ID}" --description "samson cafe updated $(date +%Y-%m-%d)")
else
  echo "    Creating a new deployment..."
  (cd "${WORKDIR}" && npx --yes @google/clasp deploy --description "samson cafe updated $(date +%Y-%m-%d)")
fi

# --- Verify -------------------------------------------------------------------
URL="https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec"
echo ""
echo "==> Verifying ${URL} ..."
for i in 1 2 3 4 5; do
  code="$(curl -sSL -o /tmp/samson-health.json -w '%{http_code}' --max-time 30 "${URL}?action=health" 2>/dev/null || echo 000)"
  if [[ "${code}" == "200" ]]; then break; fi
  sleep 3
done
echo "    health GET -> HTTP ${code}"
if [[ "${code}" != "200" ]]; then
  echo "ERROR: health check failed." >&2
  exit 1
fi
head -c 200 /tmp/samson-health.json
echo ""

OID="SC-$(date +%Y%m%d)-DEPLOY"
post_code="$(curl -sSL --post302 -o /tmp/samson-order.json -w '%{http_code}' --max-time 40 -X POST \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d "{\"action\":\"createOrder\",\"orderId\":\"${OID}\",\"customerName\":\"Deploy Check\",\"contact\":\"000\",\"items\":[{\"id\":\"COF-001\",\"quantity\":1}]}" \
  "${URL}" 2>/dev/null || echo 000)"
echo "    test order POST -> HTTP ${post_code}"
if [[ "${post_code}" == "200" || "${post_code}" == "201" ]]; then
  echo "=============================================================="
  echo " ✅ SUCCESS! Order creation is now live on the same URL:"
  echo "    ${URL}"
  echo "=============================================================="
  head -c 300 /tmp/samson-order.json
  echo ""
else
  echo "ERROR: order POST failed (HTTP ${post_code})."
  echo "       If the apps script editor shows '405', wait a minute for propagation and re-run."
  exit 1
fi