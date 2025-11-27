# Frontend Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
COPY frontend/pnpm-lock.yaml* ./

# Copy production dependencies
COPY frontend/node_modules ./node_modules

# Copy build output
COPY frontend/.next ./.next

# Copy public assets
COPY frontend/public ./public

EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "run", "start"]