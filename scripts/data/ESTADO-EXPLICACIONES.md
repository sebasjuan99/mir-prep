# Explicaciones de las preguntas — dónde vamos

Última actualización: **2026-08-18**

Cada pregunta lleva en `Pregunta.explicacion` una retroalimentación breve: por qué
la opción correcta lo es y por qué falla cada una de las demás. Se generan con
Claude desde `scripts/generar-explicaciones.ts` y **aparecen en la web en cuanto se
guardan** — no hace falta desplegar nada.

## Cómo continuar

```bash
cd D:\Mir-prep\mir-prep

# lo siguiente de la lista (una tanda de ~500)
npx tsx scripts/generar-explicaciones.ts --examen CES --lote 5
npx tsx scripts/generar-explicaciones.ts --examen UPB --lote 5

# ver antes cómo quedaría, sin gastar ni escribir en la base
npx tsx scripts/generar-explicaciones.ts --examen CES --limite 6 --lote 3 --dry-run
```

Es **reanudable**: si se corta, se relanza y sigue donde iba. Nunca repite lo hecho.

## Estado (2026-08-18)

| Examen | Visibles | Explicadas | Pendientes |
|---|---:|---:|---:|
| MIR | 210 | 210 ✅ | 0 |
| Cartagena | 297 | 287 | 10 |
| Sabana | 297 | 282 | 15 |
| Libre Cali | 298 | 274 | 24 |
| CES | 300 | 100 | 200 |
| UPB | 299 | 0 | 299 |
| UdeA | 299 | 0 | 299 |
| Univalle | 298 | 0 | 298 |
| UNAL | 309 | 0 | 309 |
| Caldas | 333 | 0 | 333 |
| FUCS | 229 | 0 | 229 |
| El Bosque | 500 | 0 | 500 |
| Rosario | 695 | 0 | 695 |
| Javeriana | 752 | 0 | 752 |
| ENARM | 1.881 | 0 | 1.881 |
| **Total** | **6.997** | **1.153** | **5.844** |

## Coste

Medido, no estimado: **1 centavo de dólar por pregunta** con `claude-opus-5` a
esfuerzo medio. Una tanda de 500 son unos **5 USD**; lo que queda, unos **58 USD**.
Cada corrida imprime al final sus tokens y su coste real.

El saldo se recarga en console.anthropic.com → Plans & Billing. Si se agota, el
script **para en seco** y lo dice; no reintenta a lo tonto.

## Las que quedan sin explicación

Cuando el modelo no puede justificar la respuesta marcada (porque no se sostiene o
el enunciado es ambiguo), **no se inventa una explicación**: deja la pregunta con
`explicacion_modelo = 'revision-medica'` y anota el motivo en
`scripts/data/explicaciones-alertas.json`. Esas preguntas ya no se reintentan en
las siguientes tandas; necesitan criterio médico. Para volver a intentarlas después
de corregirlas, `--regenerar`.

Dato útil: el MIR terminó con **cero alertas en 210 preguntas**, mientras que las
universidades completadas con preguntas reformuladas acumulan varias decenas. Son
errores heredados de los bancos de origen, no introducidos al generar.
