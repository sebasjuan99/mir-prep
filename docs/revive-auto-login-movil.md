# Auto-login móvil ProximoResidente ← Revive

Para la app móvil de Revive. En móvil, ProximoResidente debe abrirse como **página completa** (webview o navegador), **no dentro del iframe**: en móvil el iframe bloquea las cookies de terceros y la sesión no se guarda.

## Endpoint

```
GET https://www.proximoresidente.com/mobile/auto-login?token=<JWT>
```

- Solo HTTPS.
- **No** recibe email ni contraseña. La identidad va en el JWT firmado.

## El token (el mismo JWT del SSO del iframe)

Firmado **HS256** con el `SSO_SHARED_SECRET` que ya compartimos.

| Claim | Valor |
|-------|-------|
| `iss` | `"revive"` |
| `aud` | `"proximoresidente"` |
| `email` | email del usuario (debe existir ya en nuestro Supabase `auth.users`) |
| `jti` | identificador único (UUID) — **un solo uso** |
| `exp` | corto: ahora + **60 s** |

Ejemplo (Node):

```js
import { SignJWT } from 'jose'
import { randomUUID } from 'crypto'

const token = await new SignJWT({ email: user.email })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuer('revive')
  .setAudience('proximoresidente')
  .setJti(randomUUID())
  .setIssuedAt()
  .setExpirationTime('60s')
  .sign(new TextEncoder().encode(process.env.SSO_SHARED_SECRET))

const url = `https://www.proximoresidente.com/mobile/auto-login?token=${encodeURIComponent(token)}`
// → abrir `url` como página completa en la app
```

## Reglas de seguridad (lado Revive)

1. **El token se genera en el servidor de Revive.** El secreto nunca va dentro de la app móvil ni del navegador.
2. Generar el token **solo para el usuario que ya inició sesión en Revive**; nunca para un email que venga del cliente.
3. **Un token nuevo en cada acceso.** Reutilizar un token = error `token_usado`.
4. Abrir la URL **justo después** de generarla (caduca en 60 s). No mandarla por WhatsApp/email: las vistas previas de enlaces la consumirían.

## Respuestas

| Caso | Redirección (HTTP 303) |
|------|------------------------|
| Token válido | `/dashboard` con la sesión iniciada |
| Falta el token, firma mala, iss/aud incorrectos o caducado | `/login?revive_error=token_invalido` |
| Token ya usado (`jti` repetido) | `/login?revive_error=token_usado` |
| El email no existe en nuestro Supabase | `/login?revive_error=usuario_no_encontrado` |
| Fallo de configuración/servidor nuestro | `/login?revive_error=no_configurado` o `error_servidor` |

`/login` muestra al usuario un mensaje en español según el código.

## Sobre "validar que sea móvil"

No lo validamos por User-Agent: se falsifica trivialmente y no aporta seguridad. La protección real es la firma del token, el `jti` de un solo uso y la caducidad corta. El endpoint funciona igual desde cualquier dispositivo; es Revive quien decide usarlo en móvil.

## El iframe de escritorio no cambia

`POST /api/auth/sso` y el flujo por `postMessage` siguen igual.
