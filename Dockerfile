# Build context: repository root. Image updates are explicit digest changes.
FROM node@sha256:be979e5523c76fa4d5ca4ebd3099078f220aa47ec39c48ad5b5df9314debd6eb AS build
WORKDIR /app
ENV CI=true
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
COPY moneysheetFE/package.json moneysheetFE/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY moneysheetFE/ ./
RUN pnpm build

FROM caddy@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0 AS runtime
# The official Caddyfile serves this root. BE #22 mounts the production config.
RUN rm -rf /usr/share/caddy/*
COPY --from=build /app/dist/ /usr/share/caddy/
