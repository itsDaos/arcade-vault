# SPEC — Pong Clásico (Variante B — Mouse Neón Vectorial)

**State:** Draft
**Depends on:** SPEC 05, SPEC 06
**Date:** 2026-09-11
**Objective:** Implementar Pong single-player contra CPU con control por mouse (la paleta sigue el cursor verticalmente), estética neón vectorial (fondo oscuro, paletas y pelota con glow de colores, trazas de movimiento), dificultad endless con puntos ilimitados hasta perder 3 vidas, y persistencia de score máximo en Supabase.

---

## Scope

### Incluido

- Crear `app/games/pong/page.tsx` — página Next.js en la ruta `/games/pong`
- Crear `app/games/pong/PongGame.tsx` — Client Component (`'use client'`) con canvas 640×480
- Paleta del jugador (izquierda): 12×80px cyan (`#00fff7`), sigue `mousemove` sobre el canvas (centrar paleta en cursor Y)
- Paleta de la CPU (derecha): 12×80px magenta (`#ff00ff`), IA con velocidad escalonada por nivel
- Pelota: 12×12px blanca con glow amarillo; deja rastro de 5 posiciones previas (opacidad decreciente)
- Estética neón: fondo `#0a0a0f`, línea central punteada cyan tenue, marcadores con fuente monoespaciada de colores
- Sistema de vidas: el jugador empieza con 3 vidas; pierde una vida cuando la CPU anota; la CPU no pierde vidas
- Score: el jugador suma 1 punto por cada vez que la CPU no devuelve; el score es acumulativo e ilimitado
- Dificultad endless: cada 5 puntos del jugador la velocidad de la pelota aumenta 0.4px/frame y la IA mejora 0.3px/frame
- Nivel calculado como `Math.floor(playerScore / 5) + 1`, visible en HUD externo
- HUD externo: score, vidas (iconos de corazón `♥`) y nivel — tokens `var(--mono)`, `var(--cyan)`, `var(--ink)`
- Game Over cuando vidas llegan a 0; overlay con score final, input nombre, top 5
- Overlay Game Over: patrón Asteroids — input nombre (pre-relleno `localStorage('playerName')`), botón "Guardar score", top 5 inline
- Registrar juego en Supabase: INSERT en `games` con slug `pong`
- Helper `getGameIdBySlug(slug)` en `app/actions/scores.ts` (reutilizar — ya existe)
- Verificar que `/leaderboard` muestra el ranking de Pong automáticamente

### Excluido

- Sonido
- Control por teclado en esta variante (el mouse es el control exclusivo)
- Modo 2 jugadores
- Autenticación de usuarios
- Paginación del leaderboard
- Partida a puntos fijos (esta variante es endless hasta perder 3 vidas)

---

## Data model

No se introducen tablas nuevas.

```sql
insert into games (slug, name, description)
values ('pong', 'Pong', 'El clásico tenis de mesa digital. Vence a la CPU antes de que ella te venza.');
```

> Ejecutar vía MCP `mcp__supabase__apply_migration` en el paso 4 del implementation plan.

---

## Implementation plan

1. **Crear `app/games/pong/page.tsx`** — renderiza `<PongGame />` con layout `min-h-screen bg-black flex flex-col items-center justify-center`.

2. **Crear `app/games/pong/PongGame.tsx`** — Client Component con:
   - `canvasRef = useRef<HTMLCanvasElement>(null)`
   - Estado React mínimo: `score`, `lives`, `level`, `gameOver` para HUD externo y overlay
   - `useEffect` que registra `mousemove` en el canvas, inicializa estado y arranca game loop con `requestAnimationFrame`
   - Cleanup: `cancelAnimationFrame(rafId)` + `canvas.removeEventListener('mousemove')` al desmontar

3. **Implementar lógica del juego dentro del `useEffect`**:
   - Estructuras internas (refs):
     - `playerPaddle: { y: number }` — sigue `mouseY` del evento `mousemove` (clampear a `[0, canvas.height - 80]`)
     - `cpuPaddle: { y: number }` — velocidad inicial 4px/frame, aumenta 0.3px/frame cada 5 puntos del jugador (máximo 10px/frame)
     - `ball: { x, y, vx, vy, speed, trail: Array<{x,y}> }` — trail guarda las últimas 5 posiciones
     - `lives: number` (ref interna) y `score: number` (ref interna)
   - Cada frame:
     - **Input mouse**: `playerPaddle.y` se actualiza directamente en el handler `mousemove` (no en el frame loop)
     - **IA CPU**: mueve ±cpuSpeed hacia el centro de la pelota
     - **Física pelota**: `x += vx`, `y += vy`; rebote superior/inferior invierte `vy`; rebote en paleta: `vy = normalizedHit * ball.speed`, `vx = -vx`; push posición actual al `trail` (mantener máx 5 elementos)
     - **Punto jugador**: si `ball.x > canvas.width` → `score++`; si `score % 5 === 0` → `ball.speed += 0.4`; reposicionar pelota; llamar `setScore(score)` y `setLevel(Math.floor(score/5)+1)`
     - **Vida perdida**: si `ball.x < 0` → `lives--`; llamar `setLives(lives)`; si `lives === 0` → `setGameOver(true)`, detener RAF
   - **Render neón**:
     - `fillRect('#0a0a0f')` para limpiar
     - Línea central: segmentos de 4×8px cada 12px, color `rgba(0,255,247,0.2)`
     - Trail de la pelota: 5 rectángulos con opacidad decreciente (`rgba(255,255,0, 0.15 * i)`)
     - Pelota: `fillRect` blanco + `shadowColor = '#ffff00'`, `shadowBlur = 12`
     - Paleta jugador: `fillRect` cyan `#00fff7` + `shadowColor = '#00fff7'`, `shadowBlur = 8`
     - Paleta CPU: `fillRect` magenta `#ff00ff` + `shadowColor = '#ff00ff'`, `shadowBlur = 8`
     - Marcador en canvas: `ctx.font = '32px monospace'`, jugador en cyan, CPU en magenta

4. **Registrar en Supabase** — aplicar migración con `mcp__supabase__apply_migration`:

   ```sql
   insert into games (slug, name, description)
   values ('pong', 'Pong', 'El clásico tenis de mesa digital. Vence a la CPU antes de que ella te venza.');
   ```

5. **Overlay Game Over** — reutilizar patrón de `app/games/asteroids/AsteroidsGame.tsx`:
   - Mostrar score final del jugador
   - Input nombre pre-relleno de `localStorage.getItem('playerName')`
   - Botón "Guardar score" → `submitScore('pong', name, score)` de `app/actions/scores.ts`
   - Mostrar top 5 con `<TopScores gameSlug="pong" />`
   - Botón "Jugar de nuevo" reinicia el juego

6. **Verificar leaderboard** — confirmar que `/leaderboard` incluye Pong en el selector.

7. **Smoke test** — `pnpm run dev` → `/games/pong` → ciclo completo: mover mouse, anotar puntos, perder 3 vidas, ver overlay, guardar score.

8. **Build y lint** — `pnpm run build` y `pnpm run lint` sin errores.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] La ruta `/games/pong` existe y carga el juego
- [ ] El canvas es 640×480, centrado en fondo oscuro `#0a0a0f`
- [ ] La paleta del jugador sigue el cursor del mouse con fluidez
- [ ] La paleta no sale del canvas (clampeada a los bordes)
- [ ] La pelota deja rastro de posiciones previas con opacidad decreciente
- [ ] Las paletas y pelota muestran glow neón (cyan, magenta, amarillo)
- [ ] Un punto se anota cuando la pelota cruza el borde lateral correcto
- [ ] El jugador pierde una vida cuando la CPU anota; el HUD muestra `♥ ♥ ♥` reducirse
- [ ] Cada 5 puntos del jugador la velocidad de la pelota y la IA aumentan
- [ ] Game Over aparece al perder 3 vidas con score final, input nombre y top 5
- [ ] El score se guarda en `scores` y aparece en `/leaderboard` bajo "Pong"
- [ ] El nombre del jugador persiste en `localStorage('playerName')`
- [ ] Sin memory leaks: RAF cancelado y listeners eliminados al desmontar
- [ ] Ningún archivo fuera de `app/games/pong/` y `app/actions/scores.ts` fue modificado

---

## Decisions taken and discarded

| Decisión             | Elegida                                 | Descartada                           | Motivo                                                                              |
| -------------------- | --------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| Control              | Mouse (mousemove en canvas)             | Teclado (ArrowUp/ArrowDown)          | Variante B diferencia claramente de A; el mouse da control más preciso y fluido     |
| Estética visual      | Neón vectorial con glow (shadowBlur)    | Retro pixel blanco sobre negro       | Máxima diferenciación visual con variante A; shadowBlur es nativo del Canvas 2D API |
| Fin de partida       | Endless, pierde al quedarse sin 3 vidas | A 7 puntos como en variante A        | Diferencia el eje de progresión; scores más altos = más competición en leaderboard  |
| Score al leaderboard | Solo puntos del jugador (acumulados)    | Score basado en tiempo supervivencia | Más natural para Pong; fácil de comparar en leaderboard                             |
| Trail de pelota      | Array de últimas 5 posiciones en ref    | MotionBlur con CSS filter            | Refs son más performantes; CSS filters afectan todo el canvas, no solo la pelota    |

---

## Identified risks

- **React StrictMode doble montaje**: el `useEffect` se monta dos veces en desarrollo. Mitigación: retornar siempre `cancelAnimationFrame` en el cleanup.
- **mousemove fuera del canvas**: si el cursor sale del canvas durante el juego, la paleta deja de moverse. Mitigación: escuchar `mousemove` en el `window` en lugar del canvas, convirtiendo coordenadas con `getBoundingClientRect()`.
- **shadowBlur performance**: `shadowBlur` en Canvas 2D puede ser costoso en hardware lento. Mitigación: reducir `shadowBlur` a 8px y evitar múltiples capas de sombra; medir FPS en el smoke test.
- **Sincronización lives/score → estado React**: actualizar en cada frame causa re-renders. Mitigación: refs internas, `setLives`/`setScore` solo al cambiar el valor (punto anotado o vida perdida).
- **Pausa al servir**: se requiere pequeña pausa (500ms) al reposicionar la pelota; usar `setTimeout` guardado en ref para limpiarlo en cleanup y evitar llamadas en componente desmontado.
