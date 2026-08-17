#!/bin/bash
# Compress background videos for web delivery.
# Target: 720p max, CRF 28, H.264, faststart.
# Compresses in place — originals are overwritten after verification.

set -e
cd "$(dirname "$0")/.."

VIDEOS_DIR="public/videos"
TEMP_DIR="public/videos/_compressed"
mkdir -p "$TEMP_DIR"

compress() {
  local src="$1"
  local filename=$(basename "$src")
  local dest="$TEMP_DIR/$filename"

  local orig_bytes=$(stat -f%z "$src" 2>/dev/null || stat -c%s "$src")
  echo "→ $filename ($(( orig_bytes / 1024 / 1024 ))MB)..."

  ffmpeg -y -i "$src" \
    -c:v h264_videotoolbox \
    -b:v 1500k \
    -vf "scale='min(1280,iw)':-2" \
    -movflags +faststart \
    -an \
    "$dest" 2>/dev/null

  local new_bytes=$(stat -f%z "$dest" 2>/dev/null || stat -c%s "$dest")
  local saved=$(( (orig_bytes - new_bytes) * 100 / orig_bytes ))
  echo "  $(( orig_bytes / 1024 / 1024 ))MB → $(( new_bytes / 1024 / 1024 ))MB  (-${saved}%)"
}

# Process largest files first for max early impact
for f in $(ls -S "$VIDEOS_DIR"/vid*.mp4); do
  compress "$f"
done

echo ""
echo "All done — moving compressed files to $VIDEOS_DIR..."
mv "$TEMP_DIR"/*.mp4 "$VIDEOS_DIR"/
rmdir "$TEMP_DIR"
echo "Complete."
