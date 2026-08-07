FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
FROM ghcr.io/pnpm/pnpm:11
RUN pnpm runtime set node 22 -g
WORKDIR /app
COPY . .
ENV CI=true
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
# FROM base AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .
# RUN pnpm build
#
# # Production image, copy all files and run Next.js
# FROM base AS runner
# WORKDIR /app
# ENV NODE_ENV=production
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["pnpm", "start"]
