# Playwright's official image ships Chromium's system dependencies pre-installed — avoids
# hand-maintaining the apt-get list (~20 packages) that headless Chromium actually needs.
# Version pinned to match the installed `playwright` npm package (see package.json) — a
# mismatch here is the most common cause of "Executable doesn't exist" at runtime.
FROM mcr.microsoft.com/playwright:v1.61.0-noble AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Playwright's own browsers ship in the base image at this path — standalone output only
# copies what Next.js's dependency trace finds, which doesn't include the browser binary.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
