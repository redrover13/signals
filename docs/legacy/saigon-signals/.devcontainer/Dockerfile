# Start from the official Node.js image with TypeScript support
FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Switch to root for installation
USER root

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    curl \
    gnupg \
    lsb-release \
    apt-transport-https \
    ca-certificates \
    git

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get -y install gh

# Install Google Cloud SDK
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
    && apt-get update -y \
    && apt-get install -y google-cloud-sdk

# Install pnpm globally
RUN npm install -g pnpm@latest

# Switch back to non-root user
USER node

# Set shell for pnpm
ENV SHELL=/bin/bash

# Set up pnpm in the user's home directory
RUN pnpm setup

# Add pnpm to PATH
ENV PATH="/home/node/.local/share/pnpm:${PATH}"
ENV PNPM_HOME="/home/node/.local/share/pnpm"

# Create working directory
WORKDIR /workspaces/saigon-signals
