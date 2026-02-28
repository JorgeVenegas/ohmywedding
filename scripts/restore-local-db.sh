#!/bin/bash
# Restore local Supabase database from a backup
# Usage: ./scripts/restore-local-db.sh <backup-file>
# Example: ./scripts/restore-local-db.sh .local-backups/backup_20260228_120000_manual.sql

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup-file>"
  echo ""
  echo "Available backups:"
  ls -lt .local-backups/backup_*.sql 2>/dev/null | awk '{print "  " $NF " (" $5 " bytes, " $6 " " $7 " " $8 ")"}' || echo "  No backups found"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Check if Supabase is running
if ! docker ps --format '{{.Names}}' | grep -q "supabase_db_ohmywedding"; then
  echo "Error: Supabase DB container is not running. Start it with 'npx supabase start'"
  exit 1
fi

echo "⚠️  This will overwrite current data in all public tables."
read -p "Continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo "Restoring from: $BACKUP_FILE"

# Restore the data
docker exec -i supabase_db_ohmywedding psql -U postgres -d postgres < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Database restored successfully from $BACKUP_FILE"
else
  echo "❌ Restore failed. Check the backup file for errors."
  exit 1
fi
