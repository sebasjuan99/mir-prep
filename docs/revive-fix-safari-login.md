# Nota técnica — Arreglo del login en Safari (iframe Revive)

**Para:** ingeniero de Revive
**De:** equipo Próximo Residente
**Fecha:** 2026-07-10
**Estado:** primer arreglo (CHIPS) desplegado ✅ · **insuficiente en Safari** · necesitamos 2 cambios de tu lado

---

## ⚠️ Actualización (tras probar en Safari)

El arreglo con cookies `Partitioned` (CHIPS) **no fue suficiente en Safari** (WebKit es más estricto que Chrome). Además, al probar aparecieron en la consola de Safari **errores que provienen de vuestro propio bundle**, no del nuestro. Hay **dos frentes**:

### Frente 1 — Errores en el código de Revive (a revisar por vosotros)

En la consola de Safari salen estos errores con el stack en un archivo llamado **`normal`** (funciones `aZ`, `aA`, `xL`, `BIsNb`, `F2`, `FQ`…):

```
[Error] NaN
[Error] Blocked a frame with origin "https://www.proximoresidente.com" from accessing a frame with origin "https://revivevirtual.com". Protocols, domains, and ports must match. (x2)
[Error] Blocked a frame with origin "https://challenges.cloudflare.com" from accessing a frame with origin "https://www.proximoresidente.com".
```

- **`normal` es vuestro bundle, no el nuestro.** Próximo Residente sirve solo archivos `/_next/static/chunks/*.js` (con hash) y `turbopack-*.js`; no existe ningún `normal`. Por favor mapead ese stack con vuestros *sourcemaps*.
- **`Blocked a frame ... from accessing a frame`**: algo en vuestro código intenta leer *directamente* el contenido de un iframe cross-origin (el nuestro y el de Cloudflare). Eso el navegador lo bloquea siempre. La comunicación con nuestro iframe debe ser **solo por `postMessage`** (nunca `iframe.contentWindow.document`, `.location`, etc.).
- **`challenges.cloudflare.com`**: tenéis un desafío de **Cloudflare Turnstile / anti-bot** en la página que embebe. Conviene revisar que no interfiera con la carga del iframe.

### Frente 2 — Login en Safari: hace falta Storage Access API (2 cambios de vuestro lado)

Safari bloquea las cookies de terceros dentro del iframe incluso particionadas. El único camino fiable en Safari es la **Storage Access API**, que **requiere**:

1. **Añadir `allow="storage-access"` al `<iframe>`** (además del `allow` que ya tengáis):
   ```html
   <iframe
     src="https://www.proximoresidente.com"
     allow="fullscreen; storage-access"
     style="width:100%; height:100%; border:0;">
   </iframe>
   ```
2. **Aceptar un clic del usuario dentro del iframe** (un botón "Entrar"). Safari **no** concede el acceso al almacenamiento sin un gesto explícito del usuario; no se puede hacer automático al cargar. Nosotros añadiríamos ese botón dentro del iframe.

> Con esos dos cambios, nosotros implementamos en nuestro lado la llamada a `document.requestStorageAccess()` tras el clic, y ahí sí la sesión de Safari persiste. Chrome/Firefox seguirán funcionando como hasta ahora.

### Prueba que confirma la causa (opcional, en Mac)

Safari → *Desarrollo → Mostrar inspector web → Almacenamiento → Cookies*: si tras intentar entrar **no aparece ninguna cookie de `www.proximoresidente.com`**, queda confirmado que Safari bloquea la cookie y que la Storage Access API es el camino.

---

## Contexto del primer arreglo (ya desplegado)

---

## TL;DR

Detectamos y **ya corregimos** en nuestro lado el problema de *"en Safari el usuario se loguea pero no entra a la plataforma"*. **No necesitas cambiar código** de la integración SSO/webhook: el token, el `postMessage` y todo el handshake siguen exactamente igual. Solo te pedimos **probarlo en Safari** y tener en cuenta un matiz para navegadores muy antiguos.

---

## Qué pasaba

En **Safari** (no en Chrome), tras el handshake SSO el usuario quedaba fuera:

1. Recibíamos tu `PR_SSO_TOKEN`, lo canjeábamos en `/api/auth/sso` y obteníamos la sesión de Supabase — **esto funcionaba bien**.
2. Al activar la sesión (`setSession`), el navegador debe **guardar una cookie** de sesión.
3. Nuestro render de servidor lee esa cookie para saber que el usuario está logueado.

El fallo estaba en el paso 2→3, **solo en Safari**:

> Safari (motor de *Intelligent Tracking Prevention*) **bloquea por defecto todas las cookies de terceros dentro de un iframe cross-site**, incluso las `SameSite=None; Secure`. Chrome todavía las tolera — por eso allí funcionaba.

Resultado: la sesión se activaba en memoria (parecía que entraba), pero la cookie **no se persistía** → el servidor la veía como sesión cerrada → redirigía a login. Ese era el *"se loguea pero no coge el token"*.

## Qué arreglamos (en nuestro lado, ya desplegado)

Marcamos la cookie de sesión del iframe como **`Partitioned` (CHIPS — Cookies Having Independent Partitioned State)**. Una cookie particionada queda "encajonada" al par **(sitio contenedor + sitio de la cookie)**, así que Safari/Chrome/Firefox **sí la aceptan y la reenvían dentro del iframe**, sin ser una cookie de terceros "clásica".

- Aplicado en el cliente del navegador y en nuestro middleware de sesión.
- **Solo afecta al contexto embebido** (iframe cross-site); los usuarios que entran directo a la web no cambian en nada.
- Desplegado en producción (`proximoresidente.com` / `www.proximoresidente.com`).

## Qué necesitamos de ti

1. **Probar el login en Safari real** (iPhone y/o Mac): abrir Revive, loguearse y confirmar que **entra** a la plataforma.
   - Para verificar a bajo nivel (opcional): en macOS, Safari → menú *Desarrollo* → *Mostrar inspector web* → pestaña **Almacenamiento → Cookies**: la cookie de sesión de `www.proximoresidente.com` debe aparecer con la marca **Partitioned**.
2. **Confirmar que el embed cumple los requisitos de cookie segura** (ya deberían estar, solo es checklist):
   - El iframe carga sobre **HTTPS** (obligatorio: `Partitioned` exige `Secure`).
   - Sigues embebiendo **`https://www.proximoresidente.com`** (con `www`), como ya está documentado — no el apex.

> **No hay que tocar nada más de tu integración**: ni el JWT, ni el flujo `PR_IFRAME_READY` / `PR_SSO_TOKEN` / `PR_SSO_OK`, ni el webhook.

## Matiz importante — Safari antiguo

`Partitioned` (CHIPS) está soportado en **Safari 18.4+**, Chrome y Firefox. En **iOS/Safari anteriores a 18.4** el login por iframe **podría seguir fallando**.

- La mayoría de dispositivos actuales ya están en 18.4+, así que esperamos que cubra a casi todos los usuarios.
- Si en tus pruebas ves que **falla en algún dispositivo concreto**, dinos **qué versión de iOS/Safari** era. Para cubrir esos casos existe un plan B (*Storage Access API*): es más robusto pero **requiere un clic explícito del usuario dentro del iframe** (un botón tipo "Entrar") y, del lado de Revive, añadir el permiso **`allow="storage-access"`** al `<iframe>`. No lo hemos implementado porque cambia la experiencia; lo montamos solo si hace falta.

## Resumen

| | |
|---|---|
| ¿Cambia algo de tu integración SSO/webhook? | **No** |
| ¿Qué hicimos? | Cookies `Partitioned` (CHIPS) en el iframe, desplegado en prod |
| ¿Qué te pedimos? | Probar login en Safari + confirmar versión si falla algún equipo |
| Cobertura | Safari 18.4+ / Chrome / Firefox (plan B para Safari viejo si aparece) |

Cualquier duda, aquí estamos 🙌
