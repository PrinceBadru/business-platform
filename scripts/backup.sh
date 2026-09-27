#!/bin/bash
set -e

# Backup directory
BACKUP_DIR="/backups/postgres"
mkdir -p "$BACKUP_DIR"

# File name with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/nexus_finance_$TIMESTAMP.sql.gz"

echo "Starting database backup to $FILENAME..."

# Ensure we have the DB URL (will be passed from env)
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set"
  exit 1
fi

# Run pg_dump and compress
pg_dump "$DATABASE_URL" | gzip > "$FILENAME"

echo "Backup complete: $FILENAME"

# Optional: keep only the last 7 days of backups
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;
echo "Cleaned up old backups."
