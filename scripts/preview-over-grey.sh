#!/usr/bin/env bash
# Flatten a transparent render over the dark grey the graphics actually sit on.
# The review checkerboard consistently overstates faint elements; judge here.
set -euo pipefail
src="$1"
dst="${src%.mov}-preview.mp4"
probe() {
  ffprobe -v error -select_streams v:0 -show_entries "stream=$1" \
    -of default=nw=1:nk=1 "$src"
}
w="$(probe width)"
h="$(probe height)"
fps="$(probe r_frame_rate)"
ffmpeg -y -loglevel error \
  -f lavfi -i "color=c=0x141414:s=${w}x${h}:r=${fps}" \
  -i "$src" \
  -filter_complex "[0][1]overlay=shortest=1,format=yuv420p" \
  -c:v libx264 -crf 20 -movflags +faststart "$dst"
echo "$dst"
