# ── Development stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS development

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Cache npm packages layer separately
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]

# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /server

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /server/dist ./dist

EXPOSE $PORT

CMD ["node", "dist/interfaces/http/server.js"]
