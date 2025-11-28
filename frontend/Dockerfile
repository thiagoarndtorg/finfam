# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/pnpm-lock.yaml pnpm-lock.yaml

RUN npm install -g pnpm \
 && pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "start"]
