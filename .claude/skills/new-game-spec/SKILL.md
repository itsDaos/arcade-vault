---
name: new-game-spec
description: Genera un spec para agregar un juego nuevo a Arcade Vault (portado desde references/started-games/ o creado desde cero) con su integración a leaderboard/Supabase. Sigue el patrón de specs 05 y 06.
disable-model-invocation: true
argument-hint: "slug o descripción corta del juego (ej: tetris, arkanoid)"
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), mcp__supabase__execute_sql, mcp__supabase__list_tables
---

# /new-game-spec — Generador de spec para juegos en Arcade Vault

## Session context

Today's date (usa este valor exacto en el header del spec, nunca lo asumas):
!`date +%F`

Specs que ya existen en el proyecto:
!`ls specs/ 2>/dev/null | sort || echo "La carpeta specs/ no existe"`

Juegos de referencia disponibles para portar:
!`ls references/started-games/ 2>/dev/null || echo "No hay juegos de referencia"`

Rutas de juegos ya integradas:
!`ls app/games/ 2>/dev/null || echo "Ninguno"`

---

Este skill produce un único archivo `specs/NN-<slug>-game.md` siguiendo el patrón de los specs 05 (Asteroids Game) y 06 (Leaderboard y tabla de juegos). **No escribe código.** Su trabajo termina cuando el spec está guardado.

## Filosofía

Un spec no es documentación decorativa: es el contrato que guía la ejecución posterior. Si el spec es vago, el código improvisa. Por eso la Fase 2 (preguntas) es deliberadamente lenta y la Fase 3 (escritura) es rápida.

Lee `template.md` (en el mismo directorio que este skill) para ver la estructura completa del spec.

---

## Flujo de fases

### Fase 1 — Contexto del proyecto

Antes de hacer preguntas sobre el juego, asegúrate de entender el proyecto:

1. Leer `CLAUDE.md` y `AGENTS.md` — especialmente las notas de Next.js 16, Tailwind v4 y el workflow Spec Driven Design.
2. Leer `specs/05-asteroids-game.md` y `specs/06-leaderboard-and-games.md` — son el patrón canónico que este spec debe seguir (estructura, lenguaje, convenciones de nombre de secciones y estado).
3. Usar el session context de arriba para ver qué juegos de referencia hay y qué rutas de juegos ya existen.
4. Consultar los slugs ya ocupados en Supabase:
   ```sql
   select slug, name from games order by created_at;
   ```
   Ejecutar con `mcp__supabase__execute_sql`. Si la tabla no existe todavía, seguir de todas formas y anotar esa dependencia.

Si `$ARGUMENTS` llega vacío, pedir al usuario una **descripción en una sola frase** del juego que quiere agregar. Si no cabe en una frase, el juego está fuera de scope — sugerir dividirlo.

### Fase 2 — Preguntas por bloques

Esta es la fase más importante. Tu trabajo aquí es **detectar ambigüedades y preguntar**, no asumir.

Haz las preguntas en bloques de 3 a 5. Usa `AskUserQuestion` cuando el entorno lo soporte — el usuario elige en vez de tipear. Pon tu recomendación primero y márcala. Espera respuesta antes de continuar.

**Bloque A — Fuente e identidad**

1. **Fuente**: ¿Viene de `references/started-games/<carpeta>` (mostrar lista) o se crea desde cero?
2. **Slug**: string kebab-case único, ej. `tetris`. Verificar que no colisiona con los slugs ya en Supabase ni con las rutas en `app/games/`.
3. **Nombre y descripción**: texto visible en la UI y en la fila de `games` en la base de datos (ej. nombre: "Tetris", descripción: "Encaja bloques antes de que lleguen al tope.").

**Bloque B — Canvas y controles** 4. **Dimensiones lógicas del canvas**: ancho × alto en píxeles (ej. 800×600 como Asteroids, 300×600 como Tetris clásico). 5. **Controles de teclado**: teclas de movimiento, acción principal, reinicio en Game Over (documentar para el spec). 6. **Condición de Game Over**: ¿qué evento termina la partida? ¿Cómo se lee el `score` final del game loop? (puede ser una variable, un ref, o un callback).

**Bloque C — HUD y UX** 7. **HUD**: ¿externo al canvas (como Asteroids, usando el design system) o interno dibujado en canvas? La recomendación es externo. 8. **Niveles/dificultad**: ¿el juego tiene niveles progresivos o dificultad creciente? ¿Power-ups? 9. **Overlay de Game Over**: usar patrón de Asteroids — input de nombre (pre-relleno de `localStorage('playerName')`), botón "Guardar score", top 5 inline. ¿Alguna variación?

**Cuándo parar de preguntar:**

Para cuando puedas responder estas tres preguntas sin asumir nada:

1. ¿Qué archivos van a aparecer o cambiar?
2. ¿Cuál es el primer paso ejecutable y cuál es el último?
3. ¿Cómo verifico que el juego está terminado?

Si no puedes responder alguna, sigue preguntando.

### Fase 3 — Escribir el spec

Si tienes toda la información de Fase 2, **escribe el spec completo de una sola vez** y ve a Fase 4. No pidas confirmación sección por sección; el usuario ya respondió todo en Fase 2.

Solo si falta información (el usuario acortó Fase 2 o una respuesta fue vaga), desarrolla las secciones **una por una** y pide confirmación antes de avanzar.

El contenido sigue la estructura de `template.md`:

1. **Header** — State: `Draft`, Depends on (mínimo SPEC 05 y SPEC 06), Date (tomada del session context), Objective en una sola frase.
2. **Scope** — Incluido / Excluido. El "Excluido" debe ser explícito: sonido, mobile/touch, auth, paginación de leaderboard, etc.
3. **Data model** — Normalmente "No se introducen tablas nuevas" + el INSERT en `games`:
   ```sql
   insert into games (slug, name, description)
   values ('<slug>', '<Name>', '<desc>');
   ```
   Agregar nota: "Ejecutar vía MCP `mcp__supabase__apply_migration` en el paso 3 del implementation plan."
4. **Implementation plan** — Pasos numerados, cada uno deja el sistema funcional:
   - Crear `app/games/<slug>/page.tsx` con layout de pantalla completa.
   - Crear `app/games/<slug>/<GameName>Game.tsx` (Client Component `'use client'`) con `canvasRef`, `useEffect` que inicia el game loop, y cleanup de `requestAnimationFrame` + event listeners.
   - Portar toda la lógica del juego fuente (`references/started-games/<folder>/game.js` si aplica) dentro del `useEffect`.
   - Registrar el juego en Supabase: INSERT en `games` vía MCP (`mcp__supabase__apply_migration`).
   - Game Over overlay: reutilizar el patrón de `app/games/asteroids/AsteroidsGame.tsx` — detectar fin de partida, mostrar input de nombre (pre-relleno de `localStorage('playerName')`), llamar `submitScore` de `app/actions/scores.ts`, mostrar top 5 con `<TopScores>`.
   - Agregar helper `getGameIdBySlug(slug)` en `app/actions/scores.ts` (generalización de `getAsteroidsGameId`) si aún no existe.
   - Verificar que `/leaderboard` muestra el ranking del juego nuevo (el selector de juego de `app/leaderboard/page.tsx` debe incluirlo automáticamente si la fila de `games` existe).
   - `pnpm run dev` → navegar a `/games/<slug>` y recorrer el ciclo completo.
   - `pnpm run build` y `pnpm run lint` sin errores.
5. **Acceptance criteria** — Lista de checkboxes verificables. Incluir al menos:
   - `pnpm run build` sin errores de TypeScript ni lint.
   - La ruta `/games/<slug>` existe y carga el juego.
   - El canvas tiene las dimensiones definidas, centrado en fondo negro.
   - Los controles responden correctamente.
   - Las mecánicas principales funcionan (definir cuáles según el juego).
   - Al terminar la partida aparece el overlay con el score, input de nombre y top 5.
   - El score se guarda en `scores` y aparece en `/leaderboard`.
   - El nombre del jugador persiste en `localStorage`.
   - Sin memory leaks: `requestAnimationFrame` cancelado y listeners eliminados al desmontar.
   - Ningún archivo fuera de `app/games/<slug>/` y `app/actions/scores.ts` fue modificado (excepto `app/leaderboard/page.tsx` si requirió ajuste del selector).
6. **Decisions taken and discarded** — Al menos: estrategia de integración, HUD interno vs externo, persistencia de score, fuente del juego.
7. **Identified risks** — Si aplica: complejidad de portar el game loop, exposición del score final al componente React, comportamiento del selector de `/leaderboard` con múltiples juegos.

**Errores comunes a evitar:**

- Acceptance criteria no verificables ("que funcione bien").
- Poner en el implementation plan cosas que no están en scope.
- Asumir nombres de archivos o estructuras que el usuario no confirmó.
- Omitir la sección de decisions — es la de mayor valor a largo plazo.

### Fase 4 — Guardar el spec

1. Determinar el siguiente número secuencial del listado de `specs/` del session context. El más alto + 1, con cero inicial. Si `specs/` está vacío, empezar en `01-`.
2. Slug del archivo: `NN-<slug>-game.md` (ej. `07-tetris-game.md`).
3. Usar la fecha del session context en el campo `**Date:**`. **Nunca escribir una fecha que no venga de ahí.**
4. Escribir el archivo directamente en `specs/NN-<slug>-game.md`. No pedir permiso ni confirmar el nombre de archivo — anunciar el path en la confirmación final. Solo preguntar si el archivo ya existe.
5. Estado `Draft`.
6. Confirmar al usuario:
   - Path del archivo creado.
   - Recordatorio: el spec está en `Draft`. Cambiar a `Approved` después de re-leerlo.
   - Próximo paso: `/spec-impl NN-<slug>-game` cuando esté listo.
7. **Parar aquí.** No proponer implementar, no escribir código, no tomar ninguna acción adicional.

---

## Reglas irrompibles

- **Nunca escribir código durante este comando.** Solo el archivo `.md` del spec al final.
- **Nunca proponer implementar el spec después de guardarlo.** El trabajo termina cuando el archivo está escrito.
- **Nunca asumir decisiones que el usuario no confirmó.** Si falta información, preguntar — en Fase 2.
- **No re-preguntar en Fase 3 lo que ya se respondió en Fase 2.** Si la información está completa, escribir el spec entero y guardarlo.
- **Si el usuario quiere saltarse Fase 2**, recordarle: "Las preguntas ahora ahorran horas después. ¿Seguro que quieres saltarlas?" Si insiste, respetar la decisión pero registrarla en la sección de decisions.

## Tono al preguntar

Directo y específico. Sin disculpas ni frases como "si no te importa...". El usuario invocó este skill precisamente para que hagas preguntas. Usa preguntas concretas, numeradas, con opciones cuando las hay.

## Argumentos

`$ARGUMENTS` es la descripción o slug del juego. Si llega un token kebab-case sin espacios (ej. `/new-game-spec tetris`), úsalo como slug de partida y como seed de la descripción, sin pedir confirmación. Si llega vacío, pedir la descripción en una frase.
