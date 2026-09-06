FROM node:22-alpine AS development

WORKDIR /application

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]

# FROM node:22-alpine AS build

# WORKDIR /application

# COPY package*.json ./
# RUN npm ci

# COPY . .
# RUN npm run build

# FROM nginx:1.27-alpine AS production

# COPY --from=build /application/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]


# ── Production stage ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY --from=build /application/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Solución para Render: Inyectar dinámicamente el puerto antes de arrancar Nginx
CMD ["/bin/sh", "-c", "sed -i 's/listen [0-9]*;/listen '\"$PORT\"';/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
