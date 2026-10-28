#!/usr/bin/env bash
# Финальный рендер всех серий и полного фильма (две очереди параллельно — по ядрам).
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
render() { npx remotion render "$1" "$2" --codec h264 --crf 18 > "out/$1.log" 2>&1 && echo "$1 done $(date +%T)" || echo "$1 FAILED $(date +%T)"; }
( render Ep1 out/ep01.mp4; render Ep3 out/ep03.mp4; render Ep5 out/ep05.mp4 ) &
( render Ep2 out/ep02.mp4; render Ep4 out/ep04.mp4 ) &
wait
# FullFilm: по умолчанию — дорендер только отличающихся кадров и точная склейка (в ~5 раз быстрее);
# FULL_RENDER=1 — честный рендер всех 27000 кадров композиции FullFilm.
if [ "${FULL_RENDER:-0}" = "1" ]; then
  render FullFilm out/peregon_full.mp4
else
  python3 scripts/fullfilm_splice.py > out/FullFilm.log 2>&1 && echo "FullFilm done $(date +%T)" || echo "FullFilm FAILED $(date +%T)"
fi
echo "ALL done $(date +%T)"
