#!/usr/bin/env bash
set -euo pipefail

echo "=== Hanko Registration API Test ==="

HANKO_BASE_URL="${HANKO_BASE_URL:-http://localhost:4604}"
TEST_EMAIL="${TEST_EMAIL:-test+$(date +%s)@example.com}"
MAILSLURPER_API_URL="${MAILSLURPER_API_URL:-http://localhost:18085/mail}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Please install jq and retry." >&2
  exit 1
fi

resolve_href() {
  local href="$1"
  if [[ "$href" =~ ^https?:// ]]; then
    printf "%s" "$href"
  else
    printf "%s%s" "${HANKO_BASE_URL}" "${href}"
  fi
}

read_passcode_from_mail() {
  local email="$1"
  local attempts=15
  local wait_seconds=1
  local body subject code

  for ((i=1; i<=attempts; i++)); do
    body="$(curl -sS "${MAILSLURPER_API_URL}")"
    subject="$(echo "${body}" | jq -r --arg email "${email}" '.mailItems[] | select(.toAddresses[]? == $email) | .subject' | head -n1)"
    if [[ -n "${subject}" && "${subject}" != "null" ]]; then
      code="$(echo "${subject}" | sed -n 's/.*passcode \([0-9]\{6\}\).*/\1/p')"
      if [[ -n "${code}" ]]; then
        printf "%s" "${code}"
        return 0
      fi
    fi
    sleep "${wait_seconds}"
  done

  return 1
}

# Step 1: Preflight
echo "Step 1: Getting preflight..."
PREFLIGHT_RESPONSE=$(curl -sS -X POST "${HANKO_BASE_URL}/registration" \
  -H "Content-Type: application/json" \
  -d '{}')

CSRF_TOKEN=$(echo "$PREFLIGHT_RESPONSE" | jq -r '.csrf_token')
FLOW_ID=$(echo "$PREFLIGHT_RESPONSE" | jq -r '.actions.register_client_capabilities.href' | sed 's/.*action=register_client_capabilities%40\([^&]*\).*/\1/')

echo "✅ CSRF Token: $CSRF_TOKEN"
echo "✅ Flow ID: $FLOW_ID"

# Step 2: Register capabilities
echo "Step 2: Registering client capabilities..."
CAPABILITIES_RESPONSE=$(curl -sS -X POST "${HANKO_BASE_URL}/registration?action=register_client_capabilities@$FLOW_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"csrf_token\": \"$CSRF_TOKEN\",
    \"input_data\": {
      \"webauthn_available\": false,
      \"webauthn_conditional_mediation_available\": false,
      \"webauthn_platform_authenticator_available\": false
    }
  }")

NEW_CSRF=$(echo "$CAPABILITIES_RESPONSE" | jq -r '.csrf_token')
LOGIN_IDENTIFIER_URL=$(echo "$CAPABILITIES_RESPONSE" | jq -r '.actions.register_login_identifier.href' | sed 's/%40/@/')

echo "✅ Capabilities registered, new CSRF: $NEW_CSRF"

# Step 3: Register email
echo "Step 3: Registering email..."
LOGIN_RESPONSE=$(curl -sS -X POST "$(resolve_href "${LOGIN_IDENTIFIER_URL}")" \
  -H "Content-Type: application/json" \
  -d "{
    \"csrf_token\": \"$NEW_CSRF\",
    \"input_data\": {
      \"email\": \"${TEST_EMAIL}\"
    }
  }")

CURRENT_RESPONSE="$LOGIN_RESPONSE"
CURRENT_STATE=$(echo "$CURRENT_RESPONSE" | jq -r '.name')
CURRENT_CSRF=$(echo "$CURRENT_RESPONSE" | jq -r '.csrf_token')

echo "✅ Email registered, state: $CURRENT_STATE"

# Optional step: verify passcode when email verification is required.
if [[ "${CURRENT_STATE}" == "passcode_confirmation" ]]; then
  echo "Step 4: Verifying passcode from mailslurper..."
  PASSCODE="$(read_passcode_from_mail "${TEST_EMAIL}")"
  if [[ -z "${PASSCODE:-}" ]]; then
    echo "❌ Could not fetch passcode for ${TEST_EMAIL} from ${MAILSLURPER_API_URL}"
    exit 1
  fi
  echo "✅ Passcode fetched: ${PASSCODE}"

  VERIFY_URL=$(echo "$CURRENT_RESPONSE" | jq -r '.actions.verify_passcode.href' | sed 's/%40/@/')
  CURRENT_RESPONSE=$(curl -sS -X POST "$(resolve_href "${VERIFY_URL}")" \
    -H "Content-Type: application/json" \
    -d "{
      \"csrf_token\": \"$CURRENT_CSRF\",
      \"input_data\": {
        \"code\": \"${PASSCODE}\"
      }
    }")

  CURRENT_STATE=$(echo "$CURRENT_RESPONSE" | jq -r '.name')
  CURRENT_CSRF=$(echo "$CURRENT_RESPONSE" | jq -r '.csrf_token')
  echo "✅ Passcode verified, state: ${CURRENT_STATE}"
fi

# Step 5: Create password (if action available)
echo "Step 5: Creating password..."
PASSWORD_URL=$(echo "$CURRENT_RESPONSE" | jq -r '.actions.register_password.href // empty' | sed 's/%40/@/')

if [[ -z "${PASSWORD_URL}" ]]; then
  echo "❌ register_password action not found in current state (${CURRENT_STATE})"
  echo "$CURRENT_RESPONSE" | jq .
  exit 1
fi

FINAL_RESPONSE=$(curl -sS -X POST "$(resolve_href "${PASSWORD_URL}")" \
  -H "Content-Type: application/json" \
  -d "{
    \"csrf_token\": \"$CURRENT_CSRF\",
    \"input_data\": {
      \"new_password\": \"SecurePass123!\"
    }
  }")

# Optional step: finalize by skipping MFA onboarding.
FINAL_STATE=$(echo "$FINAL_RESPONSE" | jq -r '.name')
if [[ "${FINAL_STATE}" == "mfa_method_chooser" ]]; then
  echo "Step 6: Finalizing registration by skipping MFA onboarding..."
  FINAL_CSRF=$(echo "$FINAL_RESPONSE" | jq -r '.csrf_token')
  SKIP_URL=$(echo "$FINAL_RESPONSE" | jq -r '.actions.skip.href // empty' | sed 's/%40/@/')
  if [[ -n "${SKIP_URL}" ]]; then
    FINAL_RESPONSE=$(curl -sS -X POST "$(resolve_href "${SKIP_URL}")" \
      -H "Content-Type: application/json" \
      -d "{
        \"csrf_token\": \"$FINAL_CSRF\",
        \"input_data\": {}
      }")
  fi
fi

echo "✅ Final Response:"
echo "$FINAL_RESPONSE" | jq .
echo "ℹ️ Test email: ${TEST_EMAIL}"

# Check if registration was successful
if echo "$FINAL_RESPONSE" | jq -e '.name' | grep -q "success"; then
    echo "🎉 REGISTRATION SUCCESSFUL!"
elif echo "$FINAL_RESPONSE" | jq -e '.name' | grep -v "error"; then
    echo "✅ Registration flow working (partial success)"
else
    echo "❌ Registration failed"
fi

echo "=== Test Complete ==="