# Use the official Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm nx build frontend-agents --configuration=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "nx", "serve", "frontend-agents", "--configuration=production"]
