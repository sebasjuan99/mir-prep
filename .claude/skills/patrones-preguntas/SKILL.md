---
name: patrones-preguntas
description: >-
  Identifica el ESTILO/patrón de preguntas de cada universidad (a partir de las
  preguntas ya cargadas en la base de Próximo Residente) y genera preguntas NUEVAS
  imitando ese estilo, a partir de guías de manejo o artículos médicos que suba el
  usuario. Úsala cuando el usuario diga "analiza el patrón de preguntas de X",
  "genera preguntas al estilo de la Nacional/CES/MIR", "crea preguntas de este
  artículo para la universidad Y", o suba un documento médico pidiendo preguntas
  para un examen concreto. Complementa a la skill `generar-preguntas` (esa extrae
  de reconstrucciones ya hechas; esta CREA preguntas nuevas desde contenido médico).
---

# Patrones de preguntas por universidad + generación al estilo

Dos modos. **Siempre** te apoyas en las preguntas reales que ya están en la base para
que el estilo sea fiel, no inventado.

Herramienta base (muestrea la base):
```bash
npx tsx scripts/muestra-preguntas.ts --list              # ver exámenes y su código
npx tsx scripts/muestra-preguntas.ts <CODIGO> 30 --stats # 30 ejemplos + estadísticas de estilo
```
Códigos: UNAL, ELBOSQUE, ROSARIO, CES, UDEA, CALDAS, CARTAGENA, FUCS, UNIVALLE,
SABANA, LIBRECALI, UPB, JAVERIANA, MIR, ENARM.

---

## MODO 1 — Analizar el patrón de una universidad

1. Corre `muestra-preguntas.ts <CODIGO> 40 --stats`.
2. Lee los ejemplos y las estadísticas y redacta un **Perfil de estilo** con:
   - **Nº de opciones** típico (4 vs 5) y si usa Verdadero/Falso.
   - **Formato del enunciado**: recuerdo directo (definición/dato) vs caso clínico con
     viñeta larga (edad, sexo, cuadro). Da el % de casos clínicos.
   - **Fraseo característico**: ¿usa "¿cuál es el diagnóstico/conducta/agente?",
     "señale la CORRECTA", negativos tipo "EXCEPTO/FALSO/NO es"? ¿en qué proporción?
   - **Longitud** (mediana de palabras) y **registro** (telegráfico vs prosa).
   - **Dificultad** predominante y **mezcla de especialidades** (¿mucha ciencia básica?
     ¿anatomía/fisiología? ¿clínica pura?).
   - Rasgos peculiares (p. ej. UNAL: anatomía quirúrgica y "afirmación verdadera";
     MIR: 5 opciones fijas, guías, "single best answer"; CES: mini-escenario + pregunta directa).
3. Entrega el perfil como texto claro. Si el usuario solo pidió el análisis, termina aquí.

### Perfiles ya derivados (referencia rápida — reconfírmalos con el script)
- **MIR (España):** SIEMPRE 5 opciones. Enunciado corto (mediana ~11 palabras), recuerdo
  basado en guías, "single best answer". Casi todo dificultad media. Poco caso clínico largo.
  Tono: conciso, sin rodeos, una respuesta claramente mejor.
- **UNAL:** 4 opciones. ~90% recuerdo directo / ~8% caso clínico. Fraseo "¿cuál afirmación
  es verdadera?", negativos "NO emplear/EXCEPTO" (~9%). Mucha anatomía/ciencia básica y
  detalle fino (quirúrgico, clasificaciones). Dificultad más alta que el promedio.
- **CES:** 4 opciones (algo de 5). Enunciados breves con mini-escenario clínico ("Soplo tras
  faringitis, ¿agente?"; "FEVI 28%, ¿conducta?") + pregunta directa de diagnóstico/manejo/etiología.
- (Para las demás, derívalas con el script en el momento.)

---

## MODO 2 — Generar preguntas nuevas al estilo de una universidad

Entradas: (a) la **universidad objetivo** y (b) uno o más **documentos fuente** (guía de
manejo, artículo, capítulo — PDF/Word/texto/URL). Si falta alguna, pídela.

Pasos:
1. **Deriva el estilo** de la universidad objetivo (Modo 1, con el script). No lo saltes:
   el objetivo es que las preguntas se sientan de ESA universidad.
2. **Lee el documento fuente** y extrae los puntos clave examinables (definiciones,
   criterios diagnósticos, dosis, primera línea de manejo, contraindicaciones, valores de
   corte, clasificaciones, mecanismos). Para PDF usa `Read`; para Word convierte con mammoth;
   para URL usa `WebFetch`.
3. **Genera N preguntas** (pregunta al usuario cuántas; por defecto 15) que:
   - Prueben contenido que **está en el documento** (la respuesta correcta se apoya en la
     fuente — NO inventes hechos médicos; si el dato no está en la fuente, no lo preguntes).
   - Repliquen el **estilo** de la universidad: mismo nº de opciones (¡MIR = 5!), mismo tipo
     de fraseo, misma mezcla caso-clínico/recuerdo y dificultad, mismo registro.
   - Tengan **distractores plausibles** (incorrectos pero verosímiles y del mismo dominio).
   - NO copien preguntas ya existentes (son nuevas, inspiradas en la fuente).
4. **Etiqueta** cada una: `especialidad` (canónica), `tema`, `dificultad`.
5. **Marca todas** como generadas por IA para revisión (ver abajo).

### Formato de salida (JSON, listo para importar)
```json
{
  "examen": "<CODIGO DE LA UNIVERSIDAD OBJETIVO>",
  "anio": 2025,
  "fuente": "Generada de <nombre del documento> — estilo <Universidad>",
  "preguntas": [
    {
      "enunciado": "...",
      "opciones": [ {"letra":"A","texto":"..."}, ... (4 o 5 según el estilo) ],
      "respuesta_correcta": "B",
      "especialidad": "<canónica>",
      "tema": "...",
      "dificultad": "media",
      "_generada_ia": true,
      "_revisar": true,
      "_fuente_doc": "<archivo/artículo de origen>"
    }
  ]
}
```
Guárdalo en `scripts/data/generadas_<codigo>_<tema>.json`.

Reglas duras (las valida el importador): enunciado ≥20 chars; opciones 4-5 (o 2 solo si
Verdadero/Falso); letras A,B,C,D(,E) en orden; respuesta ∈ opciones; especialidad canónica
(lista en `src/lib/constants.ts`); tema obligatorio; dificultad baja|media|alta.

### Importar (opcional, cuando el usuario lo apruebe)
```bash
npx tsx scripts/importar-preguntas.ts scripts/data/generadas_<codigo>_<tema>.json --dry  # validar
npx tsx scripts/importar-preguntas.ts scripts/data/generadas_<codigo>_<tema>.json         # subir
```
Las preguntas quedan con `fuente` "Generada de …", así se distinguen en el admin.

---

## Principios (no romper)
- **No inventar hechos médicos**: la respuesta correcta debe apoyarse en el documento fuente
  (o en guía estándar si el documento lo cita). Si el documento no cubre algo, no lo preguntes.
- **Todo lo generado va a revisión humana** (`_generada_ia`/`_revisar`): es contenido creado por
  IA; un médico debe validarlo antes de publicarlo.
- **Imitar estilo, no plagiar**: preguntas nuevas, no reformular las que ya existen.
- Sin precios ni consejos de venta. Cierra con un resumen: cuántas generadas, de qué documento,
  para qué universidad, y el comando para importarlas.
