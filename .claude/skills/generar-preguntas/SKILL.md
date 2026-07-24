---
name: generar-preguntas
description: >-
  Convierte documentos de exámenes (PDF o Word) de las distintas universidades en
  preguntas JSON listas para subir a Próximo Residente, con las etiquetas correctas
  (especialidad, tema, dificultad). Úsala cuando el usuario suba o mencione un
  documento con preguntas de examen (UNAL, Rosario, El Bosque, ENARM, UdeA, CES, MIR…)
  y pida "generar preguntas", "extraer preguntas", "pasar a JSON", "cargar preguntas"
  o "armar el banco". Maneja dos casos: (1) el documento ya trae la respuesta marcada
  (con X, subrayado, negrita o resaltado) y (2) el documento NO trae respuesta y hay
  que razonar cuál es la correcta.
---

# Generar preguntas para Próximo Residente

Esta skill toma un documento con preguntas de un examen (PDF o Word) y produce un
archivo **JSON válido** que se sube a la base con `scripts/importar-preguntas.ts`.

El objetivo es **no inventar datos** y respetar **exactamente** el formato y las
etiquetas que ya usa la plataforma. Si algo falta, se pregunta; no se rellena a ojo.

---

## 1. Antes de empezar: pide lo mínimo que falte

Necesitas saber tres cosas del documento. Si el usuario no las dio, pregúntalas en
una sola tanda (flujo conversacional, no interrogatorio):

1. **¿De qué examen / universidad es?** → determina el `examen` (código) y el `anio`.
   Códigos que ya existen en la base (usa uno de estos si aplica):

   | Código     | Nombre (para mostrar) |
   |------------|-----------------------|
   | `UNAL`     | UNAL                  |
   | `ROSARIO`  | Rosario               |
   | `ELBOSQUE` | El Bosque             |
   | `ENARM`    | ENARM                 |
   | `UDEA`     | UdeA                  |
   | `CES`      | CES                   |
   | `CALDAS`   | Caldas                |
   | `MIR`      | MIR (España)          |

   > Verifica siempre los códigos existentes antes de crear uno nuevo, para no
   > duplicar exámenes. Puedes listarlos con una consulta rápida a `tipoExamen`.

   Si es una universidad nueva, propón un código corto en MAYÚSCULAS (p. ej. `JAVERIANA`)
   y confírmalo. El importador lo crea solo.

2. **¿Qué año es el examen?** (ej. 2024). Si el documento lo dice, tómalo de ahí.

3. **¿El documento ya trae marcadas las respuestas correctas, o hay que resolverlas?**
   Esto define el modo de trabajo (sección 3). Si no está claro, míralo tú mismo al
   abrir el documento y avisa lo que encontraste.

---

## 2. Cómo leer el documento (¡las marcas visuales importan!)

El punto crítico: cuando la respuesta viene **subrayada, resaltada, en negrita o con
una X**, esa marca se PIERDE si extraes solo texto plano. Elige el método según el tipo:

### PDF
- **Usa la tool `Read` directamente sobre el PDF** (lo renderiza como imagen y así *ves*
  subrayados, resaltados y X). Este es el método preferido cuando hay respuestas marcadas.
  Lee por rangos de páginas (máx. 20 por llamada) con el parámetro `pages`.
- Para PDFs muy largos de solo texto (sin marcas), puedes además apoyarte en la
  extracción de texto, pero **la lectura visual manda** cuando hay marcas.

### Word (.docx)
La tool `Read` no abre `.docx`. Tienes dos rutas, en orden de preferencia:

- **Ruta A — preservar el formato (recomendada si hay marcas):** convierte el `.docx`
  a HTML con `mammoth` (ya está instalado). El HTML conserva `<strong>` (negrita),
  `<u>` (subrayado) y el resaltado como estilos, así puedes ver qué opción está marcada:

  ```bash
  npx tsx -e "const m=require('mammoth');m.convertToHtml({path:process.argv[1]}).then(r=>console.log(r.value))" "RUTA/al/archivo.docx" > /tmp/preguntas.html
  ```
  Luego abre `/tmp/preguntas.html` con `Read` y busca `<u>…</u>`, `<strong>…</strong>`
  o `background`/`highlight` en las opciones.

- **Ruta B — convertir a PDF y leer visualmente:** si tienes LibreOffice
  (`soffice`) o Word disponible, exporta el `.docx` a PDF y usa `Read` sobre el PDF.
  Útil cuando la marca es una X manuscrita o un resaltado de color que el HTML no capta bien.

- **Ruta C — solo texto (última opción):** si no hay marcas y solo importa el contenido,
  extrae texto plano con mammoth (`extractRawText`).

> Si al abrir el documento las marcas son ambiguas (p. ej. varias opciones subrayadas,
> o una X que no se sabe a qué opción apunta), **no adivines**: marca esa pregunta para
> revisión (ver sección 4) y sigue con las demás.

---

## 3. Los dos modos de resolver la respuesta

### Modo A — El documento YA trae la respuesta marcada
Extrae la letra de la opción marcada (X / subrayado / negrita / resaltado) y ponla en
`respuesta_correcta`. **No cambies el criterio del examen**, aunque creas que está mal:
la respuesta oficial es la que marcó el documento. Si detectas que la marca contradice
la evidencia médica, consérvala igual pero anótalo en el reporte de la sección 4.

### Modo B — El documento NO trae respuesta → hay que resolverla
Razona clínicamente cuál es la opción correcta y ponla en `respuesta_correcta`. Para
cada pregunta que resuelvas tú:

- Elige la mejor opción con criterio médico estándar (guías vigentes).
- Asigna un nivel de **confianza** (`alta` / `media` / `baja`).
- Añade el campo interno `_resuelta_por_ia: true` y `_confianza: "…"` a esa pregunta.
- Si dudas entre dos opciones o la pregunta está incompleta/mal transcrita, marca
  `_revisar: true` con una nota breve en `_nota`.

### Modo C — La pregunta está INCOMPLETA (faltan opciones)
Las reconstrucciones a veces traen preguntas con menos de 4 opciones, o solo el
enunciado con la respuesta correcta y sin alternativas. Hay dos políticas según lo que
pida el usuario:

- **Por defecto (extracción fiel):** OMITE la pregunta incompleta y cuéntala como
  "incompleta". No inventes lo que falta.
- **Modo recuperación (cuando el usuario lo pide explícitamente, ej. "recupera las
  incompletas / genera distractores"):** complétala con información médica válida:
  - **Caso A — ya tiene respuesta correcta** (marcada) + 1-3 opciones: conserva el
    enunciado, las opciones reales y la respuesta; **genera los distractores que falten**
    hasta llegar a 4 opciones. Deben ser clínicamente verosímiles, del mismo dominio, pero
    claramente incorrectos. La correcta no siempre va en A.
  - **Caso B — no hay respuesta ni opciones suficientes:** resuelve la correcta con criterio
    médico estándar y **crea las 4 opciones** completas (correcta + 3 distractores válidos).
  - Marca SIEMPRE estas preguntas recuperadas con `_revisar: true`, `_recuperada: true`,
    `_distractores_ia: true` (si generaste distractores), y en el Caso B además
    `_resuelta_por_ia: true` + `_confianza`. Añade `_nota` diciendo qué completaste.
  - Racional: es contenido generado por IA sobre una base real → **debe** pasar por
    revisión humana antes de publicarse. Por eso van todas marcadas.

Estos campos con guion bajo (`_resuelta_por_ia`, `_confianza`, `_revisar`, `_nota`,
`_recuperada`, `_distractores_ia`) son **solo para control**: el importador los usa para
el reporte y los **descarta antes de insertar** en la base. No rompen nada.

---

## 4. Etiquetado: usa SOLO la taxonomía canónica

Cada pregunta lleva estas etiquetas. **No inventes especialidades nuevas.**

### `especialidad` — valor EXACTO de esta lista (con tildes):

```
Anatomía · Anestesiología · Bioquímica · Cardiología · Cirugía General ·
Dermatología · Endocrinología · Epidemiología y Salud Pública · Farmacología ·
Fisiología · Gastroenterología · Genética · Ginecología y Obstetricia · Hematología ·
Infectología · Inmunología · Medicina de Urgencias · Medicina Interna · Nefrología ·
Neumología · Neurocirugía · Neurología · Oftalmología · Oncología ·
Otorrinolaringología · Patología · Pediatría · Psiquiatría · Radiología ·
Reumatología · Traumatología y Ortopedia · Urología
```

La lista viva está en `src/lib/constants.ts` (`ESPECIALIDADES`). Si dudas entre una
subespecialidad y su padre, usa el padre (ej. *Neonatología* → `Pediatría`,
*Hepatología* → `Gastroenterología`, *Digestivo* → `Gastroenterología`). El importador
normaliza con `normalizeEspecialidad()`, pero es mejor entregar el valor canónico ya.

### `tema` — string libre pero específico
Un tema clínico corto y concreto, no la especialidad otra vez. Ej.:
`"Profilaxis post-exposición VHB"`, `"Manejo inicial del ACV isquémico"`,
`"Insuficiencia cardíaca con FEr"`. Es obligatorio.

### `subtema` — opcional
Detalle adicional si aporta (`"Enfoque diagnóstico"`). Puede omitirse.

### `dificultad` — uno de: `baja` · `media` · `alta`
Si no tienes criterio, usa `media`.

---

## 5. Formato de salida (contrato EXACTO)

Escribe un archivo `.json` con esta estructura (uno por examen+año). Es el formato que
`scripts/importar-preguntas.ts` sabe leer:

```json
{
  "examen": "UNAL",
  "anio": 2024,
  "fuente": "Reconstrucción UNAL 2024",
  "preguntas": [
    {
      "enunciado": "Texto completo de la pregunta / caso clínico…",
      "opciones": [
        { "letra": "A", "texto": "…" },
        { "letra": "B", "texto": "…" },
        { "letra": "C", "texto": "…" },
        { "letra": "D", "texto": "…" }
      ],
      "respuesta_correcta": "B",
      "especialidad": "Infectología",
      "tema": "Profilaxis post-exposición VHB",
      "subtema": "Manejo tras exposición ocupacional",
      "dificultad": "media"
    }
  ]
}
```

Reglas del contrato (el importador rechaza lo que no cumpla):

- `enunciado`: string de **≥ 20 caracteres**. Transcribe el caso completo, sin cortar.
- `opciones`: array de **4 o 5** objetos `{ letra, texto }`. Las letras van en orden
  `A, B, C, D` (y `E` si hay quinta). Sin opciones vacías. Si el documento trae menos de 4,
  o la omites (por defecto) o la recuperas generando distractores (Modo C, sección 3).
- `respuesta_correcta`: una letra `A`–`E` que **exista** entre las opciones.
- `especialidad`: valor canónico (sección 4). Obligatorio.
- `tema`: obligatorio, no vacío.
- `dificultad`: `baja` | `media` | `alta` (opcional; por defecto `media`).
- `imagen_url` / `video_url`: solo si el documento referencia una imagen/vídeo y tienes
  la URL. Si no, **omítelos** (no pongas rutas locales ni placeholders).

Campos internos opcionales (se descartan al importar): `_resuelta_por_ia`, `_confianza`,
`_revisar`, `_nota`, `_recuperada`, `_distractores_ia`.

**Dónde guardar el archivo:** en `scripts/data/` con nombre `codigo_anio.json` en
minúsculas, ej. `scripts/data/unal_2024.json`. Así queda junto a los demás sets.

---

## 6. Subir a la base (un solo comando)

Cuando el JSON esté listo y validado:

```bash
cd /d/mir-prep/mir-prep
npx tsx scripts/importar-preguntas.ts scripts/data/unal_2024.json
```

El importador:
- Crea/reutiliza el `TipoExamen` por su código.
- Valida cada pregunta (mismas reglas de arriba) y **salta las inválidas** avisando.
- Es **idempotente**: si vuelves a correrlo, no duplica (salta preguntas cuyo enunciado
  ya exista para ese examen).
- Descarta los campos `_…` internos.
- Al final imprime cuántas insertó, cuántas duplicadas y cuántas inválidas.

Requiere `DATABASE_URL` (o `DIRECT_URL`) en `.env.local` (ya configurado en el proyecto).

---

## 7. Cierra con un resumen claro

Al terminar, dile al usuario en lenguaje simple:
- Cuántas preguntas se generaron y de qué examen/año.
- Cuántas venían con respuesta marcada (Modo A) y cuántas resolviste tú (Modo B).
- **La lista de preguntas marcadas `_revisar: true`** (número + motivo), para que un
  humano las revise antes de confiar en ellas.
- El archivo JSON creado y el comando exacto para subirlas.

No sugieras precios ni des consejos de venta. No inventes datos: si el documento estaba
incompleto o ilegible en alguna parte, dilo.
