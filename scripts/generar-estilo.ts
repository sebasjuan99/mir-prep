/**
 * scripts/generar-estilo.ts
 *
 * Redacta las reformulaciones de un lote preparado por `preparar-lote-estilo.ts`.
 *
 * Toma cada pregunta de la reserva y la reescribe imitando el estilo del examen
 * destino: mismo hecho médico evaluado y misma respuesta correcta, pero enunciado
 * nuevo, opciones reordenadas y fraseo/longitud propios de esa universidad.
 *
 * Es reanudable: escribe el resultado incrementalmente y, si se corta, al volver
 * a lanzarlo sólo pide las que faltan.
 *
 * Uso:
 *   npx tsx scripts/generar-estilo.ts scripts/data/lotes/sabana-lote-281.json
 *   npx tsx scripts/generar-estilo.ts <lote.json> --lote 5 --concurrencia 3
 *   npx tsx scripts/generar-estilo.ts <lote.json> --limite 20        # prueba corta
 *
 * Opciones:
 *   --lote N          preguntas por llamada (default 5)
 *   --concurrencia N  llamadas simultáneas (default 3)
 *   --limite N        procesa como mucho N preguntas (para probar)
 *   --modelo NOMBRE   default claude-opus-5
 *   --esfuerzo NIVEL  low | medium | high | xhigh | max (default medium)
 *
 * Después:  npx tsx scripts/importar-generadas.ts <lote>-reformulado.json --dry
 *
 * Requiere ANTHROPIC_API_KEY: añade una línea al .env.local (está en .gitignore):
 *   ANTHROPIC_API_KEY=sk-ant-...
 */
import path from 'path'
import fs from 'fs'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const argv = process.argv.slice(2)
const opt = (n: string, def?: string) => {
  const i = argv.indexOf(`--${n}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def
}

const ARCHIVO = argv.find(a => !a.startsWith('--'))
const TAM_LOTE = Number(opt('lote', '5'))
const CONCURRENCIA = Number(opt('concurrencia', '3'))
const LIMITE = Number(opt('limite', '0')) || 0
const MODELO = opt('modelo', 'claude-opus-5')!
const ESFUERZO = opt('esfuerzo', 'medium')!

type Opcion = { letra: string; texto: string }
type Pregunta = {
  origen_id: string
  enunciado: string
  opciones: Opcion[]
  respuesta_correcta: string
  especialidad: string
  tema: string
  subtema: string | null
  dificultad: string
}

const LETRAS = ['A', 'B', 'C', 'D', 'E']

function sistema(perfil: any, destino: string) {
  const ops = perfil.opciones_tipicas ?? 4
  const letras = LETRAS.slice(0, ops).join('/')
  return `Eres un médico docente que redacta preguntas para el examen de residencia de ${destino} (Colombia).

Recibes preguntas de otro banco y las REFORMULAS al estilo de ${destino}. No inventas medicina nueva: cada pregunta sigue evaluando exactamente el mismo hecho clínico y conserva la MISMA opción correcta (aunque cambie de letra al reordenar).

Estilo medido sobre las preguntas reales de ${destino}:
- Exactamente ${ops} opciones, con letras ${letras}.
- Enunciado de ~${perfil.palabras_enunciado?.mediana ?? 15} palabras (rango real ${perfil.palabras_enunciado?.min ?? 5}-${perfil.palabras_enunciado?.max ?? 40}).
- ${perfil.pct_caso_clinico ?? 0}% son casos clínicos con viñeta; el resto pregunta directa de recuerdo o manejo.
- ${perfil.pct_fraseo_negativo ?? 0}% usan fraseo negativo (EXCEPTO / NO / FALSO).

Ejemplos reales de ${destino}, imita su tono y su longitud:
${(perfil.ejemplos ?? [])
  .slice(0, 8)
  .map((e: any, i: number) => `${i + 1}. ${e.enunciado}\n${(e.opciones ?? []).map((o: Opcion) => `   ${o.letra}) ${o.texto}`).join('\n')}`)
  .join('\n')}

Reglas estrictas:
- El enunciado reformulado NO puede ser el original con retoques: reescríbelo de verdad (otra entrada, otro orden de la información, otro fraseo), manteniendo el contenido evaluado.
- Reordena las opciones y ajusta "respuesta_correcta" a la nueva letra de la opción que era correcta en el original.
- NO inviertas el sentido de la pregunta. Si el original pregunta en negativo (EXCEPTO / NO / cuál NO), la reformulada sigue siendo negativa; si es positiva, sigue positiva. Invertir la polaridad cambia cuál es la respuesta correcta, y eso está prohibido: el hecho evaluado y la opción correcta deben ser los mismos que en el original.
- El texto de la opción correcta debe seguir diciendo lo mismo que decía en el original. Puedes reescribirlo o completarlo (por ejemplo "5" -> "Queratina 5"), pero no sustituirlo por otro contenido.
- Los distractores deben ser plausibles y del mismo registro clínico. Puedes reescribirlos, pero no conviertas un distractor en una segunda respuesta válida.
- Si el enunciado original es ambiguo o consideras que la opción marcada como correcta NO lo es, reformúlala igualmente respetando esa opción y devuelve "alerta" con el motivo en una frase. No cambies la respuesta por tu cuenta.
- Español de Colombia con ortografía correcta: TODAS las tildes en su sitio (diagnóstico, crónica, sérico, cuál, análisis, hemodiálisis, catiónico, electrocardiográfico...). Un texto sin tildes es un error, no un estilo.
- Sin markdown, sin comillas tipográficas raras, sin numerar la pregunta.
- Si el enunciado original menciona su universidad de origen, elimínala.`
}

function usuario(preguntas: Pregunta[]) {
  return preguntas
    .map(
      p => `origen_id: ${p.origen_id}
especialidad: ${p.especialidad} / ${p.tema}
enunciado: ${p.enunciado}
opciones:
${p.opciones.map(o => `  ${o.letra}. ${o.texto}`).join('\n')}
correcta: ${p.respuesta_correcta}`,
    )
    .join('\n\n---\n\n')
}

function esquema(opcionesTipicas: number) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['preguntas'],
    properties: {
      preguntas: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['origen_id', 'enunciado', 'opciones', 'respuesta_correcta', 'alerta'],
          properties: {
            origen_id: { type: 'string' },
            enunciado: { type: 'string' },
            opciones: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['letra', 'texto'],
                properties: {
                  letra: { type: 'string', enum: LETRAS.slice(0, opcionesTipicas) },
                  texto: { type: 'string' },
                },
              },
            },
            respuesta_correcta: { type: 'string', enum: LETRAS.slice(0, opcionesTipicas) },
            alerta: { type: ['string', 'null'] },
          },
        },
      },
    },
  }
}

async function reformularLote(client: any, perfil: any, destino: string, preguntas: Pregunta[]) {
  let ultimoError: unknown
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const message = await client.messages.create({
        model: MODELO,
        max_tokens: 16000,
        system: sistema(perfil, destino),
        output_config: {
          effort: ESFUERZO,
          format: { type: 'json_schema', schema: esquema(perfil.opciones_tipicas ?? 4) },
        },
        messages: [{ role: 'user', content: usuario(preguntas) }],
      })

      // Claude Opus 5 puede declinar una petición: hay que mirarlo antes del contenido.
      if (message.stop_reason === 'refusal') {
        throw new Error(`rechazada por los clasificadores (${message.stop_details?.category ?? 'sin categoría'})`)
      }
      if (message.stop_reason === 'max_tokens') {
        throw new Error('respuesta truncada — baja --lote')
      }

      const bloque = message.content.find((b: any) => b.type === 'text')
      if (!bloque) throw new Error(`sin bloque de texto (stop_reason: ${message.stop_reason})`)
      const parsed = JSON.parse(bloque.text)
      if (!Array.isArray(parsed?.preguntas)) throw new Error('la respuesta no trae "preguntas"')
      return parsed.preguntas
    } catch (err) {
      ultimoError = err
      if (intento < 3) await new Promise(r => setTimeout(r, 2000 * intento))
    }
  }
  throw ultimoError
}

async function main() {
  if (!ARCHIVO) {
    console.error('Uso: npx tsx scripts/generar-estilo.ts <lote.json> [--lote N] [--concurrencia N] [--limite N]')
    process.exit(1)
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Falta ANTHROPIC_API_KEY. Añade esta línea al .env.local:')
    console.error('  ANTHROPIC_API_KEY=sk-ant-...')
    process.exit(1)
  }

  const ruta = path.resolve(ARCHIVO)
  const data = JSON.parse(fs.readFileSync(ruta, 'utf8'))
  const destino: string = data.destino?.nombre ?? 'la universidad'
  const perfil = data.perfil_estilo ?? {}
  const todas: Pregunta[] = data.preguntas ?? []

  const salidaPath = ruta.replace(/\.json$/, '-reformulado.json')

  // Reanudable: conserva lo ya redactado en una corrida anterior.
  const hechas = new Map<string, any>()
  if (fs.existsSync(salidaPath)) {
    const previo = JSON.parse(fs.readFileSync(salidaPath, 'utf8'))
    for (const p of previo.preguntas ?? []) hechas.set(p.origen_id, p)
    console.log(`Reanudando: ${hechas.size} ya redactadas en ${path.basename(salidaPath)}`)
  }

  let pendientes = todas.filter(p => !hechas.has(p.origen_id))
  if (LIMITE) pendientes = pendientes.slice(0, LIMITE)

  if (!pendientes.length) {
    console.log('No queda nada por redactar.')
    return
  }

  console.log(`Destino: ${destino} · pendientes: ${pendientes.length} · modelo: ${MODELO} · esfuerzo: ${ESFUERZO}`)

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })

  const lotes: Pregunta[][] = []
  for (let i = 0; i < pendientes.length; i += TAM_LOTE) lotes.push(pendientes.slice(i, i + TAM_LOTE))

  const porId = new Map(todas.map(p => [p.origen_id, p]))
  const alertas: Array<{ origen_id: string; motivo: string; enunciado: string }> = []
  let ok = 0
  let fallos = 0
  let siguiente = 0

  const guardar = () => {
    fs.writeFileSync(
      salidaPath,
      JSON.stringify({ ...data, preguntas: [...hechas.values()] }, null, 2),
      'utf8',
    )
  }

  async function worker() {
    while (siguiente < lotes.length) {
      const idx = siguiente++
      const lote = lotes[idx]
      try {
        const res = await reformularLote(client, perfil, destino, lote)
        const porOrigen = new Map(res.map((r: any) => [r.origen_id, r]))
        for (const p of lote) {
          const r: any = porOrigen.get(p.origen_id)
          if (!r?.enunciado || !Array.isArray(r.opciones)) {
            fallos++
            continue
          }
          if (r.alerta) {
            alertas.push({ origen_id: p.origen_id, motivo: r.alerta, enunciado: p.enunciado.slice(0, 120) })
          }
          const base = porId.get(p.origen_id)!
          hechas.set(p.origen_id, {
            origen_id: p.origen_id,
            enunciado: r.enunciado.trim(),
            opciones: r.opciones,
            respuesta_correcta: r.respuesta_correcta,
            especialidad: base.especialidad,
            tema: base.tema,
            subtema: base.subtema,
            dificultad: base.dificultad,
            ...(r.alerta ? { _revisar: r.alerta } : {}),
          })
          ok++
        }
        guardar()
      } catch (err) {
        fallos += lote.length
        console.error(`\nLote ${idx + 1} falló: ${(err as Error).message}`)
      }
      process.stdout.write(`\r  ${ok + fallos}/${pendientes.length}  ok:${ok}  alertas:${alertas.length}  fallos:${fallos}   `)
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, lotes.length) }, worker))
  guardar()

  console.log('\n')
  console.log(`Redactadas: ${ok} · Fallos: ${fallos} · Marcadas para revisión médica: ${alertas.length}`)
  if (alertas.length) {
    const log = salidaPath.replace(/\.json$/, '-alertas.json')
    fs.writeFileSync(log, JSON.stringify(alertas, null, 2), 'utf8')
    console.log(`Dudas sobre la respuesta original (revisar a mano): ${log}`)
    for (const a of alertas.slice(0, 5)) console.log(`  - ${a.motivo}`)
    if (alertas.length > 5) console.log(`  ... y ${alertas.length - 5} más`)
  }
  console.log(`\nSalida: ${salidaPath}`)
  console.log(`Siguiente: npx tsx scripts/importar-generadas.ts ${salidaPath} --dry`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
