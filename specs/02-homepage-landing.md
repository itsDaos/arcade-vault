# SPEC 02 — Homepage Landing

**State:** Aproved
**Depends on:** SPEC 01
**Date:** 2026-09-04
**Objective:** Implementar el Homepage de Arcade Vault en `/` basado en la referencia `home.jsx`, moviendo la Biblioteca actual a `/games`.

---

## Scope

### Incluido
- **Migración de rutas**: la Biblioteca (`app/page.tsx`) se mueve a `app/games/page.tsx`; el nav se actualiza de `/` a `/games`
- **Homepage** (`app/page.tsx`) con las secciones de la referencia:
  - Hero con `FloatingSilhouettes` (pixel SVGs animados), eyebrow, título 3-líneas, subtítulo, botones CTA, scroll hint
  - Sección "¿Por qué Arcade Vault?" con `FeatureIcon` pixel icons (4 cards)
  - Sección "Juegos disponibles ahora" con `MiniCard` rail (primeros 6 de `GAMES`)
  - Sección "Stats" (3 bloques: 12+ juegos, miles de partidas, ranking global)
  - Sección "Actividad en vivo" (últimas puntuaciones mock + top jugadores del día mock)
  - Sección "Precios" (plan único $0 + FAQ)
  - CTA final
- **Hook `useReveal`** (IntersectionObserver, clase `.reveal` / `.in`) compartido via archivo utilitario
- **CSS de Homepage** portado de `styles.css` a `app/globals.css` (clases `.home-*`, `.feature-*`, `.mini-*`, `.stats-*`, `.activity-*`, `.pricing-*`, `.tick-*`, `.top-*`, `.home-final`)

### Excluido
- Pantalla About (`/about`) — spec posterior
- Datos de actividad en tiempo real o desde base de datos
- Aleatoriedad en la selección de juegos del rail
- Animaciones de contador animado en la sección Stats (solo texto estático)
- Modificación del sistema de auth o del contexto `UserContext`

---

## Data model

No se introducen nuevos tipos de datos. Se reutilizan `GAMES` y `Game` de `lib/data.ts` (SPEC 01).

Los datos mock de actividad se definen inline en el componente:

```ts
// inline en app/page.tsx — no exportado

const LIVE_SCORES = [
  { p: "NEONFOX",  g: "Caída",        s: 184220, t: "hace 2 min",  c: "magenta" },
  { p: "PX_KAI",   g: "Glotón",       s: 96400,  t: "hace 5 min",  c: "yellow"  },
  { p: "Z3R0COOL", g: "Invasores",    s: 54190,  t: "hace 8 min",  c: "green"   },
  { p: "VAULT_07", g: "Rocas",        s: 41200,  t: "hace 12 min", c: "cyan"    },
  { p: "GLITCHA",  g: "Bloque Buster",s: 28450,  t: "hace 18 min", c: "cyan"    },
  { p: "ARKADYA",  g: "Serpentina",   s: 7820,   t: "hace 24 min", c: "green"   },
  { p: "CYBER_LU", g: "Ranaria",      s: 18900,  t: "hace 31 min", c: "yellow"  },
]

const TOP_TODAY = [
  { r: 1, p: "NEONFOX",  s: 312840 },
  { r: 2, p: "PX_KAI",   s: 248110 },
  { r: 3, p: "M00NRYU",  s: 196720 },
  { r: 4, p: "VAULT_07", s: 154300 },
  { r: 5, p: "GLITCHA",  s: 138900 },
]
```

---

## Implementation plan

1. **Mover Biblioteca a `/games`** — copiar `app/page.tsx` (Biblioteca) a `app/games/page.tsx`. Verificar que el nuevo archivo compila y que la ruta `/games` sirve la Biblioteca correctamente.

2. **Actualizar Nav** — en `app/components/Nav.tsx`, cambiar el link "Biblioteca" de `href="/"` (o `pathname === "/"`) a `href="/games"`. Actualizar la lógica `isActive` para que `/games` y `/games/[id]` activen el link "Biblioteca".

3. **CSS de Homepage** — añadir al final de `app/globals.css` los estilos de: `.home-hero`, `.home-silos`, `.silo`, `.home-hero-inner`, `.hero-eyebrow`, `.home-title` (`.line-1`, `.line-2`, `.line-3`), `.home-sub`, `.home-ctas`, `.hero-scroll`, `.home-section`, `.section-head`, `.kicker`, `.section-title`, `.section-rule`, `.feature-grid`, `.feature-card`, `.ft-icon`, `.ft-title`, `.ft-desc`, `.mini-rail`, `.mini-card`, `.mini-cover`, `.cover-bg`, `.mini-meta`, `.mini-title`, `.mini-cat`, `.home-stats`, `.stats-inner`, `.stat-block`, `.stat-n`, `.stat-u`, `.stat-s`, `.activity-grid`, `.activity-card`, `.ac-head`, `.ac-title`, `.ticker`, `.tick-row`, `.tk-p`, `.tk-mid`, `.tk-s`, `.tk-t`, `.top-list`, `.top-row`, `.top1`, `.top2`, `.top3`, `.tp-rk`, `.tp-bar`, `.tp-fill`, `.tp-p`, `.tp-s`, `.lb-link`, `.pricing-grid`, `.price-card`, `.pc-label`, `.pc-name`, `.pc-amount`, `.pc-tag`, `.pc-list`, `.pc-foot`, `.pc-stamp`, `.pricing-faq`, `.faq-item`, `.faq-q`, `.faq-a`, `.home-final`, `.final-title`, `.final-cta`, `.final-tag`. Portarlos de `references/home-about/styles.css`.

4. **Hook `useReveal`** — crear `app/hooks/useReveal.ts` (`'use client'`) que exporta el hook con el IntersectionObserver para `.reveal` / `.in`. Reutilizable en futuras pantallas.

5. **Componentes auxiliares** — crear en `app/page.tsx` (o extraer a `app/components/home/`) los sub-componentes:
   - `FloatingSilhouettes` — div `.home-silos` con 8 SVGs pixel (s1–s8), `aria-hidden`
   - `FeatureIcon({ kind })` — renderiza uno de 4 SVG pixel según `kind`: `"GAMEPAD"`, `"FREE"`, `"TROPHY"`, `"ROCKET"`
   - `MiniCard({ game, href })` — card clickable que navega a `/games/[id]` usando `<Link>`

6. **Homepage** — reemplazar `app/page.tsx` con el componente `Home` (`'use client'`):
   - Llama `useReveal()`
   - Sección Hero: `FloatingSilhouettes` + eyebrow + `<h1>` 3 líneas + sub + 2 botones (`<Link href="/games">` y `<Link href="/auth">`) + scroll hint
   - Sección "¿Por qué?" (`// 01`): 4 `feature-card` con `FeatureIcon`
   - Sección "Juegos" (`// 02`): `mini-rail` con `GAMES.slice(0, 6).map(MiniCard)` + botón "VER TODOS →" → `/games`
   - Sección Stats: 3 `stat-block`
   - Sección "Actividad en vivo" (`// 03`): 2 `activity-card` con `LIVE_SCORES` y `TOP_TODAY`; botón "VER SALÓN →" → `/hall-of-fame`
   - Sección "Precios" (`// 04`): `price-card` + `pricing-faq`
   - Sección final: `<h2>` + botón → `/games`

7. **Reemplazar `app/page.tsx` con Homepage** — una vez que `/games` está funcionando y Nav actualizado, sobreescribir `app/page.tsx` con el Homepage.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] La ruta `/` muestra el Homepage con las 7 secciones (Hero, ¿Por qué?, Juegos, Stats, Actividad, Precios, Final CTA)
- [ ] La ruta `/games` sirve la Biblioteca (hero, buscador, chips de categoría, grid de tarjetas)
- [ ] El link "Biblioteca" en el Nav apunta a `/games` y se activa en `/games` y `/games/[id]`
- [ ] El link "Inicio" en el Nav apunta a `/` y se activa en `/`
- [ ] Las rutas `/games/[id]`, `/games/[id]/play`, `/auth`, `/hall-of-fame` siguen funcionando sin cambios
- [ ] Los 8 pixel SVGs de `FloatingSilhouettes` son visibles en el Hero y se animan (float)
- [ ] Los 4 `feature-card` muestran iconos pixel correctos con color accent correspondiente (cyan, yellow, magenta, green)
- [ ] El mini-rail muestra exactamente 6 tarjetas (primeras de `GAMES`); click navega a `/games/[id]`
- [ ] La sección Stats muestra "12+", "MILES" y "GLOBAL" en texto estático
- [ ] La sección Actividad muestra 7 filas de puntuaciones y el top 5 de hoy
- [ ] El botón "VER SALÓN →" en Actividad navega a `/hall-of-fame`
- [ ] La sección Precios muestra el plan "$0 / SIEMPRE" con la lista de 6 beneficios y el FAQ de 3 preguntas
- [ ] El botón "EMPEZAR GRATIS →" en Precios navega a `/auth`
- [ ] El botón "INSERTAR MONEDA →" en la sección final navega a `/games`
- [ ] Los elementos con clase `.reveal` entran con animación de fade/slide al hacer scroll (IntersectionObserver)
- [ ] En mobile (< 840px) el layout de las secciones es de columna única y los botones CTA ocupan ancho completo

---

## Decisions taken and discarded

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Ruta de Biblioteca | `/games` | `/biblioteca` | El nav y referencias del template usan "games" como ruta natural; "/biblioteca" es español y rompe la consistencia de paths en inglés |
| Datos de actividad | Mock inline en el componente | Leer de `localStorage` (`av_scores`) | Sin backend real, la lectura de localStorage añade complejidad de hidratación y no aporta al objetivo visual del spec |
| Games preview | `GAMES.slice(0, 6)` determinista | Aleatorio | Aleatorio causaría hydration mismatch (SSR vs cliente); la referencia también usa los primeros 6 |
| Sub-componentes Home | Definidos en `app/page.tsx` | Archivos separados en `app/components/home/` | Son componentes usados exclusivamente en esta página; extraerlos no aporta reusabilidad real en este scope |
| useReveal | `app/hooks/useReveal.ts` compartido | Inline en el componente | Será reutilizado en About y otras páginas; el hook no tiene estado externo y es trivial de extraer |
| About | Fuera del scope | Incluido en este spec | El usuario confirmó que se trata en spec posterior |
