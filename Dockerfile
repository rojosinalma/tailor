# The showcase site as a static image.
FROM oven/bun:1.4.3 AS build
WORKDIR /src
COPY package.json bun.lock bunfig.toml ./
COPY core/package.json core/
COPY react/package.json react/
COPY html/package.json html/
COPY cli/package.json cli/
COPY showcase/package.json showcase/
COPY checks/package.json checks/
RUN bun install --frozen-lockfile
COPY . .
RUN bin/build

FROM nginxinc/nginx-unprivileged:1.27-alpine
LABEL org.opencontainers.image.source="https://github.com/rojosinalma/tailor" \
      org.opencontainers.image.description="tailor: the showcase of every shell, component, skin and palette" \
      org.opencontainers.image.licenses="MIT"
COPY --from=build /src/showcase/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
