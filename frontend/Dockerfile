# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

# Build Next.js (SWC compiles TS -> JS for Next code)
RUN pnpm build

# Compile OTEL manual (tsc → JS)
RUN pnpm otel   # creates dist-otel/instrumentation.js


# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy Next.js built app
COPY --from=builder /app ./

# Copy transpiled OTEL JS
COPY --from=builder /app/dist-otel/instrumentation.js ./instrumentation.js

# Use the JS file for auto-load
ENV NODE_OPTIONS="--require ./instrumentation.js"

EXPOSE 3000
CMD ["pnpm", "start"]
