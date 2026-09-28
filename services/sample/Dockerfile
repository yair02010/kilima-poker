# syntax=docker/dockerfile:1.7
# Service image (KP-OPS-01 §3 stage 6): build the bundle with the full workspace, ship only the
# bundle on a distroless Node 24 base running as non-root. Build context: repository root.
#   docker build -f services/sample/Dockerfile -t kilima/sample .

ARG NODE_IMAGE=node:24-bookworm-slim
ARG RUNTIME_IMAGE=gcr.io/distroless/nodejs24-debian12:nonroot

FROM ${NODE_IMAGE} AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable
WORKDIR /repo
# Dependency layer first for caching: manifests only.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/eslint-plugin-kilima/package.json packages/eslint-plugin-kilima/
COPY services/sample/package.json services/sample/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@kilima/sample..." --filter kilima-poker
COPY tsconfig.base.json ./
COPY tools/build-service.ts tools/
COPY packages/shared packages/shared
COPY services/sample services/sample
RUN pnpm --filter @kilima/sample build

FROM ${RUNTIME_IMAGE}
ARG BUILD_VERSION=0.0.0-dev
ARG BUILD_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV NODE_ENV=production \
    SERVICE_NAME=sample \
    HTTP_PORT=8080 \
    METRICS_PORT=9464 \
    BUILD_VERSION=${BUILD_VERSION} \
    BUILD_COMMIT=${BUILD_COMMIT} \
    BUILD_TIME=${BUILD_TIME}
WORKDIR /app
COPY --from=build /repo/services/sample/dist/ ./
USER nonroot
EXPOSE 8080 9464
# Distroless has no shell or curl: liveness/readiness come from Kubernetes probes on /healthz and /readyz.
CMD ["--enable-source-maps", "main.mjs"]
