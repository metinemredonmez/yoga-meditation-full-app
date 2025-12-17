# Build stage (dev deps dahil)
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# prisma
COPY prisma ./prisma
RUN npx prisma generate

# kaynak kod
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# yalnız prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# çıktılar
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# non-root
RUN addgroup -g 1001 -S nodejs && adduser -S yoga -u 1001
USER yoga

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
