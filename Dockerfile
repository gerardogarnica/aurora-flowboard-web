# ─── Stage 1: Build de Vite ─────────────────────────────────
FROM node:24-alpine AS build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
WORKDIR /app

# Habilita pnpm vía Corepack (incluido en la imagen de Node)
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate

# Cache de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ─── Stage 2: Nginx sirviendo estáticos ────────────────────
FROM nginx:1.27-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
