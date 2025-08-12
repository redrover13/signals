# Use the official Node.js 20 image as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN npm install -g pnpm && pnpm install --prod

# Copy the rest of the application's source code
COPY . .

# Build the api application
RUN pnpm nx build api

# Expose the port the app runs on
EXPOSE 3000

# Start the agents application
CMD ["node", "dist/apps/api/main.js"]