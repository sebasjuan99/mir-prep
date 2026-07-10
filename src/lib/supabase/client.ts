import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }

  // Dentro de un iframe cross-site (integración Revive) las cookies de sesión
  // deben ser SameSite=None; Secure para que el navegador las envíe en los
  // requests del iframe y el render del servidor reconozca la sesión.
  // Además marcamos Partitioned (CHIPS): Safari (ITP) y Chrome (fin de las
  // cookies de terceros) bloquean las cookies de terceros normales dentro de
  // un iframe; una cookie particionada queda "encajonada" al par (sitio-top +
  // sitio-cookie) y sí se acepta y reenvía en ese contexto → arregla el login
  // en Safari, donde antes setSession no persistía y el servidor veía la sesión
  // como cerrada. Fuera del iframe (usuarios directos) se conservan los valores
  // por defecto (Lax), por lo que su experiencia no cambia en absoluto.
  const inIframe = typeof window !== 'undefined' && window.self !== window.top

  return createBrowserClient(supabaseUrl, supabaseKey,
    inIframe
      ? { cookieOptions: { sameSite: 'none', secure: true, partitioned: true } }
      : undefined
  )
}
