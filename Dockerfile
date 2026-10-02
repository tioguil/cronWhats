FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends chromium fonts-liberation ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app ./
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EXPOSE 3000
CMD ["npm", "start"]
