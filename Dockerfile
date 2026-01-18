# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build frontend and transpile server
RUN npm run build

# Stage 2: Production runner
FROM node:20-slim

WORKDIR /app

# Copy built assets and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/db ./db
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Entrypoint: run migrations and then start the server
# Note: tsx is needed for db:migrate since it runs a .ts file.
# We'll install it as a production dependency for the migration step or use a pre-transpiled migration script.
# For simplicity here, we'll install tsx.
RUN npm install -g tsx

CMD npm run db:migrate && npm run start
