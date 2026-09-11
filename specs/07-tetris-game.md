# SPEC 07 — Tetris Game

**State:** Implemented
**Depends on:** SPEC 05, SPEC 06
**Date:** 2026-09-11
**Objective:** Portar el juego Tetris existente (vanilla JS + canvas) como Client Component de Next.js en la ruta `/games/tetris`, con HUD externo, preview de siguiente pieza, pausa, y el flujo completo de Game Over con submit de score a Supabase y top 5 inline.

---

## Scope

### Incluido

- Crear `app/games/tetris/page.tsx` — página Next.js en la ruta `/games/tetris`
- Crear `app/games/tetris/TetrisGame.tsx` — Client Component con canvas principal (300×600) y segundo canvas de next-piece (120×120)
- Portar toda la lógica de `references/started-games/03-tetris/game.js` dentro del `useEffect`
- HUD externo (React, fuera del canvas) con score, lines, level y next-piece preview usando `var(--mono)`, `var(--cyan)`, `var(--ink)` del design system
- Controles: ArrowLeft/Right (mover), ArrowUp/X (rotar), ArrowDown (soft drop), Space (hard drop), P (pausa)
- Pausa: tecla P muestra overlay "PAUSA"; P de nuevo reanuda
- Game Over overlay: patrón de Asteroids — input de nombre (pre-relleno de `localStorage('playerName')`), botón "Guardar score", top 5 inline
- Registrar el juego en Supabase: INSERT en `games` con slug `tetris`
- Generalizar `getAsteroidsGameId` → `getGameIdBySlug(slug)` en `app/actions/scores.ts` si aún no existe
- Verificar que `/leaderboard` muestra el ranking de Tetris automáticamente

### Excluido

- Sonido — no existía en el original
- Soporte mobile / controles touch
- Autenticación de usuarios
- Paginación del leaderboard
- Tema claro/oscuro (toggle del original) — no forma parte del design system de la plataforma
- Selector manual de tema en la pantalla del juego

---

## Data model

No se introducen tablas nuevas. Solo se inserta una fila en `games`:

```sql
insert into games (slug, name, description)
values ('tetris', 'Tetris', 'Encaja bloques antes de que lleguen al tope.');
```

Ejecutar vía MCP `mcp__supabase__apply_migration` en el paso 4 del implementation plan.

---

## Implementation plan

1. **Crear directorio y página** — `app/games/tetris/page.tsx` que renderiza `<TetrisGame />` con layout de pantalla completa (`min-h-screen bg-black flex items-center justify-center`).

2. **Crear `TetrisGame.tsx`** — Client Component (`'use client'`) con:
   - `canvasRef = useRef<HTMLCanvasElement>(null)` para el canvas principal (300×600)
   - `nextCanvasRef = useRef<HTMLCanvasElement>(null)` para la preview de next-piece (120×120)
   - Estado React para `score`, `lines`, `level` (actualizados desde el game loop vía `useRef` + `setState` en `updateHUD`)
   - Estado React para `gameOver` y `paused` (para renderizar los overlays)
   - `useEffect` que inicia el game loop con `requestAnimationFrame` y hace cleanup al desmontar (cancela `animId`, elimina el `keydown` listener)

3. **Portar lógica del juego** — copiar y adaptar `game.js`:
   - `COLS=10`, `ROWS=20`, `BLOCK=30`, `COLORS`, `PIECES`, `LINE_SCORES` declarados dentro o fuera del componente como constantes de módulo
   - `ctx` y `nextCtx` derivados de los refs dentro del `useEffect`
   - Las referencias a `scoreEl`, `linesEl`, `levelEl`, `overlay`, `restartBtn` del DOM se reemplazan: `updateHUD()` llama a setters de estado React; los overlays se renderizan en JSX condicionalmente
   - `endGame()` setea el estado `gameOver = true` en React (ref + setter)
   - `togglePause()` setea `paused` en React
   - El `keydown` listener se registra dentro del `useEffect` y se limpia en el cleanup

4. **Registrar el juego en Supabase** — aplicar migración con el INSERT en `games` (slug `tetris`).

5. **Game Over overlay** — reutilizar el patrón de `app/games/asteroids/AsteroidsGame.tsx`:
   - Al activarse `gameOver`, renderizar overlay React con el score final, input de nombre (pre-relleno de `localStorage('playerName')`), botón "Guardar score"
   - Llamar `submitScore` de `app/actions/scores.ts`
   - Mostrar top 5 con `<TopScores gameSlug="tetris" />`
   - Botón de reinicio llama a la función `init()` interna (via ref) y resetea el estado `gameOver`

6. **Generalizar helper en `scores.ts`** — si `getAsteroidsGameId` existe, extraer `getGameIdBySlug(slug: string)` y reemplazar su uso en Asteroids y en el nuevo componente Tetris.

7. **Verificar `/leaderboard`** — confirmar que el selector de juegos en `app/leaderboard/page.tsx` incluye Tetris automáticamente al existir la fila en `games`.

8. **Smoke test** — `pnpm run dev` → navegar a `/games/tetris` → ciclo completo: jugar, pausar, reanudar, game over, guardar score, verificar en `/leaderboard`.

9. **Build y lint** — `pnpm run build` y `pnpm run lint` sin errores.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] La ruta `/games/tetris` existe y carga el juego
- [ ] El canvas principal mide 300×600, centrado, sobre fondo negro
- [ ] El HUD externo muestra score, lines y level actualizados en tiempo real
- [ ] El canvas de next-piece (120×120) muestra la siguiente pieza correctamente
- [ ] ArrowLeft/Right mueven la pieza; ArrowUp/X la rotan con wall kicks; ArrowDown hace soft drop; Space hace hard drop
- [ ] La ghost piece (transparencia 0.2) se dibuja en la posición de caída
- [ ] La velocidad de caída aumenta al subir de nivel (`dropInterval = max(100, 1000 − (level−1)×90)`)
- [ ] Presionar P pausa el juego y muestra overlay "PAUSA"; P de nuevo lo reanuda
- [ ] Al terminar la partida aparece el overlay de Game Over con score, input de nombre y top 5
- [ ] El score se guarda en `scores` y aparece en `/leaderboard` bajo el juego "Tetris"
- [ ] El nombre del jugador persiste en `localStorage('playerName')` y se pre-rellena en la siguiente partida
- [ ] Desde el overlay de Game Over se puede reiniciar sin recargar la página
- [ ] Sin memory leaks: `requestAnimationFrame` cancelado y `keydown` listener eliminado al desmontar
- [ ] Ningún archivo fuera de `app/games/tetris/` y `app/actions/scores.ts` fue modificado (excepto `app/leaderboard/page.tsx` si requirió ajuste del selector)

---

## Decisions taken and discarded

| Decisión                  | Elegida                                          | Descartada                     | Motivo                                                                              |
| ------------------------- | ------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------- |
| Estrategia de integración | Client Component con canvas y useEffect          | iframe embebido                | Idiomático en Next.js; permite cleanup correcto e integración con Supabase          |
| HUD                       | Externo al canvas (React) con next-piece preview | HUD dibujado en canvas         | Consistencia con Asteroids y el design system de la plataforma                      |
| Pausa                     | Incluida (tecla P)                               | Excluida                       | El original la tiene y mejora UX sin complejidad extra                              |
| Tema claro/oscuro         | Excluido                                         | Toggle del original            | El design system de la plataforma no soporta temas por juego individual             |
| Game Over overlay         | Patrón Asteroids (nombre + score + top 5)        | Solo mostrar score sin guardar | Consistencia con la plataforma y el flujo ya definido en SPEC 06                    |
| Fuente del juego          | `references/started-games/03-tetris/game.js`     | Reescribir desde cero          | El original es completo, funcional y bien estructurado (~305 líneas)                |
| Score final               | Variable `score` al momento de `endGame()`       | Callback externo               | La variable es accesible directamente dentro del useEffect sin necesidad de lifting |

---

## Identified risks

- **Exposición del score al componente React**: el game loop muta variables locales del `useEffect`. Para que el overlay de Game Over lea el score correcto, se debe usar un `useRef` paralelo al setter de estado (`scoreRef.current = score` en cada update).
- **Dos canvas en el mismo componente**: `nextCanvasRef` debe estar montado antes de que `init()` llame a `drawNext()`; garantizar que el `useEffect` arranque solo cuando ambos refs están disponibles.
- **Pausa y RAF**: al reanudar, `lastTime` debe resetearse a `performance.now()` para evitar un salto de `dt` acumulado durante la pausa — el original ya lo hace correctamente; mantener ese patrón al portar.
- **`getGameIdBySlug` en scores.ts**: si la generalización rompe Asteroids, el leaderboard de ambos juegos falla. Verificar Asteroids después del refactor.
