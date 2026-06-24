import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente admin de Supabase (service-role). Solo para operaciones privilegiadas
// desde el servidor (crear usuarios, cambiar contraseña/correo).
// Devuelve null si falta SUPABASE_SERVICE_ROLE_KEY: las rutas que lo usan
// responden 503 con un mensaje claro en vez de romperse.
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export const SERVICE_ROLE_MISSING_MSG =
  'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el entorno para esta acción.'
