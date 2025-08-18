# High-Performance Transaction Processing Service

## Setup Instructions

### 1. Start the Mock Posting Service (port 8080)
```bash
node mock-posting-service.cjs
```
### 2. Start Redis (port 6379)
```bash
docker run -d --name hptps-redis -p 6379:6379 redis:latest
```
### 3. Start the API Server (port 3000)
```bash
npm run dev
```

### 4. Start the Worker
```bash
npm run worker
```

## How to Run the Service
Run the API service (terminal A):
```bash
npm run dev
```

Run the worker service (terminal B):
```bash
npm run worker
```

### API Examples with curl Commands

Submit a transaction

```bash
Invoke-RestMethod -Method POST "http://localhost:3000/api/transactions" `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body '{ "id": "11111111-1111-1111-1111-111111111111", "amount": 500, "currency": "USD", "description": "Laptop Purchase", "timestamp": "2025-08-18T10:30:00Z" }'
```
1) Output:

<img width="1416" height="931" alt="Screenshot 2025-08-16 233314" src="https://github.com/user-attachments/assets/cc0b0b88-3c2c-4ade-b382-bed30fb73e86" />


Check transaction status
```bash  Invoke-RestMethod -Method GET "http://localhost:3000/api/transactions/11111111-1111-1111-1111-111111111111"
```
2) output:

<img width="1548" height="997" alt="Screenshot 2025-08-16 233359" src="https://github.com/user-attachments/assets/f87ad4b8-96dd-41ff-a644-f7c21ac04750" />


Health check
```bash
Invoke-RestMethod -Method GET "http://localhost:3000/api/health"
```
3) output:

<img width="1707" height="972" alt="Screenshot 2025-08-18 112026" src="https://github.com/user-attachments/assets/c7e74140-f6a0-4bce-a91f-eb4a30095642" />


