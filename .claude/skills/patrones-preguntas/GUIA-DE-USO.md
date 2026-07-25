# Guía de uso — Patrones de preguntas + generación al estilo

Esta skill hace dos cosas: (1) te dice **cómo es el estilo de preguntas** de cada
universidad, y (2) **crea preguntas nuevas** a partir de una guía o artículo que subas,
imitando el estilo de la universidad que elijas.

## Ver el estilo de una universidad
Pídeselo a Claude ("analiza el patrón de preguntas de la Nacional") o corre:
```bash
npx tsx scripts/muestra-preguntas.ts UNAL 40 --stats
```
Te da estadísticas (nº de opciones, % de casos clínicos, fraseo negativo, dificultad,
especialidades) y ejemplos reales. Códigos disponibles: `--list`.

## Generar preguntas desde un documento
Dile a Claude algo como:

> "Con este artículo/guía [ruta o PDF], genérame 20 preguntas al estilo de la **Universidad
> Nacional**."

Claude va a:
1. Mirar cómo pregunta esa universidad (con el script de arriba).
2. Leer tu documento y sacar los puntos examinables.
3. Crear preguntas **nuevas** que prueban el contenido del documento, con el **mismo estilo**
   de la universidad (nº de opciones, tipo de enunciado, dificultad). Ej.: para MIR salen con
   5 opciones; para la Nacional, 4 opciones y fraseo de recuerdo.
4. Etiquetar especialidad/tema y dejar todo en un JSON.

## Subirlas
```bash
npx tsx scripts/importar-preguntas.ts scripts/data/generadas_UNAL_<tema>.json --dry   # revisar
npx tsx scripts/importar-preguntas.ts scripts/data/generadas_UNAL_<tema>.json          # subir
```

## Importante
- Las preguntas **se apoyan en tu documento**: Claude no inventa hechos médicos; si un dato no
  está en la guía/artículo, no lo pregunta.
- Todo lo generado queda **marcado para revisión** (son creadas por IA). Su campo `fuente`
  empieza por "Generada de …", así las distingues en el admin. Revísalas con un médico antes
  de publicarlas.
- Elige bien la universidad objetivo: el estilo cambia bastante (MIR ≠ CES ≠ Nacional).
