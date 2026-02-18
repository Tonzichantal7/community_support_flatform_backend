# =========================
# Build Stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install ALL dependencies (including dev for TypeScript build)
RUN npm ci

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build


# =========================
# Production Stage
# =========================
FROM node:20-alpine

WORKDIR /app

# Copy only package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Expose app port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production

# Start app
CMD ["node", "dist/server.js"]
