FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy package.json and related files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json tsconfig.base.json jest.config.ts jest.preset.js ./

# Copy app source
COPY apps/api ./apps/api
COPY libs ./libs

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the API application
RUN pnpm nx build api

# Create production image
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm@10

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/api ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "main.js"]
