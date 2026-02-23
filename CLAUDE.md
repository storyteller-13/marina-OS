# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

vonsteinkirch.com — a personal website styled as a desktop operating system. Vanilla JS (no frameworks), single `index.html` page with modular application scripts. Deployed on Vercel.

## Commands

- `make server` — local dev server at http://localhost:8088 (python3 http.server)
- `npm run test:watch` — vitest in watch mode
- `npm run test:coverage` — vitest with coverage

Tests reference `tests/setup.js` but no test files exist yet. Vitest config is at `vitest.config.js`.

## Architecture

### Desktop OS Pattern

Everything runs inside a single `index.html` (60KB). The page renders a desktop with a top panel (clock, app menu), draggable windows, and a dock. Each "application" is a JS class that manages its own window.

### Core System (`scripts/core/`)

- **window-manager.js** — `WindowManager` class: window lifecycle (open/close/minimize), z-index stacking, drag-by-header. Exposes `window.WindowManager` globally. All apps check for this and fall back to direct DOM manipulation.
- **panel.js** — `Panel` class: top bar clock (HH:MM:SS), applications dropdown menu.
- **protection.js** — IIFE that blocks right-click, dev-tool shortcuts, and image dragging (client-side only).

### Applications (`scripts/applications/`)

13 self-contained app modules, each a class with `init()`, `open()`, `close()`, and `render()` methods. Classes are exposed on `window` for both global access and testing (e.g., `window.APODPanelClass`).

Apps with external data: **apod** (NASA API), **chess** (Chess.com), **xkcd** (XKCD), **b-bot** (Ollama LLM), **astro-chart** (iframe embed), **music-player** (YouTube IFrame API).

Apps with local storage: **email** (email-storage.js, email-data.js), **notes** (notes-storage.js), **todo** (todo-storage.js), **music-player** (music-player-storage.js). Storage modules expose `load()`, `save()`, `generateId()`, `getDefaultData()`.

Simple apps: **home** (iframe wrapper), **artwork** (image lightbox), **philosophy-quotes** (random quote display), **terminal** (simulated filesystem with ls/cd/cat/view commands).

### API Layer (`api/`)

Vercel serverless functions — all are CORS-enabled GET proxies with 1-hour cache + 24-hour stale-while-revalidate:

- `apod.js` — NASA APOD proxy. Uses `NASA_API_KEY` env var (falls back to DEMO_KEY).
- `chess.js` — Chess.com daily puzzle proxy.
- `xkcd.js` — XKCD comic proxy.
- `ollama/[...path].js` — Catch-all proxy to local Ollama server (`OLLAMA_URL` env var). Supports streaming NDJSON for model pulls and chat.

### Key Patterns

- **Environment-aware fetching**: localhost hits APIs directly, production uses `/api/` proxies to avoid CORS.
- **Resilient fetching**: XKCD tries 3 fallback CORS proxies; APOD serves stale cache on failure with background refresh.
- **24-hour localStorage caching** with timestamp validation (APOD, XKCD).
- **No build step**: all JS loads via `<script>` tags directly. No bundler, no transpiler.
- **Single CSS file**: `styles/styles.css` (99KB) covers everything.

## Styles

All styling is in `styles/styles.css`. The visual theme is a dark desktop OS with neon green accents (#39ff14). Windows have macOS-style traffic light controls (close/minimize/maximize circles).
