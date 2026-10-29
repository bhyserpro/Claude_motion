# ПЕРЕГОН

Анимационный мини-сериал: 5 серий × 3:00, 2.5D-вектор, всё нарисовано кодом на [Remotion](https://www.remotion.dev/) (React + TypeScript). Взрослый хоррор-детектив, 18+.

## Быстрый старт

```bash
npm install
npm run audio          # сгенерировать звук в public/audio (уже лежит в репозитории)
npm run studio         # Remotion Studio
```

Рендер:

```bash
npx remotion render Ep1 out/ep01.mp4 --codec h264 --crf 18      # … Ep2…Ep5
npx remotion render FullFilm out/peregon_full.mp4 --codec h264 --crf 18
./scripts/render_all.sh                                         # всё сразу
```

Рендер долгий (≈1–2 кадра/с на 4 ядрах), поэтому есть возобновляемый вариант — кусками по 900 кадров, которые переживают перезапуск машины:

```bash
python3 scripts/render_chunks.py render Ep3 Ep4 Ep5 ff --worker 0 --workers 2 &   # две очереди параллельно
python3 scripts/render_chunks.py render Ep3 Ep4 Ep5 ff --worker 1 --workers 2 &
python3 scripts/render_chunks.py assemble Ep3 Ep4 Ep5                            # покадрово точная склейка
python3 scripts/fullfilm_splice.py                                               # out/peregon_full.mp4
```

`fullfilm_splice.py` дорендеривает из композиции `FullFilm` только кадры, которые отличаются от отдельных серий (паузы вместо «РАНЕЕ», таймкоды без приписки, без карточек серий — ≈5300 кадров), и склеивает их с готовыми сериями покадрово. Честный рендер всех 27000 кадров — `npx remotion render FullFilm out/peregon_full.mp4 --codec h264 --crf 18` (или `FULL_RENDER=1 ./scripts/render_all.sh`); результат тот же.

В облачном контейнере SVG рисуется программно, и SwiftShader здесь в ~3 раза быстрее SwANGLE (`remotion.config.ts`).

Стоп-кадры для проверки (один бандл на все кадры, контактный лист):

```bash
node scripts/stills.mjs Ep3 /tmp/ep3 0,6,30,90,180,1:25,2:20
python3 scripts/contact.py /tmp/ep3/sheet.png /tmp/ep3/*.png
```

## Композиции

| ID | Длительность | Что это |
|---|---|---|
| `Ep1` … `Ep5` | 5400 кадров (3:00) | Серии. Пропс `{standalone}`: `true` — с блоком «РАНЕЕ» и карточкой серии |
| `FullFilm` | 27000 кадров (15:00) | Склейка через `<Series>`; «РАНЕЕ» и карточки заменены паузой-переходом (чёрный кадр, таймкод, гул), хуки остаются началами глав |
| `CharacterSheet` | still | Лист персонажей; пропс `section`: `all`, `heights`, `silhouettes`, `gleb`, `evolution`, `lights`, `blind`, `coat` |
| `Sandbox` | 300 кадров | Проверка параллакса, маски фонаря и декораций вагона |

## Устройство

```
src/
  config.ts              WIDTH/HEIGHT/FPS (вертикаль: поменять WIDTH и HEIGHT), летербокс 2.39:1
  theme/palette.ts       палитра
  lib/                   камера (2.5D, наезд/панорама/тряска), детерминированный шум, перспектива, шрифты, тайминг
  components/
    Stage25D.tsx         multiplane: слои с z, параллакс ∝ 1/z, туман по глубине (feColorMatrix)
    FX/                  зерно, виньетка, мерцание, ореолы, пыль, маска фонаря, сублиминальная вставка, трещины, летербокс
    Text/                монолог, реплики, таймкод, карандашные цифры, бланк «АКТ ОСМОТРА», хук, карточка
    Characters/          риг и все персонажи по PEREGON_characters.md (свет warm/emergency/flashlight/silhouette, LOD 0–2)
    Props/               вагон (сбоку и вдоль), туннель, гермозатвор, вентшахта, проход, кабина, город, дозиметр, блокнот, ампулы
  episodes/
    common/              «плёнка» серии, РАНЕЕ, пауза-переход, звук, крупные планы, общие декорации
    ep1 … ep5/           timing.ts (все длительности), scenes/*.tsx, index.tsx
scripts/gen_audio.py     синтез звука (numpy + scipy) + моменты щелчков дозиметра для синхронного индикатора
```

Правила, которые соблюдены во всём коде: анимация только от `useCurrentFrame()` (`interpolate` / `spring` / `Easing`), случайность только через `random(seed)`, шрифты (PT Serif, JetBrains Mono, Caveat — кириллица) через `@remotion/google-fonts` и `delayRender`, одно полноэкранное зерно на кадр, размытие — статичное на слой.

Длительности каждой серии проверяются при загрузке (`assertTiling` в `timing.ts`): сцены идут без зазоров и в сумме дают ровно 5400 кадров.

## Звук

Музыки нет. `scripts/gen_audio.py` синтезирует: стыки рельсов, гул туннеля 35–60 Гц, щелчки дозиметра (пуассоновский процесс: 0,5 / 2 / 8 / 40 / 200 в секунду), инфразвуковой удар с треском стекла, стук под полом, гудок электропоезда, сердцебиение, дыхание (в том числе «не с той стороны» — стерео), скрежет, радиошум оповещения и несколько служебных звуков. Индикатор на дозиметре мигает в те же моменты, что и щелчки в звуке (`src/audio/geigerTimes.json`).
