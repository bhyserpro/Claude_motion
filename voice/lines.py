"""
Текст озвучки «ПЕРЕГОН» (PEREGON_voice.md, §2.3 и §4) — единственный источник для генерации, обработки и проверки.

Line:
  id, ep        — E1-01 …, серия
  win           — окно в серии, секунды (начало, конец) — тайм-код из сценария
  who           — персонаж (ключ CHARACTERS)
  fx            — обработка: DRY, CAR, CAR_DARK, TUNNEL, SHAFT, CAB, INTERCOM, RADIO_INTERCOM, STREET_PA, TSS
  level         — манера для нормализации (§5.3): whisper −7, quiet −3, normal 0, raised +2, shout +4 дБ
  text          — текст с тегами, как он уходит в модель
  new           — (+) новая реплика (есть и в субтитрах)
  chain         — монолог Глеба: генерировать по порядку с previous_request_ids
  reuse         — не генерировать, взять файл другой реплики
  cut_frames    — жёсткий срез на столько кадров раньше конца генерации
  choke_frames  — в конце голос глохнет: ФНЧ за столько кадров, затем срез
  variants      — сколько вариантов сгенерировать для выбора на слух
  dialogue      — группа для Text to Dialogue (одна генерация, потом разрезать)
  duck          — приглушать фон под репликой
  scene, pos    — привязка к картинке: первое произнесённое слово звучит через pos секунд от начала сцены
                  (id сцены из src/episodes/epN/timing.ts). Без scene реплика стоит в начале окна win.
  prio          — новые реплики патча №1 (ID с N): P1 → P2 → P3, по ним идёт генерация при нехватке символов
  gain_db       — поправка громкости сверх манеры
  at            — {слово: секунды от начала сцены}: перед словом вставляется тишина, чтобы оно попало
                  на нужный кадр (цифра на стене, смена плана). Только удлиняет паузы.
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Character:
    key: str
    name: str
    f0: tuple  # целевой диапазон средней частоты основного тона, Гц
    design: str  # описание для Voice Design (английский)
    test: str  # тестовая сцена роли
    search: dict = field(default_factory=dict)  # фильтры поиска в библиотеке голосов
    stability: float = 0.45
    base_lufs: float = -19.0


CHARACTERS = {
    c.key: c
    for c in [
        Character(
            'gleb', 'Глеб Сомов', (95, 115),
            'Russian male, early 40s, native Russian speaker with a neutral Moscow accent. Low baritone with warm chest resonance '
            'and a natural rough, gravelly texture, like a tired former smoker who rarely raises his voice. Slow, deliberate, '
            'intimate delivery close to the microphone, dry and quietly ironic. Film-noir detective narrator. Clean studio '
            'recording, no reverb, no background noise.',
            '[low, tired, close to the mic] Двадцать лет я оцениваю убытки. Пожар, потоп, авария. Я прихожу после... и считаю, '
            'что осталось. [pause] [barely above a whisper] Четырнадцать. Я всегда считаю. [firm, raised voice] Тихо! Все замолчите!',
            {'gender': 'male', 'age': 'middle_aged', 'use_cases': 'narrative_story', 'search': 'deep raspy calm narrator'},
            stability=0.55, base_lufs=-18.0,
        ),
        Character(
            'nina', 'Нина Ведерникова', (165, 200),
            'Russian female, mid-30s, native Russian speaker. Soft, low, warm alto with a calm, even, clinical bedside manner. '
            'Very controlled and unhurried, never raises her voice; gentle but emotionally distant. Clear diction. Clean studio '
            'recording, no reverb.',
            '[calm, gentle] Это ещё ничего. Сидите спокойно, хорошо? [pause] [soft, almost tender] Мне жаль. Я хотела, чтобы ты '
            'не мучился. [whispering, very close] Я подделала всех. Кроме тебя.',
            {'gender': 'female', 'age': 'middle_aged', 'use_cases': 'characters', 'search': 'calm soft low warm'},
        ),
        Character(
            'semyon', 'Семён Аркадьевич', (110, 135),
            'Russian male, late 60s, native Russian speaker. Hoarse, aged, slightly wheezy voice with a light age tremor; slow, '
            'kind, working-class manner of a retired metro track worker. Warm and low. Clean studio recording, no reverb.',
            '[slow, a little out of breath] До гермы двести метров. Я тут тридцать лет ходил. [pause] Вентшахта. Наверх ведёт. '
            'Решётка там на замке.',
            {'gender': 'male', 'age': 'old', 'use_cases': 'characters', 'search': 'old hoarse kind'},
        ),
        Character(
            'korneev', 'Корнеев', (100, 125),
            'Russian male, mid-40s, native Russian speaker. Heavy, rough baritone with hard consonants and short clipped phrases; '
            'aggressive authority of a security guard who hides fear behind loudness. Clean studio recording, no reverb.',
            '[gruff, impatient] Хватит. Я наверх, через шахту. [pause] [whispering, frightened] Господи... [panicked, shouting] '
            'Назад! Не трогай меня!',
            {'gender': 'male', 'age': 'middle_aged', 'use_cases': 'characters', 'search': 'rough gruff baritone'},
        ),
        Character(
            'pavel', 'Павел', (115, 140),
            'Russian male, about 30, native Russian speaker. Clear light baritone; professional train driver making an onboard '
            'announcement, trying hard to sound calm, with audible tension underneath. Clean studio recording, no reverb.',
            '[trying to sound calm, tense underneath] Говорит машинист. Без паники. Связи нет. [pause] Ждём. [quiet, steady] '
            'Схожу до гермы. Посмотрю.',
            {'gender': 'male', 'age': 'young', 'use_cases': 'characters', 'search': 'clear baritone'},
        ),
        Character(
            'announcer', 'Диктор ГО', (175, 200),
            'Russian female, mid-40s, native Russian speaker. Formal civil-defense broadcast announcer: measured, precise '
            'articulation, neutral and cold, with barely noticeable tension. Sounds like a pre-recorded emergency message. Clean '
            'studio recording, no reverb.',
            '[formal, measured, cold] Внимание. Говорит штаб гражданской обороны. В городе объявлен режим радиационной опасности.',
            {'gender': 'female', 'age': 'middle_aged', 'use_cases': 'informative_educational', 'search': 'announcer formal'},
            stability=0.6,
        ),
        Character(
            'olga', 'Ольга', (160, 210),
            'Russian female, mid-50s, native Russian speaker. Tired warm voice, close to tears. Clean studio recording, no reverb.',
            '[crying, voice breaking] Да как ты могла... [pause] [tired, quiet] Я просто хочу домой.',
            {'gender': 'female', 'age': 'old', 'use_cases': 'characters', 'search': 'warm tired'},
        ),
        Character(
            'akhmed', 'Ахмед', (110, 150),
            'Russian male, mid-20s, native Russian speaker with a neutral Russian accent. Light baritone, nervous, quick to anger. '
            'Clean studio recording, no reverb.',
            '[angry, voice rising] Ты их убила?! Ты сама решала, кому жить?! [pause] [nervous] Я не останусь тут.',
            {'gender': 'male', 'age': 'young', 'use_cases': 'characters', 'search': 'young nervous'},
        ),
        Character(
            'fifteen', 'Пятнадцатый', (0, 0),  # только шёпот: высота не проверяется
            'Russian male, low voice, whispering only. Extremely close to the microphone, breathy and dry. Clean studio recording, no reverb.',
            '[extremely quiet, breathy whisper] Тсс.',
            {'gender': 'male', 'age': 'middle_aged', 'search': 'whisper deep'},
        ),
    ]
}

LEVEL_DB = {'whisper': -7.0, 'quiet': -3.0, 'normal': 0.0, 'raised': 2.0, 'shout': 4.0}


@dataclass
class Line:
    id: str
    win: tuple
    who: str
    fx: str
    level: str
    text: str
    new: bool = False
    chain: bool = False
    reuse: Optional[str] = None
    cut_frames: int = 0
    choke_frames: int = 0
    variants: int = 1
    dialogue: Optional[str] = None
    duck: bool = True
    scene: Optional[str] = None
    pos: float = 0.0
    at: dict = field(default_factory=dict)
    prio: int = 0  # патч №1: 1–3 — очередь генерации новых реплик (N), 0 — старая реплика
    gain_db: float = 0.0  # поправка громкости к манере (счёт E1-N02/E1-03 — +4 дБ)

    @property
    def ep(self) -> int:
        return int(self.id[1])


def tc(s: str) -> float:
    m, sec = s.split(':')
    return int(m) * 60 + float(sec)


def L(id, a, b, who, fx, level, text, **kw):
    return Line(id, (tc(a), tc(b)), who, fx, level, text, **kw)


LINES = [
    # ── СЕРИЯ 1. «18:47»
    L('E1-01', '0:00', '0:07', 'gleb', 'DRY', 'quiet',
      '[low, close to the mic, calm and quiet] Ты едешь домой с работы. [pause] [slower, almost a whisper] Через восемь минут... твоего города не станет.', chain=True,
      scene='hook', pos=0.15),
    L('E1-02', '0:08', '0:30', 'gleb', 'DRY', 'normal',
      '[low, tired, dry irony] Двадцать лет я оцениваю убытки. [pause] Пожар. Потоп. Авария. Я прихожу после... и считаю, что осталось.', chain=True,
      scene='ride', pos=1.4),
    L('E1-03', '0:32', '0:45', 'gleb', 'CAR', 'whisper',
      '[barely audible, muttering to himself] Одиннадцать... двенадцать... тринадцать... четырнадцать.',
      scene='count', pos=10.4, gain_db=4),  # сразу за E1-N02: счёт 1–14 без разрыва; 13 — кабина, 14 — отражение
    L('E1-04', '0:45', '0:55', 'gleb', 'DRY', 'normal',
      '[calm, matter-of-fact] Четырнадцать. Я всегда считаю. [pause] Привычка. Потом проще описывать ущерб.', chain=True,
      scene='count', pos=15.2),
    L('E1-05', '1:27', '1:33', 'pavel', 'INTERCOM', 'normal',
      '[trying to sound calm, tense underneath] Говорит машинист. Без паники. Связи нет. [pause] Ждём.',
      scene='emergency', pos=1.0),
    L('E1-06', '1:34', '1:50', 'announcer', 'RADIO_INTERCOM', 'normal',
      '[formal, measured, cold] Внимание. Говорит штаб гражданской обороны. В городе объявлен режим радиационной опасности. '
      'Гермозатворы метрополитена закрыты. Оставайтесь на местах. Не покидайте укрытия. Ожидайте указаний. [pause] '
      'Внимание. Говорит штаб гражданской обороны...', scene='emergency', pos=5.9),
    L('E1-07', '1:55', '1:58', 'nina', 'CAR_DARK', 'quiet', '[calm, gentle, reassuring] Это ещё ничего.',
      scene='dosimeter', pos=3.0),  # ЖК крупно — с кадра 75
    L('E1-08', '1:59', '2:09', 'gleb', 'DRY', 'quiet',
      '[quiet, slow] Она сказала это так... как врачи говорят о том, что уже случилось.', chain=True,
      scene='dosimeter', pos=4.6),
    L('E1-09', '2:10', '2:14', 'pavel', 'CAR_DARK', 'quiet',
      '[quiet, steady, forcing confidence] Схожу до гермы. Посмотрю. Двери не открывать.', new=True,
      scene='pavelLeaves', pos=0.35),
    L('E1-10', '2:28', '2:40', 'gleb', 'CAR_DARK', 'whisper',
      '[whispering, slow] Двенадцать... тринадцать... четырнадцать... [long pause] [breath catches, barely audible] пятнадцать.',
      scene='fifteen', pos=1.0),  # цифры 12–15 появляются по словам
    # патч №1
    L('E1-N01', '0:18', '0:30', 'gleb', 'DRY', 'normal',
      '[dry, quoting from memory, quiet irony] Пункт девять-четыре. Не является страховым случаем ущерб вследствие... радиоактивного заражения. [pause] Мелкий шрифт. Его никто не читает.',
      new=True, chain=True, prio=1, scene='ride', pos=10.6),
    L('E1-N02', '0:30', '0:40', 'gleb', 'CAR', 'whisper',
      '[quiet but clearly audible, muttering to himself, steady rhythm] Один. Два. Три. Четыре. Пять. Шесть. Семь. Восемь. Девять. Десять.',
      new=True, prio=1, gain_db=4, scene='count', pos=0.6),  # цифры 1–10 над пассажирами по словам
    L('E1-N03', '0:55', '1:03', 'gleb', 'DRY', 'quiet',
      '[calm, observant, low] Восемнадцать сорок шесть. Свет мигнул. [pause] В моей работе это называется — первый признак. [pause] Его тоже никто не замечает.',
      new=True, chain=True, prio=1, scene='watch', pos=0.4),
    L('E1-N04', '2:10', '2:18', 'gleb', 'DRY', 'quiet',
      '[low, quiet, counting slowly] Я считал его шаги. [pause] Сто десять... сто одиннадцать... сто двенадцать... [pause] Потом считать стало нечего.',
      new=True, chain=True, prio=1, scene='pavelLeaves', pos=4.6),  # на «нечего» фонарь гаснет
    L('E1-N05', '2:57', '3:00', 'gleb', 'DRY', 'whisper',
      '[whispering, close] Пятнадцатый был мокрый. [pause] А туннель — сухой.', new=True, chain=True, prio=3),
    # ── СЕРИЯ 2. «Машинист»
    L('E2-01', '0:00', '0:06', 'gleb', 'DRY', 'quiet',
      '[low, close to the mic, steady] Ты нашёл человека, который ушёл за помощью. [pause] [quieter] У него во рту... камни.', chain=True,
      scene='hook', pos=0.15),
    L('E2-02', '0:13', '0:34', 'gleb', 'DRY', 'normal',
      '[dry, cold, measured] На третий день люди перестают быть пассажирами. [pause] Становятся заявителями. [slight bitter irony] '
      'Каждый уверен, что его случай особый.', chain=True, scene='camp', pos=2.0),
    L('E2-03', '0:38', '0:44', 'semyon', 'TUNNEL', 'normal', '[slow, a little out of breath] До гермы двести метров. Я тут тридцать лет ходил.',
      scene='walk', pos=0.6),
    L('E2-04', '0:46', '0:52', 'semyon', 'TUNNEL', 'normal', '[pointing something out, matter-of-fact] Вентшахта. Наверх ведёт. Решётка там на замке.',
      scene='walk', pos=11.9),  # у прохода ВШ-12
    L('E2-05', '1:12', '1:17', 'semyon', 'TUNNEL', 'whisper', '[whispering, shaken, trembling voice] Паша... Господи, Паша.', new=True,
      scene='door', pos=9.3),
    L('E2-06', '1:21', '1:58', 'gleb', 'DRY', 'quiet',
      '[quiet, precise, like dictating a report] Акт осмотра номер один. [pause] Пункт первый. Ожогов нет. [pause] Пункт второй. '
      'Ногти сорваны. Он царапал герму. [pause] Пункт третий. Царапины на герме... [long pause] [quieter] и с этой стороны. [pause] '
      'Пункт четвёртый. Следы. Его ботинки — к герме. Другие — босые. От шахты. К поезду. [pause] Обратно — нет. [pause] '
      'Пункт пятый. Дозиметр машиниста. Ноль целых четыре десятых миллизиверта.', chain=True, scene='act', pos=0.5),
    L('E2-07', '1:58', '2:00', 'gleb', 'DRY', 'quiet', '[low, grim, quiet] С такой дозой живут. [pause] От неё не умирают с камнями во рту.', chain=True,
      scene='act', pos=29.6),
    L('E2-08', '2:06', '2:09', 'nina', 'CAR_DARK', 'quiet', '[calm, gentle, final] У вас много. Вам нужно отдельно.',
      scene='measure', pos=7.1),  # Семёну — без числа
    L('E2-09', '2:14', '2:15', 'nina', 'CAR_DARK', 'quiet', '[soft, after a short hesitation] Нормально.', scene='measure', pos=16.0),  # после взгляда на экран
    L('E2-10', '2:17', '2:22', 'gleb', 'DRY', 'quiet', '[quiet, suspicious, slow] Она мерила всех. [pause] Себя — нет.', chain=True,
      scene='measure', pos=17.5),
    L('E2-11', '2:42', '2:43', 'gleb', 'CAR_DARK', 'whisper', '[barely audible whisper] Пятнадцать.', scene='night', pos=12.6),
    L('E2-12', '2:45', '2:47', 'semyon', 'CAB', 'raised', '[a short, choked cry of fear, cut off abruptly] А-а...', cut_frames=3,
      scene='night', pos=14.6),  # из кабины, после 15-го стука
    # патч №1
    L('E2-N01', '0:24', '0:35', 'gleb', 'DRY', 'normal',
      '[dry, quoting, bitter irony] Пункт три-один. Страхователь обязан принять все меры к уменьшению убытков. [pause] Корнеев принял меры первым.',
      new=True, chain=True, prio=2, scene='camp', pos=10.7),
    L('E2-N02', '0:30', '0:35', 'korneev', 'CAR_DARK', 'raised',
      '[gruff, loud enough for everyone, threatening] Воду делю я. По крышке в час. [pause] Кто тронет — пожалеет.', new=True, prio=1,
      scene='camp', pos=18.9),
    L('E2-N03', '0:44', '0:48', 'semyon', 'TUNNEL', 'quiet',
      '[slow, uneasy, lowering his voice] Слышишь? [pause] Туннель всегда гудит. А сейчас молчит. [pause] Плохо это.', new=True, prio=2,
      scene='walk', pos=5.3),  # под «молчит» гул туннеля стихает
    L('E2-N04', '0:55', '1:05', 'gleb', 'DRY', 'quiet',
      '[quiet, focused, deducing] Фонарь машиниста ещё горел. [pause] Батарейки садятся за двое суток. [pause] Значит, он сидит здесь... с первой ночи.',
      new=True, chain=True, prio=1, scene='door', pos=0.6),
    L('E2-N05', '2:02', '2:06', 'nina', 'CAR_DARK', 'quiet',
      '[calm, quiet, clinical] Ноль тридцать. [pause] Ноль тридцать. [pause] Ноль тридцать одна. [pause] Ноль тридцать.', new=True, prio=1,
      scene='measure', pos=1.0),  # по числу на каждой остановке Нины
    L('E2-N06', '2:36', '2:42', 'gleb', 'CAR_DARK', 'whisper',
      '[whispering, slow, in rhythm with knocks] Девять... десять... одиннадцать... двенадцать... тринадцать... четырнадцать...', new=True, prio=1,
      scene='night', pos=5.0),  # стуки 9–14 по словам
    L('E2-N07', '2:57', '3:00', 'gleb', 'DRY', 'whisper',
      '[low, grim, whispering] Семён кричал недолго. [pause] Утром у него были сложены руки. Сам он так лечь не мог.', new=True, chain=True, prio=3),
    # ── СЕРИЯ 3. «Список»
    L('E3-01', '0:00', '0:06', 'gleb', 'DRY', 'whisper',
      '[barely audible whisper, holding his breath] Ты стоишь в темноте. [pause] Тебя трогают за лицо. [long pause] Если вздохнёшь... умрёшь.', chain=True,
      scene='hook', pos=0.4),
    L('E3-02', '0:14', '0:17', 'nina', 'CAB', 'quiet', '[calm, quiet, matter-of-fact] Лучевая. Я предупреждала.', scene='cab', pos=2.3),
    L('E3-03', '0:26', '0:39', 'gleb', 'DRY', 'quiet', '[low, slow, cold] Острая лучевая убивает за дни. [pause] Не за ночь. [pause] Убыток не сходился с причиной.', chain=True,
      scene='cab', pos=11.1),
    L('E3-04', '0:44', '1:02', 'gleb', 'DRY', 'whisper',
      '[whispering, tense] Морфин. Из больничного сейфа. [pause] Пустые. [pause] Список. Имена... дозы. [long pause] И галочки.', new=True, chain=True,
      scene='bag', pos=1.6),
    L('E3-05', '1:06', '1:10', 'korneev', 'CAR_DARK', 'normal', '[gruff, impatient, decided] Хватит. Я наверх, через шахту.', scene='korneev', pos=1.6),
    L('E3-06', '1:52', '1:54', 'korneev', 'SHAFT', 'whisper', '[whispering, terrified] Господи...', scene='shaft', pos=14.0),  # SHAFT.god
    L('E3-07', '2:00', '2:06', 'korneev', 'SHAFT', 'shout', '[panicked, shouting] Назад! Пошли назад! [screaming] Не трогай меня!', choke_frames=6,
      scene='shaft', pos=19.83),  # SHAFT.panic + 5
    L('E3-08', '2:07', '2:18', 'gleb', 'SHAFT', 'whisper',
      '[holding his breath, a tiny shaky inhale through the nose] ... [long pause] [a long, silent, trembling exhale]', variants=3,
      scene='shaft', pos=25.83),  # без слов: начало файла — SHAFT.silence + 15
    L('E3-09', '2:12', '2:13', 'fifteen', 'TSS', 'whisper', '[extremely quiet, breathy whisper] Тсс.', scene='shaft', pos=30.5),  # рука на лице
    L('E3-10', '2:33', '2:40', 'nina', 'CAR_DARK', 'quiet', '[soft, almost tender, sincere] Мне жаль. [pause] Я хотела, чтобы ты не мучился.',
      scene='list', pos=12.5),
    # патч №1
    L('E3-N01', '0:18', '0:26', 'gleb', 'DRY', 'quiet',
      '[quiet, close, examining] Зрачки — с булавочную головку. [pause] И прокол на сгибе локтя. Свежий.', new=True, chain=True, prio=1,
      scene='cab', pos=5.3),
    L('E3-N02', '1:00', '1:05', 'gleb', 'DRY', 'whisper',
      '[whispering, reading quickly] Семён Аркадьевич. Семь зивертов. Галочка. [pause] Ниже — загнуто.', new=True, chain=True, prio=2),
    L('E3-N03', '1:10', '1:12', 'gleb', 'CAR_DARK', 'quiet', '[quiet, decided] Я с тобой.', new=True, prio=2, scene='korneev', pos=4.6),
    L('E3-N04', '1:12', '1:15', 'korneev', 'TUNNEL', 'quiet', '[gruff, low] Не отставай. Свети под ноги.', new=True, prio=2),
    L('E3-N05', '1:25', '1:32', 'gleb', 'DRY', 'whisper',
      '[whispering, uneasy] Сверху сыпался пепел. Мокрый. [pause] Наверху шёл дождь. [pause] Вот почему он был мокрый.', new=True, chain=True, prio=1,
      scene='shaft', pos=0.6),  # на «Наверху» — камера шахты, луч вверх по лестнице
    L('E3-N06', '1:40', '1:48', 'gleb', 'SHAFT', 'whisper',
      '[barely audible whisper, counting automatically] Три... четыре... семь... десять... [stops himself, terrified whisper] Не считай. [pause] Не считай.',
      new=True, prio=1, scene='shaft', pos=7.6),  # цифры над сидящими по словам, на «Не считай» — перечёркнуты
    L('E3-N07', '2:20', '2:28', 'gleb', 'DRY', 'quiet',
      '[shaky, low, out of breath] Корнеев не вернулся. Я вернулся один. [pause] Нина не спала.', new=True, chain=True, prio=1,
      scene='list', pos=0.5),
    L('E3-N08', '2:56', '3:00', 'gleb', 'DRY', 'quiet',
      '[low, grim, controlled] Шесть и две десятых зиверта. [pause] Если она не врёт — мне осталось меньше недели. [pause] Если врёт... я узнаю, сколько ещё она соврала.',
      new=True, chain=True, prio=3),
    # ── СЕРИЯ 4. «Доза»
    L('E4-01', '0:00', '0:06', 'gleb', 'DRY', 'quiet', '[low, close to the mic, grim] Ты раскрыл убийство. [pause] [quieter, with dread] И сказал об этом вслух.', chain=True),
    L('E4-02', '0:14', '0:38', 'gleb', 'DRY', 'normal',
      '[dry, measured, professional] Когда клиент присылает идеальные документы... они поддельные. [pause] У Нины были идеальные документы.', chain=True),
    L('E4-03', '0:42', '1:14', 'gleb', 'CAR_DARK', 'raised',
      '[firm, clear, speaking to a room of people] Прокол на руке Семёна Аркадьевича. Пустые ампулы в её сумке. Морфин. [pause] '
      'Список. Галочка ставится после смерти. [pause] [slower, building intensity] И главное. Мы сидели в одном вагоне. Дышали одним '
      'воздухом. Когда она нас мерила — щелчки у всех были одинаковые. [pause] Нельзя облучиться сильнее, сидя на соседнем сиденье. '
      '[firm, final] Её дозы — выдумка.'),
    L('E4-04', '1:14', '1:26', 'nina', 'CAR_DARK', 'quiet',
      '[calm, even, almost gentle] Воды на пять дней. Нас было тринадцать. [pause] Я выбирала тех, кто умрёт всё равно. [long pause] '
      '[quiet, tired] Ошиблась я в одном. Всё равно умрут все.'),
    L('E4-05', '1:23', '1:26', 'akhmed', 'CAR_DARK', 'shout', '[angry, voice rising] Ты их убила?! Ты сама решала, кому жить?!', new=True, dialogue='E4-crowd'),
    L('E4-06', '1:24', '1:27', 'olga', 'CAR_DARK', 'raised', '[crying, voice breaking] Да как ты могла...', new=True, dialogue='E4-crowd'),
    L('E4-07', '1:27', '1:28', 'gleb', 'CAR_DARK', 'shout', '[sharp, loud, urgent hiss] Тихо!'),
    L('E4-08', '2:24', '2:30', 'nina', 'DRY', 'whisper', '[whispering, very close, intimate] Я подделала всех. [long pause] Кроме тебя.'),
    L('E4-09', '2:35', '2:42', 'gleb', 'CAR_DARK', 'whisper', '[a sharp, quiet intake of breath] ... [silence]', variants=2),
    # патч №1
    L('E4-N01', '0:30', '0:40', 'gleb', 'DRY', 'quiet',
      '[quiet, focused, comparing] Её прибор — ноль тридцать. Прибор машиниста — ноль тридцать. [pause] Одинаково. Как и должно быть.',
      new=True, chain=True, prio=1),
    L('E4-N02', '1:32', '1:36', 'gleb', 'DRY', 'whisper', '[barely audible whisper] Не дышать. Не двигаться. [pause] Они слушают.', new=True, chain=True, prio=1),
    L('E4-N03', '1:50', '1:56', 'gleb', 'DRY', 'whisper',
      '[whispering, faster, losing count] Двадцать... тридцать... сорок... [pause] Я перестал считать лица.', new=True, chain=True, prio=2),
    L('E4-N05', '2:56', '3:00', 'gleb', 'DRY', 'quiet',
      '[quiet, stunned, slow] Пепел из шахты. В моём кармане. Два дня. [pause] Я сам принёс себе приговор.', new=True, chain=True, prio=3),
    # ── СЕРИЯ 5. «Акт осмотра»
    L('E5-01', '0:00', '0:06', 'gleb', 'DRY', 'quiet',
      '[calm, tired, close to the mic] Тебе осталось жить несколько дней. [pause] Ты потратишь их, чтобы нажать одну кнопку.', chain=True),
    L('E5-02', '0:16', '0:26', 'gleb', 'DRY', 'quiet', '[tired, dry throat, quiet irony] Двадцать лет я считал чужие убытки. [pause] Свой посчитал за минуту.', chain=True),
    L('E5-03', '0:27', '0:39', 'gleb', 'DRY', 'quiet',
      '[low, focused, thinking aloud] В шахту падает пепел. Значит, наверху открыто. [pause] Им нужен звук. [pause] [quiet, decided] Я дам им звук.', chain=True),
    L('E5-04', '0:41', '0:52', 'gleb', 'CAR_DARK', 'whisper',
      '[whispering, calm and clear] Когда загудит — идите к шахте. Вдоль стены. Не говорите. Не светите. [pause] Не считайте.', new=True),
    L('E5-05', '0:55', '1:02', 'nina', 'CAR_DARK', 'whisper', '[whispering, steady] Я пойду с ними. [pause] Без того, кто знает про дозу, они не дойдут.'),
    L('E5-06', '1:12', '1:36', 'gleb', 'CAB', 'quiet',
      '[quiet, slow, weak but steady, dictating a report] Акт осмотра номер три. Объект: вагон четыре. Перегон Заводская — Площадь Труда. '
      '[pause] Причина убытка... [long pause] [almost a whisper] Ущерб: полный.'),
    L('E5-07', '2:16', '2:24', 'gleb', 'DRY', 'raised', '[calm, tender, quiet certainty] Нас было четырнадцать. [pause] Я всегда считаю.', chain=True, duck=False),
    L('E5-08', '2:33', '2:34', 'fifteen', 'TSS', 'whisper', '[extremely quiet, breathy whisper] Тсс.'),
    L('E5-09', '2:42', '2:55', 'announcer', 'STREET_PA', 'normal', '', reuse='E1-06'),
    # патч №1
    L('E5-N01', '0:12', '0:16', 'gleb', 'DRY', 'quiet',
      '[tired, dry throat, professional] Кровь из носа. Волосы на пальцах. [pause] Классическая картина. Я видел такие акты.', new=True, chain=True, prio=2),
    L('E5-N02', '0:52', '0:53', 'akhmed', 'CAR_DARK', 'whisper', '[whispering, scared] А вы?', new=True, prio=1),
    L('E5-N03', '0:53', '0:55', 'gleb', 'CAR_DARK', 'whisper', '[whispering, calm, a faint smile in the voice] А я посчитаю.', new=True, prio=1),
    L('E5-N04', '1:36', '1:44', 'gleb', 'CAB', 'quiet',
      '[quiet, counting slowly, listening] Сорок шагов до поворота. [pause] Тридцать... двадцать... десять... [pause] Всё. Ушли.', new=True, prio=1),
    L('E5-N05', '1:50', '1:55', 'nina', 'SHAFT', 'whisper', '[whispering, firm] Вверх. Не останавливаться. Не смотреть вниз.', new=True, prio=2),
    L('E5-N06', '2:08', '2:16', 'gleb', 'DRY', 'quiet',
      '[calm, almost tender, quoting] Последний пункт договора. [pause] Страховая сумма выплачивается выгодоприобретателю. [pause] Пусть это будут они.',
      new=True, chain=True, prio=2),
]

BY_ID = {l.id: l for l in LINES}

# «РАНЕЕ» (патч №1, §4): фрагменты уже озвученных реплик, 0 кредитов. (реплика, первое слово, последнее слово) —
# None — вся реплика. Фрагмент i звучит в i-й двухсекундной вставке блока: с кадра recap.from + 60·i + RECAP_LEAD.
RECAPS = {
    2: [('E1-04', 'Четырнадцать', 'Четырнадцать'), ('E1-06', 'оставайтесь', 'местах'), ('E1-10', 'пятнадцать', 'пятнадцать')],
    3: [('E2-01', 'У', 'камни'), ('E2-06', 'Другие', 'босые'), ('E2-12', None, None)],
    4: [('E3-07', 'Не', 'меня'), ('E3-09', None, None), ('E3-10', 'Мне', 'жаль')],
    5: [('E4-07', None, None), ('E4-08', 'Кроме', 'тебя')],
}
RECAP_LEAD = 8


def plain(text: str) -> str:
    """Текст без тегов — то, что должно прозвучать."""
    import re
    return re.sub(r'\s+', ' ', re.sub(r'\[[^\]]*\]', ' ', text)).strip()


def neighbours(line: Line, only=None):
    """Соседние по времени реплики той же серии — previous_text / next_text. only(id) — фильтр (например, уже озвученные)."""
    same = sorted([l for l in LINES if l.ep == line.ep and not l.reuse and (l is line or only is None or only(l.id))],
                  key=lambda l: (l.win[0], l.id))
    i = same.index(line)
    prev = plain(same[i - 1].text) if i > 0 else None
    nxt = plain(same[i + 1].text) if i + 1 < len(same) else None
    return prev, nxt


if __name__ == '__main__':
    for l in LINES:
        print(f'{l.id}  {l.win[0]:6.1f}–{l.win[1]:6.1f}  {l.who:9s} {l.fx:14s} {l.level:7s} {"(+)" if l.new else "   "} {plain(l.text) or "← " + str(l.reuse)}')
    assert len(BY_ID) == len(LINES)
