# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# ---- Next Variables ----
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm \
 && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm \
 && pnpm install --prod --frozen-lockfile


COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "start"]