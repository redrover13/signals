# Base stage for building the application
FROM node:18-alpine AS builder

# Add labels
LABEL maintainer="Dulce de Saigon Engineering <engineering@dulcedesaigon.com>"
LABEL description="Dulce de Saigon Agent Frontend"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package.json and related files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY agent-frontend/package.json ./agent-frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Build the agent-frontend app
RUN pnpm nx build agent-frontend --prod

# Production stage
FROM nginx:stable-alpine AS production

# Add security headers to nginx
RUN echo 'add_header X-Content-Type-Options "nosniff";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header X-Frame-Options "DENY";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header Referrer-Policy "strict-origin-when-cross-origin";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header Content-Security-Policy "default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; connect-src \'self\' https://api.dulcedesaigon.com;";' >> /etc/nginx/conf.d/default.conf

# Copy the nginx configuration
COPY agent-frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built application
COPY --from=builder /app/dist/agent-frontend /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
