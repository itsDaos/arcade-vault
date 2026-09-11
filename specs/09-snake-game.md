# SPEC 09 — Snake Game

**State:** Aproved
**Depends on:** SPEC 05, SPEC 06
**Date:** 2026-09-11
**Objective:** Implementar el juego Snake como Client Component de Next.js en la ruta `/games/snake`, con sprites de frutas, dificultad creciente por velocidad, y persistencia de score en Supabase mediante el patrón de Asteroids.

---

## Scope

### Incluido

- Crear `app/games/snake/page.tsx` — página Next.js en la ruta `/games/snake`
- Crear `app/games/snake/SnakeGame.tsx` — Client Component (`'use client'`) con canvas 400×400, game loop por intervalo, y lógica completa escrita desde cero
- Grid de 20×20 celdas de 20px; el snake inicia en el centro con 3 segmentos
- Fruta visual: sprite apple de `references/source-assets/snake-assets/fruits.png` (coordenadas del atlas: `{ x:2786, y:136, w:110, h:160 }`)
- HUD externo al canvas: score y nivel como elementos React con tokens `var(--mono)`, `var(--cyan)`, `var(--ink)` del design system
- Velocidad creciente: cada 5 frutas comidas el intervalo de tick se reduce 10ms (mínimo 60ms)
- Nivel calculado como `Math.floor(frutasComidas / 5) + 1`, visible en HUD
- Controles: ArrowUp / ArrowDown / ArrowLeft / ArrowRight para dirección; Space reinicia en Game Over
- Game Over al chocar con pared o con el propio cuerpo
- Score = total de frutas comidas en la partida
- Overlay de Game Over: patrón Asteroids — input de nombre (pre-relleno de `localStorage('playerName')`), botón "Guardar score", top 5 inline
- Registrar el juego en Supabase: INSERT en `games` con slug `snake`
- Helper `getGameIdBySlug(slug)` en `app/actions/scores.ts` si aún no existe (generalización de `getAsteroidsGameId`)
- Verificar que `/leaderboard` muestra el ranking de Snake automáticamente

### Excluido

- Controles touch / mobile
- Sonido
- Múltiples tipos de fruta en una misma partida (solo apple)
- Paginación del leaderboard
- Auth de usuarios
- Paredes atravesables (wrap-around)
- Power-ups adicionales

---

## Data model

No se introducen tablas nuevas. El estado del juego vive en memoria dentro del componente.

Registrar el juego:

```sql
insert into games (slug, name, description)
values ('snake', 'Snake', 'Come frutas y crece sin chocarte. ¿Cuánto aguantas?');
```

> Ejecutar vía MCP `mcp__supabase__apply_migration` en el paso 4 del implementation plan.

---

## Implementation plan

1. **Crear `app/games/snake/page.tsx`** — renderiza `<SnakeGame />` con layout `min-h-screen bg-black flex flex-col items-center justify-center`.

2. **Crear `app/games/snake/SnakeGame.tsx`** — Client Component con:
   - `canvasRef = useRef<HTMLCanvasElement>(null)`
   - Estado React mínimo: `score`, `level`, `gameOver` (para el HUD externo y el overlay)
   - `useEffect` que carga `fruits.png` (via `new Image()`), inicializa el grid, y arranca el game loop con `setInterval`
   - Cleanup del `useEffect`: `clearInterval` + `removeEventListener` de teclado al desmontar

3. **Implementar lógica del juego dentro del `useEffect`**:
   - Estructuras: array de segmentos `{x, y}` para el snake; posición `{x, y}` para la fruta
   - Cada tick: calcular nueva cabeza según dirección, detectar colisión con pared o cuerpo, agregar cabeza al frente del array; si hay colisión → `gameOver`; si la cabeza coincide con la fruta → no eliminar cola (crecer) + incrementar score + reposicionar fruta; si no → eliminar cola
   - Render: limpiar canvas, dibujar grid (opcional, fondo oscuro), dibujar fruta con `ctx.drawImage` usando coordenadas del sprite atlas, dibujar cada segmento del snake (rectángulo verde con esquinas redondeadas o color sólido)
   - Al cambiar score: llamar a un callback o usar `ref` para sincronizar con estado React del HUD (`setScore`, `setLevel`)
   - Velocidad: `intervalMs = Math.max(60, 150 - Math.floor(score / 5) * 10)`; reiniciar el intervalo al cambiar de nivel
   - Detectar Game Over dentro del tick y llamar `setGameOver(true)`
   - Reinicio con Space: resetear todas las variables de estado del juego y reiniciar el intervalo

4. **Registrar en Supabase** — aplicar migración con `mcp__supabase__apply_migration`:

   ```sql
   insert into games (slug, name, description)
   values ('snake', 'Snake', 'Come frutas y crece sin chocarte. ¿Cuánto aguantas?');
   ```

5. **Overlay de Game Over** — reutilizar patrón de `app/games/asteroids/AsteroidsGame.tsx`:
   - Mostrar score final
   - Input de nombre pre-relleno de `localStorage.getItem('playerName')`
   - Botón "Guardar score" llama a `submitScore` de `app/actions/scores.ts`
   - Mostrar top 5 con `<TopScores gameSlug="snake" />`
   - Space reinicia sin guardar (si el overlay está visible, Space cierra overlay y reinicia)

6. **Helper `getGameIdBySlug`** en `app/actions/scores.ts` — si aún no existe, agregar función genérica:

   ```ts
   export async function getGameIdBySlug(slug: string): Promise<string>;
   ```

   y actualizar `submitScore` para usarla en lugar de `getAsteroidsGameId`.

7. **Verificar leaderboard** — confirmar que `/leaderboard` incluye Snake en el selector de juegos (debe aparecer automáticamente si la fila de `games` existe).

8. **Prueba manual** — `pnpm run dev` → `/games/snake` → ciclo completo: jugar, morir, guardar score, ver top 5, reiniciar.

9. **Build y lint** — `pnpm run build` y `pnpm run lint` sin errores.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] La ruta `/games/snake` existe y carga el juego
- [ ] El canvas es 400×400, centrado en fondo negro
- [ ] El snake inicia con 3 segmentos en el centro del grid
- [ ] ArrowUp/Down/Left/Right cambian la dirección; no se puede invertir 180°
- [ ] La fruta aparece como sprite apple de `fruits.png`
- [ ] Comer una fruta incrementa el score en 1 y alarga el snake
- [ ] Cada 5 frutas el intervalo de tick se reduce 10ms (velocidad aumenta)
- [ ] El nivel (HUD) se incrementa correctamente con la velocidad
- [ ] Chocar con la pared o con el propio cuerpo activa Game Over
- [ ] El overlay de Game Over muestra score, input de nombre y top 5
- [ ] El nombre persiste en `localStorage('playerName')`
- [ ] El score se guarda en `scores` y aparece en `/leaderboard`
- [ ] Space reinicia la partida desde el overlay de Game Over
- [ ] Sin memory leaks: `clearInterval` y `removeEventListener` al desmontar
- [ ] Ningún archivo fuera de `app/games/snake/`, `app/actions/scores.ts` y la migración de Supabase fue modificado (excepto `app/leaderboard/page.tsx` si necesita ajuste del selector)

---

## Decisions taken and discarded

| Decisión                  | Elegida                                   | Descartada                       | Motivo                                                                                                              |
| ------------------------- | ----------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Estrategia de integración | Client Component con canvas y setInterval | requestAnimationFrame            | Snake no requiere render continuo; un tick por intervalo es suficiente y simplifica la lógica de velocidad variable |
| Fuente del juego          | Desde cero                                | Portar started-games             | No existe carpeta started-games para Snake; se usa el sprite atlas de source-assets como único asset externo        |
| HUD                       | Externo al canvas (React)                 | Dibujado en canvas               | Consistencia con el design system de la plataforma y con el patrón de Asteroids                                     |
| Fruta visual              | Sprite apple de fruits.png                | Rectángulo de color / emoji      | Los assets existen; usarlos eleva la calidad visual sin complejidad adicional                                       |
| Velocidad                 | Intervalo decreciente (min 60ms)          | Velocidad fija                   | El usuario quiere dificultad creciente; el intervalo decreciente es la implementación más simple                    |
| Overlay Game Over         | Patrón Asteroids (con persistencia)       | Solo reinicio sin score          | Consistencia con los demás juegos; el leaderboard ya está implementado                                              |
| Frutas múltiples          | Excluido (solo apple)                     | Rotar frutas del atlas por nivel | Complejidad adicional sin impacto en el gameplay core; se puede agregar en un spec posterior                        |

---

## Identified risks

- **Sincronización score → HUD**: el game loop corre dentro del `useEffect` con variables locales; actualizar estado React (`setScore`) en cada tick puede causar re-renders frecuentes. Mitigación: usar un `ref` para el score interno y llamar `setScore` solo cuando cambia el valor.
- **Reinicio del intervalo al cambiar velocidad**: si `setInterval` se recrea en cada cambio de nivel, los listeners de teclado deben mantenerse vivos. Mitigación: gestionar el intervalo con un `intervalRef` y limpiarlo/recrearlo dentro del mismo `useEffect` al detectar cambio de nivel.
- **Carga de imagen asíncrona**: `fruits.png` debe estar cargado antes del primer render. Mitigación: iniciar el game loop dentro del callback `img.onload`.
- **`getGameIdBySlug` vs `getAsteroidsGameId`**: si la función genérica no existe, el implementador debe crearla sin romper el flujo de Asteroids existente.
