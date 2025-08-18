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
