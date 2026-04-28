# ChessVerse

> ChessVerse = быстрый старт партии по ссылке + AI-разбор.
> Иммерсивные 3D-шахматы с Stockfish, онлайн-синхронизацией через Supabase Realtime

**Демо:** https://chessdevalina.vercel.app  
**GitHub:** https://github.com/bimogg/chess.dev.alina

---

## Что это и для кого

ChessVerse — не очередная плоская доска. Это попытка собрать в одном месте всё,
чего обычно не хватает в браузерных шахматных движках, и упаковать это в по-настоящему
красивый 3D-интерфейс.

**Целевая аудитория:**

- Любители, которым надоели плоские доски с «нарисованными» фигурами
- Игроки, которым нужен серьёзный соперник (Stockfish 18, 5 уровней) и реальный анализ партий
- Друзья, которые хотят быстро начать партию по ссылке
- Локальные комьюнити (Алматы, Астана, …), которым важен городской лидерборд

**Почему это ценно:**

1. **3D-движок** — настоящая глубина и тени, не «псевдо-3D» с CSS-перспективой
2. **Реальный Stockfish** — не случайные ходы, а UCI-движок Stockfish 18 (WASM)
3. **AI Coach** — пост-игровой анализ с метрикой точности и блaндерами
4. **Онлайн по ссылке** — Supabase Realtime синхронизирует ходы между устройствами

---

## Стек

| Слой | Технология |
| --- | --- |
| UI / state | React 18, TypeScript, Zustand |
| Сборка | Vite 5 |
| 3D | Three.js + react-three-fiber + drei (GLB-модели) |
| Шахматная логика | chess.js (полные правила, рокировка, en passant, превращение, мат/пат) |
| ИИ | Stockfish 18 (WASM, web worker) |
| AI Coach | Stockfish + собственный анализатор позиций |
| Мультиплеер | Supabase Realtime rooms |
| Профиль + БД + лидерборд | Supabase (опционально) |
| Хранилище | LocalStorage (фолбэк, всегда работает) |

---

## Возможности (по уровням ТЗ)

### Уровень «Слабый» ✅
Доска и фигуры — есть, и не просто 8×8, а полноценная 3D-сцена с тенями.

### Уровень «Средний» ✅
- Полная проверка правил через chess.js
- Рокировка, взятие на проходе, превращение пешки (модал-выбор фигуры)
- Детект мата, пата, ничьей по троекратному повторению/50 ходов
- Игра вдвоём на одном экране (`Local 2-player`)
- Сохранение текущей и завершённых партий в LocalStorage

### Уровень «Сильный» ✅
- **Реальный Stockfish 18** на 5 уровнях сложности (Beginner → Expert)
- История партий с возможностью загрузки
- Гостевой профиль (`clientId` + nickname) с локальным сохранением
- **Светлая / тёмная тема** UI с переключением
- Адаптивный дизайн — играет с телефона (sidebar складывается под доску)
- Save/Load прогресса между сессиями

### Уровень «Великий» ✅
- **Мультиплеер по ссылке** через Supabase Realtime
- **AI Coach** — после партии анализирует каждый ход через Stockfish
  и показывает блaндеры, ошибки, неточности и общую метрику точности
- **Лидерборд по городам** — глобальный + фильтр по городу пользователя
- ELO-рейтинг с автоматическим пересчётом по результатам партий
- **Pro-экран** с премиум-скинами фигур (Gold, Marble, Neon)
- **Уникальная ниша** — 3D-визуал + immersive experience как ключевой дифференциатор

---

## Запуск локально

Требуется Node.js 18+ и npm.

```bash
git clone <repo>
cd chessverse-3d
npm install        # установит зависимости и автоматически скопирует Stockfish в /public/stockfish/
npm run dev        # http://localhost:5173
```

`npm install` запускает скрипт `scripts/copy-stockfish.js`, который копирует
WASM-движок Stockfish из `node_modules/stockfish/` в `public/stockfish/` —
он подгружается в браузере как Web Worker.

### Подключение Supabase (опционально)

Без Supabase приложение работает в local-only режиме: профиль и стата хранятся
в LocalStorage, лидерборд показывает demo-данные. Чтобы включить настоящий бэкенд:

1. Зарегистрируйся бесплатно на [supabase.com](https://supabase.com), создай проект
2. В **SQL Editor** прогони миграцию из `supabase/migrations/001_init.sql` —
   она создаст таблицы `profiles`, `games`, RLS-политики и триггер автосоздания профиля
3. В **Settings → API** скопируй URL и anon-key
4. Создай `.env` (используй `.env.example` как шаблон):

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

5. Перезапусти `npm run dev`. Теперь работают онлайн-комнаты через Supabase Realtime
   и реальный лидерборд по городам.

---

## Структура проекта

```
src/
├── App.tsx                    # router screens + глобальные модалки
├── main.tsx
├── index.css                  # ~1300 строк, темы, адаптив, все секции
├── store/
│   └── gameStore.ts           # Zustand: единое состояние всей игры + flows
├── types/
│   └── index.ts               # все доменные типы
├── utils/
│   ├── chess.ts               # хелперы поверх chess.js
│   ├── engine.ts              # Stockfish UCI wrapper + heuristic fallback
│   ├── coach.ts               # пост-игровой анализатор партий
│   ├── multiplayer.ts         # helper'ы ссылок и room-id для online режима
│   ├── supabase.ts            # клиент + auth + leaderboard
│   └── storage.ts             # LocalStorage (профиль, скины, темы, партии)
└── components/
    ├── Landing/LandingPage.tsx
    ├── Setup/SetupScreen.tsx
    ├── Multiplayer/MultiplayerLobby.tsx
    ├── Profile/{ProfileScreen,LeaderboardScreen}.tsx
    ├── Scene/                 # 3D: ChessScene, Board, Piece, Markers, ShowcaseScene
    └── UI/                    # Sidebar, Modals (Pro, Skins, Auth, CoachReport, Promotion)
public/
└── stockfish/                 # копируется postinstall'ом, в git не коммитится
supabase/
└── migrations/001_init.sql    # схема + RLS
scripts/
└── copy-stockfish.js          # копирует WASM-движок в public/
```

---

## Лицензия

MIT (код), GPL-3.0 (Stockfish используется как WASM web worker).

---

Сделано Алиной для **nFactorial 2 тур**, Апрель 2026
