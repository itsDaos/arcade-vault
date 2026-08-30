# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**Arcade Vault** — online gaming platform where users compete for the highest score. Uses Spec Driven Design (`/spec` → `/spec-impl` workflow from [fernando-skills](https://github.com/Klerith/fernando-skills)).

## Commands

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

No test runner is configured yet.

## Stack & Versions

| Package | Version | Notes |
|---|---|---|
| Next.js | 16.3.3 | App Router — **breaking changes from v14/v15** |
| React | 19.2.8 | — |
| Tailwind CSS | 4.x | New import syntax: `@import "tailwindcss"` — no `@tailwind` directives |
| TypeScript | 5.x | — |


## Skills 
usa siempre /frontend-design para diseñar la interfaz del usuario

## Architecture

Single Next.js App Router project, all source under `app/`:

- `app/layout.tsx` — root layout; uses `LayoutProps<"/">` (Next.js 16 type, not `{ children: ReactNode }`); loads Geist fonts via `next/font/google`
- `app/globals.css` — Tailwind v4 entry; CSS custom properties for light/dark theme
- `app/page.tsx` — home page

## Key Conventions

- **Next.js 16 APIs differ from prior versions.** Before writing any route, layout, or metadata code, read `node_modules/next/dist/docs/` for the current API surface.
- Tailwind v4 uses `@import "tailwindcss"` — do not use `@tailwind base/components/utilities` directives.
- Theme tokens (`--background`, `--foreground`) are defined in CSS custom properties and mapped to Tailwind via `@theme inline` — extend theme there, not in `tailwind.config`.
- Follow Spec Driven Design: write a spec first, then implement.
