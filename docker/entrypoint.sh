#!/bin/sh
# Runs as root only long enough to make the upload directory writable (important when a
# platform mounts a volume there), then drops to the unprivileged app user.
set -e

UPLOAD_DIR="${USER_PROFILE_UPLOAD_DIR:-/app/uploads/user/profile}"
mkdir -p "$UPLOAD_DIR"
chown -R pocketwise:pocketwise "$UPLOAD_DIR"

exec su-exec pocketwise java ${JAVA_OPTS:-} -XX:MaxRAMPercentage="${MAX_RAM_PERCENTAGE:-70}" -jar /app/app.jar
