/**
 * scripts/scrape-mir.ts
 *
 * Scrapes MIR 2025 questions from Redaccion Medica.
 * The page publishes questions as flowing text inside <p> tags.
 * Each question starts with its number, followed by the question text,
 * then the answer options. The correct answer is in <strong>/<b>.
 *
 * Usage:  npx tsx scripts/scrape-mir.ts
 * Output: scripts/data/preguntas.json
 *
 * If scraping fails (paywall, dynamic content, etc.) the script
 * falls back to generate-sample-data.ts automatically.
 */

import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
// Keyword-based classifier
// ---------------------------------------------------------------------------

const KEYWORD_MAP: Record<string, { especialidad: string; tema: string }[]> = {
  // Pediatria
  vacun: [{ especialidad: "Pediatria", tema: "Vacunacion" }],
  neonat: [{ especialidad: "Pediatria", tema: "Neonatologia" }],
  "recien nacido": [{ especialidad: "Pediatria", tema: "Neonatologia" }],
  "recién nacido": [{ especialidad: "Pediatria", tema: "Neonatologia" }],
  exantem: [{ especialidad: "Pediatria", tema: "Enfermedades exantematicas" }],
  sarampion: [{ especialidad: "Pediatria", tema: "Enfermedades exantematicas" }],
  "sarampi\u00f3n": [{ especialidad: "Pediatria", tema: "Enfermedades exantematicas" }],
  rubeola: [{ especialidad: "Pediatria", tema: "Enfermedades exantematicas" }],
  varicela: [{ especialidad: "Pediatria", tema: "Enfermedades exantematicas" }],
  cardiopatia_congenita: [{ especialidad: "Pediatria", tema: "Cardiopatias congenitas" }],
  malnutricion: [{ especialidad: "Pediatria", tema: "Malnutricion" }],
  desnutricion: [{ especialidad: "Pediatria", tema: "Malnutricion" }],
  lactante: [{ especialidad: "Pediatria", tema: "Neonatologia" }],

  // Cardiologia
  arritm: [{ especialidad: "Cardiologia", tema: "Arritmias" }],
  fibrilacion: [{ especialidad: "Cardiologia", tema: "Arritmias" }],
  "fibrilaci\u00f3n": [{ especialidad: "Cardiologia", tema: "Arritmias" }],
  taquicardia: [{ especialidad: "Cardiologia", tema: "Arritmias" }],
  bradicardia: [{ especialidad: "Cardiologia", tema: "Arritmias" }],
  isquem: [{ especialidad: "Cardiologia", tema: "Cardiopatia isquemica" }],
  infarto: [{ especialidad: "Cardiologia", tema: "Cardiopatia isquemica" }],
  "insuficiencia card": [{ especialidad: "Cardiologia", tema: "Insuficiencia cardiaca" }],
  valvul: [{ especialidad: "Cardiologia", tema: "Valvulopatias" }],
  estenosis: [{ especialidad: "Cardiologia", tema: "Valvulopatias" }],
  hipertension: [{ especialidad: "Cardiologia", tema: "Hipertension" }],
  "hipertensi\u00f3n": [{ especialidad: "Cardiologia", tema: "Hipertension" }],

  // Neurologia
  epileps: [{ especialidad: "Neurologia", tema: "Epilepsia" }],
  convuls: [{ especialidad: "Neurologia", tema: "Epilepsia" }],
  ictus: [{ especialidad: "Neurologia", tema: "ACV" }],
  "acv": [{ especialidad: "Neurologia", tema: "ACV" }],
  "cerebrovascular": [{ especialidad: "Neurologia", tema: "ACV" }],
  "esclerosis multiple": [{ especialidad: "Neurologia", tema: "Esclerosis multiple" }],
  "esclerosis m\u00faltiple": [{ especialidad: "Neurologia", tema: "Esclerosis multiple" }],
  desmieliniz: [{ especialidad: "Neurologia", tema: "Esclerosis multiple" }],
  cefalea: [{ especialidad: "Neurologia", tema: "Cefaleas" }],
  migrana: [{ especialidad: "Neurologia", tema: "Cefaleas" }],
  "migra\u00f1a": [{ especialidad: "Neurologia", tema: "Cefaleas" }],
  parkinson: [{ especialidad: "Neurologia", tema: "Parkinson" }],

  // Digestivo
  hepatitis: [{ especialidad: "Digestivo", tema: "Hepatitis" }],
  cirrosis: [{ especialidad: "Digestivo", tema: "Cirrosis" }],
  "enfermedad inflamatoria intestinal": [{ especialidad: "Digestivo", tema: "EII" }],
  crohn: [{ especialidad: "Digestivo", tema: "EII" }],
  "colitis ulcerosa": [{ especialidad: "Digestivo", tema: "EII" }],
  ulcera: [{ especialidad: "Digestivo", tema: "Ulcera peptica" }],
  "\u00falcera": [{ especialidad: "Digestivo", tema: "Ulcera peptica" }],
  helicobacter: [{ especialidad: "Digestivo", tema: "Ulcera peptica" }],
  pancreatitis: [{ especialidad: "Digestivo", tema: "Pancreatitis" }],

  // Nefrologia
  nefrotico: [{ especialidad: "Nefrologia", tema: "Sindrome nefrotico" }],
  "nefr\u00f3tico": [{ especialidad: "Nefrologia", tema: "Sindrome nefrotico" }],
  nefritico: [{ especialidad: "Nefrologia", tema: "Sindrome nefritico" }],
  "nefr\u00edtico": [{ especialidad: "Nefrologia", tema: "Sindrome nefritico" }],
  "insuficiencia renal aguda": [{ especialidad: "Nefrologia", tema: "IRA" }],
  "fracaso renal agudo": [{ especialidad: "Nefrologia", tema: "IRA" }],
  "insuficiencia renal cronica": [{ especialidad: "Nefrologia", tema: "IRC" }],
  "insuficiencia renal cr\u00f3nica": [{ especialidad: "Nefrologia", tema: "IRC" }],
  "enfermedad renal cr\u00f3nica": [{ especialidad: "Nefrologia", tema: "IRC" }],
  hiperpotasemia: [{ especialidad: "Nefrologia", tema: "Electrolitos" }],
  hiponatremia: [{ especialidad: "Nefrologia", tema: "Electrolitos" }],
  hipocalcemia: [{ especialidad: "Nefrologia", tema: "Electrolitos" }],
  electrolito: [{ especialidad: "Nefrologia", tema: "Electrolitos" }],

  // Neumologia
  epoc: [{ especialidad: "Neumologia", tema: "EPOC" }],
  asma: [{ especialidad: "Neumologia", tema: "Asma" }],
  broncoespasmo: [{ especialidad: "Neumologia", tema: "Asma" }],
  "tromboembolismo pulmonar": [{ especialidad: "Neumologia", tema: "TEP" }],
  tep: [{ especialidad: "Neumologia", tema: "TEP" }],
  embolia_pulmonar: [{ especialidad: "Neumologia", tema: "TEP" }],
  neumonia: [{ especialidad: "Neumologia", tema: "Neumonias" }],
  "neumon\u00eda": [{ especialidad: "Neumologia", tema: "Neumonias" }],
  "cancer de pulmon": [{ especialidad: "Neumologia", tema: "Cancer de pulmon" }],
  "c\u00e1ncer de pulm\u00f3n": [{ especialidad: "Neumologia", tema: "Cancer de pulmon" }],
  "carcinoma pulmonar": [{ especialidad: "Neumologia", tema: "Cancer de pulmon" }],

  // Endocrinologia
  diabetes: [{ especialidad: "Endocrinologia", tema: "Diabetes" }],
  insulina: [{ especialidad: "Endocrinologia", tema: "Diabetes" }],
  glucemia: [{ especialidad: "Endocrinologia", tema: "Diabetes" }],
  tiroides: [{ especialidad: "Endocrinologia", tema: "Tiroides" }],
  hipotiroidismo: [{ especialidad: "Endocrinologia", tema: "Tiroides" }],
  hipertiroidismo: [{ especialidad: "Endocrinologia", tema: "Tiroides" }],
  "graves": [{ especialidad: "Endocrinologia", tema: "Tiroides" }],
  suprarrenal: [{ especialidad: "Endocrinologia", tema: "Suprarrenales" }],
  cushing: [{ especialidad: "Endocrinologia", tema: "Suprarrenales" }],
  addison: [{ especialidad: "Endocrinologia", tema: "Suprarrenales" }],
  hipofisis: [{ especialidad: "Endocrinologia", tema: "Hipofisis" }],
  "hip\u00f3fisis": [{ especialidad: "Endocrinologia", tema: "Hipofisis" }],
  prolactinoma: [{ especialidad: "Endocrinologia", tema: "Hipofisis" }],
  acromegalia: [{ especialidad: "Endocrinologia", tema: "Hipofisis" }],
  osteoporosis: [{ especialidad: "Endocrinologia", tema: "Osteoporosis" }],
};

function classifyQuestion(text: string): { especialidad: string; tema: string } {
  const lower = text.toLowerCase();
  for (const [keyword, matches] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      return matches[0];
    }
  }
  return { especialidad: "Otros", tema: "General" };
}

// ---------------------------------------------------------------------------
// Scraper
// ---------------------------------------------------------------------------

const MIR_URL =
  "https://www.redaccionmedica.com/secciones/formacion/examen-mir-2025-al-completo-todas-las-preguntas-publicadas-por-sanidad-5904";

async function scrape(): Promise<PreguntaRaw[]> {
  console.log("Fetching MIR 2025 page...");
  const { data: html } = await axios.get(MIR_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 30_000,
  });

  const $ = cheerio.load(html);
  const preguntas: PreguntaRaw[] = [];

  // Get all text content from the article body
  const articleBody =
    $(".article-body").text() ||
    $(".entry-content").text() ||
    $("article").text() ||
    $("main").text();

  if (!articleBody || articleBody.length < 500) {
    throw new Error("Could not find article body content");
  }

  // Pattern: question number. text? options
  // Questions start with a number followed by a period
  const questionRegex =
    /(\d{1,3})\.\s+([\s\S]*?)(?=\d{1,3}\.\s+|$)/g;

  let match: RegExpExecArray | null;
  while ((match = questionRegex.exec(articleBody)) !== null) {
    const num = parseInt(match[1], 10);
    if (num < 1 || num > 250) continue;

    const block = match[2].trim();

    // Try to split into question text and options
    // Options typically start with a letter followed by )  or just listed
    const optionPatterns = [
      /([A-E])\)\s*([^A-E\)]+)/g,
      /\n\s*([1-5])\.\s*([^\n]+)/g,
    ];

    const opciones: Opcion[] = [];
    let enunciado = block;
    const letras = ["A", "B", "C", "D", "E"];

    // Try to find options by splitting on line breaks
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 3) {
      enunciado = lines[0];
      for (let i = 1; i < lines.length && opciones.length < 5; i++) {
        opciones.push({
          letra: letras[opciones.length],
          texto: lines[i].replace(/^[A-E]\)\s*/, "").trim(),
        });
      }
    }

    if (opciones.length < 2) continue; // skip malformed

    // Try to detect correct answer from bold/strong tags in HTML
    let correcta = "A"; // default
    const questionHtml = $(`*:contains("${num}.")`).first().html() || "";
    const strongMatch = questionHtml.match(
      /<(?:strong|b)>([^<]+)<\/(?:strong|b)>/
    );
    if (strongMatch) {
      const boldText = strongMatch[1].trim();
      const found = opciones.find((o) => o.texto.includes(boldText));
      if (found) correcta = found.letra;
    }

    // Detect images
    let imagen_url: string | null = null;
    const imgMatch = enunciado.match(/[Ii]magen\s+(\d+)/);
    if (imgMatch) {
      const imgEl = $(`img[alt*="${imgMatch[1]}"], img[src*="imagen${imgMatch[1]}"]`).first();
      if (imgEl.length) {
        imagen_url = imgEl.attr("src") || null;
      }
    }

    const { especialidad, tema } = classifyQuestion(enunciado + " " + opciones.map((o) => o.texto).join(" "));

    preguntas.push({
      numero_mir: num,
      enunciado,
      opciones,
      respuesta_correcta: correcta,
      imagen_url,
      especialidad,
      tema,
      subtema: null,
      dificultad: "media",
      anio: 2025,
    });
  }

  return preguntas;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const outDir = path.join(__dirname, "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "preguntas.json");

  try {
    const preguntas = await scrape();

    if (preguntas.length < 10) {
      console.warn(
        `Only scraped ${preguntas.length} questions. Falling back to sample data.`
      );
      throw new Error("Insufficient scraped data");
    }

    fs.writeFileSync(outPath, JSON.stringify(preguntas, null, 2), "utf-8");
    console.log(`Saved ${preguntas.length} questions to ${outPath}`);
  } catch (err: any) {
    console.error("Scraping failed:", err.message);
    console.log("Running fallback sample data generator...");

    // Import and run fallback generator
    const { generateSampleData } = await import("./generate-sample-data");
    const preguntas = generateSampleData();
    fs.writeFileSync(outPath, JSON.stringify(preguntas, null, 2), "utf-8");
    console.log(
      `Fallback: saved ${preguntas.length} sample questions to ${outPath}`
    );
  }
}

main().catch(console.error);
