# syntax=docker/dockerfile:1

# ── Stage 1: install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# --no-audit skips the audit network call (avoids failures on audit advisories)
# --no-fund suppresses funding messages
RUN npm ci --no-audit --no-fund

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (needs schema only, not the DB)
RUN npx prisma generate

# Build Next.js — NEXT_PUBLIC_ vars are baked in at build time.
# Non-secret: safe to pass as build args.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build && mkdir -p /app/public

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# PORT is intentionally not set here — Railway injects it at runtime.
# HOSTNAME must be 0.0.0.0 so the server accepts connections from outside the container.
ENV HOSTNAME=0.0.0.0

# Only copy what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Secrets (DATABASE_URL, NEXTAUTH_SECRET, etc.) are injected by Railway at
# runtime only — never baked into the image.
# next start -p uses Railway's $PORT; falls back to 3000 locally.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
