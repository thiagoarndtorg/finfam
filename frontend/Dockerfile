# Frontend Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy package files (build context is already ./frontend)
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Copy production dependencies
COPY node_modules ./node_modules

# Copy build output
COPY .next ./.next

# Copy public assets
COPY public ./public

EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "run", "start"]