# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy only package.json & package-lock.json first
COPY package*.json ./

# Install deps fresh inside container (Linux-compatible binaries)
RUN npm install

# Copy rest of the code (but NOT node_modules from host)
COPY . .

# Rebuild esbuild (important fix)
RUN npm rebuild esbuild

# Start app
CMD ["npm", "run", "dev"]
