# SPEC NN — <Name> Game

**State:** Draft
**Depends on:** SPEC 05, SPEC 06
**Date:** YYYY-MM-DD
**Objective:** Adaptar el juego <Name> (<source: vanilla JS + canvas / nuevo desde cero>) como Client Component de Next.js en la ruta `/games/<slug>`, con integración al leaderboard de la plataforma.

---

## Scope

### Incluido

- Crear `app/games/<slug>/page.tsx` — página Next.js en la ruta `/games/<slug>`
- Crear `app/games/<slug>/<Name>Game.tsx` — Client Component que monta el `<canvas>` y ejecuta el game loop
- Portar toda la lógica de `references/started-games/<folder>/game.js` al componente React usando `useEffect` y `useRef` _(omitir si es juego nuevo)_
- El canvas mide `<W>×<H>` lógico; escala con CSS (`width: 100%; height: auto`) dentro de un contenedor `max-width: <W>px`
- HUD externo al canvas (<campos: score, nivel, vidas, etc.>) con el design system de la plataforma (`var(--mono)`, `var(--cyan)`, `var(--ink)`)
- Game Over overlay: input de nombre del jugador (pre-relleno de `localStorage('playerName')`), botón "Guardar score", top 5 inline usando `<TopScores>`
- Registrar el juego en Supabase: INSERT en `games` (slug: `<slug>`, name: `<Name>`, description: `<desc>`)
- Helper `getGameIdBySlug(slug)` en `app/actions/scores.ts` si no existe aún
- El juego debe funcionar: <describir mecánicas principales — movimiento, objetivo, condición de Game Over, reinicio>

### Excluido

- Sonido — no existía en el original / fuera de scope inicial
- Soporte mobile / controles touch — spec posterior
- Header, navegación adicional ni layout de plataforma más allá del existente
- Autenticación de usuarios — spec posterior
- Paginación del leaderboard
- UPSERT best-score-per-player (histórico plano, un row por partida)

---

## Data model

No se introducen tablas nuevas. Solo se registra el juego en la tabla `games` existente:

```sql
insert into games (slug, name, description)
values ('<slug>', '<Name>', '<Descripción corta visible en la UI>');
```

Ejecutar vía MCP `mcp__supabase__apply_migration` en el paso 4 del implementation plan.

---

## Implementation plan

1. **Crear directorio y página** — `app/games/<slug>/page.tsx` que renderiza `<<Name>Game />` con layout de pantalla completa (`min-h-screen bg-black flex flex-col items-center justify-center`).

2. **Crear `<Name>Game.tsx`** — Client Component (`'use client'`) con:
   - `canvasRef = useRef<HTMLCanvasElement>(null)`
   - `useEffect` que inicia el game loop con `requestAnimationFrame` al montar
   - Cleanup del `useEffect` cancela el frame pendiente y elimina los event listeners de teclado
   - Estado React para el overlay de Game Over (`gameOver`, `finalScore`, `topScores`, `playerName`)
   - Toda la lógica del juego declarada dentro del `useEffect` para que capture `ctx` y `canvas` locales

3. **Portar lógica del juego** — copiar y adaptar `references/started-games/<folder>/game.js`: _(omitir si es juego nuevo)_
   - Las constantes `W = <W>`, `H = <H>` y `ctx` se derivan del `canvasRef` dentro del `useEffect`
   - `window.addEventListener` para teclado se registran dentro del `useEffect` y se limpian en el cleanup
   - Cuando la condición de Game Over se cumple (`<condición>`), el game loop llama a un callback o actualiza una ref que React detecta para mostrar el overlay

4. **Registrar en Supabase** — aplicar el INSERT de `games` vía MCP `mcp__supabase__apply_migration`.

5. **Helper `getGameIdBySlug`** — en `app/actions/scores.ts`, agregar (si no existe):

   ```ts
   export async function getGameIdBySlug(slug: string): Promise<string | null> {
     const { data } = await supabase
       .from("games")
       .select("id")
       .eq("slug", slug)
       .single();
     return data?.id ?? null;
   }
   ```

6. **Game Over overlay** — al detectar fin de partida, mostrar un overlay con:
   - Input de nombre (pre-relleno de `localStorage('playerName')`)
   - Botón "Guardar score" que llama `submitScore(gameId, playerName, finalScore)` de `app/actions/scores.ts`
   - Persiste el nombre en `localStorage('playerName')` al guardar
   - Muestra top 5 actualizado con el componente `<TopScores>` de `app/components/TopScores.tsx`
   - Botón "Jugar de nuevo" que reinicia el game loop

7. **Verificar leaderboard** — navegar a `/leaderboard` y confirmar que el selector incluye `<Name>` y que el top 10 se carga correctamente.

8. **Verificar** — `pnpm run dev`, navegar a `/games/<slug>` y recorrer el ciclo completo: jugar → Game Over → guardar score → ver top 5 → reiniciar.

9. **Verificar build** — `pnpm run build` y `pnpm run lint` sin errores de TypeScript ni lint.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] La ruta `/games/<slug>` existe y carga el juego
- [ ] El canvas es `<W>×<H>`, centrado en fondo negro
- [ ] Los controles responden: `<tecla>` hace `<acción>`, `<tecla>` hace `<acción>`
- [ ] _[Mecánica 1 del juego — describir comportamiento esperado]_
- [ ] _[Mecánica 2 del juego — describir comportamiento esperado]_
- [ ] Al terminar la partida aparece el overlay de Game Over con el score final
- [ ] El input de nombre se pre-rellena desde `localStorage('playerName')` si existe
- [ ] Al guardar el score, se inserta en `scores` y el overlay muestra el top 5 actualizado
- [ ] El nombre del jugador queda en `localStorage` para la siguiente partida
- [ ] `/leaderboard` muestra el top 10 de `<Name>` con rank, nombre, score y fecha
- [ ] Sin memory leaks: `requestAnimationFrame` cancelado y listeners eliminados al desmontar el componente
- [ ] La fila `<slug>` existe en la tabla `games` de Supabase tras la migración
- [ ] Ningún archivo fuera de `app/games/<slug>/` y `app/actions/scores.ts` fue modificado (excepto `app/leaderboard/page.tsx` si el selector requirió ajuste)

---

## Decisions taken and discarded

| Decisión                  | Elegida                                             | Descartada                 | Motivo                                                                                                              |
| ------------------------- | --------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Estrategia de integración | Client Component con canvas y useEffect             | iframe embebido            | El Client Component es idiomático en Next.js, permite limpieza correcta y facilita integración futura con Supabase  |
| HUD                       | Externo al canvas con design system                 | Interno dibujado en canvas | Consistencia visual con la plataforma; más fácil de mantener                                                        |
| Persistencia del score    | Histórico plano (un row por partida)                | UPSERT best-score          | Simplicidad; el top N ya filtra los mejores                                                                         |
| Fuente del juego          | `references/started-games/<folder>/game.js` / nuevo | _alternativa_              | _motivo_                                                                                                            |
| Estado del juego          | Variables locales dentro del useEffect              | useReducer / zustand       | El juego usa un loop imperativo con mutación directa; extraerlo a estado React introduciría complejidad innecesaria |

---

## Identified risks

- **Exposición del score al componente React**: el game loop es imperativo; necesita un mecanismo para notificar a React cuando ocurre Game Over (callback ref o variable mutable que el overlay lee). Solución canónica en Asteroids: ref mutable compartida entre el loop y el handler del overlay.
- **Selector de `/leaderboard`**: si la página asume un solo juego, puede requerir ajuste para mostrar el selector cuando hay más de una fila en `games`. Revisar `app/leaderboard/page.tsx` antes de implementar.
