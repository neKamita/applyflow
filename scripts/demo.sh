#!/usr/bin/env bash
# End-to-end walkthrough against a running stack (docker compose up, or a port-forwarded gateway).
# Exits non-zero if any step does not behave as expected.
set -euo pipefail

GATEWAY="${GATEWAY:-http://localhost:8080}"
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }

step() { printf '\n== %s\n' "$*"; }
fail() { echo "FAILED: $*" >&2; exit 1; }

token() {
  curl -fsS -X POST "$GATEWAY/auth/token" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"password\":\"$2\"}" | jq -r .accessToken
}

submit() { # token idempotency-key program payment-token
  curl -sS -o /tmp/applyflow-demo-body -w '%{http_code}' -X POST "$GATEWAY/api/applications" \
    -H "Authorization: Bearer $1" -H "Idempotency-Key: $2" -H 'Content-Type: application/json' \
    -d "{\"programId\":\"$3\",\"applicantEmail\":\"aziz@example.com\",\"paymentToken\":\"$4\"}"
}

wait_for_status() { # token application-id expected-status
  for _ in $(seq 1 30); do
    status=$(curl -fsS "$GATEWAY/api/applications/$2" -H "Authorization: Bearer $1" | jq -r .status)
    [[ "$status" == "$3" ]] && { echo "status: $status"; return 0; }
    sleep 1
  done
  fail "application $2 stayed in $status, expected $3"
}

step "Public catalog (served from Redis after the first call)"
curl -fsS "$GATEWAY/api/programs" | jq -r '.[] | "\(.id)\t\(.applicationFee) \(.currency)\t\(.university)"'

step "Protected endpoint without a token"
code=$(curl -s -o /dev/null -w '%{http_code}' "$GATEWAY/api/applications")
[[ "$code" == 401 ]] || fail "expected 401, got $code"; echo "401 Unauthorized"

step "Log in"
AZIZ=$(token aziz aziz-demo-pass)
MALIKA=$(token malika malika-demo-pass)
echo "got tokens for aziz and malika"

step "Submit an application (payment runs asynchronously)"
KEY="demo-$(date +%s)-$RANDOM"
code=$(submit "$AZIZ" "$KEY" bham-msc-cs tok_visa)
[[ "$code" == 201 ]] || fail "expected 201, got $code: $(cat /tmp/applyflow-demo-body)"
APP=$(jq -r .id /tmp/applyflow-demo-body)
jq '{id, programName, status, applicationFee, currency}' /tmp/applyflow-demo-body

step "Retry with the same Idempotency-Key returns the same application"
code=$(submit "$AZIZ" "$KEY" bham-msc-cs tok_visa)
[[ "$code" == 200 && "$(jq -r .id /tmp/applyflow-demo-body)" == "$APP" ]] || fail "expected a replay of $APP, got $code"
echo "200 OK, same id $APP"

step "Wait for application.submitted -> payment.completed -> PAID"
wait_for_status "$AZIZ" "$APP" PAID
curl -fsS "$GATEWAY/api/payments/$APP" -H "Authorization: Bearer $AZIZ" | jq '{status, amount, currency, providerReference}'

step "Notifications sent for this application"
for _ in $(seq 1 10); do
  count=$(curl -fsS "$GATEWAY/api/notifications/$APP" -H "Authorization: Bearer $AZIZ" | jq length)
  [[ "$count" -ge 2 ]] && break; sleep 1
done
curl -fsS "$GATEWAY/api/notifications/$APP" -H "Authorization: Bearer $AZIZ" | jq -r '.[].subject'

step "Another student cannot see it"
code=$(curl -s -o /dev/null -w '%{http_code}' "$GATEWAY/api/applications/$APP" -H "Authorization: Bearer $MALIKA")
[[ "$code" == 404 ]] || fail "expected 404, got $code"; echo "404 Not Found"

step "A declined card ends in PAYMENT_FAILED"
code=$(submit "$AZIZ" "demo-declined-$RANDOM-$RANDOM" kaist-msc-ai tok_declined)
[[ "$code" == 201 ]] || fail "expected 201, got $code"
wait_for_status "$AZIZ" "$(jq -r .id /tmp/applyflow-demo-body)" PAYMENT_FAILED

step "Rate limiting: a burst of submissions from one user"
codes=""
for i in $(seq 1 8); do
  codes+="$(submit "$MALIKA" "demo-burst-$RANDOM-$i" wiut-bsc-se tok_visa) "
done
echo "$codes"
[[ "$codes" == *429* ]] || fail "expected at least one 429"

rm -f /tmp/applyflow-demo-body
printf '\nAll checks passed.\n'
