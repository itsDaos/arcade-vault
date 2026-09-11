# SPEC 05 — Asteroids Game

**State:** Implemented
**Depends on:** SPEC 04
**Date:** 2026-09-10
**Objective:** Adaptar el juego Asteroids existente (vanilla JS + canvas) como Client Component de Next.js en la ruta `/games/asteroids`, sin persistencia de score ni layout de plataforma.

---

## Scope

### Incluido

- Crear `app/games/asteroids/page.tsx` — página Next.js en la ruta `/games/asteroids`
- Crear `app/games/asteroids/AsteroidsGame.tsx` — Client Component que monta el `<canvas>` y ejecuta el game loop
- Portar toda la lógica de `references/started-games/02-asteroids/game.js` al componente React usando `useEffect` y `useRef`
- El canvas mide 800×600 lógico; escala con CSS (`width: 100%; height: auto`) dentro de un contenedor `max-width: 800px` para que no desborde en viewports pequeños
- HUD externo al canvas (score, nivel, vidas, triple-shot) con el design system de la plataforma (`var(--mono)`, `var(--cyan)`, `var(--ink)`)
- El juego debe funcionar igual que el original: movimiento, disparo, niveles, powerUp triple-shot, vidas, game over, reinicio con Space

### Excluido

- Guardar score en Supabase — spec posterior
- Header, navegación, ni layout de plataforma — spec posterior
- Soporte mobile / controles touch — spec posterior
- Sonido — no existía en el original, no se agrega aquí

---

## Data model

No se introducen tablas ni tipos nuevos. El estado del juego vive exclusivamente en memoria dentro del componente (refs y variables locales del `useEffect`).

---

## Implementation plan

1. **Crear directorio y página** — `app/games/asteroids/page.tsx` que renderiza `<AsteroidsGame />` con un layout de pantalla completa (`min-h-screen bg-black flex items-center justify-center`).

2. **Crear `AsteroidsGame.tsx`** — Client Component (`'use client'`) con:
   - `canvasRef = useRef<HTMLCanvasElement>(null)`
   - `useEffect` que inicia el game loop con `requestAnimationFrame` al montar
   - Cleanup del `useEffect` cancela el frame pendiente y elimina los event listeners de teclado
   - Toda la lógica de clases (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`) y funciones de estado (`initGame`, `update`, `draw`, `nextLevel`, etc.) declaradas dentro del `useEffect` para que capturen el `ctx` y `canvas` locales

3. **Portar lógica del juego** — copiar y adaptar `game.js`:
   - Las constantes `W = 800`, `H = 600` y `ctx` se derivan del `canvasRef` dentro del `useEffect`
   - `window.addEventListener` para teclado se registran dentro del `useEffect` y se limpian en el cleanup
   - No hay cambios en la lógica de gameplay, física, colisiones ni renderizado

4. **Verificar** — ejecutar `pnpm run dev`, navegar a `http://localhost:3000/games/asteroids` y confirmar que el juego arranca, responde a teclado y el ciclo completo (jugar → game over → reiniciar) funciona.

5. **Verificar build** — `pnpm run build` sin errores de TypeScript ni lint.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] La ruta `/games/asteroids` existe y carga el juego
- [ ] El canvas es 800×600, centrado en fondo negro, sin UI adicional
- [ ] La nave se mueve con ArrowLeft/ArrowRight/ArrowUp y dispara con Space
- [ ] Los asteroides se dividen correctamente al ser destruidos
- [ ] El powerUp triple-shot aparece y funciona
- [ ] Las vidas se decrementan al morir; game over al llegar a 0
- [ ] Presionar Space en game over reinicia la partida
- [ ] Al limpiar el nivel se pasa al siguiente con más asteroides
- [ ] No hay memory leaks: el `requestAnimationFrame` se cancela y los listeners se eliminan al desmontar el componente
- [ ] Ningún archivo fuera de `app/games/asteroids/` fue modificado

---

## Decisions taken and discarded

| Decisión                  | Elegida                                 | Descartada                     | Motivo                                                                                                              |
| ------------------------- | --------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Estrategia de integración | Client Component con canvas y useEffect | iframe embebido                | El Client Component es idiomático en Next.js, permite limpieza correcta y facilita integración futura con Supabase  |
| Ruta                      | `/games/asteroids`                      | `/asteroids`                   | Escala mejor cuando se agreguen más juegos                                                                          |
| Persistencia de score     | Fuera de scope                          | INSERT a Supabase en este spec | El usuario confirmó que la integración con DB va en spec posterior                                                  |
| Wrapper visual            | Solo canvas, fondo negro                | Layout con nav de plataforma   | El usuario quiere la experiencia de juego pura primero; nav se agrega en spec posterior                             |
| Estado del juego          | Variables locales dentro del useEffect  | useReducer / zustand           | El juego usa un loop imperativo con mutación directa; extraerlo a estado React introduciría complejidad innecesaria |
