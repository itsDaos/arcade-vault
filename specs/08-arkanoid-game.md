# SPEC 08 — Arkanoid Game

**State:** Implemented
**Depends on:** SPEC 05, SPEC 06
**Date:** 2026-09-11
**Objective:** Portar el juego Arkanoid (vanilla JS + canvas) como Client Component de Next.js en la ruta `/games/arkanoid`, con HUD externo, 5 niveles, animaciones de explosión y persistencia de score en Supabase.

---

## Scope

### Incluido

- Crear `app/games/arkanoid/page.tsx` — página Next.js en la ruta `/games/arkanoid`
- Crear `app/games/arkanoid/ArkanoidGame.tsx` — Client Component (`'use client'`) con `canvasRef`, `useEffect` que inicia el game loop, y cleanup
- Portar toda la lógica de `references/started-games/04-arkanoid/game.js` y `levels.js` dentro del componente
- Copiar assets necesarios: `references/started-games/04-arkanoid/assets/spritesheet-breakout.png` y `spritesheet.js` a `public/games/arkanoid/`
- Canvas 800×600 lógico; escala con CSS dentro de contenedor `max-width: 800px`
- HUD externo al canvas con el design system de la plataforma (`var(--mono)`, `var(--cyan)`, `var(--ink)`) — score, vidas, nivel
- Controles: ← → para mover el paddle + mouse (`mousemove` sobre el canvas)
- Pausa con P o Escape
- 5 niveles con velocidad creciente (+10 % por nivel); pasar al siguiente nivel al destruir todos los bloques
- Animación de explosión al destruir un bloque (spritesheet, 4 frames) — sin sonido
- Game Over al perder las 3 vidas: overlay estándar — input nombre (pre-relleno de `localStorage('playerName')`), botón "Guardar score", top 5 inline
- Pantalla de victoria ("¡Completaste el juego!") con el mismo overlay y botón de guardar score
- Registrar juego en Supabase: INSERT en `games`
- Helper `getGameIdBySlug(slug)` en `app/actions/scores.ts` si aún no existe (generalización de `getAsteroidsGameId`)
- Verificar que `/leaderboard` muestra el ranking de Arkanoid automáticamente

### Excluido

- Sonidos (ball-bounce.mp3, break-sound.mp3) — no se portan
- Soporte mobile / controles touch
- Autenticación de usuario
- Paginación del leaderboard
- Selector de nivel en overlay de pausa (la funcionalidad original se omite para mantener el scope acotado)
- Cualquier modificación fuera de `app/games/arkanoid/`, `app/actions/scores.ts` y `public/games/arkanoid/`

---

## Data model

No se introducen tablas nuevas. El estado del juego vive en memoria dentro del componente.

Registrar el juego en la tabla `games`:

```sql
insert into games (slug, name, description)
values ('arkanoid', 'Arkanoid', 'Rompe bloques con la paleta antes de perder tus 3 vidas.');
```

> Ejecutar vía MCP `mcp__supabase__apply_migration` en el paso 4 del implementation plan.

---

## Implementation plan

1. **Copiar assets** — copiar `spritesheet-breakout.png` y `assets/spritesheet.js` a `public/games/arkanoid/` para que Next.js los sirva como estáticos.

2. **Crear directorio y página** — `app/games/arkanoid/page.tsx` que renderiza `<ArkanoidGame />` con layout de pantalla completa (`min-h-screen bg-black flex flex-col items-center justify-center`). El HUD externo (score, vidas, nivel) se muestra encima del canvas usando el design system de la plataforma.

3. **Crear `ArkanoidGame.tsx`** — Client Component con:
   - `canvasRef = useRef<HTMLCanvasElement>(null)`
   - Estado React mínimo: `score`, `lives`, `level`, `gameState` (`'playing' | 'gameover' | 'victory'`) para el HUD externo y el overlay
   - `useEffect` que inicia el game loop con `requestAnimationFrame` al montar
   - Cleanup cancela el frame pendiente, elimina event listeners de teclado y mouse
   - La lógica de `game.js` y `levels.js` se porta íntegramente dentro del `useEffect`; los helpers de spritesheet se importan desde `public/games/arkanoid/spritesheet.js` o se inline-copian al componente
   - El paddle responde a `mousemove` sobre el canvas (calcular posición escalada) y a `keydown`/`keyup` de ArrowLeft/ArrowRight
   - Al detectar Game Over o Victoria, actualizar el estado React para mostrar el overlay

4. **Registrar juego en Supabase** — ejecutar el INSERT de la sección Data model vía `mcp__supabase__apply_migration`.

5. **Helper `getGameIdBySlug`** — en `app/actions/scores.ts`, si no existe una función genérica por slug, agregar:

   ```ts
   async function getGameIdBySlug(slug: string): Promise<string>;
   ```

   y actualizar `submitScore` para usarla en lugar del helper hardcodeado de Asteroids.

6. **Game Over / Victory overlay** — reutilizar el patrón de `app/games/asteroids/AsteroidsGame.tsx`:
   - Input de nombre (pre-relleno de `localStorage('playerName')`)
   - Botón "Guardar score" → llama `submitScore` con el slug `'arkanoid'`
   - Top 5 con `<TopScores gameSlug="arkanoid" />`
   - Guardar nombre en `localStorage('playerName')` al enviar

7. **Verificar dev** — `pnpm run dev` → navegar a `/games/arkanoid`, recorrer el ciclo completo: jugar → perder una vida → game over → guardar score → ver top 5 → comprobar que `/leaderboard` muestra Arkanoid en el selector.

8. **Verificar build** — `pnpm run build` y `pnpm run lint` sin errores.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] La ruta `/games/arkanoid` existe y carga el juego
- [ ] El canvas es 800×600, centrado en fondo negro
- [ ] HUD externo muestra score, vidas y nivel con los tokens del design system
- [ ] El paddle se mueve con ← → y con el mouse
- [ ] La pelota rebota en paredes, paddle y bloques correctamente
- [ ] Los bloques se destruyen al contacto; la animación de explosión (4 frames) se reproduce
- [ ] Al destruir todos los bloques se pasa al siguiente nivel (velocidad incrementa un 10 %)
- [ ] Al completar el nivel 5 aparece el overlay de victoria
- [ ] Al perder las 3 vidas aparece el overlay de game over
- [ ] El overlay muestra el score, input de nombre (pre-relleno de `localStorage`) y top 5
- [ ] El score se guarda en `scores` y aparece en `/leaderboard` bajo Arkanoid
- [ ] El nombre del jugador persiste en `localStorage('playerName')`
- [ ] P o Escape pausa y reanuda el juego
- [ ] Sin memory leaks: `requestAnimationFrame` cancelado y listeners eliminados al desmontar
- [ ] Ningún archivo fuera de `app/games/arkanoid/`, `app/actions/scores.ts` y `public/games/arkanoid/` fue modificado (excepto `app/leaderboard/page.tsx` solo si requirió ajuste del selector)

---

## Decisions taken and discarded

| Decisión                   | Elegida                                 | Descartada                                    | Motivo                                                                         |
| -------------------------- | --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| Estrategia de integración  | Client Component con canvas y useEffect | iframe embebido                               | Idiomático en Next.js, permite limpieza correcta e integración con Supabase    |
| HUD                        | Externo al canvas con design system     | Interno dibujado en canvas (como el original) | Consistencia visual con Asteroids y Tetris en la plataforma                    |
| Controles                  | Mouse + teclado ← →                     | Solo teclado                                  | El original ya soporta mouse; mejor UX sin costo adicional                     |
| Sonidos                    | Excluidos                               | Portar ball-bounce.mp3 y break-sound.mp3      | Reduce complejidad del port; no es un criterio de aceptación de la plataforma  |
| Animaciones de explosión   | Incluidas (spritesheet)                 | Excluidas                                     | Ya existe en el original; el spritesheet es un asset estático fácil de copiar  |
| Selector de nivel en pausa | Excluido                                | Incluir overlay de pausa con botones 1–5      | Fuera del flujo principal de la plataforma; se puede agregar en spec posterior |
| Persistencia de score      | Supabase (submitScore de scores.ts)     | Estado local / localStorage                   | Consistencia con el sistema de leaderboard existente                           |
| Helper de game ID          | `getGameIdBySlug(slug)` genérico        | `getAsteroidsGameId` duplicado                | Evita código repetido al agregar más juegos                                    |

---

## Identified risks

- **Port del game loop**: `game.js` usa `canvas` y `ctx` globales. Dentro del `useEffect` hay que reasignarlos del `canvasRef`; cualquier referencia global residual romperá el juego en StrictMode (doble montaje).
- **spritesheet.js como módulo**: el helper original es un script vanilla. Habrá que inline-copiarlo o convertirlo en módulo ES para importarlo en el componente.
- **Exposición del score final a React**: el score vive en una variable local del game loop; hay que sincronizarlo al estado React (`setScore`) en cada frame o solo al detectar Game Over/Victoria para no causar re-renders por frame.
- **Mouse escalado**: el canvas se escala con CSS (`width: 100%`); la posición del mouse debe compensarse con `canvas.getBoundingClientRect()` y el ratio `canvas.width / rect.width`.
