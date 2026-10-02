# syntax=docker/dockerfile:1

# Build images for the demo backends. --target selects which one:
#
#   docker build --target issuer-be   -t dtk-demo-issuer-be   .
#   docker build --target verifier-be -t dtk-demo-verifier-be .
#
# Config comes from the environment; see the app's .env.example.
# Listens on PORT, default 3200 (issuer) / 3201 (verifier).

ARG NODE_IMAGE=node:22-alpine

# ==================================================================================
# BASE — the workspace as it comes out of git, plus the script both builders run
# ==================================================================================

FROM ${NODE_IMAGE} AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /app

RUN corepack enable

COPY . ./

COPY --chmod=755 <<'SCRIPT' /usr/local/bin/build-app
#!/bin/sh
set -eu
app_dir=$1

# --prod only unlinks devDependencies — their files stay in node_modules/.pnpm — so wipe
# and reinstall instead. Packages come from the pnpm store, not the network.
pnpm install --frozen-lockfile --filter "{./${app_dir}}..." --filter "{.}"
pnpm --dir "${app_dir}" build
rm -rf node_modules "${app_dir}/node_modules"
pnpm install --prod --frozen-lockfile --filter "{./${app_dir}}..." --filter "{.}"
SCRIPT

# ==================================================================================
# BUILDERS — one per app, so each image gets only its own dependencies.
# APP_DIR is the only difference between them.
# ==================================================================================

FROM base AS issuer-build

ARG APP_DIR=apps/issuer-demo/be

RUN --mount=type=cache,id=pnpm,target=/pnpm/store build-app "${APP_DIR}"

FROM base AS verifier-build

ARG APP_DIR=apps/verifier-demo/be

RUN --mount=type=cache,id=pnpm,target=/pnpm/store build-app "${APP_DIR}"

# ==================================================================================
# RUNTIMES — the two build targets
# ==================================================================================

FROM ${NODE_IMAGE} AS issuer-be

ARG APP_DIR=apps/issuer-demo/be

ENV NODE_ENV=production

WORKDIR /app

# The app's node_modules are relative symlinks up into /app/node_modules, so the app has
# to keep the same path it had in the builder.
COPY --from=issuer-build --chown=node:node /app/node_modules ./node_modules
COPY --from=issuer-build --chown=node:node /app/${APP_DIR} ./${APP_DIR}

WORKDIR /app/${APP_DIR}

EXPOSE 3200

USER node

CMD ["node", "dist/server.js"]

FROM ${NODE_IMAGE} AS verifier-be

ARG APP_DIR=apps/verifier-demo/be

ENV NODE_ENV=production

WORKDIR /app

COPY --from=verifier-build --chown=node:node /app/node_modules ./node_modules
COPY --from=verifier-build --chown=node:node /app/${APP_DIR} ./${APP_DIR}

WORKDIR /app/${APP_DIR}

EXPOSE 3201

USER node

CMD ["node", "dist/server.js"]
