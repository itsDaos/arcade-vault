# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**Arcade Vault** — online gaming platform where users compete for the highest score. Uses Spec Driven Design (`/spec` → `/spec-impl` workflow from [fernando-skills](https://github.com/Klerith/fernando-skills)).

## Commands

```bash
pnpm dev      # start dev server (http://localhost:3000)
pnpm build    # production build
pnpm lint     # ESLint
```

**Always use `pnpm` — never `npm` or `yarn`.**  
No test runner is configured yet.

## Stack & Versions

| Package      | Version  | Notes                                                                  |
| ------------ | -------- | ---------------------------------------------------------------------- |
| Next.js      | 16.3.3   | App Router — **breaking changes from v14/v15**                         |
| React        | 19.2.8   | —                                                                      |
| Tailwind CSS | 4.x      | New import syntax: `@import "tailwindcss"` — no `@tailwind` directives |
| TypeScript   | 5.x      | —                                                                      |
| Supabase JS  | ^2.116.0 | Client at `lib/supabase.ts`                                            |
| Resend       | ^6.26.0  | Email via `/api/contact` route                                         |

## Skills

- Usa siempre `/frontend-design` para diseñar la interfaz del usuario.
- Usa `/spec` + `/spec-impl` para spec driven design.

## Architecture

Single Next.js App Router project, all source under `app/`:

- `app/layout.tsx` — root layout; uses `LayoutProps<"/">` (Next.js 16 type); loads Geist fonts
- `app/globals.css` — Tailwind v4 entry; CSS custom properties for light/dark theme
- `app/page.tsx` — home page (landing)
- `app/about/page.tsx` — about page with contact form
- `app/auth/page.tsx` — authentication page
- `app/games/page.tsx` — games catalog
- `app/games/[id]/page.tsx` — game detail (dynamic)
- `app/games/[id]/play/page.tsx` — game play (dynamic)
- `app/games/arkanoid/` — Arkanoid game (`ArkanoidGame.tsx` + page)
- `app/games/asteroids/` — Asteroids game (`AsteroidsGame.tsx` + page)
- `app/games/snake/` — Snake game (`SnakeGame.tsx` + page)
- `app/games/tetris/` — Tetris game (`TetrisGame.tsx` + page) and more ... (see `references/implemented-games.md`) when you need to check wich games are implemented and how to implement new ones.
- `app/leaderboard/page.tsx` — leaderboard
- `app/hall-of-fame/page.tsx` — hall of fame
- `app/components/` — shared components: `Nav.tsx`, `Background.tsx`, `TopScores.tsx`
- `app/context/UserContext.tsx` — global user context (React Context)
- `app/hooks/useReveal.ts` — scroll-reveal hook
- `app/actions/scores.ts` — Server Actions for score operations
- `app/api/contact/route.ts` — contact form API (sends email via Resend)
- `lib/supabase.ts` — Supabase client singleton
- `lib/data.ts` — static/mock data helpers
- `specs/` — spec files (01–09), one per feature

## Implemented Games

| Game      | Spec                         | Route              |
| --------- | ---------------------------- | ------------------ |
| Asteroids | `specs/05-asteroids-game.md` | `/games/asteroids` |
| Tetris    | `specs/07-tetris-game.md`    | `/games/tetris`    |
| Arkanoid  | `specs/08-arkanoid-game.md`  | `/games/arkanoid`  |
| Snake     | `specs/09-snake-game.md`     | `/games/snake`     |

## External Services

- **Supabase** — database + auth. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Resend** — transactional email for contact form. Env var: `RESEND_API_KEY`.

## Key Conventions

- **Always use `pnpm`** for all package manager operations.
- **Next.js 16 APIs differ from prior versions.** Read `node_modules/next/dist/docs/` before writing route/layout/metadata code.
- Tailwind v4 uses `@import "tailwindcss"` — no `@tailwind base/components/utilities`.
- Theme tokens (`--background`, `--foreground`) in CSS custom properties, mapped via `@theme inline`.
- Follow Spec Driven Design: write a spec first (`specs/`), then implement.
