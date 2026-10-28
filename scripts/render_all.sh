#!/usr/bin/env bash
# Финальный рендер всех серий и полного фильма.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
for i in 1 2 3 4 5; do
  npx remotion render "Ep$i" "out/ep0$i.mp4" --codec h264 --crf 18 --log=error
  echo "Ep$i done $(date +%T)"
done
npx remotion render FullFilm out/peregon_full.mp4 --codec h264 --crf 18 --log=error
echo "FullFilm done $(date +%T)"
