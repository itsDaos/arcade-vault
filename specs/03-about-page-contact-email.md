# SPEC 03 — About Page & Contact Email

**State:** Aproved
**Depends on:** SPEC 02
**Date:** 2026-09-04
**Objective:** Implementar la página `/about` con sección Acerca de y formulario de contacto que envía correos reales vía Resend.

---

## Scope

### Incluido
- **Página `/about`** (`app/about/page.tsx`) portada de `references/home-about/about.jsx` con:
  - Sección "Acerca de" — kicker, título, misión, 3 highlight cards con `HighlightIcon` pixel SVG
  - Divider banner animado
  - Sección "Contacto" — form con campos nombre, email, mensaje
  - Estado loading durante el submit (botón deshabilitado con texto "ENVIANDO…")
  - Estado éxito — terminal `VAULT-OS` igual al template
  - Estado error inline — mensaje visible, campos preservados, botón "REINTENTAR"
- **API Route** `app/api/contact/route.ts` — recibe POST, envía email con Resend
- **CSS about** — clases `.about-*`, `.contact-*`, `.terminal-*`, `.highlight-*` portadas de `references/home-about/styles.css` a `app/globals.css`
- **Nav** — agregar link "About" apuntando a `/about`; activo cuando `pathname === "/about"`
- **Env vars** — `RESEND_API_KEY` y `RESEND_TO` en `.env.local`

### Excluido
- Dominio verificado en Resend (se usa `onboarding@resend.dev` como remitente)
- Rate limiting en el API route
- Validación de email con regex avanzado (solo `type="email"` en el input)
- CAPTCHA o protección anti-spam
- Guardado de mensajes en base de datos
- Lógica de retry automático en el cliente (el usuario reintenta manualmente)

---

## Data model

No se introducen nuevos tipos persistentes. El formulario maneja estado local:

```ts
// estado del formulario en app/about/page.tsx
type FormState = { name: string; email: string; msg: string }
type Status = "idle" | "loading" | "success" | "error"

// payload del POST a /api/contact
type ContactPayload = { name: string; email: string; msg: string }

// respuesta del API route
type ContactResponse = { ok: true } | { ok: false; error: string }
```

Variables de entorno requeridas en `.env.local`:
```
RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_TO=danielosorio2596@gmail.com
```

---

## Implementation plan

1. **Instalar Resend** — `pnpm add resend`. Verificar que se agregó a `package.json`.

2. **Env vars** — agregar `RESEND_API_KEY` y `RESEND_TO=danielosorio2596@gmail.com` a `.env.local`. Añadir ambas a `.env.example` con valores placeholder.

3. **API Route** — crear `app/api/contact/route.ts`:
   - Leer `RESEND_API_KEY` y `RESEND_TO` de `process.env`
   - Parsear el body `{ name, email, msg }`
   - Validar que los tres campos no estén vacíos (retornar 400 si faltan)
   - Enviar con `resend.emails.send({ from: "onboarding@resend.dev", to: RESEND_TO, subject: "Nuevo mensaje de Arcade Vault", ... })`
   - Retornar `{ ok: true }` en 200 o `{ ok: false, error: string }` en 500

4. **CSS About** — añadir al final de `app/globals.css` los estilos de: `.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`, `.hl-icon`, `.hl-text`, `.about-divider`, `.div-bar`, `.div-pixels`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`, `.contact-sub`, `.contact-tips`, `.tip`, `.tip-led`, `.contact-form`, `.field`, `.terminal-success`, `.term-bar`, `.dot`, `.term-title`, `.term-body`, `.line`, `.prompt`, `.caret`, `.shake`. Portarlos de `references/home-about/styles.css`.

5. **Componente About** — crear `app/about/page.tsx` (`'use client'`):
   - Importar `useReveal` de `app/hooks/useReveal.ts`
   - Estado: `form: FormState`, `status: Status`, `errorMsg: string`, `shake: boolean`
   - `onSubmit`: validar campos → si vacíos shake; si ok → `status = "loading"` → POST a `/api/contact` → si ok `status = "success"` → si error `status = "error"` con mensaje
   - Renderizar sección about-hero con los 3 highlights usando `HighlightIcon`
   - Renderizar divider banner (24 spans animados)
   - Renderizar sección contact con form condicional según `status`
   - `HighlightIcon` definido en el mismo archivo (no exportado)

6. **Nav** — en `app/components/Nav.tsx` agregar link "ABOUT" con `href="/about"`; aplicar clase activa cuando `pathname === "/about"`.

---

## Acceptance criteria

- [ ] `pnpm run build` completa sin errores de TypeScript ni lint
- [ ] La ruta `/about` carga correctamente la página About
- [ ] La sección "Acerca de" muestra kicker, título, texto de misión y los 3 highlight cards con sus iconos pixel SVG
- [ ] Los elementos `.reveal` entran con animación al hacer scroll (IntersectionObserver de `useReveal`)
- [ ] El divider banner con 24 spans animados es visible entre las dos secciones
- [ ] El formulario valida campos vacíos y activa animación `shake` sin enviar
- [ ] Durante el submit el botón muestra "ENVIANDO…" y está deshabilitado
- [ ] Al submit exitoso se muestra el terminal `VAULT-OS` con el nombre del usuario en mayúsculas
- [ ] Al submit con error de Resend se muestra mensaje de error inline y los campos mantienen sus valores
- [ ] El botón "ENVIAR OTRO MENSAJE" reinicia el formulario al estado idle
- [ ] El email llega a `danielosorio2596@gmail.com` con nombre, email y mensaje del usuario
- [ ] El Nav muestra el link "ABOUT" y se activa en la ruta `/about`
- [ ] En mobile (< 840px) el contact-grid es de columna única

---

## Decisions taken and discarded

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Remitente Resend | `onboarding@resend.dev` | Dominio propio | Proyecto de prueba; dominio propio requiere verificación DNS adicional |
| Destinatario email | `RESEND_TO` env var | Hardcodeado | Separa configuración del código aunque el valor inicial sea fijo; facilita cambio sin tocar código |
| Error handling submit | Inline error + campos preservados + retry manual | Ignorar error / retry automático | Un senior dev preserva el mensaje del usuario y le da control del retry; retry automático puede causar duplicados |
| Loading state | `status` enum `idle/loading/success/error` | Booleanos separados `isLoading`/`isSent` | Un solo estado enum es más predecible y elimina estados imposibles |
| `HighlightIcon` | Definido en `app/about/page.tsx` | Archivo separado | Usado exclusivamente en esta página; extraerlo no aporta reusabilidad real |
| Rate limiting | Fuera del scope | Incluido | Proyecto de prueba; añade complejidad sin beneficio inmediato |
