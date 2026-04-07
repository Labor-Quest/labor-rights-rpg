# === Build stage: compile React frontend ===
FROM node:20-alpine AS build

WORKDIR /app

# Install client deps (cached layer)
COPY client/package*.json ./client/
RUN cd client && npm ci --ignore-scripts

# Copy client source and build
COPY client/ ./client/
RUN cd client && npm run build

# === Production stage: lean runtime ===
FROM node:20-alpine

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install server production deps only (cached layer)
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

# Copy server code
COPY server/src/ ./server/src/

# Copy built client from build stage
COPY --from=build /app/client/dist ./client/dist

# Copy pre-generated scenario data
COPY data/scenarios/ ./data/scenarios/

ENV NODE_ENV=production
ENV PORT=8080

# Drop to non-root user
USER appuser

EXPOSE 8080

CMD ["node", "server/src/index.js"]
