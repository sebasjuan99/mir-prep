# Guía de uso — Generar preguntas para Próximo Residente

Esta skill convierte un documento de examen (PDF o Word) en preguntas listas para la
plataforma, y las sube con un solo comando. Aquí tienes el flujo desde tu lado.

## Qué necesitas tener a la mano
- El documento con las preguntas (`.pdf` o `.docx`).
- Saber de qué **universidad/examen** y de qué **año** es.
- Saber si el documento **ya trae la respuesta marcada** (X, subrayado, negrita,
  resaltado) o si Claude debe **resolver** la correcta.

## Cómo pedírselo a Claude (en Claude Code / Cowork, dentro de esta carpeta)

Basta con algo como:

> "Genera preguntas de este examen: `D:/…/UNAL 2024.docx`. Es de la UNAL, año 2024.
> Las respuestas correctas vienen subrayadas."

o si el documento no trae respuestas:

> "Extrae las preguntas de este PDF de El Bosque 2025 y resuelve tú cuál es la correcta,
> márcame las que te queden con duda."

Claude va a:
1. Abrir el documento con el método correcto (visual para PDF; HTML con formato para Word,
   para **no perder** subrayados/resaltados/negritas).
2. Transcribir cada pregunta con sus opciones.
3. Poner la respuesta: la marcada, o la que resuelva él (con nivel de confianza).
4. Etiquetar especialidad / tema / dificultad con la taxonomía oficial del proyecto.
5. Guardar un JSON en `scripts/data/codigo_anio.json`.
6. Darte un resumen: cuántas salieron, cuántas resolvió él, y **cuáles debes revisar**.

## Subir las preguntas a la base

Cuando el JSON esté listo:

```bash
npx tsx scripts/importar-preguntas.ts scripts/data/unal_2024.json
```

- **Probar sin subir** (recomendado la primera vez): añade `--dry`
  ```bash
  npx tsx scripts/importar-preguntas.ts scripts/data/unal_2024.json --dry
  ```
  Solo valida y te dice qué insertaría, sin tocar la base.

- Es **idempotente**: si lo corres dos veces, no duplica preguntas.
- Salta automáticamente las inválidas y te avisa por qué.

## Preguntas incompletas: ¿omitir o recuperar?
Las reconstrucciones a veces traen preguntas con menos de 4 opciones. Por defecto Claude
**las omite** (no inventa). Si quieres **recuperarlas**, pídelo explícitamente:

> "Recupera las incompletas: genera distractores si ya tienen la respuesta correcta, y si
> falta la respuesta créala con información válida."

Claude completará esas preguntas y las marcará **todas** para revisión humana
(`_recuperada`), porque son contenido generado por IA sobre una base real. Revísalas en el
admin antes de publicarlas.

## Códigos de examen que ya existen
`UNAL`, `ROSARIO`, `BOSQUE`, `ENARM`, `UDEA`, `CES`, `MIR`.
Si es una universidad nueva, Claude propone un código nuevo y el importador lo crea solo.

## Notas
- Las preguntas que Claude resolvió por sí mismo o marcó con duda salen listadas en el
  resumen para que un humano las revise antes de confiar en ellas.
- Nada de precios ni consejos de venta en la salida.
- Si el documento está incompleto o ilegible en alguna parte, Claude te lo dice en vez
  de inventar.
```
