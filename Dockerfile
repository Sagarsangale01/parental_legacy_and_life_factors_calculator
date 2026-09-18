# Stage 1: Build React Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build Express Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Final Production Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY server/package*.json ./
RUN npm ci --only=production

# Copy compiled backend and built frontend bundle
COPY --from=server-builder /app/server/dist ./dist
COPY --from=client-builder /app/client/dist ./public

EXPOSE 5000

CMD ["node", "dist/server.js"]
