FROM node:20-alpine AS build

WORKDIR /app

# Install client deps and build
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# --- Production stage ---
FROM node:20-alpine

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install server production deps only
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built client from build stage
COPY --from=build /app/client/dist ./client/dist

# Copy pre-generated data
COPY data/ ./data/

ENV NODE_ENV=production
ENV PORT=8080

# Drop to non-root user
USER appuser

EXPOSE 8080

CMD ["node", "server/src/index.js"]
