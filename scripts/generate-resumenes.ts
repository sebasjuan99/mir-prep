/**
 * scripts/generate-resumenes.ts
 *
 * Generates study summaries (fichas de estudio) for each specialty+topic.
 * Each summary contains: key points, comparative tables, mnemonics,
 * most-asked MIR topics, and a MIR tip.
 *
 * Usage:  npx tsx scripts/generate-resumenes.ts
 * Output: scripts/data/resumenes.json
 */

import * as fs from "fs";
import * as path from "path";

interface Resumen {
  especialidad: string;
  tema: string;
  contenido_md: string;
  tip_mir: string;
}

// ---------------------------------------------------------------------------
// All 35 study summaries
// ---------------------------------------------------------------------------

const RESUMENES: Resumen[] = [
  // =====================================================================
  // PEDIATRIA
  // =====================================================================
  {
    especialidad: "Pediatria",
    tema: "Vacunacion",
    contenido_md: `# Vacunacion Infantil

## Puntos clave
- El calendario vacunal espanol incluye vacunas sistematicas financiadas a los 2, 4, 6, 12, 15 meses y 6, 12, 14 anos
- La vacuna hexavalente (DTPa-VPI-Hib-HB) se administra a los 2, 4 y 11 meses
- La triple virica (SRP) se administra a los 12 meses (1a dosis) y 3-4 anos (2a dosis)
- Las vacunas de virus vivos atenuados (SRP, varicela, rotavirus) estan contraindicadas en inmunodepresion severa
- La unica contraindicacion absoluta universal es la reaccion anafilactica previa a esa vacuna o a alguno de sus componentes

## Tabla comparativa: Vacunas vivas vs inactivadas

| Caracteristica | Vivas atenuadas | Inactivadas |
|---|---|---|
| Ejemplos | SRP, varicela, rotavirus, BCG | Hexavalente, neumococo, meningococo |
| Inmunodeprimidos | Contraindicadas | Seguras (pueden ser menos eficaces) |
| N de dosis | Menos dosis necesarias | Requieren mas dosis/refuerzos |
| Intervalo entre ellas | Minimo 4 semanas si no simultaneas | Sin restriccion |

## Reglas mnemotecnicas
- **SRAV**: las 4 vacunas vivas del calendario = **S**RP, **R**otavirus, varicela (**A**gua), **v**aricela
- **2-4-11**: meses de la hexavalente
- **12 meses**: triple virica + meningococo C/ACWY + varicela 1a dosis

## Lo mas preguntado en el MIR
- Contraindicaciones reales vs falsas contraindicaciones
- Calendario vacunal: que vacuna se pone a que edad
- Vacunacion en inmunodeprimidos
- Vacunas del VPH: indicaciones y pauta`,
    tip_mir: "La fiebre leve, los antibioticos y la prematuridad NO son contraindicaciones de vacunacion. Solo lo es la anafilaxia previa a la vacuna. Pregunta clasica MIR.",
  },
  {
    especialidad: "Pediatria",
    tema: "Neonatologia",
    contenido_md: `# Neonatologia

## Puntos clave
- La enfermedad de membrana hialina (EMH) es la causa mas frecuente de distres respiratorio en prematuros (<34 semanas) por deficit de surfactante
- La taquipnea transitoria del RN (TTRN) es la causa mas frecuente de distres respiratorio en RN a termino, generalmente tras cesarea
- Ictericia patologica: aparicion <24h de vida, bilirrubina >5 mg/dL/dia, >15 mg/dL en RN a termino
- Apgar: valoracion a 1 y 5 minutos (FC, respiracion, tono, irritabilidad, color). No es diagnostico de asfixia
- La asfixia perinatal se diagnostica por: pH umbilical <7.00, deficit de bases >12, Apgar <5 a 5 min, encefalopatia neonatal

## Tabla: Distres respiratorio neonatal

| Entidad | Clinica | Rx torax | Tratamiento |
|---|---|---|---|
| EMH | Prematuro, quejido, tiraje progresivo | Reticulogranular + broncograma aereo | CPAP / surfactante |
| TTRN | A termino, cesarea, taquipnea autolimitada | Liquido en cisuras, hiperinsuflacion | Soporte, O2, se resuelve en 24-72h |
| SAM | Postermino, liquido meconial | Infiltrados algodonosos parcheados | Aspiracion, surfactante, VM |
| Neumotorax | Brusco, asimetria respiratoria | Hiperclaridad, colapso pulmonar | Drenaje si a tension |

## Reglas mnemotecnicas
- **EMH = Enfermedad del preMa con Hialina**: prematuro + patron reticulogranular
- **TTRN = Transitoria del Termino**: se resuelve sola
- Reanimacion neonatal: **ABCD** = Abrir via aerea, Breathing (ventilacion), Circulacion (compresiones si FC<60), Drogas (adrenalina)

## Lo mas preguntado en el MIR
- Diagnostico diferencial del distres respiratorio neonatal
- Criterios de fototerapia y exanguinotransfusion
- Enterocolitis necrosante: factores de riesgo y clinica
- Reanimacion neonatal: algoritmo basico`,
    tip_mir: "Ictericia en las primeras 24 horas de vida = SIEMPRE patologica. Pensar en isoinmunizacion Rh o ABO. Nunca es fisiologica.",
  },
  {
    especialidad: "Pediatria",
    tema: "Enfermedades exantematicas",
    contenido_md: `# Enfermedades exantematicas

## Puntos clave
- Sarampion: fiebre + catarro (tos, coriza, conjuntivitis) + manchas de Koplik + exantema maculopapuloso craneocaudal
- Rubeola: exantema tenue rosado + adenopatias retroauriculares/cervicales + artritis (en adultos)
- Varicela: exantema vesiculoso en diferentes estadios evolutivos ("cielo estrellado"), NO dar AAS (riesgo de sindrome de Reye)
- Eritema infeccioso (5a enfermedad, parvovirus B19): mejillas abofeteadas + exantema reticulado
- Exantema subito (6a enfermedad, VHH-6): fiebre alta 3 dias que cede y aparece exantema

## Tabla comparativa

| Enfermedad | Agente | Clinica clave | Complicacion principal |
|---|---|---|---|
| Sarampion | Paramixovirus | Koplik + exantema craneocaudal | Neumonia, encefalitis |
| Rubeola | Togavirus | Adenopatias + exantema tenue | Embriopatia congenita |
| Varicela | VVZ | Vesiculas en distintos estadios | Sobreinfeccion bacteriana |
| Escarlatina | S. pyogenes | Lengua aframbuesada + piel aspera | Fiebre reumatica, GN |
| Eritema inf. | Parvovirus B19 | Mejillas abofeteadas | Crisis aplasica (anemia cronica) |
| Exantema subito | VHH-6 | Fiebre que cede -> exantema | Convulsiones febriles |

## Reglas mnemotecnicas
- **1-2-3-4-5-6**: numerar las enfermedades exantematicas clasicas
- **KOPLIK = sarampion** (patognomonico)
- **Bofetada = Parvovirus B19**
- **Fiebre que se va y sale el exantema = roseola (VHH-6)**

## Lo mas preguntado en el MIR
- Diagnostico diferencial de exantemas infantiles
- Complicaciones del sarampion (neumonia es la mas frecuente)
- Contraindicacion del AAS en varicela`,
    tip_mir: "Si te dan un nino con fiebre alta 3 dias que desaparece y luego sale el exantema = exantema subito (VHH-6). Es la pregunta trampa clasica.",
  },
  {
    especialidad: "Pediatria",
    tema: "Cardiopatias congenitas",
    contenido_md: `# Cardiopatias congenitas

## Puntos clave
- La cardiopatia congenita acianotica mas frecuente: CIV (comunicacion interventricular)
- La cardiopatia cianotica mas frecuente en neonatos: TGA (transposicion de grandes arterias)
- La cardiopatia cianotica mas frecuente despues del periodo neonatal: Tetralogia de Fallot
- Test de hiperoxia negativo (PaO2 no sube con O2 al 100%) = cardiopatia cianotica
- Crisis hipoxemicas de Fallot: posicion genupectoral (squatting), O2, morfina, fenilefrina

## Tabla: Cianoticas vs Acianoticas

| Cianoticas | Acianoticas |
|---|---|
| TGA | CIV |
| Tetralogia de Fallot | CIA |
| Atresia tricuspidea | DAP |
| Truncus arteriosus | Coartacion de aorta |
| Drenaje venoso anomalo | Canal AV |

## Reglas mnemotecnicas
- **CIV**: la mas frecuente de todas, **C**omun **I**n **V**erdad
- **TGA** = corazon en huevo + pediculo estrecho en Rx
- **Fallot** = 4 cosas: estenosis pulmonar, CIV, cabalgamiento aortico, hipertrofia VD
- **5T cianoticas**: TGA, Tetralogia, Tricuspidea (atresia), Truncus, Total (DVPAT)

## Lo mas preguntado en el MIR
- Diagnostico diferencial de cardiopatias cianoticas
- Clinica y manejo de la Tetralogia de Fallot
- Test de hiperoxia
- CIV: clinica y evolucion natural`,
    tip_mir: "Cianotico neonatal + corazon en huevo en Rx = TGA. Cianotico despues de neonatal con crisis hipoxemicas = Fallot. Dos clasicos MIR.",
  },
  {
    especialidad: "Pediatria",
    tema: "Malnutricion",
    contenido_md: `# Malnutricion infantil

## Puntos clave
- Marasmo: deficit calorico-proteico global, caquexia sin edemas, grasa subcutanea ausente
- Kwashiorkor: deficit predominante de proteinas, edemas, hepatomegalia, lesiones cutaneas, pelo despigmentado
- El indicador mas sensible de desnutricion aguda: peso para la talla
- El indicador de desnutricion cronica: talla para la edad
- Sindrome de realimentacion: hipofosfatemia severa al realimentar un desnutrido (riesgo de arritmias, IC, muerte)

## Tabla: Marasmo vs Kwashiorkor

| Caracteristica | Marasmo | Kwashiorkor |
|---|---|---|
| Deficit | Calorico global | Predominantemente proteico |
| Edemas | Ausentes | Presentes |
| Grasa subcutanea | Ausente | Conservada parcialmente |
| Hepatomegalia | No | Si (higado graso) |
| Pelo | Fino, escaso | Despigmentado, ralo, signo de bandera |
| Albumina | Baja | Muy baja |

## Reglas mnemotecnicas
- **Kwashiorkor = K de edemas (K suena a "con" edemas)**
- **Marasmo = Mara-flaco**: piel y huesos sin edemas
- **RealimentaFOS**: realimentacion -> hipoFOSfatemia

## Lo mas preguntado en el MIR
- Diferenciar marasmo de kwashiorkor
- Sindrome de realimentacion: prevencion y manejo
- Indicadores nutricionales pediatricos
- Deficit vitaminicos especificos (A, D, C, B1)`,
    tip_mir: "Si te describen un nino desnutrido CON edemas = kwashiorkor. SIN edemas = marasmo. La hipofosfatemia al realimentar puede ser mortal.",
  },

  // =====================================================================
  // CARDIOLOGIA
  // =====================================================================
  {
    especialidad: "Cardiologia",
    tema: "Arritmias",
    contenido_md: `# Arritmias

## Puntos clave
- FA: arritmia sostenida mas frecuente. Anticoagular segun CHA2DS2-VASc (>=2 en varones, >=3 en mujeres)
- ACOD preferidos sobre acenocumarol en FA no valvular
- Taquicardia de QRS estrecho (<120 ms) = supraventricular; QRS ancho (>120 ms) = ventricular hasta que se demuestre lo contrario
- Bloqueo AV 3er grado = marcapasos definitivo
- Ritmos desfibrilables en PCR: FV y TV sin pulso

## Tabla: Antiarritmicos

| Clase | Farmacos | Uso principal |
|---|---|---|
| I (bloqueo Na) | Flecainida, propafenona | FA sin cardiopatia estructural |
| II (betabloqueantes) | Bisoprolol, atenolol | Control de frecuencia |
| III (bloqueo K) | Amiodarona, sotalol | FA, TV, FV |
| IV (Ca antagonistas) | Verapamilo, diltiazem | TPSV, control de frecuencia en FA |

## Reglas mnemotecnicas
- **CHA2DS2-VASc**: Congestiva, HTA, Age>=75 (x2), Diabetes, Stroke (x2), Vascular, Age 65-74, Sex (mujer)
- **Amiodarona = el antiarritmico universal** (funciona en casi todo pero tiene muchos efectos secundarios)

## Lo mas preguntado en el MIR
- Indicaciones de anticoagulacion en FA
- Manejo agudo de taquicardias
- Indicaciones de marcapasos
- ECG de la FA y flutter`,
    tip_mir: "FA de <48h se puede cardiovertir directamente. FA de >48h o desconocida: anticoagular 3 semanas antes o ETE para descartar trombo.",
  },
  {
    especialidad: "Cardiologia",
    tema: "Cardiopatia isquemica",
    contenido_md: `# Cardiopatia isquemica

## Puntos clave
- SCACEST (STEMI): elevacion ST -> angioplastia primaria (puerta-balon <90 min) o fibrinolisis (<120 min si no hay acceso a ICP)
- SCASEST (NSTEMI/angina inestable): sin elevacion ST -> antiagregacion + anticoagulacion + estratificacion de riesgo
- Troponina de alta sensibilidad: biomarcador mas especifico de dano miocardico
- Infarto inferior (II, III, aVF) = coronaria derecha
- Infarto anterior extenso (V1-V6) = descendente anterior

## Tabla: Localizacion del infarto segun ECG

| Derivaciones con ST elevado | Territorio | Arteria |
|---|---|---|
| V1-V4 | Anterior/septal | Descendente anterior |
| V5-V6, I, aVL | Lateral | Circunfleja |
| II, III, aVF | Inferior | Coronaria derecha (90%) |
| V3R, V4R | Ventrículo derecho | Coronaria derecha proximal |

## Reglas mnemotecnicas
- **MONA** (Morfina, Oxigeno si SatO2<90%, Nitroglicerina, AAS) = tratamiento inicial
- **Puerta-balon 90 min** = tiempo maximo para ICP primaria

## Lo mas preguntado en el MIR
- Manejo agudo del SCACEST: tiempos de reperfusion
- Localizacion del infarto segun derivaciones ECG
- Complicaciones mecanicas del IAM
- Tratamiento cronico post-IAM (los 4 farmacos)`,
    tip_mir: "Los 4 farmacos post-IAM que reducen mortalidad: AAS + betabloqueante + IECA/ARA-II + estatina. No olvidar el doble antiagregante 12 meses.",
  },
  {
    especialidad: "Cardiologia",
    tema: "Insuficiencia cardiaca",
    contenido_md: `# Insuficiencia cardiaca

## Puntos clave
- ICFEr (FEVI <40%): 4 pilares = IECA/ARNI + betabloqueante + ARM + iSGLT2
- ICFEp (FEVI >=50%): iSGLT2 han mostrado beneficio; tratar comorbilidades
- NT-proBNP: peptido natriuretico para diagnostico y seguimiento
- IC descompensada: furosemida IV + oxigeno + vasodilatadores si TAS permite
- No iniciar betabloqueantes en IC descompensada aguda

## Tabla: Clasificacion NYHA

| Clase | Descripcion |
|---|---|
| I | Sin limitacion de actividad fisica |
| II | Leve limitacion, disnea con esfuerzos grandes |
| III | Marcada limitacion, disnea con esfuerzos minimos |
| IV | Sintomas en reposo |

## Los 4 pilares de la ICFEr

| Farmaco | Beneficio |
|---|---|
| IECA/ARNI (sacubitril/valsartan) | Reduce mortalidad y hospitalizacion |
| Betabloqueante (bisoprolol, carvedilol, metoprolol) | Reduce mortalidad |
| ARM (espironolactona, eplerenona) | Reduce mortalidad |
| iSGLT2 (dapagliflozina, empagliflozina) | Reduce mortalidad CV + hospitalizacion |

## Reglas mnemotecnicas
- **4 pilares = BASI**: Betabloqueante, ARNI, Spironolactona, Inhibidor SGLT2

## Lo mas preguntado en el MIR
- Tratamiento farmacologico de la ICFEr: los 4 pilares
- Diagnostico: NT-proBNP + ecocardiograma
- Manejo del EAP
- Clasificacion NYHA`,
    tip_mir: "La digoxina NO reduce mortalidad en IC, solo mejora sintomas y reduce hospitalizaciones. No incluirla en los pilares del tratamiento.",
  },
  {
    especialidad: "Cardiologia",
    tema: "Valvulopatias",
    contenido_md: `# Valvulopatias

## Puntos clave
- Estenosis aortica: soplo sistolico eyectivo en foco aortico. Triada clasica: angina, sincope, disnea
- Estenosis mitral: causa mas frecuente = fiebre reumatica. Soplo diastolico con chasquido de apertura
- Insuficiencia mitral aguda: EAP brusco, soplo holosistolico en apex
- TAVI: indicada en estenosis aortica severa con alto riesgo quirurgico o contraindicacion para cirugia
- Profilaxis de endocarditis: solo protesis valvulares, CC cianoticas y endocarditis previa

## Tabla: Soplos valvulares

| Valvulopatia | Tipo de soplo | Foco | Irradiacion |
|---|---|---|---|
| Estenosis aortica | Sistolico eyectivo romboidal | Aortico | Carotidas |
| Insuficiencia aortica | Diastolico aspirativo | Aortico/Erb | Apex |
| Estenosis mitral | Diastolico con chasquido | Apex | No irradia |
| Insuficiencia mitral | Holosistolico | Apex | Axila |

## Reglas mnemotecnicas
- **EAo = Eyectivo Aortico Sistolico** (el mas preguntado)
- **Reumatica = Mitral** (la fiebre reumatica dana sobre todo la mitral)

## Lo mas preguntado en el MIR
- Indicaciones quirurgicas de la estenosis aortica
- Clinica y auscultacion de las valvulopatias principales
- Indicaciones de TAVI
- Profilaxis de endocarditis: indicaciones actuales`,
    tip_mir: "Estenosis aortica severa sintomatica = cirugia (o TAVI si alto riesgo). Sin tratamiento medico eficaz. La mortalidad sin intervencion es muy alta.",
  },
  {
    especialidad: "Cardiologia",
    tema: "Hipertension",
    contenido_md: `# Hipertension arterial

## Puntos clave
- HTA grado 1: 140-159/90-99 mmHg; grado 2: 160-179/100-109; grado 3: >=180/>=110
- Primera linea: IECA/ARA-II, calcioantagonistas, tiazidas (combinaciones si es necesario)
- IECA/ARA-II de eleccion en: diabeticos con nefropatia, IC, post-IAM
- IECA contraindicados en: embarazo, hiperpotasemia, estenosis bilateral de arteria renal
- HTA resistente (3 farmacos con diuretico a dosis plena): anadir espironolactona

## Tabla: Eleccion de antihipertensivo segun comorbilidad

| Comorbilidad | Farmaco de eleccion |
|---|---|
| DM con nefropatia | IECA/ARA-II |
| IC con FEr | IECA/ARA-II + betabloqueante |
| Embarazo | Labetalol, nifedipino, metildopa |
| Raza negra sin DM | Calcioantagonista o tiazida |
| HTA + fibrilacion auricular | Betabloqueante o calcioantagonista no DHP |

## Reglas mnemotecnicas
- **Embarazo = LNM**: Labetalol, Nifedipino, Metildopa (NO IECA/ARA-II)
- **Espironolactona = 4to escalon** en HTA resistente (estudio PATHWAY-2)

## Lo mas preguntado en el MIR
- HTA secundaria: causas y diagnostico
- Emergencia vs urgencia hipertensiva
- Contraindicaciones de IECA
- HTA en embarazo: farmacos seguros`,
    tip_mir: "HTA + hipopotasemia espontanea = pensar en hiperaldosteronismo primario. La causa renovascular es la mas frecuente de HTA secundaria en general.",
  },

  // =====================================================================
  // NEUROLOGIA
  // =====================================================================
  {
    especialidad: "Neurologia",
    tema: "Epilepsia",
    contenido_md: `# Epilepsia

## Puntos clave
- Ausencias: punta-onda 3 Hz generalizada, tipica de la infancia, tratamiento con etosuximida o valproico
- Crisis focales: carbamazepina u oxcarbazepina como primera linea
- Estatus epileptico: benzodiacepinas IV (1a linea) -> acido valproico/levetiracetam/fenitoina IV (2a linea)
- Carbamazepina puede empeorar ausencias y mioclonias
- En mujer en edad fertil: preferir lamotrigina o levetiracetam (evitar valproico por teratogenia)

## Tabla: Farmacos segun tipo de crisis

| Tipo de crisis | 1a linea | Contraindicados |
|---|---|---|
| Focal | Carbamazepina, lamotrigina | - |
| Ausencias | Etosuximida, valproico | Carbamazepina, fenitoina |
| Mioclonias | Valproico, levetiracetam | Carbamazepina |
| TCG | Valproico, lamotrigina, levetiracetam | - |

## Reglas mnemotecnicas
- **CBZ contraindica en Ausencias**: CBZ = Crisis By focal, no por Ausencias
- **Estatus = BVL**: Benzodiacepina -> Valproico/Levetiracetam -> anestesia si refractario

## Lo mas preguntado en el MIR
- Eleccion de antiepileptico segun tipo de crisis
- Manejo del estatus epileptico
- Sindrome de West: triada clinica
- Epilepsia en mujer fertil y embarazo`,
    tip_mir: "Nunca dar carbamazepina ni fenitoina en ausencias ni en mioclonias: las empeoran. Es una pregunta MIR clasica.",
  },
  {
    especialidad: "Neurologia",
    tema: "ACV",
    contenido_md: `# Accidente cerebrovascular (ictus)

## Puntos clave
- Ictus isquemico: trombolisis IV con alteplasa (<4.5h) y/o trombectomia mecanica (<6-24h en oclusion de gran vaso anterior)
- ACM izquierda: hemiplejia derecha + afasia (global o de Broca/Wernicke)
- ACP: hemianopsia homonima contralateral
- Hemorragia intraparenquimatosa: causa mas frecuente = HTA
- Hemorragia subaracnoidea: cefalea en trueno, TAC + PL, angio-TAC para localizar aneurisma

## Tabla: Sindromes vasculares

| Arteria | Clinica |
|---|---|
| ACM | Hemiplejia braquiofacial contralateral + afasia (si hemisferio dominante) |
| ACA | Hemiplejia crural contralateral + alteracion conductual |
| ACP | Hemianopsia homonima contralateral |
| Basilar | Coma, tetraplejia, sindrome de enclaustramiento |
| Cerebelo (PICA) | Vertigo, ataxia, nistagmo, sindrome de Wallenberg |

## Reglas mnemotecnicas
- **4.5 horas = trombolisis IV**, **6-24h = trombectomia** (con criterios de imagen)
- **ACM = Brazo + Cara + lenguaje** (la mas frecuente)
- **Trueno = HSA**: cefalea subita maxima intensidad

## Lo mas preguntado en el MIR
- Ventana terapeutica de trombolisis y trombectomia
- Sindromes vasculares por territorio afectado
- Diferencia hemorragico vs isquemico
- Manejo HSA: nimodipino + cirugia/coil del aneurisma`,
    tip_mir: "La trombectomia mecanica ha extendido la ventana a 24h en oclusion de gran vaso anterior con tejido salvable (segun imagen de perfusion). Pregunta MIR actualizada.",
  },
  {
    especialidad: "Neurologia",
    tema: "Esclerosis multiple",
    contenido_md: `# Esclerosis multiple

## Puntos clave
- Enfermedad desmielinizante autoinmune del SNC, mas frecuente en mujeres jovenes
- Diagnostico: criterios de McDonald 2017 = diseminacion en espacio Y tiempo (clinica o RM)
- RM cerebral con gadolinio: prueba mas sensible (placas periventriculares, yuxtacorticales, infratentoriales, medulares)
- LCR: bandas oligoclonales positivas (>95% de EM)
- Brote agudo: metilprednisolona IV en pulsos (3-5 dias)

## Formas clinicas

| Forma | Descripcion |
|---|---|
| Remitente-recurrente (85%) | Brotes con recuperacion, la mas frecuente |
| Secundaria progresiva | Evolucion de la RR con deterioro progresivo |
| Primaria progresiva (10-15%) | Deterioro desde el inicio sin brotes claros |

## Reglas mnemotecnicas
- **McDonald 2017 = DIS + DIT**: Diseminacion en espacio + Diseminacion en tiempo
- **Uhthoff = calor empeora** (banarse con agua caliente empeora sintomas)
- **Lhermitte = descarga electrica** al flexionar el cuello

## Lo mas preguntado en el MIR
- Criterios diagnosticos de McDonald
- Tratamiento del brote (corticoides) vs tratamiento modificador
- Diagnostico diferencial de neuritis optica
- Formas clinicas y pronostico`,
    tip_mir: "RM con lesiones periventriculares perpendiculares al cuerpo calloso (dedos de Dawson) + bandas oligoclonales en LCR = alta sospecha de EM.",
  },
  {
    especialidad: "Neurologia",
    tema: "Cefaleas",
    contenido_md: `# Cefaleas

## Puntos clave
- Migrana: unilateral, pulsatil, 4-72h, nauseas/vomitos, foto/fonofobia, empeora con actividad
- Cefalea tensional: bilateral, opresiva, leve-moderada, no empeora con actividad
- Cefalea en racimos (cluster): periorbital unilateral, 15-180 min, sintomas autonomicos (lagrimeo, rinorrea), predominio masculino
- Arteritis de celulas gigantes: >50 anos, cefalea temporal, claudicacion mandibular, VSG elevada -> corticoides urgentes
- Red flags: inicio subito, edema papila, fiebre, focalidad neurologica, >50 anos de novo

## Tabla: Tratamiento de cefaleas primarias

| Cefalea | Agudo | Profilactico |
|---|---|---|
| Migrana | Triptanes, AINE | Propranolol, topiramato, anti-CGRP |
| Tensional | AINE, paracetamol | Amitriptilina |
| Cluster | Sumatriptan SC, O2 al 100% | Verapamilo |
| Hemicranea paroxistica | Indometacina (diagnostico-terapeutico) | Indometacina |

## Reglas mnemotecnicas
- **Cluster = Clavos + Lagrimas**: dolor intenso periorbital + lagrimeo
- **Indometacina-sensibles**: hemicranea paroxistica, hemicranea continua, SUNCT (son las "indometacina-respondedoras")
- **Trueno = emergencia**: descartar HSA siempre

## Lo mas preguntado en el MIR
- Diagnostico diferencial de cefaleas primarias
- Signos de alarma que obligan a neuroimagen
- Arteritis de la temporal: diagnostico y tratamiento urgente
- Tratamiento agudo y profilactico de la migrana`,
    tip_mir: "Anciano + cefalea temporal + claudicacion mandibular + VSG >50 = arteritis de celulas gigantes. Iniciar corticoides SIN esperar la biopsia de temporal.",
  },
  {
    especialidad: "Neurologia",
    tema: "Parkinson",
    contenido_md: `# Enfermedad de Parkinson

## Puntos clave
- Triada clasica: temblor de reposo (4-6 Hz), rigidez en rueda dentada, bradicinesia
- Inicio asimetrico (unilateral) que progresa a bilateral
- Tratamiento mas eficaz: levodopa/carbidopa
- Complicaciones motoras del tratamiento con levodopa: wearing-off, discinesias, fenomeno on-off
- Diagnostico diferencial: parkinsonismo farmacologico (simetrico, por neurolepticos), atrofia multisistemica, PSP

## Tabla: Farmacos antiparkinsonianos

| Farmaco | Uso principal | Efecto adverso |
|---|---|---|
| Levodopa/carbidopa | Mas eficaz, todos los estadios | Discinesias, fluctuaciones |
| Agonistas dopaminergicos (pramipexol) | Jovenes, inicio | Impulsividad, somnolencia |
| IMAO-B (rasagilina, safinamida) | Complementario, leve | Insomnio |
| ICOMT (entacapona) | Complemento a levodopa | Diarrea |
| Anticolinergicos (biperideno) | Temblor en jovenes | Confusion en ancianos |

## Reglas mnemotecnicas
- **Parkinson = TRAP**: Temblor de Reposo, Acinesia/bradicinesia, Rigidez, Postural instability
- **Levodopa = el mas potente** pero con complicaciones a largo plazo

## Lo mas preguntado en el MIR
- Diferencias entre Parkinson y parkinsonismo farmacologico
- Complicaciones motoras del tratamiento con levodopa
- Demencia con cuerpos de Lewy vs Parkinson con demencia
- Eleccion de farmaco segun edad y estadio`,
    tip_mir: "Parkinsonismo simetrico + antecedente de antipsicotico/metoclopramida = parkinsonismo farmacologico. No confundir con Parkinson idiopatico (asimetrico).",
  },

  // =====================================================================
  // DIGESTIVO
  // =====================================================================
  {
    especialidad: "Digestivo",
    tema: "Hepatitis",
    contenido_md: `# Hepatitis virales

## Puntos clave
- VHA y VHE: transmision fecal-oral, no cronifican (excepto VHE en inmunodeprimidos)
- VHB: transmision parenteral/sexual/vertical. Cronifica en 5% adultos, 90% neonatos
- VHC: transmision parenteral. Cronifica en 80%. Tratamiento actual: AAD con tasas de curacion >95%
- Marcadores VHB: HBsAg (infeccion), anti-HBs (inmunidad), anti-HBc IgM (aguda), HBeAg (replicacion)
- VHE es especialmente grave en embarazadas (mortalidad hasta 20%)

## Tabla: Marcadores serologicos de VHB

| Situacion | HBsAg | Anti-HBs | Anti-HBc | HBeAg |
|---|---|---|---|---|
| Infeccion aguda | + | - | IgM+ | +/- |
| Infeccion cronica | + | - | IgG+ | +/- |
| Inmunidad por vacuna | - | + | - | - |
| Inmunidad natural | - | + | IgG+ | - |
| Ventana inmunologica | - | - | IgM+ | - |

## Reglas mnemotecnicas
- **Anti-HBs solo = vacunado** (sin anti-HBc)
- **Anti-HBs + anti-HBc = infeccion curada** (inmunidad natural)
- **VHC = se Cura con AAD** (>95%)

## Lo mas preguntado en el MIR
- Interpretacion serologica de VHB
- Indicaciones de tratamiento de VHB cronica
- VHC: tratamiento con AAD
- VHE en embarazo`,
    tip_mir: "Anti-HBs positivo SOLO (sin anti-HBc) = vacunado. Anti-HBs + anti-HBc positivos = infeccion pasada curada. Pregunta MIR segura.",
  },
  {
    especialidad: "Digestivo",
    tema: "Cirrosis",
    contenido_md: `# Cirrosis hepatica

## Puntos clave
- Causa mas frecuente en Occidente: alcohol. Segunda: esteatohepatitis no alcoholica (NASH)
- Child-Pugh: bilirrubina, albumina, INR, ascitis, encefalopatia (A=5-6, B=7-9, C=10-15)
- Prevencion de hemorragia por varices: betabloqueantes no selectivos (propranolol/carvedilol) o ligadura con bandas
- PBE: PMN >250 en liquido ascitico. Tratamiento: cefotaxima. Profilaxis: norfloxacino
- Encefalopatia hepatica: lactulosa + rifaximina

## Tabla: Complicaciones de la cirrosis

| Complicacion | Diagnostico | Tratamiento |
|---|---|---|
| Ascitis | Ecografia + paracentesis | Dieta hiposodica + espironolactona +/- furosemida |
| PBE | PMN >250 en LA | Cefotaxima IV |
| Hemorragia variceal | Endoscopia | Ligadura + terlipresina/octreotido |
| Encefalopatia | Clinica + NH3 | Lactulosa + rifaximina |
| Sd hepatorrenal | Exclusion + creatinina | Terlipresina + albumina (tipo 1) |

## Reglas mnemotecnicas
- **Child-Pugh = ABBIE**: Albumina, Bilirrubina, (coagulacion=INR), Encefalopatia
- **PBE = 250 PMN**: diagnostico con un solo numero

## Lo mas preguntado en el MIR
- Clasificacion Child-Pugh y MELD
- Manejo de las complicaciones de la cirrosis
- Indicaciones de TIPS
- Prevencion de hemorragia variceal`,
    tip_mir: "En la PBE, el gradiente de albumina suero-ascitis (GASA) >1.1 indica hipertension portal. No esperar a cultivo para tratar: PMN >250 = antibiotico.",
  },
  {
    especialidad: "Digestivo",
    tema: "EII",
    contenido_md: `# Enfermedad inflamatoria intestinal

## Puntos clave
- Crohn: cualquier tramo del tubo digestivo (boca a ano), transmural, segmentaria, granulomas, fistulas, estenosis
- Colitis ulcerosa (CU): solo colon, continua desde recto, mucosa/submucosa, pseudopolipos, nunca fistulas
- Tratamiento de mantenimiento CU leve: mesalazina (5-ASA)
- Tratamiento Crohn: budesonida (brote leve), azatioprina/biologicos (moderado-grave)
- Manifestaciones extraintestinales: eritema nodoso (paralelo), colangitis esclerosante primaria (independiente, asociada a CU)

## Tabla comparativa: Crohn vs CU

| Caracteristica | Crohn | Colitis ulcerosa |
|---|---|---|
| Localizacion | Cualquiera (ileon terminal +frecuente) | Solo colon (desde recto) |
| Extension | Segmentaria (zonas sanas intercaladas) | Continua |
| Profundidad | Transmural | Mucosa/submucosa |
| Granulomas | Si (30-60%) | No |
| Fistulas | Frecuentes | No |
| Megacolon toxico | Raro | Mas frecuente |
| Cancer colorrectal | Riesgo aumentado | Riesgo mas aumentado |

## Reglas mnemotecnicas
- **Crohn = transmural = fistulas** (la C de Crohn es de Completo = todo el espesor)
- **CU = Continua desde recto, solo Colon, solo mucosa**
- **Eritema nodoso = paralelo a la actividad intestinal**

## Lo mas preguntado en el MIR
- Diagnostico diferencial Crohn vs CU
- Tratamiento escalonado (step-up)
- Manifestaciones extraintestinales
- Megacolon toxico`,
    tip_mir: "Si te dan un paciente con EII + colangitis esclerosante primaria = pensar en colitis ulcerosa (no en Crohn). La CEP es independiente de la actividad intestinal.",
  },
  {
    especialidad: "Digestivo",
    tema: "Ulcera peptica",
    contenido_md: `# Ulcera peptica

## Puntos clave
- Causa mas frecuente de ulcera duodenal: H. pylori. Causa mas frecuente de ulcera gastrica: AINE
- Erradicacion de H. pylori: IBP + claritromicina + amoxicilina x 14 dias (terapia triple clasica)
- Alternativa: terapia cuadruple con bismuto (IBP + bismuto + tetraciclina + metronidazol)
- Complicacion mas frecuente: hemorragia digestiva alta
- Comprobacion de erradicacion: test de aliento con C13 (4 semanas tras fin de antibiotico, 2 semanas sin IBP)

## Clasificacion de Forrest (riesgo de resangrado)

| Forrest | Hallazgo | Riesgo resangrado | Actitud |
|---|---|---|---|
| Ia | Sangrado arterial activo | 90% | Endoscopia terapeutica |
| Ib | Sangrado en babeo | 50% | Endoscopia terapeutica |
| IIa | Vaso visible no sangrante | 40% | Endoscopia terapeutica |
| IIb | Coagulo adherido | 20% | Controversial |
| IIc | Mancha plana pigmentada | 10% | No endoscopia |
| III | Fondo limpio | 5% | No endoscopia |

## Reglas mnemotecnicas
- **HP = ulcera duodenal** (la Helicobacter Produce ulcera Duodenal)
- **AINE = ulcera gastrica** (proteger con IBP en mayores de 65 o con factores de riesgo)

## Lo mas preguntado en el MIR
- Esquemas de erradicacion de H. pylori
- Clasificacion de Forrest e indicaciones de tratamiento endoscopico
- Indicaciones de cirugia en ulcera peptica
- Sindrome de Zollinger-Ellison`,
    tip_mir: "Forrest IIa (vaso visible) requiere tratamiento endoscopico. Forrest III (fondo limpio) no. Pregunta clasica de indicaciones de endoscopia terapeutica.",
  },
  {
    especialidad: "Digestivo",
    tema: "Pancreatitis",
    contenido_md: `# Pancreatitis

## Puntos clave
- Causas mas frecuentes: litiasis biliar (40%) y alcohol (30%)
- Diagnostico: 2 de 3 criterios (dolor tipico + lipasa/amilasa >3x + imagen compatible)
- Lipasa mas especifica que amilasa
- PA grave: criterios de Atlanta revisados, necrosis pancreatica, fallo organico persistente
- Pseudoquiste: coleccion encapsulada sin epitelio, aparece >4 semanas
- Pancreatitis cronica: alcohol es la causa mas frecuente

## Tabla: Gravedad de la pancreatitis aguda

| Gravedad | Fallo organico | Complicaciones locales |
|---|---|---|
| Leve | No | No |
| Moderada | Transitorio (<48h) | Si |
| Grave | Persistente (>48h) | Si |

## Reglas mnemotecnicas
- **Biliar y Alcohol = las 2 causas principales** (B y A = BA como "BA-ncreas")
- **Lipasa > Amilasa** en especificidad
- **Pseudoquiste = Pseudo (falso) quiste = sin epitelio** (aparece a las 4 semanas)

## Lo mas preguntado en el MIR
- Etiologia y diagnostico de PA
- Criterios de gravedad
- Manejo de la necrosis pancreatica infectada (step-up approach)
- Pancreatitis cronica: insuficiencia exocrina (esteatorrea)`,
    tip_mir: "La necrosis pancreatica infectada se maneja con step-up approach: antibioticos -> drenaje percutaneo/endoscopico -> necrosectomia solo si falla. NO cirugia precoz.",
  },

  // =====================================================================
  // NEFROLOGIA
  // =====================================================================
  {
    especialidad: "Nefrologia",
    tema: "Sindrome nefrotico",
    contenido_md: `# Sindrome nefrotico

## Puntos clave
- Definicion: proteinuria >3.5 g/dia + hipoalbuminemia + edemas + hiperlipidemia
- Causa mas frecuente en ninos: enfermedad de cambios minimos (responde a corticoides)
- Causa mas frecuente en adultos: glomerulonefritis membranosa (anticuerpos anti-PLA2R)
- Complicacion mas temida: trombosis venosa (especialmente vena renal, sobre todo en membranosa)
- Cambios minimos: microscopia optica normal, fusion de pedicelos en ME

## Tabla: Causas por edad

| Edad | Causa mas frecuente | Tratamiento |
|---|---|---|
| Ninos | Cambios minimos | Corticoides (respuesta >90%) |
| Adultos jovenes | GEFS | Corticoides +/- inmunosupresores |
| Adultos >40 anos | Membranosa | Anti-PLA2R + rituximab/ciclofosfamida |
| Diabeticos | Nefropatia diabetica | IECA/ARA-II + iSGLT2 |

## Reglas mnemotecnicas
- **3.5 = nefrotico** (proteinuria >3.5 g/dia)
- **Cambios MINimos = ninos** (MIN = menores)
- **Membranosa = adultos + trombosis** (la M de Membranosa = la M de Mayor y Mortal trombosis)

## Lo mas preguntado en el MIR
- Diagnostico diferencial de sindrome nefrotico segun edad
- Trombosis venosa como complicacion
- Enfermedad de cambios minimos: respuesta a corticoides
- Anticuerpos anti-PLA2R en membranosa`,
    tip_mir: "Nino con sindrome nefrotico puro (sin hematuria ni HTA) = cambios minimos. Se trata con corticoides sin biopsia inicial. Respuesta >90%.",
  },
  {
    especialidad: "Nefrologia",
    tema: "Sindrome nefritico",
    contenido_md: `# Sindrome nefritico

## Puntos clave
- Triada: hematuria (con hematies dismorficos/cilindros hematicos), HTA, oliguria con deterioro de FG
- Causa mas frecuente en ninos: GN postestreptococica (C3 bajo)
- Causa mas frecuente de hematuria macroscopica recurrente: nefropatia IgA (C3 normal)
- GN rapidamente progresiva: semilunas en >50% de glomerulos, urgencia nefrologica
- Goodpasture: anti-MBG + hemorragia pulmonar + GN rapidamente progresiva

## Tabla: GN y complemento

| GN | Complemento |
|---|---|
| GN postestreptococica | C3 bajo |
| Nefropatia IgA | Normal |
| GN membranoproliferativa | C3 bajo |
| Nefropatia lupica | C3 y C4 bajos |
| Anti-MBG (Goodpasture) | Normal |
| ANCA | Normal |

## Reglas mnemotecnicas
- **Postestrep = 2 semanas despues de faringitis** (y 4-6 semanas despues de cutanea)
- **IgA = hemAturia con infeccion** (coincide, no se retrasa como la postestrep)
- **Semilunas = gravedad = rapidamente progresiva**

## Lo mas preguntado en el MIR
- Diagnostico diferencial de GN segun complemento
- GN postestreptococica vs nefropatia IgA
- GN rapidamente progresiva: causas y urgencia
- Sindrome de Goodpasture`,
    tip_mir: "Hematuria COINCIDENTE con infeccion respiratoria = IgA. Hematuria 2 SEMANAS DESPUES de faringitis = postestreptococica. La temporalidad es clave.",
  },
  {
    especialidad: "Nefrologia",
    tema: "IRA",
    contenido_md: `# Insuficiencia renal aguda (IRA)

## Puntos clave
- IRA prerrenal (70%): hipoperfusion renal, FeNa <1%, Na urinario <20, urea/creatinina >40
- IRA intrinseca: NTA (la mas frecuente), nefritis intersticial, GN
- IRA postrenal: obstruccion (hiperplasia prostatica, litiasis bilateral)
- NTA: cilindros granulosos marrones (muddy brown casts), FeNa >2%
- Indicaciones urgentes de dialisis: hiperpotasemia refractaria, EAP refractario, acidosis severa, uremia sintomatica, intoxicaciones

## Tabla: Prerrenal vs NTA

| Parametro | Prerrenal | NTA |
|---|---|---|
| Na urinario | <20 mEq/L | >40 mEq/L |
| FeNa | <1% | >2% |
| Osmolaridad urinaria | >500 | <350 |
| Urea/Creatinina | >40 | <20 |
| Sedimento | Normal/cilindros hialinos | Cilindros granulosos marrones |
| Respuesta a volumen | Si | No |

## Reglas mnemotecnicas
- **Prerrenal = rinon Pidiendo sangre** (retiene Na y agua, FeNa bajo)
- **NTA = rinon No funciona** (pierde Na, FeNa alto)
- **AEIOU de dialisis urgente**: Acidosis, Electrolitos (K+), Intoxicacion, Overload (sobrecarga), Uremia

## Lo mas preguntado en el MIR
- Diagnostico diferencial prerrenal vs NTA con indices urinarios
- Indicaciones urgentes de dialisis
- Nefritis intersticial aguda: triada (fiebre, rash, eosinofiluria)
- Causas de IRA obstructiva`,
    tip_mir: "FeNa <1% = prerrenal (el rinon funciona bien, retiene sodio). FeNa >2% = NTA (el tubulo esta danado, pierde sodio). Es la pregunta MIR mas clasica de nefrologia.",
  },
  {
    especialidad: "Nefrologia",
    tema: "IRC",
    contenido_md: `# Enfermedad renal cronica (ERC)

## Puntos clave
- Causa mas frecuente: nefropatia diabetica, seguida de nefropatia hipertensiva
- Estadios KDIGO: G1 (>90), G2 (60-89), G3a (45-59), G3b (30-44), G4 (15-29), G5 (<15 = dialisis)
- Anemia renal: deficit de eritropoyetina -> AEE + hierro
- Hiperparatiroidismo secundario: deficit de calcitriol + hiperfosfatemia -> osteodistrofia renal
- Dialisis: generalmente FG <15 o sintomas uremicos refractarios

## Tabla: Complicaciones de la ERC y tratamiento

| Complicacion | Causa | Tratamiento |
|---|---|---|
| Anemia | Deficit de EPO | AEE + hierro |
| Osteodistrofia renal | HPT 2o, deficit vit D | Quelantes de fosforo + calcitriol + cinacalcet |
| Acidosis metabolica | Retencion de H+ | Bicarbonato oral |
| Hiperpotasemia | Descenso del FG | Dieta, resinas, iSGLT2 |
| HTA | Retencion hidrosalina | IECA/ARA-II (nefroproteccion) |

## Reglas mnemotecnicas
- **ERC = Diabetes es la Reina de las Causas**
- **HPT 2o = fosforo alto + calcio bajo + PTH alta + vitamina D activa baja**
- **Dialisis cuando el FG dice 15 o los sintomas dicen basta**

## Lo mas preguntado en el MIR
- Estadificacion KDIGO
- Manejo de la anemia renal
- Osteodistrofia renal: fisiopatologia y tratamiento
- Indicaciones de inicio de dialisis
- Nefroproteccion con IECA/ARA-II e iSGLT2`,
    tip_mir: "Los iSGLT2 (dapagliflozina, empagliflozina) han demostrado retrasar la progresion de la ERC incluso en no diabeticos. Pregunta MIR actualizada y muy importante.",
  },
  {
    especialidad: "Nefrologia",
    tema: "Electrolitos",
    contenido_md: `# Trastornos electroliticos

## Puntos clave
- Hiperpotasemia: ECG con T picudas -> QRS ancho -> FV. Tratamiento: gluconato calcico (proteccion cardiaca) + insulina+glucosa + salbutamol + resinas/dialisis
- Hipopotasemia: debilidad, arritmias, onda U. Si severa (<2.5): KCl IV con monitorizacion
- Hiponatremia: causa mas frecuente hospitalaria = SIADH. Corregir lento (<10 mEq/L/dia) para evitar mielinolisis pontina
- Hipocalcemia: Chvostek y Trousseau positivos, QT largo. Tratamiento: calcio IV si severa
- Hipercalcemia: causa mas frecuente ambulatoria = HPT primario; hospitalaria = neoplasias

## Tabla: Trastornos del potasio

| | Hipopotasemia | Hiperpotasemia |
|---|---|---|
| Causas frecuentes | Diureticos de asa/tiazidas, vomitos, diarrea | ERC, IECA/ARA-II, espironolactona |
| ECG | Aplanamiento T, onda U, ST deprimido | T picudas, QRS ancho, bradicardia |
| Urgencia | <2.5 mEq/L | >6.5 mEq/L o cambios ECG |
| Tratamiento | KCl oral/IV | Gluconato Ca + insulina + resinas |

## Reglas mnemotecnicas
- **T picuda = K+ picudo** (hiperpotasemia)
- **SIADH = hiponatremia euvoleemica** con orina concentrada
- **Chvostek = mejilla, Trousseau = mano (espasmo carpopedal)** = hipocalcemia

## Lo mas preguntado en el MIR
- ECG de hiperpotasemia e hipopotasemia
- SIADH: diagnostico y manejo
- Mielinolisis pontina por correccion rapida de hiponatremia
- Causas de hipercalcemia`,
    tip_mir: "Ante hiperpotasemia con cambios ECG: lo PRIMERO es gluconato calcico IV (estabiliza la membrana cardiaca), NO la insulina. La insulina baja el K+ pero no protege el corazon.",
  },

  // =====================================================================
  // NEUMOLOGIA
  // =====================================================================
  {
    especialidad: "Neumologia",
    tema: "EPOC",
    contenido_md: `# Enfermedad pulmonar obstructiva cronica

## Puntos clave
- Diagnostico: espirometria con FEV1/FVC <0.70 post-broncodilatador
- Clasificacion GOLD de obstruccion: GOLD 1 (FEV1>=80%), 2 (50-79%), 3 (30-49%), 4 (<30%)
- Grupos ABE: segun sintomas (mMRC/CAT) y exacerbaciones
- OCD: PaO2 <55 mmHg o <60 con cor pulmonale/poliglobulia (minimo 15h/dia)
- El tabaquismo es el factor de riesgo principal. Dejar de fumar = unica medida que cambia la historia natural

## Tabla: Tratamiento escalonado EPOC (GOLD 2024)

| Grupo | Sintomas | Exacerbaciones | Tratamiento |
|---|---|---|---|
| A | Pocos | 0-1 leves | Broncodilatador a demanda |
| B | Muchos | 0-1 leves | LABA o LAMA |
| E | Cualquiera | >=2 moderadas o >=1 hospitalizada | LABA+LAMA (+/- ICS si eos>=300) |

## Reglas mnemotecnicas
- **GOLD = siempre post-broncodilatador** (a diferencia del asma que es pre/post)
- **ABE = A poco, B sintomas, E exacerbaciones**
- **OCD a 55 o 60 con complicaciones**: como la velocidad en ciudad

## Lo mas preguntado en el MIR
- Diagnostico espirometrico de EPOC
- Indicaciones de OCD
- Diferencia con asma (irreversibilidad)
- Deficit de alfa-1-antitripsina`,
    tip_mir: "El unico tratamiento que modifica la supervivencia en EPOC es dejar de fumar (y OCD si esta indicada). Los broncodilatadores mejoran sintomas y exacerbaciones, no mortalidad.",
  },
  {
    especialidad: "Neumologia",
    tema: "Asma",
    contenido_md: `# Asma bronquial

## Puntos clave
- Patron espirometrico: obstructivo REVERSIBLE (mejoria >12% y >200 mL con broncodilatador)
- Tratamiento de control: corticoide inhalado (CI) es la base
- Escalones GINA: 1-2 (CI baja dosis), 3 (CI media + LABA), 4 (CI alta + LABA), 5 (biologicos)
- Crisis grave: SABA nebulizado + corticoides sistemicos + O2 + bromuro de ipratropio
- Asma alergica grave: anti-IgE (omalizumab), anti-IL5 (mepolizumab), anti-IL4/13 (dupilumab)

## Tabla: Escalones terapeuticos (GINA 2024)

| Escalon | Controlador | Rescate |
|---|---|---|
| 1 | CI baja dosis + formoterol a demanda | CI-formoterol a demanda |
| 2 | CI baja dosis diario | SABA o CI-formoterol |
| 3 | CI media + LABA | SABA o CI-formoterol |
| 4 | CI alta + LABA +/- LAMA | SABA o CI-formoterol |
| 5 | Biologico (anti-IgE, anti-IL5, anti-IL4) | SABA o CI-formoterol |

## Reglas mnemotecnicas
- **Asma = Reversible** (a diferencia de EPOC)
- **CI = la base del tratamiento** (Corticoide Inhalado siempre)
- **GINA 2024: formoterol-CI como rescate** preferido sobre SABA solo

## Lo mas preguntado en el MIR
- Diagnostico espirometrico (reversibilidad)
- Escalones terapeuticos GINA
- Manejo de la crisis asmatica grave
- Indicaciones de biologicos en asma grave`,
    tip_mir: "GINA 2024 ya no recomienda SABA solo como rescate. La preferencia es CI + formoterol a demanda incluso en escalon 1. Pregunta actualizada.",
  },
  {
    especialidad: "Neumologia",
    tema: "TEP",
    contenido_md: `# Tromboembolismo pulmonar

## Puntos clave
- Sospecha clinica: escala de Wells (probabilidad pre-test)
- Dimero D: alto VPN, util para EXCLUIR en probabilidad baja-intermedia
- Diagnostico: angio-TAC pulmonar (prueba de eleccion)
- TEP estable: anticoagulacion (HBPM/ACOD)
- TEP masivo (inestable hemodinamicamente): trombolisis sistemica (alteplasa)

## Algoritmo diagnostico simplificado

1. Sospecha clinica -> Wells
2. Probabilidad baja/intermedia -> Dimero D
3. Dimero D negativo -> excluye TEP
4. Dimero D positivo o probabilidad alta -> angio-TAC
5. Angio-TAC positivo -> tratamiento

## Tabla: Escala de Wells (simplificada)

| Criterio | Puntos |
|---|---|
| TVP clinica | 3 |
| Diagnostico alternativo menos probable que TEP | 3 |
| FC >100 | 1.5 |
| Inmovilizacion/cirugia reciente | 1.5 |
| TVP/TEP previo | 1.5 |
| Hemoptisis | 1 |
| Cancer activo | 1 |

## Reglas mnemotecnicas
- **Wells = probabilidad PRE-test** (antes de pedir pruebas)
- **DD negativo + probabilidad baja = descarta** (alto valor predictivo negativo)
- **Masivo = trombolisis** (el TEP estable NO se tromboliza)

## Lo mas preguntado en el MIR
- Algoritmo diagnostico del TEP
- Indicaciones de trombolisis vs anticoagulacion
- Escala de Wells
- Duracion de la anticoagulacion`,
    tip_mir: "El dimero D solo sirve para EXCLUIR (si es negativo en probabilidad baja). Un dimero D positivo no confirma nada. Nunca usar en probabilidad alta.",
  },
  {
    especialidad: "Neumologia",
    tema: "Neumonias",
    contenido_md: `# Neumonias

## Puntos clave
- Agente mas frecuente de NAC: Streptococcus pneumoniae
- NAC atipica: Mycoplasma (jovenes), Legionella (ancianos, hiponatremia)
- Escala CURB-65: Confusion, Urea >44, Respiratoria (FR>=30), Blood pressure (TAS<90/TAD<=60), 65 anos
- 0-1: ambulatorio; 2: hospital; 3-5: UCI
- Neumonia nosocomial: >48h de hospitalizacion. Cubrir Pseudomonas y SAMR si factores de riesgo

## Tabla: Neumonias tipicas vs atipicas

| Caracteristica | Tipica | Atipica |
|---|---|---|
| Inicio | Brusco | Gradual |
| Fiebre | Alta con escalofrio | Moderada |
| Tos | Productiva purulenta | Seca |
| Rx | Condensacion lobar | Infiltrado intersticial |
| Agente tipico | Neumococo | Mycoplasma, Legionella, Chlamydia |
| Tratamiento | Betalactamico | Macrolido o fluoroquinolona |

## Reglas mnemotecnicas
- **Neumococo = Numero 1** en NAC
- **Legionella = hipoNatremia + diarrea + hepatitis** (pista MIR clasica)
- **CURB-65**: cada letra = 1 punto, >=2 = hospitalizar

## Lo mas preguntado en el MIR
- Etiologia mas frecuente de NAC
- Escala CURB-65 para decidir ingreso
- Neumonia por Legionella: clinica tipica
- Neumonia por Pneumocystis en VIH`,
    tip_mir: "NAC + hiponatremia + diarrea + transaminasas altas = Legionella. Es una de las pistas clinicas mas clasicas del MIR.",
  },
  {
    especialidad: "Neumologia",
    tema: "Cancer de pulmon",
    contenido_md: `# Cancer de pulmon

## Puntos clave
- Tipo histologico mas frecuente: adenocarcinoma (antes era epidermoide)
- Microcitico (SCLC): muy agresivo, central, sindromes paraneoplasicos (SIADH, Cushing ectopico, Lambert-Eaton)
- Pancoast: tumor del sulcus superior con sindrome de Horner + dolor braquial
- Cribado: TAC baja dosis anual en fumadores/exfumadores 50-80 anos con >=20 paquetes-ano
- Tratamiento: cirugia en estadios precoces (I-II), quimio+inmuno en avanzados, terapias diana (EGFR, ALK)

## Tabla: Sindromes paraneoplasicos

| Sindrome | Tipo histologico | Mediador |
|---|---|---|
| SIADH | Microcitico | ADH ectopica |
| Cushing ectopico | Microcitico | ACTH ectopica |
| Hipercalcemia | Epidermoide | PTHrP |
| Lambert-Eaton | Microcitico | Ac anti-canal Ca voltaje |
| Osteoartropatia hipertrofica | Adenocarcinoma | - |

## Reglas mnemotecnicas
- **Microcitico = Muy agresivo + SIADH + no cirugia** (se trata con QT+RT)
- **Epidermoide = central + hipercalcemia** (PTHrP)
- **Adenocarcinoma = periferico + actual numero 1** (no fumadores tambien)

## Lo mas preguntado en el MIR
- Sindromes paraneoplasicos segun tipo histologico
- Tumor de Pancoast: clinica
- Estadificacion y tratamiento por estadio
- Mutaciones conductoras: EGFR, ALK`,
    tip_mir: "Hiponatremia + tumor pulmonar central = SIADH por microcitico. Hipercalcemia + tumor pulmonar = PTHrP por epidermoide. La bioquimica te dice el tipo.",
  },

  // =====================================================================
  // ENDOCRINOLOGIA
  // =====================================================================
  {
    especialidad: "Endocrinologia",
    tema: "Diabetes",
    contenido_md: `# Diabetes mellitus

## Puntos clave
- Diagnostico: glucemia ayunas >=126 (x2), glucemia al azar >=200 con sintomas, SOG >=200 a 2h, HbA1c >=6.5%
- DM tipo 2: metformina de primera linea
- iSGLT2 y arGLP-1: beneficio cardiovascular y renal demostrado
- Cetoacidosis diabetica (CAD): hiperglucemia + acidosis metabolica + cetonemia. Tto: insulina IV + suero + potasio
- Estado hiperosmolar: DM2, hiperglucemia extrema (>600), deshidratacion severa, sin cetosis significativa

## Tabla: CAD vs Estado hiperosmolar

| Caracteristica | CAD | Estado hiperosmolar |
|---|---|---|
| Tipo DM | DM1 (tipico) | DM2 |
| Glucemia | 250-600 | >600 |
| Cetonas | Presentes (altas) | Ausentes/minimas |
| pH | <7.30 | >7.30 |
| Osmolaridad | Variable | >320 |
| Tratamiento | Insulina IV + volumen + K+ | Volumen ++ + insulina IV |
| Mortalidad | ~1-5% | ~5-20% |

## Reglas mnemotecnicas
- **126 en ayunas, 200 al azar, 6.5% de HbA1c**: los 3 numeros de la diabetes
- **Metformina = Primera** (la M es de Metformina y de Mero principio)
- **CAD = Cetoacidosis = tipo 1** (aunque puede ocurrir en tipo 2 tambien)

## Lo mas preguntado en el MIR
- Criterios diagnosticos
- Tratamiento escalonado de DM2
- CAD: diagnostico y tratamiento
- Beneficio cardiovascular de iSGLT2 y arGLP-1`,
    tip_mir: "En la CAD, el potasio puede estar normal o alto a pesar de deficit corporal total. Al dar insulina, el K+ baja. Siempre reponer K+ salvo hiperpotasemia severa.",
  },
  {
    especialidad: "Endocrinologia",
    tema: "Tiroides",
    contenido_md: `# Patologia tiroidea

## Puntos clave
- Hipertiroidismo: Graves es la causa mas frecuente (TSI/TRAb positivos, bocio difuso, oftalmopatia)
- Hipotiroidismo: Hashimoto es la causa mas frecuente en areas sin deficit de yodo (anti-TPO positivos)
- Hipotiroidismo subclinico: TSH alta con T4L normal
- Nodulo tiroideo: ecografia + PAAF si TI-RADS sospechoso. La gammagrafia solo si TSH baja
- Tormenta tiroidea: emergencia. PTU/metimazol + yodo + betabloqueantes + corticoides + soporte

## Tabla: Hipertiroidismo - causas

| Causa | Gammagrafia | Anticuerpos | Clinica |
|---|---|---|---|
| Graves | Captacion difusa aumentada | TRAb/TSI+ | Bocio difuso + oftalmopatia |
| BMN toxico | Captacion parcheada | Negativos | Bocio nodular |
| Adenoma toxico | Nodulo caliente | Negativos | Nodulo unico |
| Tiroiditis subaguda | Captacion abolida | Negativos | Dolor + VSG alta |

## Reglas mnemotecnicas
- **Graves = autoinmune con ojos** (oftalmopatia, unica causa)
- **Hashimoto = anti-TPO + hipotiroidismo** (Hash = destruccion)
- **Tormenta tiroidea = Todo junto**: PTU + Yodo + Beta + Corticoides

## Lo mas preguntado en el MIR
- Diagnostico diferencial de hipertiroidismo con gammagrafia
- Manejo del nodulo tiroideo
- Tormenta tiroidea: tratamiento urgente
- Hipotiroidismo subclinico: cuando tratar`,
    tip_mir: "La gammagrafia tiroidea solo se pide si la TSH esta BAJA (hipertiroidismo). Con TSH normal o alta, el abordaje del nodulo es ecografia + PAAF.",
  },
  {
    especialidad: "Endocrinologia",
    tema: "Suprarrenales",
    contenido_md: `# Patologia suprarrenal

## Puntos clave
- Cushing: cortisol alto. Diagnostico: supresion con DXM 1mg nocturno y/o CLU 24h. Despues ACTH para localizar
- Addison: insuficiencia suprarrenal primaria. Hiperpigmentacion + hipotension + hipoNa + hiperK + ACTH alta
- Feocromocitoma: HTA paroxistica + cefalea + sudoracion + palpitaciones. Diagnostico: metanefrinas. Tratamiento: alfa-bloqueo primero, luego cirugia
- Hiperaldosteronismo primario (Conn): HTA + hipoK + alcalosis metabolica. Diagnostico: ratio aldosterona/renina elevado
- Crisis suprarrenal: hidrocortisona IV 100mg + suero salino

## Tabla: Cushing - localizacion segun ACTH

| ACTH | Causa | Siguiente paso |
|---|---|---|
| Baja (suprimida) | Suprarrenal (adenoma, carcinoma) | TAC suprarrenal |
| Alta | Hipofisario (70%) o ectopico | RM hipofisis + CRH/DDAVP |

## Reglas mnemotecnicas
- **Addison = oscuro (hiperpigmentado) + bajo (hipotension) + sal (hipoNa)**
- **Feo-cromocitoma = las 5 P**: Presion (HTA), Palpitaciones, Pain (cefalea), Perspiration (sudor), Pallor (palidez)
- **Conn = aldosterona alta + potasio bajo**

## Lo mas preguntado en el MIR
- Algoritmo diagnostico del Cushing
- Feocromocitoma: regla del 10% y diagnostico bioquimico
- Addison: clinica y manejo de la crisis
- Hiperaldosteronismo primario: screening`,
    tip_mir: "En el feocromocitoma, NUNCA operar sin alfa-bloqueo previo (fenoxibenzamina o doxazosina). Riesgo de crisis hipertensiva intraoperatoria mortal.",
  },
  {
    especialidad: "Endocrinologia",
    tema: "Hipofisis",
    contenido_md: `# Patologia hipofisaria

## Puntos clave
- Adenoma mas frecuente: prolactinoma. Tratamiento medico con agonistas dopaminergicos (cabergolina)
- Acromegalia: exceso de GH. Diagnostico: IGF-1 elevada + SOG con GH que no suprime. Tratamiento: cirugia transesfenoidal
- Diabetes insipida central: deficit de ADH, poliuria con orina diluida, responde a desmopresina
- Sindrome de Sheehan: panhipopituitarismo postparto por necrosis isquemica
- Macroadenoma (>10mm) con extension supraselar: hemianopsia bitemporal por compresion del quiasma

## Tabla: Adenomas hipofisarios

| Tipo | Hormona | Clinica | Tratamiento |
|---|---|---|---|
| Prolactinoma | PRL | Amenorrea, galactorrea, infertilidad | Cabergolina (medico) |
| Somatotropo | GH | Acromegalia/gigantismo | Cirugia transesfenoidal |
| Corticotropo | ACTH | Enfermedad de Cushing | Cirugia transesfenoidal |
| Tirotropo | TSH | Hipertiroidismo central (raro) | Cirugia transesfenoidal |
| No funcionante | - | Efecto masa, hipopituitarismo | Cirugia si sintomas |

## Reglas mnemotecnicas
- **Prolactinoma = unico que se trata CON PASTILLAS** (no cirugia de entrada)
- **Sheehan = hemorragia postparto + agalactia** (no puede dar de mamar)
- **Hemianopsia Bitemporal = quiasma optico comprimido**

## Lo mas preguntado en el MIR
- Prolactinoma: tratamiento medico (no quirurgico)
- Acromegalia: diagnostico y complicaciones
- Diabetes insipida: diferencia central vs nefrogenica
- Hemianopsia bitemporal por macroadenoma`,
    tip_mir: "El prolactinoma es el UNICO adenoma hipofisario que se trata medicamente de entrada (cabergolina). Todos los demas se operan. Pregunta MIR clasica.",
  },
  {
    especialidad: "Endocrinologia",
    tema: "Osteoporosis",
    contenido_md: `# Osteoporosis

## Puntos clave
- Diagnostico: T-score <=-2.5 en DEXA (columna lumbar o cadera)
- Osteopenia: T-score entre -1.0 y -2.5
- Tratamiento primera linea: bifosfonatos (alendronato, risedronato) + calcio + vitamina D
- Complicaciones de bifosfonatos: osteonecrosis de maxilar, fracturas atipicas de femur (uso >5 anos)
- Alternativas: denosumab (anti-RANKL), teriparatida (PTH recombinante, osteoformador)
- Fractura mas frecuente: vertebral (la mas frecuente, muchas son asintomaticas)

## Tabla: Farmacos para osteoporosis

| Farmaco | Mecanismo | Indicacion especial |
|---|---|---|
| Alendronato | Antirresortivo (bifosfonato) | Primera linea |
| Denosumab | Anti-RANKL | Contraindicacion a bifosfonatos, IRC |
| Teriparatida | Osteoformador (PTH) | Osteoporosis severa con fracturas |
| Romosozumab | Anti-esclerostina | Muy alto riesgo de fractura |
| THS | Estrogenico | Menopausia precoz con sintomas |

## Reglas mnemotecnicas
- **-2.5 = osteoporosis** (el numero mas preguntado)
- **Bifosfonato = Buen inicio** (primera linea)
- **Denosumab = D de Dos opciones** (cuando no van bifosfonatos)
- **Teriparatida = Terriblemente osteoporotico** (osteoporosis severa)

## Lo mas preguntado en el MIR
- Criterios diagnosticos DEXA (T-score)
- Indicaciones y complicaciones de bifosfonatos
- Causas de osteoporosis secundaria
- Fractura vertebral: diagnostico y manejo`,
    tip_mir: "Tras 5 anos de bifosfonatos orales (o 3 anos de zoledronato IV), reevaluar: vacaciones terapeuticas si riesgo moderado. El uso indefinido aumenta riesgo de fractura atipica de femur.",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const outDir = path.join(__dirname, "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "resumenes.json");

  fs.writeFileSync(outPath, JSON.stringify(RESUMENES, null, 2), "utf-8");
  console.log(`Generated ${RESUMENES.length} study summaries to ${outPath}`);

  // Print summary
  const bySpecialty = new Map<string, string[]>();
  for (const r of RESUMENES) {
    if (!bySpecialty.has(r.especialidad)) bySpecialty.set(r.especialidad, []);
    bySpecialty.get(r.especialidad)!.push(r.tema);
  }
  console.log("\nResumenes por especialidad:");
  for (const [esp, temas] of bySpecialty) {
    console.log(`  ${esp}: ${temas.join(", ")}`);
  }
}

main();
