#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIRECTORY="${SCRIPT_DIRECTORY}/backups"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "${BACKUP_DIRECTORY}"
cd "${SCRIPT_DIRECTORY}"

docker compose exec -T postgres sh -c \
  'pg_dump --format=custom --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
  > "${BACKUP_DIRECTORY}/wingerx-${TIMESTAMP}.dump"

find "${BACKUP_DIRECTORY}" -type f -name 'wingerx-*.dump' -mtime +7 -delete

echo "Created ${BACKUP_DIRECTORY}/wingerx-${TIMESTAMP}.dump"
