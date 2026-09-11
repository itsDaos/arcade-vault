# SPEC 04 — Supabase Setup

**State:** Aproved
**Depends on:** SPEC 03
**Date:** 2026-09-10
**Objective:** Integrar Supabase en la app instalando el cliente, configurando las variables de entorno y exponiendo un singleton reutilizable.

---

## Scope

### Incluido

- Instalar `@supabase/supabase-js`
- Agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.local` y `.env.example`
- Crear `lib/supabase.ts` — singleton del cliente Supabase listo para importar en cualquier módulo

### Excluido

- Auth de usuarios (sign up / sign in) — spec posterior
- Esquema de base de datos o tablas — spec posterior
- Realtime subscriptions — spec posterior
- Row Level Security — spec posterior
- Modificación de cualquier componente, página o contexto existente

---

## Data model

No se introducen tablas ni tipos nuevos. Solo variables de entorno:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Cliente exportado desde `lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Implementation plan

1. **Instalar dependencia** — `pnpm add @supabase/supabase-js`. Verificar que aparece en `package.json`.

2. **Env vars** — agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los valores reales a `.env.local`. Agregar ambas con valores placeholder a `.env.example`.

3. **Cliente singleton** — crear `lib/supabase.ts` con el `createClient` usando las dos env vars. Exportar el singleton como `supabase`.

4. **Verificar build** — ejecutar `pnpm run build` y confirmar que no hay errores de TypeScript ni lint.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] `@supabase/supabase-js` aparece en `dependencies` de `package.json`
- [ ] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con valores reales
- [ ] `.env.example` contiene las mismas keys con valores placeholder
- [ ] `lib/supabase.ts` existe y exporta `supabase` (singleton de `createClient`)
- [ ] Ningún componente, página ni contexto existente fue modificado

---

## Decisions taken and discarded

| Decisión             | Elegida                        | Descartada           | Motivo                                                                                                       |
| -------------------- | ------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Prefijo env vars     | `NEXT_PUBLIC_`                 | Sin prefijo          | Las env vars serán usadas en componentes cliente; Next.js requiere `NEXT_PUBLIC_` para exponerlas al browser |
| Patrón de cliente    | Singleton en `lib/supabase.ts` | Instancia por módulo | Un singleton evita múltiples conexiones y es el patrón recomendado por Supabase para apps Next.js            |
| Auth / DB / Realtime | Fuera del scope                | Incluidos            | El usuario confirmó que este spec es solo el setup base; las features van en specs posteriores               |
