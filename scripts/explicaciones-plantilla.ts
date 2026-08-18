/**
 * scripts/explicaciones-plantilla.ts
 *
 * Rellena Pregunta.explicacion con una retroalimentación de plantilla, sin IA
 * y sin API key. Solo usa datos que ya están en la base: la letra correcta, el
 * texto de esa opción, el tema/especialidad y, si existe, el tip_mir del
 * ResumenTema correspondiente. No inventa nada.
 *
 * Limitación conocida: una plantilla NO puede explicar por qué cada opción
 * incorrecta lo es. Para eso hace falta leer la pregunta —ver
 * scripts/generar-explicaciones.ts, que sustituye estas plantillas por
 * explicaciones reales cuando haya ANTHROPIC_API_KEY.
 *
 * Las marca con explicacion_modelo = 'plantilla' para poder distinguirlas
 * y regenerarlas después de forma selectiva.
 *
 * Uso:
 *   npx tsx scripts/explicaciones-plantilla.ts            # rellena las que no tienen
 *   npx tsx scripts/explicaciones-plantilla.ts --rehacer  # regenera también las plantillas previas
 *   npx tsx scripts/explicaciones-plantilla.ts --muestra  # solo enseña 5 ejemplos, no escribe
 */
import path from 'path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!),
} as any)

const REHACER = process.argv.includes('--rehacer')
const MUESTRA = process.argv.includes('--muestra')

/**
 * Texto de la plantilla, construido en SQL para poder actualizar las ~8.600
 * preguntas de una sola pasada en vez de fila por fila.
 *
 * - texto_correcta: el texto de la opción cuya letra coincide con respuesta_correcta.
 * - tip: el tip_mir del ResumenTema que coincida en especialidad+tema (pocos casos).
 */
const SQL_ACTUALIZAR = `
UPDATE "Pregunta" p
SET "explicacion" = concat(
      'Respuesta correcta: ', p."respuesta_correcta",
      coalesce(
        ' — «' || (
          SELECT o->>'texto'
          FROM jsonb_array_elements(p."opciones") o
          WHERE o->>'letra' = p."respuesta_correcta"
          LIMIT 1
        ) || '».',
        '.'
      ),
      ' Tema evaluado: ', p."tema", ' (', p."especialidad", ').',
      coalesce(
        ' Tip MIR: ' || (
          SELECT nullif(btrim(r."tip_mir"), '')
          FROM "ResumenTema" r
          WHERE r."especialidad" = p."especialidad" AND r."tema" = p."tema"
          LIMIT 1
        ),
        ''
      )
    ),
    "explicacion_modelo" = 'plantilla',
    "updatedAt" = now()
WHERE jsonb_typeof(p."opciones") = 'array'
  AND p."tema" IS NOT NULL
  AND __WHERE__
`

async function main() {
  const filtro = REHACER
    ? `(p."explicacion" IS NULL OR p."explicacion_modelo" = 'plantilla')`
    : `p."explicacion" IS NULL`

  if (MUESTRA) {
    const ejemplos = await prisma.$queryRawUnsafe<any[]>(`
      SELECT p."respuesta_correcta", p."tema", p."especialidad",
        (SELECT o->>'texto' FROM jsonb_array_elements(p."opciones") o
          WHERE o->>'letra' = p."respuesta_correcta" LIMIT 1) AS texto,
        r."tip_mir"
      FROM "Pregunta" p
      LEFT JOIN "ResumenTema" r
        ON r."especialidad" = p."especialidad" AND r."tema" = p."tema"
      WHERE jsonb_typeof(p."opciones") = 'array' AND p."tema" IS NOT NULL
      ORDER BY random() LIMIT 5
    `)
    for (const e of ejemplos) {
      const tip = e.tip_mir?.trim() ? ` Tip MIR: ${e.tip_mir}` : ''
      console.log(
        `\nRespuesta correcta: ${e.respuesta_correcta}` +
          (e.texto ? ` — «${e.texto}».` : '.') +
          ` Tema evaluado: ${e.tema} (${e.especialidad}).${tip}`
      )
    }
    console.log('\n(muestra — no se escribió nada)')
    return
  }

  const antes = await prisma.pregunta.count({ where: { explicacion: null } })
  const afectadas = await prisma.$executeRawUnsafe(SQL_ACTUALIZAR.replace('__WHERE__', filtro))

  const sinExplicacion = await prisma.pregunta.count({ where: { explicacion: null } })
  const conPlantilla = await prisma.pregunta.count({ where: { explicacion_modelo: 'plantilla' } })

  console.log(`Sin explicación antes:   ${antes}`)
  console.log(`Preguntas actualizadas:  ${afectadas}`)
  console.log(`Con plantilla en total:  ${conPlantilla}`)
  console.log(`Siguen sin explicación:  ${sinExplicacion}`)
  if (sinExplicacion > 0) {
    console.log('  (opciones mal formadas o sin tema — revisar a mano)')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
