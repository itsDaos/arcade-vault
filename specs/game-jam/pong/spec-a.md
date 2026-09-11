# SPEC — Pong Clásico (Variante A — Teclado Retro Purista)

**State:** Draft
**Depends on:** SPEC 05, SPEC 06
**Date:** 2026-09-11
**Objective:** Implementar Pong clásico single-player contra CPU con estética retro pixel (fondo negro, paletas y pelota blancas, línea central punteada), control exclusivo por teclado (ArrowUp/ArrowDown), dificultad creciente por velocidad de pelota, y persistencia de score en Supabase.

---

## Scope

### Incluido

- Crear `app/games/pong/page.tsx` — página Next.js en la ruta `/games/pong`
- Crear `app/games/pong/PongGame.tsx` — Client Component (`'use client'`) con canvas 640×480
- Paleta del jugador (izquierda): 12×80px, control ArrowUp / ArrowDown
- Paleta de la CPU (derecha): 12×80px, IA simple — sigue el centro de la pelota con velocidad máxima limitada (4px/frame al inicio)
- Pelota: 12×12px blanca; rebote en paredes superior/inferior; rebote en paletas con ángulo según punto de impacto (tercio superior → arriba, tercio inferior → abajo, centro → recto)
- Score: punto para el jugador cuando la CPU no devuelve; punto para CPU cuando el jugador no devuelve
- El score enviado al leaderboard es exclusivamente el **score del jugador** al final de la partida
- Partida a 7 puntos: quien llega primero gana; se muestra overlay de Victoria o Derrota
- Dificultad progresiva: velocidad de la pelota aumenta 0.5px/frame cada vez que el jugador anota un punto (máximo 12px/frame)
- Canvas estilo retro: fondo negro (#000), paletas y pelota blancas (#fff), línea central punteada blanca, marcador dibujado en canvas (fuente monoespaciada)
- HUD externo mínimo al canvas: estado de partida (`var(--mono)`, `var(--cyan)`) — solo "PONG" como título
- Overlay Game Over / Victory: patrón Asteroids — input nombre (pre-relleno `localStorage('playerName')`), botón "Guardar score", top 5 inline
- Registrar juego en Supabase: INSERT en `games` con slug `pong`
- Helper `getGameIdBySlug(slug)` en `app/actions/scores.ts` (reutilizar — ya existe)
- Verificar que `/leaderboard` muestra el ranking de Pong automáticamente

### Excluido

- Sonido (beeps de rebote)
- Controles touch / mobile
- Modo 2 jugadores (multiplayer)
- Autenticación de usuarios
- Paginación del leaderboard
- Niveles discretos explícitos (la dificultad es continua)
- Efectos de partículas al anotar

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
   - Estado React mínimo: `playerScore`, `cpuScore`, `gameState: 'playing' | 'win' | 'lose'` para HUD y overlay
   - `useEffect` que inicializa estado del juego y arranca el game loop con `requestAnimationFrame`
   - Cleanup: `cancelAnimationFrame(rafId)` + `removeEventListener('keydown')` + `removeEventListener('keyup')` al desmontar

3. **Implementar lógica del juego dentro del `useEffect`**:
   - Estructuras internas (refs, no estado React):
     - `playerPaddle: { y: number }` — x fijo en 20px
     - `cpuPaddle: { y: number }` — x fijo en canvas.width - 32px
     - `ball: { x, y, vx, vy, speed }` — velocidad inicial 5px/frame en ángulo aleatorio (±30° de la horizontal)
     - `keys: Set<string>` — teclas actualmente presionadas
   - Cada frame:
     - **Input jugador**: si `ArrowUp` en `keys` y `paddle.y > 0` → `y -= 5`; si `ArrowDown` y `paddle.y + 80 < canvas.height` → `y += 5`
     - **IA CPU**: calcula centro de la pelota vs centro de su paleta; mueve ±4px/frame hacia la pelota (velocidad de IA aumenta 0.3px/frame cada punto del jugador, máximo 9px)
     - **Física pelota**: `x += vx`, `y += vy`; rebote superior/inferior invierte `vy`; rebote en paleta calcula ángulo según `(ballCenter - paddleCenter) / (paddleHeight / 2)` → `vy = normalizedHit * ball.speed`, `vx = -vx`
     - **Punto**: si `ball.x < 0` → `cpuScore++`; si `ball.x > canvas.width` → `playerScore++` y `ball.speed += 0.5`; reposicionar pelota al centro con nueva dirección aleatoria; pausar 1 segundo antes de servir
     - **Fin de partida**: si `playerScore === 7` → `setGameState('win')`; si `cpuScore === 7` → `setGameState('lose')`; detener RAF
   - **Render**: limpiar con `fillRect('#000')`; dibujar línea central punteada (segmentos de 8×2px cada 16px verticales); dibujar marcadores con `ctx.font = '48px monospace'`; dibujar paletas (`fillRect`); dibujar pelota (`fillRect`)
   - Sincronización score: usar refs internamente, llamar `setPlayerScore` / `setCpuScore` al anotar (no en cada frame)

4. **Registrar en Supabase** — aplicar migración con `mcp__supabase__apply_migration`:

   ```sql
   insert into games (slug, name, description)
   values ('pong', 'Pong', 'El clásico tenis de mesa digital. Vence a la CPU antes de que ella te venza.');
   ```

5. **Overlay fin de partida** — reutilizar patrón de `app/games/asteroids/AsteroidsGame.tsx`:
   - Título: "VICTORIA" (verde `var(--cyan)`) o "DERROTA" (rojo) según `gameState`
   - Mostrar score final del jugador
   - Input nombre pre-relleno de `localStorage.getItem('playerName')`
   - Botón "Guardar score" llama a `submitScore('pong', name, playerScore)` de `app/actions/scores.ts`
   - Mostrar top 5 con `<TopScores gameSlug="pong" />`
   - Botón "Jugar de nuevo" reinicia sin guardar (o tras guardar)

6. **Verificar leaderboard** — confirmar que `/leaderboard` incluye Pong en el selector.

7. **Smoke test** — `pnpm run dev` → `/games/pong` → ciclo completo: jugar partida completa, ver overlay, guardar score, ver top 5.

8. **Build y lint** — `pnpm run build` y `pnpm run lint` sin errores.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] La ruta `/games/pong` existe y carga el juego
- [ ] El canvas es 640×480, centrado en fondo negro
- [ ] ArrowUp / ArrowDown mueven la paleta del jugador sin salirse del canvas
- [ ] La pelota rebota correctamente en paredes y paletas
- [ ] El ángulo de rebote varía según el punto de impacto en la paleta
- [ ] La CPU responde con IA que puede ser superada
- [ ] Un punto se anota correctamente cuando la pelota cruza el borde lateral
- [ ] La velocidad de la pelota aumenta con cada punto del jugador
- [ ] La partida termina al llegar a 7 puntos (jugador o CPU)
- [ ] El overlay muestra "VICTORIA" o "DERROTA" con el score del jugador, input de nombre y top 5
- [ ] El score se guarda en `scores` y aparece en `/leaderboard` bajo "Pong"
- [ ] El nombre del jugador persiste en `localStorage('playerName')`
- [ ] Sin memory leaks: RAF cancelado y listeners eliminados al desmontar
- [ ] Ningún archivo fuera de `app/games/pong/` y `app/actions/scores.ts` fue modificado

---

## Decisions taken and discarded

| Decisión             | Elegida                                       | Descartada                           | Motivo                                                                   |
| -------------------- | --------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| Control              | Teclado (ArrowUp/ArrowDown)                   | Mouse/puntero                        | Variante A es purista retro; el teclado es el control canónico de Pong   |
| Estética visual      | Retro pixel (blanco sobre negro, sin efectos) | Neón vectorial con glow              | Fidelidad máxima al original; implementación más simple sin CSS filters  |
| Fin de partida       | A 7 puntos                                    | Tiempo límite o puntos infinitos     | Partidas acotadas (<5 min), claras para el leaderboard                   |
| Score al leaderboard | Solo puntos del jugador                       | Diferencia de puntos (jugador - CPU) | Más intuitivo y consistente con el resto de juegos                       |
| RAF vs setInterval   | requestAnimationFrame                         | setInterval                          | RAF pausa automáticamente en tabs inactivos; mejor para juegos continuos |

---

## Identified risks

- **React StrictMode doble montaje**: en desarrollo, el `useEffect` se monta dos veces. Si el RAF no se cancela en el cleanup, habrá dos loops corriendo simultáneamente. Mitigación: siempre retornar la función de cleanup con `cancelAnimationFrame`.
- **Sincronización estado React**: actualizar `playerScore`/`cpuScore` en cada frame causaría re-renders. Mitigación: usar refs para el estado interno del juego y llamar `setPlayerScore` solo al anotar un punto.
- **Pausa al servir**: la pausa de 1 segundo entre puntos usa `setTimeout`; si el componente se desmonta durante la pausa, el timeout dispara en un componente unmounted. Mitigación: guardar el id del timeout en una ref y limpiarlo en el cleanup.
- **IA demasiado fácil o difícil**: la velocidad de IA debe estar calibrada para que sea desafiante pero vencible. El límite de 9px/frame para la IA vs 12px/frame para la pelota asegura que el jugador hábil siempre pueda ganar con ángulos extremos.
