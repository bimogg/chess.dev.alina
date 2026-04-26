# ChessVerse 3D

> Created by **Alina** for **nFactorial — 2nd Round**

A modern 3D chess platform built with React, Three.js, and React Three Fiber. Play locally with a friend or against an AI opponent, with full chess rules, beautiful 3D visualization, and a clean product-grade flow: Landing → Setup → Game.

---

## Who It's For

Chess players and beginners who want an immersive 3D chess experience right in the browser — no account, no backend, no paid APIs.

## Why It's Valuable

- Runs 100% in the browser with zero server dependency
- Real 3D GLB piece models with shadows and lighting
- Full chess rules via chess.js (promotion, castling, en passant, check/stalemate/draw)
- Focus Mode for beginners — dims irrelevant pieces, shows only legal moves
- AI Hint prefers captures and checks — teaches good habits
- Three board themes (Classic, Green, Walnut)
- LocalStorage save/restore — games persist between sessions

---

## Features

| Feature | Status |
|---|---|
| 3D Chess Board (React Three Fiber + GLB models) | ✅ |
| Local 2-player mode | ✅ |
| Play vs AI (random legal moves, chess.js) | ✅ |
| Full chess rules: castling, en passant, promotion | ✅ |
| Pawn promotion: Queen / Rook / Bishop / Knight | ✅ |
| Check / Checkmate / Stalemate / Draw detection | ✅ |
| Legal move highlights (green dots/rings) | ✅ |
| Selected square + last move highlights | ✅ |
| Animated check/hint markers | ✅ |
| Move history (SAN notation) | ✅ |
| Captured pieces tracker | ✅ |
| Focus Mode | ✅ |
| AI Hint button (prefers captures > checks) | ✅ |
| Board themes: Classic / Green / Walnut | ✅ |
| Save & restore games (LocalStorage, up to 20) | ✅ |
| Undo move | ✅ |
| Landing page with features grid | ✅ |
| Game setup screen (mode / color / theme) | ✅ |
| OrbitControls + zoom limits + camera reset | ✅ |
| AI Coach (deep analysis) | 🔜 Coming soon |
| Multiplayer by link | 🔜 Coming soon |
| City leaderboard (Astana, Almaty, Shymkent) | 🔜 Coming soon |
| Pro tier (skins, cloud history) | 🔜 Coming soon |

---

## Tech Stack

- **React 18** + TypeScript
- **Vite** — fast development and production builds
- **@react-three/fiber** — React renderer for Three.js
- **@react-three/drei** — helpers: OrbitControls, useGLTF, ContactShadows
- **Three.js** — 3D rendering, ACES tone mapping, shadow maps
- **chess.js** — complete chess logic and rule enforcement
- **Zustand** — lightweight state management

---

## Run Locally

```bash
cd chessverse-3d
npm install
npm run dev
# Open http://localhost:5173
```

## Production Build

```bash
npm run build
# Output in dist/
```

---

## Project Flow

```
Landing Page  →  Setup Screen  →  3D Chess Game
   (hero,          (mode /         (board +
  features)        color /         sidebar)
                   theme)
```

## Roadmap

- **AI Coach** — position analysis, opening database, personalized training
- **Multiplayer by link** — real-time play via WebSockets, no account needed
- **City Leaderboard** — Astana, Almaty, Shymkent community rankings
- **Pro tier** — custom piece skins, cloud game history, advanced analytics

---

*Built with ♟ by Alina for nFactorial 2nd Round*
