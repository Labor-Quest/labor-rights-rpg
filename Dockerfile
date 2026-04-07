FROM node:20-alpine

WORKDIR /app

# Install server deps
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Install client deps and build
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Copy pre-generated data
COPY data/ ./data/

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/src/index.js"]
