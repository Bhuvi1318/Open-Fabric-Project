 # OpenFabric: Transaction Mock Service

This repository demonstrates a mock transaction posting service with worker processing and k6 load testing.

---

## Prerequisites

1. **Docker installed**  
   Required for mock service and Redis (optional).

2. **Node.js & npm installed**  
   Verify Node:  
   ```powershell
   node -v
   npm -v
   ```

3. **k6 installation**
   ```powershell
   choco install k6
   ```
   and
   ```powershell
   k6 version
   ```

## Step 1: Start Docker containers
Start Redis (if needed by worker):
```powershell
docker run -d --name redis -p 6379:6379 redis
```

Start the mock posting service:
```powershell
docker run -d --name mock-api -p 3000:8080 vinhopenfabric/mock-posting-service
```

Verify running containers:
```powershell
docker ps
```

##  Step 2: Start the worker
```powershell
npm run worker
```

## Submit a transaction manually (PowerShell)
```powershell
$baseUrl = "http://localhost:3000"
$transactionId = "tx-101"
$submittedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$transaction = @{
    id = $transactionId
    amount = 250
    currency = "USD"
    description = "Test"
    timestamp = $submittedAt
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/transactions" `
  -Method POST `
  -ContentType "application/json" `
  -Body $transaction `
  -UseBasicParsing

Write-Host "Transaction submitted. ID: $transactionId, Status: pending"
```
Check stored transaction:
```powershell
# ---------- Simulate worker processing ----------
Start-Sleep -Seconds 5  # simulate processing delay

$completedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Simulate status update
$transactionResponse = @{
    transactionId = $transactionId
    status        = "completed"       # can also be "processing" or "failed"
    submittedAt   = $submittedAt
    completedAt   = $completedAt
    error         = $null             # populate string if failed
} | ConvertTo-Json

Write-Host "Transaction processed:"
Write-Host $transactionResponse
```

Check service health:
```powershell
# ---------- List metrics ----------
$metrics = @{
    queueDepth  = 0
    errorRate1m = 0
} | ConvertTo-Json

Write-Host "Metrics:"
Write-Host $metrics
```

Stored transaction in mock service:
```powershell
# ---------- Get transaction from mock service ----------
$mockTransaction = Invoke-RestMethod -Uri "$baseUrl/transactions/$transactionId"
Write-Host "Stored transaction in mock service:"
$mockTransaction | Format-List
```

## Sample output:

<img width="1099" height="1066" alt="Screenshot 2025-08-19 104003" src="https://github.com/user-attachments/assets/9f3c6426-9af4-45d8-bc89-d315137b7a0d" />


## Step 4: Run k6 load test

```powershell
k6 run k6-load.js
```







