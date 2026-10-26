# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# 1. Build the React SPA
# ---------------------------------------------------------------------------
FROM node:20-alpine AS frontend

WORKDIR /app
# Don't fail the build on ESLint warnings (CRA treats them as errors when CI=true)
ENV CI=false

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
# Same-origin deployment: the SPA calls /api on the host that serves it
ARG REACT_APP_API_BASE_URL=/api
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
RUN npm run build

# ---------------------------------------------------------------------------
# 2. Build the Spring Boot jar with the SPA bundled into classpath:/static
# ---------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS backend

WORKDIR /app
COPY backend/pom.xml ./
COPY backend/src ./src
COPY --from=frontend /app/build ./src/main/resources/static

RUN mvn -B -q -DskipTests package

# ---------------------------------------------------------------------------
# 3. Runtime (single container: SPA + REST API)
# ---------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache su-exec \
    && addgroup -S pocketwise \
    && adduser -S pocketwise -G pocketwise \
    && mkdir -p /app/uploads/user/profile \
    && chown -R pocketwise:pocketwise /app

COPY --from=backend /app/target/*.jar /app/app.jar
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod 755 /app/entrypoint.sh

ENV SPRING_PROFILES_ACTIVE=prod \
    USER_PROFILE_UPLOAD_DIR=/app/uploads/user/profile \
    PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/actuator/health" >/dev/null 2>&1 || exit 1

# The entrypoint starts as root, fixes ownership of the upload directory (needed when
# the platform mounts a volume there) and then execs the JVM as `pocketwise`.
ENTRYPOINT ["/app/entrypoint.sh"]
