#!/usr/bin/env bash
set -e

API="http://localhost:8001/api"

# Login
echo "--- Login ---"
RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"e2e@test.com","password":"Password123!"}')
TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo "Token: ${TOKEN:0:15}..."

# Create workflow
echo "--- Create Workflow ---"
WF=$(curl -s -X POST "$API/workflows" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"E2E Delayed Workflow","description":"Test with delay + transform"}')
WF_ID=$(echo "$WF" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "Workflow ID: $WF_ID"

# Add delay step
curl -s -X POST "$API/workflows/$WF_ID/steps" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"step_type":"delay","config":{"delay_seconds":3},"label":"Wait 3s","position_x":100,"position_y":100}' > /dev/null
echo "Step 1: Delay 3s"

# Add transform step
curl -s -X POST "$API/workflows/$WF_ID/steps" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"step_type":"transform","config":{"operation":"upper","field":"message"},"label":"To Upper","position_x":100,"position_y":250}' > /dev/null
echo "Step 2: Transform"

# Deploy
curl -s -X POST "$API/workflows/$WF_ID/deploy" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
echo "Deployed"

# Execute
echo "--- Execute ---"
EXEC=$(curl -s -X POST "$API/workflows/$WF_ID/execute" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"input":{"message":"hello e2e"}}')
echo "Execute response: $EXEC"
EXEC_ID=$(echo "$EXEC" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "Execution ID: $EXEC_ID"

# Wait for queue worker to process
echo "--- Wait for execution ---"
sleep 5

# Check execution status
echo "--- Execution Status ---"
curl -s "$API/executions/$EXEC_ID" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || echo "Failed to fetch execution"
