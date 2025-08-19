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
   k6 version```

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

## Step 3: Run k6 load test

```powershell
k6 run k6-load.js
```







