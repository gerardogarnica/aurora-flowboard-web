# ─── Stage 1: Build de Vite ─────────────────────────────────
FROM node:24-alpine AS build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_APP_ENV
ENV VITE_APP_ENV=$VITE_APP_ENV
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
ARG VITE_API_BASE_URL
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf

# La CSP solo permite conexiones al propio origen y al de la API: se toma el origen
# (esquema + host + puerto) de VITE_API_BASE_URL. Una URL relativa (/api) es del
# mismo origen y no agrega nada. `nginx -t` hace fallar el build si la config quedó mal.
RUN api_origin=$(printf '%s' "$VITE_API_BASE_URL" | sed -nE 's#^(https?://[^/]+).*#\1#p') \
 && sed -i "s#__API_ORIGIN__#${api_origin:+ $api_origin}#" /etc/nginx/snippets/security-headers.conf \
 && nginx -t

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
