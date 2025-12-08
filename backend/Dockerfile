# TechBuddy Backend Dockerfile
# Node.js 18 LTS - Full version (not Alpine) for Prisma compatibility

FROM node:18-slim

# Install OpenSSL and other dependencies required by Prisma
RUN apt-get update -y && apt-get install -y openssl libssl-dev ca-certificates wget && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for prisma)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 3000

# Start with migration script
CMD ["./start.sh"]
