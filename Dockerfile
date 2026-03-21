# Use Debian-based Node for better compatibility and "real" npx/npm
FROM node:20-bookworm-slim AS base

# Install openssl (needed for Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci


FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=10000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# 1. Copy the standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 2. CRITICAL: Copy ALL node_modules from builder so reset-admin.js has bcryptjs
# and entrypoint.sh has the prisma binary.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/reset-admin.js ./reset-admin.js
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# 3. Fix Home Directory Permissions for npm/npx cache
RUN mkdir -p /home/nextjs/.npm && chown -R nextjs:nodejs /home/nextjs

# 4. Copy and fix entrypoint
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 10000

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]