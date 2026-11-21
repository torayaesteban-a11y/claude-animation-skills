#!/usr/bin/env bash
set -euo pipefail
output=${1:-Le-dernier-bus-03h00.mp4}
ffmpeg -hide_banner -loglevel error -y -filter_threads 2 \
  -i silent.mp4 -i mix.wav -map 0:v -map 1:a \
  -vf 'scale=1080:1920:flags=lanczos:out_range=tv,vignette=PI/5,ass=captions.ass' \
  -c:v libx264 -threads 3 -preset fast -crf 19 -profile:v high -pix_fmt yuv420p \
  -color_range tv -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -af 'loudnorm=I=-16:TP=-1.5:LRA=10' -ar 48000 -c:a aac -b:a 192k \
  -metadata:s:a:0 language=fra -movflags +faststart -t 45 "$output"
