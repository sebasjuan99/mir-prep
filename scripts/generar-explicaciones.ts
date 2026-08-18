/**
 * scripts/generar-explicaciones.ts
 *
 * Genera la retroalimentación breve de cada pregunta: por qué la opción correcta
 * lo es y por qué las demás no. La guarda en Pregunta.explicacion.
 *
 * Es reanudable: por defecto solo procesa preguntas con explicacion NULL, así que
 * si el proceso se corta, basta con volver a lanzarlo.
 *
 * Uso:
 *   npx tsx scripts/generar-explicaciones.ts --limite 25                  # prueba
 *   npx tsx scripts/generar-explicaciones.ts --examen ELBOSQUE            # un examen completo
 *   npx tsx scripts/generar-explicaciones.ts                              # todo el banco
 *   npx tsx scripts/generar-explicaciones.ts --examen UNAL --regenerar    # rehace las ya hechas
 *   npx tsx scripts/generar-explicaciones.ts --limite 10 --dry-run        # imprime sin guardar
 *
 * Opciones:
 *   --examen CODIGO     filtra por código de TipoExamen (ELBOSQUE, ENARM, UNAL...)
 *   --limite N          máximo de preguntas a procesar
 *   --lote N            preguntas por llamada a Claude (default 5)
 *   --concurrencia N    llamadas simultáneas (default 3)
 *   --modelo NOMBRE     modelo de Claude (default claude-opus-5)
 *   --esfuerzo NIVEL    low | medium | high (default medium)
 *   --regenerar         incluye también las que ya tienen explicación
 *   --dry-run           no escribe en la base de datos
 *
 * Requiere ANTHROPIC_API_KEY en .env.local o en el entorno.
 */
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!),
} as any)

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2)
const flag = (name: string) => argv.includes(`--${name}`)
const opt = (name: string, def?: string) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def
}

const EXAMEN = opt('examen')
const LIMITE = Number(opt('limite', '0')) || 0
const LOTE = Number(opt('lote', '5'))
const CONCURRENCIA = Number(opt('concurrencia', '3'))
const MODELO = opt('modelo', 'claude-opus-5')!
const ESFUERZO = opt('esfuerzo', 'medium') as 'low' | 'medium' | 'high'
const REGENERAR = flag('regenerar')
const DRY_RUN = flag('dry-run')

const LOG_ALERTAS = path.resolve(__dirname, 'data', 'explicaciones-alertas.json')

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Eres un médico docente que prepara retroalimentación para un banco de preguntas de exámenes de residencia médica en Colombia y España (MIR/ENARM y exámenes de universidades colombianas).

Para cada pregunta que recibas escribe UNA explicación breve, en español, de 3 a 5 frases, que:
1. Justifique con criterio clínico por qué la opción marcada como correcta es la correcta.
2. Descarte brevemente las demás opciones, nombrando la letra de cada una y el motivo concreto por el que no aplica (dato clave que la descarta, no una negación vacía).

Reglas estrictas:
- La respuesta correcta es la que se te indica en el campo "correcta". Explica ESA opción como correcta.
- Si tras analizar la pregunta consideras que la opción marcada como correcta NO lo es, o que el enunciado está incompleto, truncado o es ambiguo hasta el punto de no poder justificarla, NO inventes una justificación: devuelve "alerta" con el motivo y deja "explicacion" vacía.
- No inventes datos, cifras, guías ni referencias que no puedas sostener. Prefiere el criterio clínico general a citar una guía concreta con año.
- Tono directo y docente, sin preámbulos del tipo "En esta pregunta...". Empieza directamente por el contenido médico.
- Texto plano, sin markdown, sin viñetas, sin saltos de línea.
- No menciones que eres una IA ni el proceso de generación.

Devuelve ÚNICAMENTE un array JSON válido, sin texto adicional ni bloques de código, con un objeto por pregunta recibida:
[{"id": "<id de la pregunta>", "explicacion": "<texto>", "alerta": null}]

Usa "alerta": "<motivo breve>" y "explicacion": "" solo en los casos descritos arriba.`

type PreguntaBD = {
  id: string
  enunciado: string
  opciones: unknown
  respuesta_correcta: string
  especialidad: string
  tema: string
}

function formatearPregunta(p: PreguntaBD) {
  const opciones = Array.isArray(p.opciones)
    ? (p.opciones as Array<{ letra?: string; texto?: string }>)
        .map(o => `  ${o.letra}. ${o.texto}`)
        .join('\n')
    : '  (opciones no disponibles)'

  return `id: ${p.id}
especialidad: ${p.especialidad} / ${p.tema}
enunciado: ${p.enunciado}
opciones:
${opciones}
correcta: ${p.respuesta_correcta}`
}

// ---------------------------------------------------------------------------
// Llamada a Claude
// ---------------------------------------------------------------------------

type Resultado = { id: string; explicacion: string; alerta: string | null }

const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['explicaciones'],
  properties: {
    explicaciones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'explicacion', 'alerta'],
        properties: {
          id: { type: 'string' },
          explicacion: { type: 'string' },
          alerta: { type: ['string', 'null'] },
        },
      },
    },
  },
}

// Para poder decir al final cuánto costó de verdad, no una estimación.
let gastoEntrada = 0
let gastoSalida = 0

async function explicarLote(client: any, preguntas: PreguntaBD[]): Promise<Resultado[]> {
  const contenido = preguntas.map(formatearPregunta).join('\n\n---\n\n')

  let ultimoError: unknown
  for (let intento = 1; intento <= 3; intento++) {
    try {
      // max_tokens cubre razonamiento + respuesta: en Opus 5 el thinking está
      // activo por defecto, así que hay que dejar holgura o se trunca el JSON.
      const message = await client.messages.create({
        model: MODELO,
        max_tokens: 16000,
        output_config: {
          effort: ESFUERZO,
          format: { type: 'json_schema', schema: ESQUEMA },
        },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: contenido }],
      })

      // Claude Opus 5 puede declinar: comprobarlo antes de leer el contenido.
      if (message.stop_reason === 'refusal') {
        throw new Error(`rechazada por los clasificadores (${(message as any).stop_details?.category ?? 'sin categoría'})`)
      }
      if (message.stop_reason === 'max_tokens') {
        throw new Error('Respuesta truncada (max_tokens) — baja el tamaño del lote')
      }

      gastoEntrada += message.usage.input_tokens
      gastoSalida += message.usage.output_tokens

      // content puede traer bloques de thinking delante: hay que buscar el texto.
      const bloque = message.content.find(b => b.type === 'text')
      if (!bloque) throw new Error(`Sin bloque de texto (stop_reason: ${message.stop_reason})`)
      const parsed = JSON.parse((bloque as { type: 'text'; text: string }).text)
      if (!Array.isArray(parsed?.explicaciones)) throw new Error('La respuesta no trae "explicaciones"')
      return parsed.explicaciones
    } catch (err) {
      ultimoError = err
      // Sin saldo no sirve de nada reintentar 260 veces: se para en seco.
      const msg = (err as Error)?.message ?? ''
      if (/credit balance is too low|insufficient_quota/i.test(msg)) {
        console.error('\n\nSIN SALDO en la cuenta de API. Recarga en console.anthropic.com y relanza:')
        console.error('el script es reanudable, sigue donde lo dejó.\n')
        process.exit(2)
      }
      if (intento < 3) await new Promise(r => setTimeout(r, 2000 * intento))
    }
  }
  throw ultimoError
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Falta ANTHROPIC_API_KEY. Añádela a .env.local:')
    console.error('  ANTHROPIC_API_KEY=sk-ant-...')
    process.exit(1)
  }

  // Por defecto trabaja sobre lo que aún no tiene explicación real: las vacías
  // y las de plantilla (scripts/explicaciones-plantilla.ts). Con --regenerar
  // rehace también las que ya generó la IA.
  // Sólo lo que el estudiante puede ver: no se paga por explicar la reserva.
  const pendiente = {
    visible: true,
    OR: [
      { explicacion: null, explicacion_modelo: null },
      { explicacion_modelo: 'plantilla' },
    ],
  }
  const where: Record<string, unknown> = REGENERAR ? { visible: true } : { ...pendiente }
  if (EXAMEN) {
    const tipo = await prisma.tipoExamen.findUnique({ where: { codigo: EXAMEN } })
    if (!tipo) {
      const todos = await prisma.tipoExamen.findMany({ select: { codigo: true } })
      console.error(`No existe el examen "${EXAMEN}". Disponibles: ${todos.map(t => t.codigo).join(', ')}`)
      process.exit(1)
    }
    where.tipoExamen_id = tipo.id
  }

  const pendientes = await prisma.pregunta.count({ where })
  const preguntas = (await prisma.pregunta.findMany({
    where,
    select: {
      id: true,
      enunciado: true,
      opciones: true,
      respuesta_correcta: true,
      especialidad: true,
      tema: true,
    },
    orderBy: { createdAt: 'asc' },
    ...(LIMITE ? { take: LIMITE } : {}),
  })) as PreguntaBD[]

  if (!preguntas.length) {
    console.log('No hay preguntas pendientes con esos filtros.')
    return
  }

  console.log(`Pendientes con estos filtros: ${pendientes}`)
  console.log(`A procesar ahora: ${preguntas.length}  |  modelo: ${MODELO}  |  lote: ${LOTE}  |  concurrencia: ${CONCURRENCIA}${DRY_RUN ? '  |  DRY-RUN' : ''}\n`)

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })

  const lotes: PreguntaBD[][] = []
  for (let i = 0; i < preguntas.length; i += LOTE) lotes.push(preguntas.slice(i, i + LOTE))

  let ok = 0
  let alertas: Array<{ id: string; motivo: string; enunciado: string }> = []
  let fallos = 0
  let siguiente = 0

  async function worker() {
    while (siguiente < lotes.length) {
      const idx = siguiente++
      const lote = lotes[idx]
      try {
        const resultados = await explicarLote(client, lote)
        const porId = new Map(resultados.map(r => [r.id, r]))

        for (const p of lote) {
          const r = porId.get(p.id)
          if (!r) {
            fallos++
            continue
          }
          if (r.alerta || !r.explicacion?.trim()) {
            alertas.push({
              id: p.id,
              motivo: r.alerta || 'explicación vacía',
              enunciado: p.enunciado.slice(0, 120),
            })
            // Se marca en la base para que las siguientes pasadas NO la reintenten:
            // la respuesta del banco no se sostiene y hace falta criterio médico.
            // Con --regenerar vuelven a entrar.
            if (!DRY_RUN) {
              await prisma.pregunta.update({
                where: { id: p.id },
                data: { explicacion: null, explicacion_modelo: 'revision-medica' },
              })
            }
            continue
          }
          if (DRY_RUN) {
            console.log(`\n[${p.id}] correcta ${p.respuesta_correcta}\n  ${p.enunciado.slice(0, 100)}...\n  → ${r.explicacion}`)
          } else {
            await prisma.pregunta.update({
              where: { id: p.id },
              data: { explicacion: r.explicacion.trim(), explicacion_modelo: MODELO },
            })
          }
          ok++
        }
      } catch (err) {
        fallos += lote.length
        console.error(`Lote ${idx + 1} falló: ${(err as Error).message}`)
      }
      const hechos = ok + alertas.length + fallos
      process.stdout.write(`\r  ${hechos}/${preguntas.length}  ok:${ok}  alertas:${alertas.length}  fallos:${fallos}   `)
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, lotes.length) }, worker))

  console.log('\n')
  const costo = (gastoEntrada / 1e6) * 5 + (gastoSalida / 1e6) * 25 // Opus 5: $5 / $25 por millón
  console.log(`Explicaciones guardadas: ${ok}`)
  console.log(`Tokens: ${gastoEntrada.toLocaleString()} entrada / ${gastoSalida.toLocaleString()} salida  ≈ USD ${costo.toFixed(2)}`)
  console.log(`Marcadas para revisión:  ${alertas.length}`)
  console.log(`Fallos:                  ${fallos}`)

  if (alertas.length) {
    fs.mkdirSync(path.dirname(LOG_ALERTAS), { recursive: true })
    fs.writeFileSync(LOG_ALERTAS, JSON.stringify(alertas, null, 2), 'utf8')
    console.log(`\nPreguntas donde Claude no pudo justificar la respuesta marcada (revisar a mano):`)
    console.log(`  ${LOG_ALERTAS}`)
    for (const a of alertas.slice(0, 5)) console.log(`  - ${a.id}: ${a.motivo}`)
    if (alertas.length > 5) console.log(`  ... y ${alertas.length - 5} más`)
  }

  const restantes = await prisma.pregunta.count({
    where: EXAMEN ? { ...pendiente, tipoExamen_id: where.tipoExamen_id } : pendiente,
  })
  console.log(`\nQuedan sin explicación real (vacías o de plantilla): ${restantes}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
