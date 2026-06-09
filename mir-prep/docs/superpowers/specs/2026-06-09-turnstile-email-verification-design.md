# Diseño: Cloudflare Turnstile + Verificación de Email

**Fecha:** 2026-06-09
**Estado:** Aprobado

---

## Objetivo

Añadir protección anti-bot con Cloudflare Turnstile en los formularios de login y registro, y habilitar la verificación de email obligatoria en Supabase para nuevas cuentas.

---

## Arquitectura general

### Flujo actual (inseguro)
```
Browser → supabase.auth.signUp() directo → Dashboard
Browser → supabase.auth.signInWithPassword() directo → Dashboard
```

### Flujo nuevo
```
Registro:
Browser (form + Turnstile widget)
  → POST /api/auth/signup { email, password, turnstileToken }
      → Cloudflare verifica token (server-side)
      → Supabase crea usuario + envía email de confirmación
      → { success: true }
  → UI muestra "Revisa tu correo electrónico"

Login:
Browser (form + Turnstile widget)
  → POST /api/auth/signin { email, password, turnstileToken }
      → Cloudflare verifica token (server-side)
      → Supabase signInWithPassword → setea cookies de sesión
      → { success: true }
  → Redirect a /dashboard
```

---

## Archivos modificados

| Archivo | Acción |
|---|---|
| `src/app/api/auth/signup/route.ts` | CREAR |
| `src/app/api/auth/signin/route.ts` | CREAR |
| `src/hooks/useAuth.ts` | MODIFICAR — llamar API routes en lugar de Supabase directo |
| `src/app/(auth)/register/page.tsx` | MODIFICAR — añadir Turnstile widget |
| `src/app/(auth)/login/page.tsx` | MODIFICAR — añadir Turnstile widget |
| `.env.local` | MODIFICAR — añadir variables Turnstile |
| Vercel env vars | CONFIGURAR — añadir variables Turnstile |
| Supabase email confirmation | CONFIGURAR vía MCP |

---

## Variables de entorno

```
# Pública (expuesta al cliente)
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAADhd1IeygwUqbXHs

# Privada (solo servidor)
CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAADhd1CMG9eH6MA_9gI4gXTUWIxw
```

Configurar en: `.env.local` (local) y Vercel Settings > Environment Variables (Production + Preview).

---

## Implementación de API routes

### Helper compartido: verificación Turnstile

```typescript
// src/lib/turnstile.ts
export async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!,
      response: token,
    }),
  })
  const data = await res.json()
  return data.success === true
}
```

### POST /api/auth/signup

1. Extraer `{ email, password, turnstileToken }` del body
2. Validar que los tres campos estén presentes → 400 si faltan
3. Llamar `verifyTurnstile(turnstileToken)` → 400 "Verificación de seguridad fallida" si falla
4. Crear cliente Supabase server-side con `createServerClient`
5. Llamar `supabase.auth.signUp({ email, password })`
6. Si error de Supabase → 400 con el mensaje de error
7. Retornar `{ success: true }` — NO setea sesión (email no confirmado aún)

### POST /api/auth/signin

1. Extraer `{ email, password, turnstileToken }` del body
2. Validar presencia de campos → 400 si faltan
3. Llamar `verifyTurnstile(turnstileToken)` → 400 "Verificación de seguridad fallida" si falla
4. Crear cliente Supabase server-side con `createServerClient` + cookie helpers
5. Llamar `supabase.auth.signInWithPassword({ email, password })`
6. Si error "Email not confirmed" → 401 "Debes verificar tu correo antes de iniciar sesión"
7. Si otro error → 401 con mensaje
8. Si éxito → cookies de sesión seteadas en la respuesta → `{ success: true }`

---

## Widget Turnstile en formularios

**Paquete:** `@marsidev/react-turnstile`

```tsx
import { Turnstile } from '@marsidev/react-turnstile'

// Estado en el componente:
const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

// En el JSX, antes del botón submit:
<Turnstile
  siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
  onSuccess={(token) => setTurnstileToken(token)}
  onError={() => setTurnstileToken(null)}
  onExpire={() => setTurnstileToken(null)}
  options={{ theme: 'light' }}
/>

// Botón submit deshabilitado hasta que haya token:
<button type="submit" disabled={!turnstileToken || isLoading}>
  Iniciar sesión
</button>
```

---

## Flujo completo de verificación de email

```
1. Usuario completa registro → POST /api/auth/signup
   → Supabase envía correo de confirmación
   → UI muestra: "Revisa tu correo electrónico para confirmar tu cuenta"
   → No redirige a /dashboard

2. Usuario abre correo → clic en link de confirmación
   → Supabase verifica token → activa cuenta
   → Redirige a /login?verified=true

3. Login page detecta ?verified=true en URL
   → Muestra banner: "Cuenta verificada. Ya puedes iniciar sesión."

4. Usuario intenta login sin confirmar email
   → API retorna error: "Debes verificar tu correo antes de iniciar sesión"
   → UI muestra el error en el formulario
```

### Corrección en useAuth.ts

El `signUp` actual hace `router.push('/dashboard')` después del signup — esto debe eliminarse. El redirect lo controla ahora el componente `register/page.tsx` al detectar `{ success: true }` del API.

---

## Configuración Supabase

- **Authentication > Email > Confirm email:** ON (configurado vía Supabase MCP)
- **Authentication > URL Configuration > Redirect URLs:** añadir el dominio de Vercel

---

## Error handling

| Escenario | Respuesta |
|---|---|
| Token Turnstile ausente | 400 "Verificación de seguridad requerida" |
| Token Turnstile inválido/expirado | 400 "Verificación de seguridad fallida" |
| Email ya registrado | 400 mensaje de Supabase |
| Contraseña muy corta | 400 mensaje de Supabase |
| Email no confirmado (login) | 401 "Debes verificar tu correo antes de iniciar sesión" |
| Credenciales incorrectas | 401 mensaje de Supabase |
| Token expirado en widget (>5 min) | Widget se refresca automáticamente, `onExpire` limpia el token |

---

## Seguridad

- El secreto de Turnstile (`CLOUDFLARE_TURNSTILE_SECRET_KEY`) nunca llega al cliente
- La verificación se hace server-side en cada request — no hay forma de saltarla
- El service role de Supabase no se usa (se usa anon key con permisos normales)
- Cookies de sesión seteadas por Supabase SSR (httpOnly, secure en producción)
