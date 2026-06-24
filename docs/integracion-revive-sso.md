# Integración Revive ↔ Próximo Residente — Especificación de embebido en iframe + SSO

**Estado:** acordado el enfoque, pendientes 3 decisiones menores (ver final).
**Dominio que embebe:** `https://revivevirtual.com`
**Aplicación embebida:** `https://proximoresidente.com` (Next.js en Vercel + Supabase)

---

## Resumen de lo decidido

- La autenticación dentro del iframe se resuelve con **SSO por token de un solo uso** (no se modifican las cookies globales de la plataforma → los usuarios que entran directo a proximoresidente.com no se ven afectados).
- La sesión se crea **dentro del iframe** vía `supabase.auth.setSession()`, evitando la dependencia de cookies de terceros (que Safari/Chrome bloquean).
- El token lo **genera Revive**, lo **valida Próximo Residente**.

---

## Estado de los 9 puntos originales

| # | Punto solicitado | Responsable | Estado |
|---|------------------|-------------|--------|
| 1 | CSP `frame-ancestors` / sin `X-Frame-Options` | **Próximo Residente** | Lo configuramos nosotros (cabecera con lista blanca de revivevirtual.com) |
| 2 | Cookies `SameSite=None; Secure` | — | **Descartado**: se reemplaza por SSO + `setSession()`, más seguro y sin afectar a usuarios directos |
| 3 | CORS para su dominio | **Próximo Residente** (si aplica) | Solo si Revive llama nuestra API desde su propio JS. Con app embebida completa NO hace falta |
| 4 | CSRF compatible con iframe | **Próximo Residente** | Cubierto: el endpoint SSO valida un token firmado; el login normal sigue con Turnstile |
| 5 | Anti-clickjacking solo su dominio | **Próximo Residente** | Es la misma cabecera del punto 1 |
| HTTPS | Servir por HTTPS | — | Ya cumplido (Vercel) |
| 6 | Permisos cámara/micro/etc. | — | **No aplica**: la plataforma no usa cámara ni micrófono. No se añade `Permissions-Policy` |
| 7 | Sin restricciones por Origin/Referer | **Próximo Residente** | Verificado: no existen bloqueos en el código |
| 8 | `window.postMessage()` | **Revive + Próximo Residente** | Es el canal del SSO (protocolo definido abajo) |
| 9 | URL estable sin redirecciones | **Próximo Residente** | Verificado: sin bucles; la URL del iframe será estable |

---

## ✅ Lo que debe implementar Revive

### A. Generar el token SSO (JWT)

- **Algoritmo:** HS256
- **Firma:** con un secreto compartido `SSO_SHARED_SECRET` (lo intercambiamos por canal seguro, no por chat/correo)
- **Vida:** muy corta (`exp = iat + 90 segundos`)
- **Un solo uso:** incluir `jti` único (UUID) por token

**Claims del token:**

| Claim | Obligatorio | Valor |
|-------|-------------|-------|
| `iss` | sí | `"revive"` |
| `aud` | sí | `"proximoresidente"` |
| `email` | sí | email del usuario (llave que enlaza la cuenta) |
| `sub` | sí | id del usuario en Revive |
| `name` | opcional | nombre del usuario |
| `iat` | sí | timestamp de emisión |
| `exp` | sí | `iat + 90` |
| `jti` | sí | UUID único |

Ejemplo de payload:
```json
{
  "iss": "revive",
  "aud": "proximoresidente",
  "email": "usuario@correo.com",
  "sub": "revive_user_12345",
  "name": "Juan Pérez",
  "iat": 1750800000,
  "exp": 1750800090,
  "jti": "b3f1c2a4-9d8e-4f12-a1b2-c3d4e5f6a7b8"
}
```

### B. Embeber el iframe

```html
<iframe
  src="https://proximoresidente.com"
  allow="fullscreen"
  style="width:100%; height:100%; border:0;">
</iframe>
```

### C. Enviar el token por postMessage

```js
// 1) Esperar a que nuestro iframe avise que cargó:
window.addEventListener("message", (event) => {
  if (event.origin !== "https://proximoresidente.com") return;

  if (event.data?.type === "PR_IFRAME_READY") {
    // 2) Enviar el token (SIEMPRE con targetOrigin explícito):
    iframeEl.contentWindow.postMessage(
      { type: "PR_SSO_TOKEN", token: jwtGeneradoEnElBackend },
      "https://proximoresidente.com"
    );
  }

  if (event.data?.type === "PR_SSO_OK") {
    // sesión iniciada correctamente dentro del iframe
  }
  if (event.data?.type === "PR_SSO_ERROR") {
    console.error("SSO falló:", event.data.error);
  }
});
```

> Importante: el token se genera **en el backend de Revive** (donde vive el secreto), nunca en el navegador.

### D. Webhook de suscripción (pagos recurrentes)

La activación/desactivación mensual **no viaja en el token de login** (el SSO solo da identidad). Se maneja por un canal aparte de sincronización continua. Ver la sección **"Sincronización de pagos recurrentes"** más abajo.

---

## 🔧 Lo que implementa Próximo Residente (de nuestra parte)

1. **Fase 1 — Cabeceras (riesgo cero, sin esperar nada):**
   - `Content-Security-Policy: frame-ancestors 'self' https://revivevirtual.com`
   - `Permissions-Policy` con los permisos acordados
   - (No se usa `X-Frame-Options`, es incompatible con multi-dominio)

2. **Fase 2 — SSO:**
   - Endpoint `POST /api/auth/sso` que: valida la firma del JWT, `aud`, `exp` y `jti` no reutilizado → resuelve el usuario → mintea una sesión real de Supabase → devuelve `access_token` y `refresh_token`.
   - Listener de `postMessage` en el iframe (emite `PR_IFRAME_READY`, recibe `PR_SSO_TOKEN`, llama `setSession()`, responde `PR_SSO_OK`/`PR_SSO_ERROR`).

3. **Fase 3 — Webhook de suscripción Revive:**
   - Endpoint `POST /api/webhooks/revive` que recibe los eventos de facturación, valida la firma y actualiza `suscripcionStatus` + `suscripcionExpira` (reutiliza la lógica del webhook de MercadoPago existente).
   - Nuevo campo `suscripcionOrigen` en el usuario (`mercadopago` / `revive` / `manual`) para que cada fuente solo gestione a sus propios usuarios y no se pisen entre sí.

Todo se prueba primero en un **Preview de Vercel** antes de pasar a producción.

---

## 💳 Sincronización de pagos recurrentes (suscripción)

**Principio:** identidad (SSO) y derecho de acceso (suscripción) son canales separados.
- El **token SSO** solo dice *quién* es el usuario, se revisa al iniciar sesión.
- El **estado de pago** define *si tiene acceso*, se revisa en **cada carga de página** contra los campos del usuario.

Próximo Residente ya gobierna el acceso con estos campos (hoy alimentados por MercadoPago):
`suscripcionStatus`, `suscripcionExpira` (acceso válido mientras esté en el futuro) y `suscripcionOrigen` (nuevo). Si `suscripcionExpira` ya pasó, el acceso se corta **automáticamente**.

### Reparto de responsabilidades sobre el usuario

El usuario vive en **dos tablas**:
- **`auth.users` (Supabase)** → autenticación / login. **La crea Revive** al cerrar la venta (ya tiene acceso a Supabase).
- **`Usuario` (tabla de aplicación)** → acceso, suscripción, rol. **La crea/sincroniza nuestro webhook**, no Revive.

Así Revive queda desacoplado del esquema de la app: solo toca `auth.users` y nos manda los eventos. Nuestro webhook hace `upsert` del perfil `Usuario` (resolviendo el `auth_id` del usuario que Revive ya creó) y le asigna el acceso.

### Flujo con Revive (mensual o anual)

```
Revive cierra venta → crea auth.users + manda webhook de cobro
   ├─ Cobro OK / renovación → webhook → upsert del perfil Usuario:
   │                                     suscripcionOrigen = "revive"
   │                                     suscripcionExpira = current_period_end + gracia
   │                                     (usuario activo)
   ├─ Cobro fallido         → webhook → no se renueva la fecha
   └─ Cancelación           → webhook → al pasar suscripcionExpira el usuario
                                         queda inactivo solo (fail-safe)

Usuario entra al iframe → SSO lo loguea → su perfil ya da acceso → entra ✅
```

La fecha de vencimiento es **agnóstica al plan**: el acceso solo mira `suscripcionExpira`. Si pagó un mes, Revive manda una fecha a ~1 mes; si pagó un año, a ~1 año. Mismo código.

### Lo que debe enviar Revive — `POST https://proximoresidente.com/api/webhooks/revive`

En cada evento de facturación: **cobro exitoso (alta/renovación), cobro fallido y cancelación.**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `event` | sí | `payment.success` / `payment.failed` / `subscription.cancelled` |
| `email` | sí | email del usuario (llave; debe coincidir con el de `auth.users`) |
| `subscription_id` | sí | id de la suscripción en Revive |
| `plan` | en `payment.success` | `"monthly"` o `"annual"` |
| `current_period_end` | en `payment.success` | **fecha hasta la que el usuario tiene acceso pagado** (ISO 8601) |
| `event_id` | sí | id único del evento (idempotencia, evita doble conteo en reintentos) |

Requisitos:
- **Firmado** con el secreto compartido (HMAC SHA-256), igual que el webhook de MercadoPago.
- **Idempotente**: reintentos del mismo `event_id` no deben contar doble.
- Revive envía directamente `current_period_end` (no lo calculamos nosotros), así funciona para mensual, anual o cualquier plan futuro.

### Fail-safe

Aunque un webhook se pierda, como el acceso depende de `suscripcionExpira`, el usuario **se desactiva solo** cuando la fecha vence. Nunca queda activo de forma indefinida por un mensaje perdido.

---

## ❓ Decisiones pendientes (necesitamos respuesta de Revive)

1. **Período de gracia ante impago:** cuando un cobro falla, ¿se corta el acceso **de inmediato** o se dan unos días de gracia (recomendado 3-5 días para reintentos de tarjeta)?
2. **Secreto compartido:** ¿por qué canal seguro lo intercambiamos? (gestor de contraseñas compartido) — sirve tanto para firmar el token SSO como el webhook.
3. **Confirmar origin:** ¿solo `https://revivevirtual.com` o también `https://www.revivevirtual.com`?

### Decisiones ya cerradas

- **Alta de usuarios:** Revive crea el usuario de `auth.users` al cerrar la venta; el perfil `Usuario` de la app lo crea/sincroniza nuestro webhook. Revive **no** toca la tabla `Usuario`.
- **Planes mensual/anual:** el webhook envía `plan` + `current_period_end`; nosotros guardamos esa fecha como vencimiento (agnóstico al plan).
- **Cámara/micrófono:** la plataforma no los usa → no se configuran permisos especiales (punto 6 cerrado).

---

## Seguridad (criterios que ambos lados deben cumplir)

- Token de **vida corta** (90s) y de **un solo uso** (`jti`).
- Validación estricta de `origin` en ambos `postMessage`.
- El secreto de firma **nunca** viaja al navegador ni por canales no seguros.
- `targetOrigin` siempre explícito en `postMessage` (nunca `"*"`).
- Todo sobre HTTPS.
