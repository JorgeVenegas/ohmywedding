#!/bin/bash
# Backup local Supabase database
# Usage: ./scripts/backup-local-db.sh [optional-label]
# Creates a timestamped SQL dump in .local-backups/

set -euo pipefail

BACKUP_DIR=".local-backups"
LABEL="${1:-manual}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/backup_${TIMESTAMP}_${LABEL}.sql"

# Ensure backup directory exists and is gitignored
mkdir -p "$BACKUP_DIR"
if ! grep -q ".local-backups" .gitignore 2>/dev/null; then
  echo ".local-backups/" >> .gitignore
  echo "Added .local-backups/ to .gitignore"
fi

# Check if Supabase is running
if ! docker ps --format '{{.Names}}' | grep -q "supabase_db_ohmywedding"; then
  echo "Error: Supabase DB container is not running. Start it with 'npx supabase start'"
  exit 1
fi

echo "Backing up local Supabase database..."

# Dump only the public schema data (structure comes from migrations)
docker exec supabase_db_ohmywedding pg_dump \
  -U postgres \
  -d postgres \
  --schema=public \
  --data-only \
  --no-owner \
  --no-privileges \
  --no-comments \
  --disable-triggers \
  > "$FILENAME"

# Check if dump was successful and non-empty
if [ -s "$FILENAME" ]; then
  SIZE=$(du -h "$FILENAME" | cut -f1)
  echo "✅ Backup saved: $FILENAME ($SIZE)"
  
  # Keep only last 10 backups
  ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
  echo "📁 Backups in $BACKUP_DIR: $(ls "$BACKUP_DIR"/backup_*.sql 2>/dev/null | wc -l | tr -d ' ')"
else
  echo "❌ Backup failed or empty"
  rm -f "$FILENAME"
  exit 1
fi
