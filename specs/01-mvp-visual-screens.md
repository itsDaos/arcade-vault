# SPEC 01 — MVP Visual Screens

**State:** Implemented
**Depends on:** —
**Date:** 2026-08-30
**Objective:** Portar las 5 pantallas del template de referencia a Next.js App Router como interfaz visual completa del MVP de Arcade Vault, sin implementar lógica real de juegos.

---

## Scope

### Incluido
- Navegación global (`Nav`) con logo, links, contador de créditos, botón de auth y menú hamburguesa mobile
- Pantalla **Biblioteca** (`/`) — hero, buscador, filtros por categoría, grid de tarjetas con efecto tilt 3D
- Pantalla **Auth** (`/auth`) — tabs login/registro, campos, botones sociales (visuales), guest mode
- Pantalla **GameDetail** (`/games/[id]`) — portada, tags, stats, tabla de puntuaciones mock, botones de acción
- Pantalla **GamePlayer** (`/games/[id]/play`) — HUD (puntuación/vidas/nivel/pausa), pantalla CRT con animación placeholder, overlay de pausa, modal de Game Over con guardado visual
- Pantalla **HallOfFame** (`/hall-of-fame`) — podio top-3, tabla completa, tabs por juego
- Componente `Background` — degradados, grid perspectivo animado, scanlines, ruido
- CSS de diseño portado a `app/globals.css` (Tailwind v4 + custom properties)
- Fuentes: **Press Start 2P** y **JetBrains Mono** via `next/font/google`
- Datos mock en `lib/data.ts` con tipos TypeScript
- Estado de usuario via React Context (localStorage, sin backend)

### Excluido
- Lógica real de ningún juego
- Autenticación real (sin backend, sin JWT, sin OAuth funcional)
- Leaderboard con base de datos real
- Persistencia de puntuaciones en servidor
- Cualquier API route de Next.js

---

## Data model

```ts
// lib/data.ts

export type Game = {
  id: string
  title: string
  short: string
  long: string
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER' | 'VERSUS'
  cover: string          // clase CSS para cover generada por CSS
  color: 'cyan' | 'magenta' | 'yellow' | 'green'
  best: number
  plays: string
}

export type ScoreRow = {
  rank: number
  name: string
  score: number
  date: string
}

export type User = { name: string }

export const GAMES: Game[]     // 8 juegos del template (bloque-buster, caida, etc.)
export const CATS: string[]    // ['TODOS','ARCADE','PUZZLE','SHOOTER','VERSUS']
export function seededScores(seed: number, count?: number): ScoreRow[]
```

```ts
// context/UserContext.tsx
// Context + Provider + hook useUser()
// Persiste en localStorage bajo la clave 'av_user'
// Expone: user: User | null, login(u: User), logout()
```

---

## Implementation plan

1. **Fuentes y CSS base** — Añadir `Press Start 2P` a `app/layout.tsx` junto a `JetBrains Mono`. Portar `styles.css` completo (con todas las clases `.av-*`, `.btn`, `.card`, `.crt`, etc.) al bloque de CSS custom en `app/globals.css`, debajo de `@import "tailwindcss"`. Añadir variables CSS al `:root` global (no en `@theme inline` — son tokens de diseño propios, no de Tailwind).

2. **Mock data** — Crear `lib/data.ts` con los 8 juegos, `CATS`, `PLAYERS` y `seededScores`. Exportar el tipo `Game`, `ScoreRow`, `User`.

3. **UserContext** — Crear `app/context/UserContext.tsx` como `'use client'`. Provider lee/escribe `av_user` en localStorage. Exportar `useUser()`.

4. **Componente Background** — Crear `app/components/Background.tsx` (`'use client'`) con los divs `.av-bg` y `.av-noise`. Se renderiza `position: fixed` detrás de todo.

5. **Componente Nav** — Crear `app/components/Nav.tsx` (`'use client'`). Usa `usePathname()` de `next/navigation` para determinar enlace activo. Usa `useUser()` para mostrar nombre/logout. Links apuntan a las rutas reales (`/`, `/hall-of-fame`, `/auth`). Hamburguesa controla estado local `open`.

6. **Root layout** — Actualizar `app/layout.tsx`: envolver en `UserProvider`, renderizar `<Background />` y `<Nav />` antes de `<main>`. Añadir `<footer>` con el texto del template.

7. **Pantalla Biblioteca** (`app/page.tsx`) — Componente `'use client'`. Estado: `q` (búsqueda) y `cat` (categoría activa). Render: `<section class="av-hero">`, filtros, `<div class="av-grid">` con `<GameCard>` por cada juego filtrado. `<GameCard>` implementa el efecto tilt con `useRef` + `onMouseMove`. Click en card o botón navega a `/games/[id]` con `useRouter`.

8. **Pantalla Auth** (`app/auth/page.tsx`) — Componente `'use client'`. Estado: `tab` (in/up), campos usuario/email/pass. Submit llama `login()` del contexto y redirige a `/`. Botón guest llama `login(null)` y redirige a `/`. Botones Google/GitHub son visuales sin acción.

9. **Pantalla GameDetail** (`app/games/[id]/page.tsx`) — Componente `'use client'`. Recibe `params.id`. Busca el juego en `GAMES`. Si no existe, `notFound()`. Llama `seededScores(id.length * 17 + 3, 10)`. Render: layout de dos columnas `.av-detail`, portada CSS, tags, stats, leaderboard lateral, botones play/back.

10. **Pantalla GamePlayer** (`app/games/[id]/play/page.tsx`) — Componente `'use client'`. Estado: `score`, `lives`, `level`, `paused`, `over`, `saved`, `name`. El score sube automáticamente cada 220ms con `setInterval` (pausa si `paused || over`). El level sube cada 2500 puntos. Render: HUD `.player-hud`, pantalla CRT `.crt` con `.game-arena` (grid, nave, enemigos — todos CSS puro), overlay de pausa, modal de game over con input de nombre y botón guardar (localStorage `av_scores`).

11. **Pantalla HallOfFame** (`app/hall-of-fame/page.tsx`) — Componente `'use client'`. Estado: `tab` (id del juego activo, default `GAMES[0].id`). Llama `seededScores(tab.length * 23 + 7, 12)`. Si hay usuario logueado, muestra fila destacada con su marca simulada. Render: cabecera, tabs de juegos, podio, tabla completa.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni de lint
- [ ] `pnpm run dev` sirve la app en `localhost:3000` sin errores de consola
- [ ] La ruta `/` muestra la Biblioteca con hero, buscador, chips de categoría y al menos 8 tarjetas de juego
- [ ] El buscador filtra tarjetas en tiempo real por nombre
- [ ] Los chips de categoría filtran por cat; si no hay resultados, aparece el mensaje "NO HAY RESULTADOS"
- [ ] Click en una tarjeta navega a `/games/[id]`
- [ ] `/games/[id]` muestra portada CSS, tags, stats y leaderboard lateral de 10 filas mock
- [ ] El botón "JUGAR AHORA" navega a `/games/[id]/play`
- [ ] `/games/[id]/play` muestra HUD con score que sube, pantalla CRT animada, botón PAUSA funciona (detiene el contador), botón FIN abre el modal de Game Over
- [ ] El modal de Game Over permite escribir un nombre, guardar (toast "PUNTUACIÓN GUARDADA_"), y volver o jugar de nuevo
- [ ] `/auth` muestra las dos pestañas; al enviar el formulario el usuario queda logueado (nombre visible en Nav), y redirige a `/`
- [ ] "JUGAR COMO INVITADO" redirige a `/` sin usuario logueado
- [ ] El botón de logout en el Nav desloguea al usuario
- [ ] `/hall-of-fame` muestra podio, tabla de 12 filas, y los tabs cambian los datos
- [ ] Si hay usuario logueado, aparece la fila "TU MEJOR MARCA" destacada en amarillo
- [ ] En mobile (< 840px) el menú hamburguesa abre el panel lateral y el backdrop cierra el panel
- [ ] Las fuentes Press Start 2P y JetBrains Mono se cargan correctamente
- [ ] El fondo animado (grid perspectivo + scanlines) es visible en todas las pantallas

---

## Decisions taken and discarded

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Routing | Next.js file-based (`/games/[id]`) | Hash SPA del template (`#%7B...%7D`) | Mejor DX, URLs legibles, funciona con App Router |
| Auth state | React Context + localStorage | URL params / server session | MVP sin backend; contexto evita prop drilling entre rutas |
| CSS approach | Port completo a `globals.css` | Tailwind utilities por clase | El sistema de diseño del template tiene 950+ líneas de CSS custom; reescribirlo en utilidades sería reingeniería fuera del scope |
| Fuentes | `next/font/google` | CDN link en `<head>` | Mejor rendimiento, sin layout shift, integrado con Next.js 16 |
| Lógica de juego | Totalmente omitida | Placeholder mínimo en iframe | El scope es solo visual; el CRT placeholder CSS cumple sin añadir complejidad |
| Datos | `lib/data.ts` estático | Ruta API + fetch | No hay backend; datos deterministas, no necesitan red |

---

## Identified risks

- **Fuente "Press Start 2P"**: disponible en Google Fonts pero con latencia variable. Si `next/font` la descarga lento en build, usar `display: swap` (es el default) para no bloquear.
- **Efecto tilt 3D en tarjetas**: usa `onMouseMove` con `transform` directo en el DOM ref — puede causar re-renders extra si se implementa con estado. Mantener el patrón del template (mutación directa de `el.style.transform`).
- **`usePathname` en Nav**: requiere que el componente sea `'use client'`. Si en algún momento se quiere Server Component en el layout, habrá que aislar el Nav en su propio boundary.
