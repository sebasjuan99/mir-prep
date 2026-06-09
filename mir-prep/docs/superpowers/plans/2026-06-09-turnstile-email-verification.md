# Turnstile + Email Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proteger los formularios de login y registro con Cloudflare Turnstile (server-side) y habilitar verificación de email obligatoria en Supabase.

**Architecture:** Se crean dos API routes (`/api/auth/signup` y `/api/auth/signin`) que verifican el token Turnstile con Cloudflare antes de ejecutar cualquier operación de Supabase. El secreto de Turnstile nunca sale del servidor. Los formularios pasan a llamar estas rutas directamente vía `fetch`, y Supabase setea las cookies de sesión en la respuesta del servidor.

**Tech Stack:** Next.js 16 App Router, `@marsidev/react-turnstile`, `@supabase/ssr`, Cloudflare Turnstile API, Supabase Auth.

---

## Task 1: Instalar paquete y configurar variables de entorno

**Files:**
- Modify: `package.json` (automático con npm)
- Modify: `.env.local`

- [ ] **Step 1: Instalar @marsidev/react-turnstile**

```bash
cd D:\residentes\mir-prep
npm install @marsidev/react-turnstile
```

Salida esperada: `added 1 package` (o similar), sin errores.

- [ ] **Step 2: Agregar variables Turnstile a .env.local**

Abrir `D:\residentes\mir-prep\.env.local` y añadir al final:

```
# Cloudflare Turnstile
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAADhd1IeygwUqbXHs
CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAADhd1CMG9eH6MA_9gI4gXTUWIxw
```

- [ ] **Step 3: Agregar variables en Vercel**

En el dashboard de Vercel → proyecto `mir-prep` → Settings → Environment Variables:

| Variable | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | `0x4AAAAAADhd1IeygwUqbXHs` | Production, Preview, Development |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | `0x4AAAAAADhd1CMG9eH6MA_9gI4gXTUWIxw` | Production, Preview, Development |

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @marsidev/react-turnstile"
```

---

## Task 2: Crear helper de verificación Turnstile

**Files:**
- Create: `src/lib/turnstile.ts`

- [ ] **Step 1: Crear el archivo**

Crear `src/lib/turnstile.ts` con este contenido exacto:

```typescript
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

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
cd D:\residentes\mir-prep
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/turnstile.ts
git commit -m "feat: add Turnstile server-side verification helper"
```

---

## Task 3: Crear API route POST /api/auth/signup

**Files:**
- Create: `src/app/api/auth/signup/route.ts`

- [ ] **Step 1: Crear la route**

Crear `src/app/api/auth/signup/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { verifyTurnstile } from '@/lib/turnstile'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.email || !body?.password || !body?.turnstileToken) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos' },
      { status: 400 }
    )
  }

  const { email, password, turnstileToken } = body

  const turnstileOk = await verifyTurnstile(turnstileToken)
  if (!turnstileOk) {
    return NextResponse.json(
      { error: 'Verificación de seguridad fallida. Inténtalo de nuevo.' },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Sin errores esperados.

- [ ] **Step 3: Test manual con curl (servidor dev corriendo)**

Iniciar el servidor de desarrollo en otra terminal: `npm run dev`

Probar que el campo turnstileToken es requerido:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

Respuesta esperada: `{"error":"Faltan campos requeridos"}` con status 400.

Probar token Turnstile inválido:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","turnstileToken":"token-invalido"}'
```

Respuesta esperada: `{"error":"Verificación de seguridad fallida. Inténtalo de nuevo."}` con status 400.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/signup/route.ts
git commit -m "feat: add /api/auth/signup route with Turnstile verification"
```

---

## Task 4: Crear API route POST /api/auth/signin

**Files:**
- Create: `src/app/api/auth/signin/route.ts`

- [ ] **Step 1: Crear la route**

Crear `src/app/api/auth/signin/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { verifyTurnstile } from '@/lib/turnstile'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.email || !body?.password || !body?.turnstileToken) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos' },
      { status: 400 }
    )
  }

  const { email, password, turnstileToken } = body

  const turnstileOk = await verifyTurnstile(turnstileToken)
  if (!turnstileOk) {
    return NextResponse.json(
      { error: 'Verificación de seguridad fallida. Inténtalo de nuevo.' },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { pendingCookies.push(...cookiesToSet) },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const isEmailNotConfirmed = error.message.toLowerCase().includes('email not confirmed')
    const message = isEmailNotConfirmed
      ? 'Debes verificar tu correo electrónico antes de iniciar sesión.'
      : 'Correo o contraseña incorrectos.'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )
  return response
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Sin errores esperados.

- [ ] **Step 3: Test manual con curl**

Probar campos faltantes:

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

Respuesta esperada: `{"error":"Faltan campos requeridos"}` con status 400.

Probar token inválido:

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","turnstileToken":"invalido"}'
```

Respuesta esperada: `{"error":"Verificación de seguridad fallida. Inténtalo de nuevo."}` con status 400.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/signin/route.ts
git commit -m "feat: add /api/auth/signin route with Turnstile verification and cookie handling"
```

---

## Task 5: Habilitar verificación de email en Supabase

Este paso configura Supabase para enviar un correo de confirmación al registrar un usuario nuevo. El usuario no podrá iniciar sesión hasta confirmar su email.

- [ ] **Step 1: Habilitar "Confirm email" en Supabase vía MCP**

En el Authentication dashboard de Supabase (`https://supabase.com/dashboard/project/jqgjxiymizlarmcfvpzk/auth/providers`):

- Ir a **Authentication → Providers → Email**
- Activar **"Confirm email"** → Save

O ejecutar vía MCP Supabase si está disponible.

- [ ] **Step 2: Configurar redirect URL en Supabase**

En Supabase → **Authentication → URL Configuration → Redirect URLs**, añadir:

```
https://*.vercel.app/login
http://localhost:3000/login
```

Esto permite que el link de confirmación en el correo redirija correctamente a `/login`.

- [ ] **Step 3: Verificar en Supabase dashboard**

En **Authentication → Settings**, confirmar que "Enable email confirmations" aparece activado.

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "config: enable Supabase email confirmation (configured in dashboard)"
```

---

## Task 6: Actualizar register/page.tsx con Turnstile

**Files:**
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

Reemplazar `src/app/(auth)/register/page.tsx` con:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Turnstile } from '@marsidev/react-turnstile'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (!turnstileToken) {
      setError('Completa la verificación de seguridad')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al registrarse')
        return
      }
      setSuccess(true)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-md text-center p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="font-[var(--font-display)] text-2xl font-bold mb-3">Revisa tu correo</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Te hemos enviado un enlace de confirmación. Haz clic en él para activar tu cuenta.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 px-6 py-3 text-white font-semibold rounded-lg"
            style={{ background: 'var(--accent)' }}
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">📚</span>
            <span className="font-[var(--font-display)] text-2xl font-bold">MIR Prep</span>
          </Link>
          <h1 className="font-[var(--font-display)] text-3xl font-bold mb-2">Crea tu cuenta</h1>
          <p style={{ color: 'var(--text-muted)' }}>Empieza a preparar el MIR hoy mismo</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-2xl space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          {error && (
            <div className="p-3 rounded-lg text-sm font-medium" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
              placeholder="Repite tu contraseña"
            />
          </div>

          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
              options={{ theme: 'light' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ background: loading ? 'var(--text-muted)' : 'var(--accent)' }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Sin errores esperados.

- [ ] **Step 3: Test visual en el navegador**

Con `npm run dev` corriendo, abrir `http://localhost:3000/register`. Verificar:
- El widget de Turnstile aparece entre el campo "confirmar contraseña" y el botón
- El botón "Crear cuenta" está deshabilitado (opaco) hasta que el widget se resuelve
- Al resolver el widget, el botón se activa

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/register/page.tsx
git commit -m "feat: add Turnstile widget to register form"
```

---

## Task 7: Actualizar login/page.tsx con Turnstile y banner de verificación

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

Reemplazar `src/app/(auth)/login/page.tsx` con:

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerified(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!turnstileToken) {
      setError('Completa la verificación de seguridad')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">📚</span>
            <span className="font-[var(--font-display)] text-2xl font-bold">MIR Prep</span>
          </Link>
          <h1 className="font-[var(--font-display)] text-3xl font-bold mb-2">Bienvenido de vuelta</h1>
          <p style={{ color: 'var(--text-muted)' }}>Inicia sesión para continuar estudiando</p>
        </div>

        {verified && (
          <div className="mb-4 p-3 rounded-lg text-sm font-medium text-center" style={{ background: 'var(--success-light, #d1fae5)', color: 'var(--success, #065f46)' }}>
            ✅ Cuenta verificada. Ya puedes iniciar sesión.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-2xl space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          {error && (
            <div className="p-3 rounded-lg text-sm font-medium" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
              options={{ theme: 'light' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ background: loading ? 'var(--text-muted)' : 'var(--accent)' }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Sin errores esperados.

- [ ] **Step 3: Test visual en el navegador**

Con `npm run dev` corriendo:

1. Abrir `http://localhost:3000/login` — verificar que el widget Turnstile aparece y el botón está deshabilitado hasta resolverlo.
2. Abrir `http://localhost:3000/login?verified=true` — verificar que aparece el banner verde "Cuenta verificada. Ya puedes iniciar sesión."

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/login/page.tsx
git commit -m "feat: add Turnstile widget and verified banner to login form"
```

---

## Task 8: Limpiar useAuth.ts — eliminar signUp y signIn muertos

**Files:**
- Modify: `src/hooks/useAuth.ts`

- [ ] **Step 1: Reemplazar el contenido del archivo**

Reemplazar `src/hooks/useAuth.ts` con:

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return { user, loading, signOut }
}
```

- [ ] **Step 2: Verificar que no hay imports rotos**

```bash
npx tsc --noEmit
```

Si hay errores de "signUp/signIn not found", buscar qué otros archivos los importan:

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx src/ | Select-String "signUp|signIn"
```

Los únicos archivos que usaban `signUp`/`signIn` son los dos de auth que ya actualizamos. Si aparece otro, actualizar ese archivo para no usar el hook.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "refactor: remove signUp/signIn from useAuth — auth now via API routes"
```

---

## Task 9: Deploy a Vercel y verificación E2E

- [ ] **Step 1: Hacer push a GitHub**

```bash
git push origin master
```

Vercel detectará el push y desplegará automáticamente.

- [ ] **Step 2: Verificar el deploy en Vercel**

En el dashboard de Vercel → proyecto `mir-prep` → Deployments, confirmar que el último deploy está en estado **Ready** (sin errores de build).

Si hay errores de build, revisar los logs. El error más común es una variable de entorno faltante — verificar que `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` y `CLOUDFLARE_TURNSTILE_SECRET_KEY` están configuradas en Vercel.

- [ ] **Step 3: Test E2E — Registro con Turnstile**

1. Abrir la URL de producción en Vercel → ir a `/register`
2. Verificar que el widget Turnstile aparece en el formulario
3. Llenar el formulario con un email real tuyo y contraseña
4. Resolver el widget (clic o automático según configuración)
5. Clic en "Crear cuenta"
6. Verificar que aparece la pantalla "Revisa tu correo"
7. Revisar el email — debe llegar un correo de Supabase con link de confirmación
8. Clic en el link del correo → debe redirigir a `/login`

- [ ] **Step 4: Test E2E — Login antes de confirmar email**

1. Intentar iniciar sesión con el email recién registrado (sin confirmar)
2. Resolver Turnstile → clic "Iniciar sesión"
3. Debe aparecer el error: "Debes verificar tu correo electrónico antes de iniciar sesión."

- [ ] **Step 5: Test E2E — Login después de confirmar email**

1. Confirmar el email desde el link del correo
2. Verificar que redirecciona a `/login` (con o sin `?verified=true`)
3. Iniciar sesión con email y contraseña
4. Resolver Turnstile → clic "Iniciar sesión"
5. Debe redirigir a `/dashboard`

- [ ] **Step 6: Commit final (si hay ajustes)**

```bash
git add -A
git commit -m "fix: post-deploy adjustments"
git push origin master
```
