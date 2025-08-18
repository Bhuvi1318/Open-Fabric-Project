# ---------- Build Stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install ALL dependencies (including devDeps, so tsc works)
RUN npm install --no-audit --no-fund

# Copy source and tsconfig
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript -> dist/
RUN npm run build


# ---------- Runtime Stage ----------
FROM node:20-alpine AS base
WORKDIR /app

# Copy only package files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install only production deps
RUN npm install --omit=dev --no-audit --no-fund

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV NODE_ENV=production

# Run built server.js
CMD ["node", "dist/server.js"]

