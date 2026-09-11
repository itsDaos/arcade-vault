# SPEC 06 — Leaderboard y tabla de juegos

**State:** Implemented
**Depends on:** SPEC 04, SPEC 05
**Date:** 2026-09-10
**Objective:** Crear las tablas `games` y `scores` en Supabase, una página `/leaderboard` con el ranking global por juego, y el flujo de submit de score al terminar una partida en Asteroids.

---

## Scope

### Incluido

- Migración Supabase: tabla `games` con seed para Asteroids
- Migración Supabase: tabla `scores` con RLS para insert anónimo y select público
- Página `/leaderboard` — top 10 scores por juego (selector de juego si hay más de uno)
- Al Game Over en Asteroids: prompt de nombre → insert en `scores` → mostrar top 5 inline
- Nombre del jugador persiste en `localStorage` (se pre-rellena en partidas siguientes)
- `games` se pobla con una fila de Asteroids en la migración; futuros juegos = nueva migración

### Excluido

- Autenticación de usuarios (Supabase Auth) — spec posterior
- UPSERT best-score-per-player (se inserta un row por partida, histórico plano)
- Rutas anidadas `/games/[slug]/leaderboard` — sólo `/leaderboard` en este spec
- Paginación del leaderboard
- Controles de moderación / borrar scores

---

## Data model

### `games`

```sql
create table games (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,        -- 'asteroids'
  name        text not null,               -- 'Asteroids'
  description text,
  created_at  timestamptz default now()
);
```

Seed dentro de la migración:

```sql
insert into games (slug, name, description)
values ('asteroids', 'Asteroids', 'Destruye asteroides y sobrevive.');
```

### `scores`

```sql
create table scores (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid references games(id) not null,
  player_name  text not null check (char_length(player_name) between 1 and 20),
  score        int not null check (score >= 0),
  created_at   timestamptz default now()
);
```

RLS:

- `select`: público (anon + authenticated)
- `insert`: anon key permitido (sin auth requerida)

---

## Implementation plan

1. **Migración `games`** — crear `games` table + seed Asteroids vía `supabase` MCP
2. **Migración `scores`** — crear `scores` table + políticas RLS vía `supabase` MCP
3. **Server Action / Route** — `app/actions/scores.ts`: funciones `submitScore(gameId, playerName, score)` y `getTopScores(gameId, limit)` usando Supabase client (server-side)
4. **Game Over modal en Asteroids** — al detectar `lives === 0` mostrar un overlay con input de nombre, botón "Guardar score"; nombre se pre-rellena desde `localStorage('playerName')`; al submit llama `submitScore` y actualiza estado local con top 5
5. **Componente `<TopScores>`** — tabla simple (rank, nombre, score, fecha) reutilizable tanto en el modal como en `/leaderboard`
6. **Página `/leaderboard`** (`app/leaderboard/page.tsx`, Server Component) — carga top 10 de Asteroids (y selector si `games` tiene >1 fila), renderiza `<TopScores>`
7. **Link en nav/homepage** hacia `/leaderboard` (según layout existente)

---

## Acceptance criteria

- [ ] Migración aplica sin errores; tablas `games` y `scores` existen en Supabase
- [ ] `games` contiene la fila de Asteroids tras la migración
- [ ] Al terminar una partida, el modal de Game Over muestra un input con el nombre recordado del jugador (o vacío si es la primera vez)
- [ ] Al enviar el formulario, el score se guarda en `scores` y el modal muestra el top 5 actualizado
- [ ] El nombre del jugador queda en `localStorage` para la siguiente partida
- [ ] `/leaderboard` muestra el top 10 global de Asteroids con rank, nombre, score y fecha
- [ ] La página `/leaderboard` funciona sin JavaScript deshabilitado (Server Component)
- [ ] RLS: no es posible hacer DELETE ni UPDATE desde el cliente anon

---

## Decisions taken and discarded

- **Histórico vs. best-score UPSERT** → histórico (un row por partida). Simplicidad; el top N ya filtra los mejores.
- **Auth requerida para submit** → descartado. El spec de auth viene después; por ahora nombre libre + anon insert.
- **Ruta `/games/[slug]/leaderboard`** → descartado en este spec. Una sola ruta `/leaderboard` es suficiente hasta que haya más juegos.
- **Edge Function para insert** → descartado. Server Action es suficiente y más simple.

---

## Identified risks

- **RLS demasiado abierto**: anon insert sin límite puede recibir spam. Mitigación: añadir rate-limit a nivel de Supabase (pg_cron + contador) en un spec posterior si se detecta abuso.
- **Game loop de Asteroids no expone `onGameOver` fácilmente**: puede requerir refactor leve del componente existente para emitir el score final vía callback o estado React.
