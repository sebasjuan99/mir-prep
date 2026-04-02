/**
 * scripts/seed.ts
 *
 * Seeds the database with MIR questions from preguntas.json
 * and creates ResumenTema records for each unique specialty+topic.
 *
 * Usage:  npx tsx scripts/seed.ts
 *
 * Prerequisites:
 *   1. Run `npx tsx scripts/generate-sample-data.ts` or `npx tsx scripts/scrape-mir.ts`
 *   2. Ensure DATABASE_URL is set in .env
 *   3. Run `npx prisma db push` or `npx prisma migrate dev`
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
config({ path: path.resolve(__dirname, "..", ".env.local") });

const adapter = new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

interface Opcion {
  letra: string;
  texto: string;
}

interface PreguntaRaw {
  numero_mir: number;
  enunciado: string;
  opciones: Opcion[];
  respuesta_correcta: string;
  imagen_url: string | null;
  especialidad: string;
  tema: string;
  subtema: string | null;
  dificultad: string;
  anio: number;
}

// ---------------------------------------------------------------------------
// Resumen content stubs — will be filled by generate-resumenes.ts
// ---------------------------------------------------------------------------

function defaultResumen(especialidad: string, tema: string): string {
  return `# ${tema} - ${especialidad}\n\n_Contenido pendiente de generar con generate-resumenes.ts_`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dataPath = path.join(__dirname, "data", "preguntas.json");
  if (!fs.existsSync(dataPath)) {
    console.error(
      "preguntas.json not found. Run generate-sample-data.ts or scrape-mir.ts first."
    );
    process.exit(1);
  }

  const preguntas: PreguntaRaw[] = JSON.parse(
    fs.readFileSync(dataPath, "utf-8")
  );
  console.log(`Read ${preguntas.length} questions from ${dataPath}`);

  // ---- Upsert preguntas ------------------------------------------------
  let created = 0;
  let updated = 0;

  for (const p of preguntas) {
    try {
      await prisma.pregunta.upsert({
        where: { numero_mir: p.numero_mir },
        update: {
          enunciado: p.enunciado,
          opciones: p.opciones as any,
          respuesta_correcta: p.respuesta_correcta,
          imagen_url: p.imagen_url,
          especialidad: p.especialidad,
          tema: p.tema,
          subtema: p.subtema,
          dificultad: p.dificultad,
          anio: p.anio,
        },
        create: {
          numero_mir: p.numero_mir,
          enunciado: p.enunciado,
          opciones: p.opciones as any,
          respuesta_correcta: p.respuesta_correcta,
          imagen_url: p.imagen_url,
          especialidad: p.especialidad,
          tema: p.tema,
          subtema: p.subtema,
          dificultad: p.dificultad,
          anio: p.anio,
        },
      });
      created++;
    } catch (err: any) {
      console.warn(`Failed to upsert question ${p.numero_mir}: ${err.message}`);
    }
  }
  console.log(`Upserted ${created} questions`);

  // ---- Collect unique specialty+topic combos ---------------------------
  const combos = new Map<string, { especialidad: string; tema: string }>();
  for (const p of preguntas) {
    const key = `${p.especialidad}::${p.tema}`;
    if (!combos.has(key)) {
      combos.set(key, { especialidad: p.especialidad, tema: p.tema });
    }
  }

  // ---- Try loading generated resumen content ---------------------------
  const resumenesPath = path.join(__dirname, "data", "resumenes.json");
  let resumenesMap: Record<string, { contenido_md: string; tip_mir: string }> = {};

  if (fs.existsSync(resumenesPath)) {
    const raw = JSON.parse(fs.readFileSync(resumenesPath, "utf-8"));
    for (const r of raw) {
      resumenesMap[`${r.especialidad}::${r.tema}`] = {
        contenido_md: r.contenido_md,
        tip_mir: r.tip_mir,
      };
    }
    console.log(`Loaded ${Object.keys(resumenesMap).length} resumenes from file`);
  }

  // ---- Upsert ResumenTema records --------------------------------------
  let resumenCount = 0;
  for (const [key, { especialidad, tema }] of combos) {
    const content = resumenesMap[key];
    const contenido_md = content?.contenido_md || defaultResumen(especialidad, tema);
    const tip_mir = content?.tip_mir || null;

    try {
      await prisma.resumenTema.upsert({
        where: {
          especialidad_tema: { especialidad, tema },
        },
        update: { contenido_md, tip_mir },
        create: { especialidad, tema, contenido_md, tip_mir },
      });
      resumenCount++;
    } catch (err: any) {
      console.warn(`Failed to upsert resumen ${key}: ${err.message}`);
    }
  }
  console.log(`Upserted ${resumenCount} ResumenTema records`);

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
