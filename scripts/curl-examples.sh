#!/usr/bin/env bash
set -euo pipefail

TX_ID=${1:-11111111-1111-1111-1111-111111111111}

curl -s -X POST http://localhost:3000/api/transactions     -H "content-type: application/json"     -d "{"id":"$TX_ID","amount":100.5,"currency":"USD","timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}" | jq

sleep 1

curl -s http://localhost:3000/api/transactions/$TX_ID | jq
