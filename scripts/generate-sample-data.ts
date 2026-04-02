/**
 * scripts/generate-sample-data.ts
 *
 * Generates 210 realistic MIR-style sample questions covering 7 specialties
 * with 5 topics each (30 questions per specialty).
 *
 * Usage:  npx tsx scripts/generate-sample-data.ts
 * Output: scripts/data/preguntas.json
 *
 * Can also be imported: import { generateSampleData } from "./generate-sample-data"
 */

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
// Question bank per specialty/topic
// ---------------------------------------------------------------------------

interface QuestionTemplate {
  enunciado: string;
  opciones: string[];
  correcta: number; // 0-based index
  dificultad?: string;
}

const QUESTION_BANK: Record<string, Record<string, QuestionTemplate[]>> = {
  Pediatria: {
    Vacunacion: [
      {
        enunciado: "Lactante de 2 meses acude a su primera visita de vacunacion. Segun el calendario vacunal vigente, cual de las siguientes vacunas NO corresponde administrar a esta edad?",
        opciones: ["Hexavalente (DTPa-VPI-Hib-HB)", "Neumococo conjugada 13-valente", "Rotavirus", "Triple virica (SRP)", "Meningococo B"],
        correcta: 3,
      },
      {
        enunciado: "Respecto a la vacuna del virus del papiloma humano (VPH) en el calendario vacunal, senale la afirmacion correcta:",
        opciones: ["Se administra exclusivamente a ninas", "La pauta son 3 dosis en menores de 15 anos", "Se recomienda a los 12 anos con pauta de 2 dosis", "Esta contraindicada en inmunodeprimidos", "Solo protege frente a los serotipos 16 y 18"],
        correcta: 2,
      },
      {
        enunciado: "Un nino de 6 anos sin vacunar previamente acude a consulta. Cual es la actitud correcta respecto a su vacunacion?",
        opciones: ["No se puede iniciar vacunacion a esta edad", "Se debe aplicar el calendario acelerado de rescate", "Solo se administra triple virica", "Se aplica el mismo calendario que a un lactante", "Se vacuna solo de tetanos y difteria"],
        correcta: 1,
      },
      {
        enunciado: "Cual de las siguientes es una contraindicacion ABSOLUTA para la administracion de cualquier vacuna?",
        opciones: ["Fiebre leve (<38 C)", "Tratamiento antibiotico actual", "Reaccion anafilactica previa a la misma vacuna", "Prematuridad", "Convulsion febril previa"],
        correcta: 2,
      },
      {
        enunciado: "En un nino con infeccion VIH asintomatica, cual de las siguientes vacunas esta CONTRAINDICADA?",
        opciones: ["Gripe inactivada", "Neumococo conjugada", "BCG", "Hepatitis B", "DTPa"],
        correcta: 2,
      },
      {
        enunciado: "La vacuna antimeningococica ACWY conjugada se administra en el calendario vacunal a la edad de:",
        opciones: ["2 meses", "6 meses", "12 meses", "12 anos", "Solo en grupos de riesgo"],
        correcta: 3,
      },
    ],
    Neonatologia: [
      {
        enunciado: "Recien nacido de 34 semanas de gestacion presenta dificultad respiratoria progresiva desde el nacimiento con quejido, tiraje y cianosis. La radiografia muestra un patron reticulogranular difuso con broncograma aereo. El diagnostico mas probable es:",
        opciones: ["Taquipnea transitoria del recien nacido", "Enfermedad de membrana hialina", "Sindrome de aspiracion meconial", "Neumotorax", "Hernia diafragmatica congenita"],
        correcta: 1,
      },
      {
        enunciado: "Un recien nacido a termino presenta ictericia a las 8 horas de vida con bilirrubina total de 12 mg/dL. La actitud mas adecuada es:",
        opciones: ["Observacion domiciliaria", "Fototerapia y estudio de hemolisis", "Lactancia materna exclusiva sin mas", "Exanguinotransfusion urgente", "Administrar fenobarbital"],
        correcta: 1,
        dificultad: "alta",
      },
      {
        enunciado: "Cual de los siguientes hallazgos en un recien nacido sugiere asfixia perinatal grave?",
        opciones: ["Apgar de 8 al minuto", "pH de arteria umbilical 7.30", "Convulsiones en las primeras 24 horas", "Frecuencia cardiaca de 140 lpm", "Llanto vigoroso al nacer"],
        correcta: 2,
      },
      {
        enunciado: "La enterocolitis necrosante del recien nacido se asocia principalmente con:",
        opciones: ["Recien nacidos a termino alimentados con lactancia materna", "Prematuros alimentados con formula", "Neonatos postermino", "Hijos de madre diabetica", "Recien nacidos con ictericia fisiologica"],
        correcta: 1,
      },
      {
        enunciado: "En la reanimacion neonatal, la ventilacion con presion positiva se inicia cuando:",
        opciones: ["La frecuencia cardiaca es menor de 60 lpm tras 30 segundos de estimulacion", "El Apgar es menor de 7 al minuto", "El recien nacido tiene cianosis acra", "La frecuencia cardiaca es menor de 100 lpm o hay apnea tras los pasos iniciales", "El recien nacido no llora inmediatamente"],
        correcta: 3,
      },
      {
        enunciado: "Prematuro de 28 semanas con persistencia del conducto arterioso hemodinamicamente significativo. El tratamiento farmacologico de primera linea es:",
        opciones: ["Digoxina", "Ibuprofeno o indometacina", "Furosemida", "Prostaglandina E1", "Sildenafilo"],
        correcta: 1,
      },
    ],
    "Enfermedades exantematicas": [
      {
        enunciado: "Nino de 5 anos presenta fiebre alta, tos, coriza, conjuntivitis y un exantema maculopapuloso que comienza en cara y se extiende caudalmente. Se observan manchas de Koplik. El diagnostico es:",
        opciones: ["Rubeola", "Sarampion", "Escarlatina", "Eritema infeccioso", "Exantema subito"],
        correcta: 1,
      },
      {
        enunciado: "El exantema subito (roseola infantum) es causado por:",
        opciones: ["Parvovirus B19", "Virus herpes humano 6", "Virus del sarampion", "Streptococcus pyogenes", "Virus varicela-zoster"],
        correcta: 1,
      },
      {
        enunciado: "Nina de 7 anos con exantema en patron de 'bofetada' en mejillas y exantema reticulado en extremidades. El agente causal mas probable es:",
        opciones: ["VHH-6", "Parvovirus B19", "Virus del sarampion", "Streptococcus pyogenes", "Virus de Epstein-Barr"],
        correcta: 1,
      },
      {
        enunciado: "La complicacion mas frecuente del sarampion es:",
        opciones: ["Encefalitis", "Neumonia", "Otitis media", "Miocarditis", "Panencefalitis esclerosante subaguda"],
        correcta: 2,
      },
      {
        enunciado: "Un nino con varicela, cual de los siguientes farmacos esta CONTRAINDICADO para el tratamiento de la fiebre?",
        opciones: ["Paracetamol", "Ibuprofeno", "Acido acetilsalicilico", "Metamizol", "Dexketoprofeno"],
        correcta: 2,
      },
      {
        enunciado: "La escarlatina se caracteriza por todo lo siguiente EXCEPTO:",
        opciones: ["Lengua aframbuesada", "Exantema micropapuloso con tacto de papel de lija", "Lineas de Pastia en pliegues", "Descamacion furfuracea en tronco tras la fase aguda", "Exantema que respeta palmas y plantas siempre"],
        correcta: 4,
      },
    ],
    "Cardiopatias congenitas": [
      {
        enunciado: "Recien nacido cianotico con radiografia que muestra corazon en forma de huevo y pediculovascular estrecho. El diagnostico mas probable es:",
        opciones: ["Tetralogia de Fallot", "Transposicion de grandes arterias", "Coartacion de aorta", "Comunicacion interventricular", "Estenosis pulmonar"],
        correcta: 1,
      },
      {
        enunciado: "Cual es la cardiopatia congenita cianotica mas frecuente despues del periodo neonatal?",
        opciones: ["Transposicion de grandes arterias", "Tetralogia de Fallot", "Atresia tricuspidea", "Truncus arteriosus", "Anomalia de Ebstein"],
        correcta: 1,
      },
      {
        enunciado: "La comunicacion interauricular tipo ostium secundum se caracteriza por:",
        opciones: ["Soplo holosistolico en borde esternal izquierdo", "Desdoblamiento fijo del segundo ruido", "Cianosis desde el nacimiento", "Pulsos saltones en extremidades inferiores", "Soplo continuo en maquinaria"],
        correcta: 1,
      },
      {
        enunciado: "En un nino con crisis hipoxemicas por Tetralogia de Fallot, la maniobra mas util de forma inmediata es:",
        opciones: ["Posicion de Trendelenburg", "Maniobra de Valsalva", "Posicion genupectoral (squatting)", "Hiperventilacion", "Masaje del seno carotideo"],
        correcta: 2,
      },
      {
        enunciado: "Un recien nacido presenta cianosis que no mejora con oxigeno al 100%. El test de hiperoxia es negativo. Esto sugiere:",
        opciones: ["Patologia pulmonar parenquimatosa", "Cardiopatia congenita cianotica", "Sepsis neonatal", "Anemia neonatal", "Hipertension pulmonar transitoria"],
        correcta: 1,
      },
      {
        enunciado: "La cardiopatia congenita acianotica mas frecuente es:",
        opciones: ["Comunicacion interauricular", "Comunicacion interventricular", "Ductus arterioso persistente", "Coartacion de aorta", "Estenosis aortica"],
        correcta: 1,
      },
    ],
    Malnutricion: [
      {
        enunciado: "Un nino de 2 anos presenta edemas generalizados, hepatomegalia, lesiones cutaneas y cabello ralo y despigmentado. El diagnostico mas probable es:",
        opciones: ["Marasmo", "Kwashiorkor", "Deficit de zinc", "Sindrome nefrotico", "Hipotiroidismo"],
        correcta: 1,
      },
      {
        enunciado: "La principal diferencia entre marasmo y kwashiorkor es:",
        opciones: ["La edad de presentacion", "El marasmo cursa con edemas y el kwashiorkor no", "El kwashiorkor tiene edemas por hipoalbuminemia", "El marasmo tiene peor pronostico siempre", "Ambos tienen albumina normal"],
        correcta: 2,
      },
      {
        enunciado: "El sindrome de realimentacion se caracteriza principalmente por:",
        opciones: ["Hiperpotasemia", "Hiperfosfatemia", "Hipofosfatemia", "Hipernatremia", "Hipercalcemia"],
        correcta: 2,
      },
      {
        enunciado: "En la valoracion nutricional pediatrica, el indice mas sensible para detectar desnutricion aguda es:",
        opciones: ["Talla para la edad", "Peso para la talla", "Perimetro cefalico", "Indice de masa corporal", "Edad osea"],
        correcta: 1,
      },
      {
        enunciado: "La deficiencia de vitamina A se manifiesta clinicamente como:",
        opciones: ["Raquitismo", "Escorbuto", "Xeroftalmia y ceguera nocturna", "Pelagra", "Beriberi"],
        correcta: 2,
      },
      {
        enunciado: "El raquitismo por deficit de vitamina D se diagnostica en la analitica por:",
        opciones: ["Calcio alto, fosforo alto, FA alta", "Calcio bajo o normal, fosforo bajo, FA alta", "Calcio alto, fosforo bajo, FA normal", "Calcio normal, fosforo alto, FA baja", "Todos los valores normales"],
        correcta: 1,
      },
    ],
  },

  Cardiologia: {
    Arritmias: [
      {
        enunciado: "Paciente de 65 anos con fibrilacion auricular permanente y CHA2DS2-VASc de 4. El tratamiento anticoagulante mas recomendado actualmente es:",
        opciones: ["Acido acetilsalicilico", "Acenocumarol con INR 2-3", "Anticoagulante oral de accion directa (ACOD)", "Heparina de bajo peso molecular", "Doble antiagregacion"],
        correcta: 2,
      },
      {
        enunciado: "Paciente que presenta episodios de taquicardia paroxistica supraventricular. La maniobra vagal de primera eleccion para revertirla es:",
        opciones: ["Compresion ocular", "Maniobra de Valsalva modificada", "Inmersion facial en agua fria", "Masaje del seno carotideo bilateral", "Tos repetida"],
        correcta: 1,
      },
      {
        enunciado: "En el ECG se observa un intervalo QT prolongado. Cual de los siguientes farmacos puede ser responsable?",
        opciones: ["Amiodarona", "Atenolol", "Verapamilo", "Digoxina", "Adenosina"],
        correcta: 0,
      },
      {
        enunciado: "Paciente con bloqueo AV de tercer grado y bradicardia sintomatica. El tratamiento definitivo es:",
        opciones: ["Atropina intravenosa", "Isoproterenol", "Implante de marcapasos definitivo", "Amiodarona", "Cardioversion electrica"],
        correcta: 2,
      },
      {
        enunciado: "En la fibrilacion auricular de menos de 48 horas de evolucion, se puede realizar cardioversion electrica:",
        opciones: ["Solo tras 3 semanas de anticoagulacion", "Directamente sin anticoagulacion previa", "Solo con amiodarona previa", "Nunca, solo farmacologica", "Tras ecocardiograma transesofagico obligatorio"],
        correcta: 1,
      },
      {
        enunciado: "Cual es el ritmo de parada cardiaca desfibrilable?",
        opciones: ["Asistolia", "Actividad electrica sin pulso", "Fibrilacion ventricular", "Bloqueo AV completo", "Bradicardia sinusal"],
        correcta: 2,
      },
    ],
    "Cardiopatia isquemica": [
      {
        enunciado: "Paciente de 55 anos con dolor toracico opresivo de 2 horas de evolucion. El ECG muestra elevacion del ST en II, III y aVF. La arteria culpable mas probable es:",
        opciones: ["Descendente anterior", "Circunfleja", "Coronaria derecha", "Tronco comun izquierdo", "Diagonal"],
        correcta: 2,
      },
      {
        enunciado: "En un SCACEST (infarto con elevacion ST), el tiempo puerta-balon recomendado para angioplastia primaria es:",
        opciones: ["Menos de 30 minutos", "Menos de 60 minutos", "Menos de 90 minutos", "Menos de 120 minutos", "Menos de 180 minutos"],
        correcta: 2,
      },
      {
        enunciado: "Cual de los siguientes biomarcadores es el mas especifico para dano miocardico?",
        opciones: ["Mioglobina", "CK-MB", "Troponina T de alta sensibilidad", "LDH", "GOT (AST)"],
        correcta: 2,
      },
      {
        enunciado: "La complicacion mecanica mas frecuente del infarto agudo de miocardio es:",
        opciones: ["Rotura de pared libre", "Rotura del septo interventricular", "Insuficiencia mitral aguda por rotura de musculo papilar", "Aneurisma ventricular", "Taponamiento cardiaco"],
        correcta: 3,
      },
      {
        enunciado: "En el tratamiento cronico post-infarto, cual de los siguientes farmacos ha demostrado reducir la mortalidad?",
        opciones: ["Nifedipino", "Betabloqueante", "Digoxina", "Amiodarona", "Ranolazina"],
        correcta: 1,
      },
      {
        enunciado: "Paciente con angina estable que no responde a tratamiento medico optimo. La indicacion de revascularizacion se establece cuando:",
        opciones: ["Siempre que haya angina", "Hay enfermedad de tronco o 3 vasos con disfuncion ventricular", "Solo si hay infarto previo", "Unicamente si es menor de 50 anos", "Solo con test de esfuerzo positivo"],
        correcta: 1,
      },
    ],
    "Insuficiencia cardiaca": [
      {
        enunciado: "En la insuficiencia cardiaca con fraccion de eyeccion reducida (ICFEr), cual de los siguientes farmacos ha demostrado reducir mortalidad?",
        opciones: ["Amlodipino", "Sacubitril/valsartan", "Digoxina", "Ivabradina", "Hidralazina en monoterapia"],
        correcta: 1,
      },
      {
        enunciado: "Los 4 pilares del tratamiento farmacologico de la ICFEr incluyen todos EXCEPTO:",
        opciones: ["IECA/ARA-II o ARNI", "Betabloqueante", "Antagonista del receptor mineralocorticoide", "Inhibidor de SGLT2", "Digoxina"],
        correcta: 4,
      },
      {
        enunciado: "Cual es el peptido natriuretico mas util para el diagnostico de insuficiencia cardiaca aguda?",
        opciones: ["Troponina", "NT-proBNP", "PCR", "Dimero D", "Procalcitonina"],
        correcta: 1,
      },
      {
        enunciado: "Paciente con insuficiencia cardiaca descompensada con edema agudo de pulmon. El tratamiento inmediato incluye:",
        opciones: ["Betabloqueante IV", "Furosemida IV y oxigeno", "Digital IV", "AINE IV", "Calcioantagonista IV"],
        correcta: 1,
      },
      {
        enunciado: "La clasificacion funcional de la NYHA clase III corresponde a:",
        opciones: ["Sin limitacion de actividad fisica", "Ligera limitacion, disnea con esfuerzos grandes", "Marcada limitacion, disnea con esfuerzos minimos", "Sintomas en reposo", "Asintomatico con disfuncion ventricular"],
        correcta: 2,
      },
      {
        enunciado: "En la insuficiencia cardiaca con fraccion de eyeccion preservada (ICFEp), el tratamiento que ha mostrado beneficio en mortalidad cardiovascular es:",
        opciones: ["IECA", "Betabloqueantes", "Inhibidores de SGLT2", "Espironolactona", "Sacubitril/valsartan"],
        correcta: 2,
      },
    ],
    Valvulopatias: [
      {
        enunciado: "Paciente con disnea de esfuerzo progresiva, sincope y angina. La auscultacion revela un soplo sistolico eyectivo en foco aortico con irradiacion a carotidas. El diagnostico mas probable es:",
        opciones: ["Estenosis mitral", "Insuficiencia aortica", "Estenosis aortica", "Insuficiencia mitral", "Prolapso mitral"],
        correcta: 2,
      },
      {
        enunciado: "La causa mas frecuente de estenosis mitral es:",
        opciones: ["Degenerativa", "Fiebre reumatica", "Endocarditis infecciosa", "Congenita", "Lupus eritematoso"],
        correcta: 1,
      },
      {
        enunciado: "En la insuficiencia aortica cronica severa, la indicacion quirurgica se establece cuando:",
        opciones: ["Siempre que se diagnostica", "Hay sintomas o FEVI <50% o dilatacion ventricular severa", "Solo si hay sintomas", "Unicamente si hay fibrilacion auricular", "Solo en mayores de 70 anos"],
        correcta: 1,
      },
      {
        enunciado: "El signo auscultatorio tipico de la estenosis mitral es:",
        opciones: ["Soplo holosistolico en apex", "Soplo diastolico con chasquido de apertura", "Soplo continuo en maquinaria", "Click mesosistolico", "Soplo sistolico eyectivo romboidal"],
        correcta: 1,
      },
      {
        enunciado: "Cual es la indicacion de TAVI (implante valvular aortico transcateter)?",
        opciones: ["Estenosis aortica severa en pacientes jovenes", "Estenosis aortica severa en pacientes con alto riesgo quirurgico", "Insuficiencia aortica severa", "Estenosis mitral severa", "Cualquier valvulopatia en ancianos"],
        correcta: 1,
      },
      {
        enunciado: "La profilaxis de endocarditis infecciosa actualmente se recomienda en:",
        opciones: ["Todas las valvulopatias antes de procedimientos dentales", "Solo protesis valvulares y cardiopatias congenitas cianoticas", "Prolapso mitral con regurgitacion", "Estenosis mitral reumatica", "Todos los pacientes con soplo"],
        correcta: 1,
      },
    ],
    Hipertension: [
      {
        enunciado: "Segun las guias europeas de hipertension, se considera hipertension arterial grado 1 a partir de:",
        opciones: ["120/80 mmHg", "130/85 mmHg", "140/90 mmHg", "160/100 mmHg", "180/110 mmHg"],
        correcta: 2,
      },
      {
        enunciado: "En un paciente hipertenso con diabetes tipo 2 y microalbuminuria, el farmaco de primera eleccion es:",
        opciones: ["Calcioantagonista", "Betabloqueante", "IECA o ARA-II", "Diuretico tiazidico", "Alfabloqueante"],
        correcta: 2,
      },
      {
        enunciado: "La crisis hipertensiva con dano organico agudo (emergencia hipertensiva) se trata con:",
        opciones: ["Antihipertensivos orales y observacion ambulatoria", "Reduccion rapida a cifras normales en 1 hora", "Farmacos IV con reduccion gradual del 25% en la primera hora", "AINE y reposo", "Diureticos orales a dosis altas"],
        correcta: 2,
      },
      {
        enunciado: "Causa mas frecuente de hipertension arterial secundaria:",
        opciones: ["Feocromocitoma", "Hiperaldosteronismo primario", "Enfermedad renovascular", "Coartacion de aorta", "Sindrome de Cushing"],
        correcta: 2,
        dificultad: "alta",
      },
      {
        enunciado: "Los IECA estan contraindicados en:",
        opciones: ["Insuficiencia cardiaca", "Nefropatia diabetica", "Embarazo", "Hipertension esencial", "Post-infarto de miocardio"],
        correcta: 2,
      },
      {
        enunciado: "Paciente con hipertension resistente (no controlada con 3 farmacos a dosis plenas incluyendo un diuretico). El cuarto farmaco recomendado es:",
        opciones: ["Otro diuretico tiazidico", "Espironolactona", "Alfabloqueante", "Calcioantagonista adicional", "AINE"],
        correcta: 1,
      },
    ],
  },

  Neurologia: {
    Epilepsia: [
      {
        enunciado: "Paciente de 22 anos con episodios de desconexion del medio de segundos de duracion con parpadeo ritmico desde la infancia. El EEG muestra punta-onda a 3 Hz generalizada. El tipo de epilepsia mas probable es:",
        opciones: ["Epilepsia focal temporal", "Epilepsia de ausencias", "Sindrome de West", "Sindrome de Lennox-Gastaut", "Epilepsia mioclonica juvenil"],
        correcta: 1,
      },
      {
        enunciado: "En una crisis epileptica tonico-clonica generalizada que dura mas de 5 minutos (estatus epileptico), el tratamiento de primera linea es:",
        opciones: ["Fenitoina IV", "Diazepam IV o midazolam IM", "Valproico IV", "Levetiracetam IV", "Fenobarbital IV"],
        correcta: 1,
      },
      {
        enunciado: "Cual es el farmaco antiepileptico de primera eleccion en la epilepsia de ausencias infantil?",
        opciones: ["Carbamazepina", "Fenitoina", "Etosuximida o valproico", "Fenobarbital", "Lacosamida"],
        correcta: 2,
      },
      {
        enunciado: "La carbamazepina esta especialmente indicada en:",
        opciones: ["Crisis de ausencias", "Crisis focales", "Sindrome de West", "Espasmos infantiles", "Mioclonias"],
        correcta: 1,
      },
      {
        enunciado: "El Sindrome de West se caracteriza por la triada de:",
        opciones: ["Ausencias, mioclonias, crisis tonico-clonicas", "Espasmos infantiles, hipsarritmia en EEG, regresion psicomotora", "Crisis febriles, retraso del lenguaje, autismo", "Convulsiones neonatales, apneas, hipertonia", "Crisis parciales, hemiplejia, calcificaciones"],
        correcta: 1,
      },
      {
        enunciado: "Ante una primera crisis epileptica no provocada en un adulto, se recomienda iniciar tratamiento antiepileptico cuando:",
        opciones: ["Siempre tras la primera crisis", "Solo tras la segunda crisis no provocada o si hay factores de riesgo de recurrencia alta", "Solo si el EEG es anormal", "Unicamente si la RM es patologica", "Nunca hasta la tercera crisis"],
        correcta: 1,
      },
    ],
    ACV: [
      {
        enunciado: "Paciente de 68 anos con hemiplejia derecha de instauracion brusca e incapacidad para hablar (afasia global). La arteria mas probablemente afectada es:",
        opciones: ["Arteria cerebral posterior izquierda", "Arteria cerebral media izquierda", "Arteria cerebral anterior derecha", "Arteria basilar", "Arteria vertebral"],
        correcta: 1,
      },
      {
        enunciado: "En el ictus isquemico agudo, la ventana terapeutica para la trombolisis intravenosa con alteplasa es de:",
        opciones: ["1 hora", "3 horas", "4.5 horas", "6 horas", "12 horas"],
        correcta: 2,
      },
      {
        enunciado: "La causa mas frecuente de hemorragia intraparenquimatosa cerebral es:",
        opciones: ["Malformacion arteriovenosa", "Aneurisma cerebral", "Hipertension arterial", "Angiopatia amiloide", "Anticoagulacion"],
        correcta: 2,
      },
      {
        enunciado: "Paciente con hemianopsia homonima derecha, alexia sin agrafia. La lesion se localiza en:",
        opciones: ["Lobulo frontal izquierdo", "Lobulo parietal derecho", "Lobulo occipital izquierdo con afectacion del esplenio del cuerpo calloso", "Cerebelo izquierdo", "Talamo derecho"],
        correcta: 2,
        dificultad: "alta",
      },
      {
        enunciado: "La trombectomia mecanica en el ictus isquemico agudo esta indicada en:",
        opciones: ["Todos los ictus isquemicos", "Oclusion de gran vaso en territorio anterior dentro de las primeras 6-24 horas segun criterios de imagen", "Solo si la trombolisis ha fracasado", "Unicamente en menores de 60 anos", "Solo en infartos lacunares"],
        correcta: 1,
      },
      {
        enunciado: "El signo clinico mas sugestivo de hemorragia subaracnoidea por rotura aneurismatica es:",
        opciones: ["Hemiparesia progresiva", "Cefalea brusca de maxima intensidad (en trueno)", "Diplopia aislada", "Amnesia global transitoria", "Vertigo posicional"],
        correcta: 1,
      },
    ],
    "Esclerosis multiple": [
      {
        enunciado: "Mujer de 28 anos presenta neuritis optica unilateral con dolor al movimiento ocular. La prueba diagnostica mas sensible para confirmar esclerosis multiple es:",
        opciones: ["TAC craneal", "Potenciales evocados visuales", "RM cerebral con gadolinio", "Puncion lumbar aislada", "Electroencefalograma"],
        correcta: 2,
      },
      {
        enunciado: "Los criterios diagnosticos actuales de esclerosis multiple (McDonald 2017) requieren demostrar:",
        opciones: ["Solo diseminacion en espacio", "Solo diseminacion en tiempo", "Diseminacion en espacio y tiempo", "Unicamente bandas oligoclonales positivas", "Solo hallazgos clinicos sin pruebas complementarias"],
        correcta: 2,
      },
      {
        enunciado: "El tratamiento del brote agudo de esclerosis multiple se realiza con:",
        opciones: ["Interferon beta", "Metilprednisolona IV en pulsos", "Natalizumab", "Fingolimod", "Acetato de glatiramer"],
        correcta: 1,
      },
      {
        enunciado: "Cual de los siguientes hallazgos en LCR es mas tipico de la esclerosis multiple?",
        opciones: ["Glucosa baja", "Proteinas muy elevadas", "Bandas oligoclonales positivas", "Pleocitosis >500 celulas", "Cultivo positivo"],
        correcta: 2,
      },
      {
        enunciado: "El fenomeno de Uhthoff consiste en:",
        opciones: ["Mejoria de sintomas con el calor", "Empeoramiento transitorio de sintomas con el aumento de temperatura", "Signo de Lhermitte positivo", "Espasticidad nocturna", "Incontinencia urinaria de esfuerzo"],
        correcta: 1,
      },
      {
        enunciado: "En la forma progresiva primaria de esclerosis multiple, el farmaco aprobado es:",
        opciones: ["Interferon beta", "Natalizumab", "Ocrelizumab", "Fingolimod", "Dimetilfumarato"],
        correcta: 2,
      },
    ],
    Cefaleas: [
      {
        enunciado: "Paciente con cefalea unilateral pulsatil de 12 horas de duracion, con nauseas, fotofobia y fonofobia. El diagnostico mas probable es:",
        opciones: ["Cefalea tensional", "Migrana sin aura", "Cefalea en racimos", "Neuralgia del trigemino", "Arteritis de la temporal"],
        correcta: 1,
      },
      {
        enunciado: "El tratamiento profilactico de primera linea para la migrana episodica es:",
        opciones: ["Triptanes", "Betabloqueantes (propranolol)", "Ergotamina", "Oxigeno al 100%", "Indometacina"],
        correcta: 1,
      },
      {
        enunciado: "La cefalea en racimos (cluster) se caracteriza por todo lo siguiente EXCEPTO:",
        opciones: ["Dolor periorbital unilateral intenso", "Duracion de 15-180 minutos", "Sintomas autonomicos ipsilaterales (lagrimeo, rinorrea)", "Empeora con el movimiento y mejora en reposo", "Predominio en varones"],
        correcta: 3,
      },
      {
        enunciado: "Paciente de 75 anos con cefalea temporal, claudicacion mandibular y VSG elevada. La sospecha diagnostica obliga a:",
        opciones: ["Realizar RM craneal urgente", "Iniciar corticoides de inmediato sin esperar biopsia", "Solicitar puncion lumbar", "Pautar triptanes", "Observacion durante una semana"],
        correcta: 1,
      },
      {
        enunciado: "Cual de las siguientes cefaleas responde especificamente a la indometacina?",
        opciones: ["Migrana", "Cefalea en racimos", "Hemicranea paroxistica", "Cefalea tensional", "Cefalea por abuso de analgesicos"],
        correcta: 2,
      },
      {
        enunciado: "Los signos de alarma (red flags) en una cefalea que obligan a estudio urgente con neuroimagen incluyen todos EXCEPTO:",
        opciones: ["Cefalea de inicio subito (en trueno)", "Cefalea que empeora con Valsalva", "Cefalea bilateral opresiva que mejora con analgesicos", "Cefalea con edema de papila", "Cefalea de novo en mayor de 50 anos"],
        correcta: 2,
      },
    ],
    Parkinson: [
      {
        enunciado: "La triada clasica de la enfermedad de Parkinson incluye:",
        opciones: ["Temblor, rigidez, bradicinesia", "Temblor, ataxia, nistagmo", "Rigidez, corea, distonia", "Bradicinesia, fasciculaciones, amiotrofia", "Temblor, demencia, incontinencia"],
        correcta: 0,
      },
      {
        enunciado: "El temblor tipico de la enfermedad de Parkinson es:",
        opciones: ["Temblor intencional", "Temblor de reposo que mejora con el movimiento voluntario", "Temblor postural bilateral", "Temblor esencial hereditario", "Temblor cerebeloso"],
        correcta: 1,
      },
      {
        enunciado: "El tratamiento farmacologico mas eficaz de la enfermedad de Parkinson es:",
        opciones: ["Anticolinergicos", "Amantadina", "Levodopa/carbidopa", "Selegilina", "Pramipexol"],
        correcta: 2,
      },
      {
        enunciado: "Las fluctuaciones motoras tipo wearing-off en pacientes con Parkinson avanzado se deben a:",
        opciones: ["Progresion de la enfermedad unicamente", "Perdida del efecto de levodopa al final de cada dosis", "Efecto secundario de los anticolinergicos", "Desarrollo de anticuerpos anti-dopamina", "Insuficiencia hepatica por levodopa"],
        correcta: 1,
      },
      {
        enunciado: "La diferencia clave entre enfermedad de Parkinson y parkinsonismo farmacologico es que en este ultimo:",
        opciones: ["El temblor es unilateral", "Hay respuesta a levodopa", "Los sintomas son simetricos y hay antecedente de farmacos antidopaminergicos", "Siempre hay demencia asociada", "Predomina la ataxia"],
        correcta: 2,
      },
      {
        enunciado: "La demencia con cuerpos de Lewy se diferencia del Parkinson con demencia en que:",
        opciones: ["Solo la demencia con cuerpos de Lewy tiene parkinsonismo", "En la demencia con cuerpos de Lewy, la demencia aparece antes o al inicio del parkinsonismo", "El Parkinson nunca cursa con demencia", "La demencia con cuerpos de Lewy no tiene alucinaciones", "Son la misma entidad sin diferencias"],
        correcta: 1,
      },
    ],
  },

  Digestivo: {
    Hepatitis: [
      {
        enunciado: "La hepatitis B cronica se define por la persistencia de HBsAg positivo durante mas de:",
        opciones: ["1 mes", "3 meses", "6 meses", "12 meses", "24 meses"],
        correcta: 2,
      },
      {
        enunciado: "El marcador que indica inmunidad por vacunacion frente a hepatitis B es:",
        opciones: ["Anti-HBc IgM positivo", "Anti-HBs positivo con anti-HBc negativo", "HBsAg positivo", "HBeAg positivo", "Anti-HBc IgG positivo aislado"],
        correcta: 1,
      },
      {
        enunciado: "La hepatitis C cronica se trata actualmente con:",
        opciones: ["Interferon pegilado + ribavirina", "Antivirales de accion directa (AAD)", "Lamivudina", "Transplante hepatico como primera opcion", "No tiene tratamiento eficaz"],
        correcta: 1,
      },
      {
        enunciado: "La via de transmision mas frecuente de la hepatitis A es:",
        opciones: ["Parenteral", "Sexual", "Fecal-oral", "Vertical", "Respiratoria"],
        correcta: 2,
      },
      {
        enunciado: "La hepatitis E es especialmente grave en:",
        opciones: ["Ninos", "Adolescentes", "Embarazadas", "Ancianos vacunados", "Inmunodeprimidos por VIH unicamente"],
        correcta: 2,
      },
      {
        enunciado: "La hepatitis autoinmune tipo 1 se caracteriza por la presencia de:",
        opciones: ["Anti-LKM1", "Anticuerpos anti-musculo liso (ASMA) y ANA", "Anticuerpos anti-mitocondriales", "Anti-SLA exclusivamente", "P-ANCA"],
        correcta: 1,
      },
    ],
    Cirrosis: [
      {
        enunciado: "La causa mas frecuente de cirrosis hepatica en paises occidentales es:",
        opciones: ["Hepatitis B", "Hepatitis C", "Alcohol", "Esteatohepatitis no alcoholica", "Hepatitis autoinmune"],
        correcta: 2,
      },
      {
        enunciado: "La clasificacion de Child-Pugh evalua la gravedad de la cirrosis basandose en:",
        opciones: ["Solo la bilirrubina y la albumina", "Bilirrubina, albumina, INR, ascitis y encefalopatia", "MELD score", "Gradiente de presion venosa hepatica", "Fibroscan y elastografia"],
        correcta: 1,
      },
      {
        enunciado: "El tratamiento de primera linea para la prevencion de la hemorragia por varices esofagicas es:",
        opciones: ["Escleroterapia", "TIPS", "Betabloqueantes no selectivos o ligadura con bandas", "Octreotido", "Sonda de Sengstaken-Blakemore"],
        correcta: 2,
      },
      {
        enunciado: "La peritonitis bacteriana espontanea se diagnostica cuando el recuento de PMN en liquido ascitico es:",
        opciones: [">100 celulas/mm3", ">250 celulas/mm3", ">500 celulas/mm3", ">1000 celulas/mm3", ">50 celulas/mm3"],
        correcta: 1,
      },
      {
        enunciado: "El sindrome hepatorrenal tipo 1 se caracteriza por:",
        opciones: ["Deterioro lento de la funcion renal en meses", "Deterioro rapido de la funcion renal en menos de 2 semanas", "Hematuria macroscopica", "Proteinuria masiva", "Respuesta favorable a diureticos"],
        correcta: 1,
      },
      {
        enunciado: "El tratamiento de la encefalopatia hepatica incluye:",
        opciones: ["Dieta hiperproteica", "Lactulosa y/o rifaximina", "Corticoides", "Aminoglucosidos IV", "Restriccion hidrica severa"],
        correcta: 1,
      },
    ],
    EII: [
      {
        enunciado: "La enfermedad de Crohn se diferencia de la colitis ulcerosa en que:",
        opciones: ["Solo afecta al recto", "Puede afectar cualquier tramo del tubo digestivo de forma transmural y segmentaria", "Nunca presenta fistulas", "Siempre cursa con rectorragia masiva", "Presenta pseudopolipos exclusivamente"],
        correcta: 1,
      },
      {
        enunciado: "En la colitis ulcerosa, la afectacion tipica es:",
        opciones: ["Transmural y segmentaria", "Mucosa y submucosa, continua desde el recto", "Solo ileal", "Granulomatosa", "Perianal exclusivamente"],
        correcta: 1,
      },
      {
        enunciado: "El tratamiento de mantenimiento de primera linea en colitis ulcerosa leve-moderada es:",
        opciones: ["Corticoides orales", "Mesalazina (5-ASA)", "Azatioprina", "Infliximab", "Ciclosporina"],
        correcta: 1,
      },
      {
        enunciado: "La manifestacion extraintestinal de EII que evoluciona paralelamente a la actividad intestinal es:",
        opciones: ["Colangitis esclerosante primaria", "Espondilitis anquilosante", "Eritema nodoso", "Pioderma gangrenoso", "Uveitis posterior"],
        correcta: 2,
      },
      {
        enunciado: "El megacolon toxico es una complicacion grave que se presenta con mayor frecuencia en:",
        opciones: ["Enfermedad de Crohn ileal", "Colitis ulcerosa", "Sindrome de intestino irritable", "Enfermedad celiaca", "Colitis microscopica"],
        correcta: 1,
      },
      {
        enunciado: "Ante un brote grave de colitis ulcerosa que no responde a corticoides IV en 3-5 dias, el siguiente paso es:",
        opciones: ["Doblar dosis de corticoides", "Infliximab IV o ciclosporina IV como rescate", "Mesalazina rectal", "Antibioticos de amplio espectro", "Dieta absoluta sin mas tratamiento"],
        correcta: 1,
      },
    ],
    "Ulcera peptica": [
      {
        enunciado: "El factor etiologico mas frecuente de la ulcera duodenal es:",
        opciones: ["AINE", "Estres", "Helicobacter pylori", "Sindrome de Zollinger-Ellison", "Tabaco"],
        correcta: 2,
      },
      {
        enunciado: "El esquema erradicador de primera linea de H. pylori incluye:",
        opciones: ["IBP solo durante 4 semanas", "IBP + claritromicina + amoxicilina durante 14 dias", "Bismuto en monoterapia", "Metronidazol solo", "Antihistaminicos H2"],
        correcta: 1,
      },
      {
        enunciado: "La complicacion mas frecuente de la ulcera peptica es:",
        opciones: ["Perforacion", "Hemorragia digestiva alta", "Estenosis pilorica", "Penetracion a pancreas", "Malignizacion"],
        correcta: 1,
      },
      {
        enunciado: "En una hemorragia digestiva alta por ulcera peptica con vaso visible no sangrante (Forrest IIa), la actitud es:",
        opciones: ["Solo tratamiento medico con IBP", "Tratamiento endoscopico + IBP IV en perfusion", "Cirugia urgente", "Embolizacion angiografica", "Observacion sin tratamiento"],
        correcta: 1,
      },
      {
        enunciado: "El test diagnostico no invasivo de eleccion para confirmar la erradicacion de H. pylori es:",
        opciones: ["Serologia", "Test de aliento con urea marcada con C13", "Hemograma", "Coprocultivo convencional", "Endoscopia con biopsia siempre"],
        correcta: 1,
      },
      {
        enunciado: "El Sindrome de Zollinger-Ellison se debe a:",
        opciones: ["Ulcera gastrica simple", "Gastrinoma secretor de gastrina", "Infeccion cronica por H. pylori", "Uso cronico de AINE", "Anemia perniciosa"],
        correcta: 1,
      },
    ],
    Pancreatitis: [
      {
        enunciado: "Las dos causas mas frecuentes de pancreatitis aguda son:",
        opciones: ["Alcohol y farmacos", "Litiasis biliar y alcohol", "Hipertrigliceridemia y trauma", "Autoinmune y viral", "CPRE y farmacos"],
        correcta: 1,
      },
      {
        enunciado: "El criterio analitico mas util para el diagnostico de pancreatitis aguda es:",
        opciones: ["Amilasa serica >3 veces el limite superior normal", "Lipasa serica >3 veces el limite superior normal", "PCR elevada", "Leucocitosis", "Bilirrubina elevada"],
        correcta: 1,
      },
      {
        enunciado: "En la pancreatitis aguda grave, la necrosis pancreatica infectada se trata con:",
        opciones: ["Antibioticos profilacticos siempre desde el inicio", "Antibioticos + drenaje/necrosectomia (preferiblemente step-up approach)", "Solo cirugia abierta inmediata", "Corticoides IV", "CPRE urgente"],
        correcta: 1,
      },
      {
        enunciado: "El pseudoquiste pancreatico se define como:",
        opciones: ["Coleccion con pared epitelizada que aparece precozmente", "Coleccion encapsulada sin pared epitelial que aparece >4 semanas", "Absceso pancreatico", "Necrosis pancreatica esteril", "Quiste congenito del pancreas"],
        correcta: 1,
      },
      {
        enunciado: "La pancreatitis cronica se asocia principalmente con:",
        opciones: ["Litiasis biliar", "Consumo cronico de alcohol", "Hipertrigliceridemia", "Farmacos", "Infecciones virales"],
        correcta: 1,
      },
      {
        enunciado: "La insuficiencia pancreatica exocrina se manifiesta clinicamente como:",
        opciones: ["Diabetes mellitus aislada", "Esteatorrea y malabsorcion", "Ictericia obstructiva", "Dolor epigastrico exclusivamente", "Hemorragia digestiva"],
        correcta: 1,
      },
    ],
  },

  Nefrologia: {
    "Sindrome nefrotico": [
      {
        enunciado: "El sindrome nefrotico se define por proteinuria superior a:",
        opciones: ["500 mg/dia", "1 g/dia", "2 g/dia", "3.5 g/dia", "5 g/dia"],
        correcta: 3,
      },
      {
        enunciado: "La causa mas frecuente de sindrome nefrotico en ninos es:",
        opciones: ["Glomerulonefritis membranosa", "Enfermedad de cambios minimos", "Glomeruloesclerosis focal y segmentaria", "Nefropatia IgA", "Nefropatia lupica"],
        correcta: 1,
      },
      {
        enunciado: "La causa mas frecuente de sindrome nefrotico en adultos es:",
        opciones: ["Enfermedad de cambios minimos", "Glomerulonefritis membranosa", "Nefropatia diabetica", "Amiloidosis", "Nefropatia IgA"],
        correcta: 1,
      },
      {
        enunciado: "La enfermedad de cambios minimos se caracteriza por:",
        opciones: ["Depositos de IgA mesangiales", "Microscopia optica normal, fusion podocitaria en microscopia electronica", "Semilunas en biopsia renal", "Engrosamiento de membrana basal con spikes", "Depositos subendoteliales de inmunocomplejos"],
        correcta: 1,
      },
      {
        enunciado: "La complicacion mas temida del sindrome nefrotico es:",
        opciones: ["Hipertension arterial", "Trombosis venosa (especialmente de venas renales)", "Hematuria macroscopica", "Insuficiencia renal aguda", "Acidosis metabolica"],
        correcta: 1,
      },
      {
        enunciado: "El tratamiento de primera linea del sindrome nefrotico por cambios minimos en ninos es:",
        opciones: ["Ciclofosfamida", "Corticoides (prednisona)", "Ciclosporina", "Rituximab", "Micofenolato"],
        correcta: 1,
      },
    ],
    "Sindrome nefritico": [
      {
        enunciado: "El sindrome nefritico se caracteriza por la triada de:",
        opciones: ["Proteinuria masiva, hipoalbuminemia, edemas", "Hematuria, hipertension, oliguria con deterioro de funcion renal", "Poliuria, polidipsia, perdida de peso", "Dolor lumbar, fiebre, piuria", "Proteinuria, glucosuria, aminoaciduria"],
        correcta: 1,
      },
      {
        enunciado: "La causa mas frecuente de sindrome nefritico en ninos es:",
        opciones: ["Nefropatia IgA", "Glomerulonefritis postinfecciosa (postestreptococica)", "Nefropatia lupica", "Sindrome de Goodpasture", "Vasculitis ANCA"],
        correcta: 1,
      },
      {
        enunciado: "En la glomerulonefritis postestreptococica, el complemento C3 esta:",
        opciones: ["Elevado", "Normal", "Disminuido", "Ausente", "Variable sin patron"],
        correcta: 2,
      },
      {
        enunciado: "La nefropatia IgA (enfermedad de Berger) se presenta tipicamente como:",
        opciones: ["Sindrome nefrotico puro", "Hematuria macroscopica coincidente con infecciones respiratorias", "Insuficiencia renal rapida con semilunas", "Proteinuria asintomatica aislada", "Litiasis renal recurrente"],
        correcta: 1,
      },
      {
        enunciado: "El sindrome de Goodpasture se caracteriza por:",
        opciones: ["Anticuerpos anti-membrana basal glomerular con hemorragia pulmonar y GN rapidamente progresiva", "Anticuerpos ANCA con granulomas", "Depositos de IgA mesangiales", "Complemento bajo y crioglobulinemia", "Anticuerpos anti-PLA2R"],
        correcta: 0,
      },
      {
        enunciado: "La glomerulonefritis rapidamente progresiva se caracteriza en la biopsia por:",
        opciones: ["Fusion podocitaria aislada", "Formacion de semilunas en mas del 50% de glomerulos", "Engrosamiento de la membrana basal", "Esclerosis focal y segmentaria", "Depositos lineales de IgA"],
        correcta: 1,
      },
    ],
    IRA: [
      {
        enunciado: "La causa mas frecuente de insuficiencia renal aguda intrahospitalaria es:",
        opciones: ["Glomerulonefritis", "Necrosis tubular aguda", "Nefritis intersticial", "Uropatia obstructiva", "Trombosis de vena renal"],
        correcta: 1,
      },
      {
        enunciado: "En la IRA prerrenal, tipicamente encontramos:",
        opciones: ["Sodio urinario >40 mEq/L y FeNa >2%", "Sodio urinario <20 mEq/L y FeNa <1%", "Cilindros granulosos marrones en orina", "Eosinofiluria", "Hematuria dismorfica"],
        correcta: 1,
      },
      {
        enunciado: "La indicacion urgente de dialisis en la IRA incluye:",
        opciones: ["Creatinina >3 mg/dL sin mas", "Hiperpotasemia refractaria con cambios ECG", "Proteinuria >1 g/dia", "Hematuria macroscopica", "Anemia leve"],
        correcta: 1,
      },
      {
        enunciado: "El hallazgo en el sedimento urinario mas tipico de necrosis tubular aguda es:",
        opciones: ["Hematies dismorficos", "Cilindros granulosos marrones (muddy brown casts)", "Cilindros cereos", "Cristales de oxalato", "Cilindros hematicios"],
        correcta: 1,
      },
      {
        enunciado: "La nefritis intersticial aguda por farmacos se sospecha ante la triada de:",
        opciones: ["Fiebre, rash, eosinofiluria", "Oliguria, edemas, hipertension", "Poliuria, hipopotasemia, acidosis", "Hematuria, proteinuria masiva, hipoalbuminemia", "Dolor costovertebral, fiebre, piuria"],
        correcta: 0,
      },
      {
        enunciado: "La causa mas frecuente de IRA obstructiva (postrenal) es:",
        opciones: ["Litiasis ureteral bilateral", "Hiperplasia benigna de prostata", "Tumor vesical", "Fibrosis retroperitoneal", "Estenosis ureteral congenita"],
        correcta: 1,
      },
    ],
    IRC: [
      {
        enunciado: "La causa mas frecuente de enfermedad renal cronica en paises desarrollados es:",
        opciones: ["Glomerulonefritis", "Nefropatia diabetica", "Poliquistosis renal", "Nefropatia hipertensiva", "Nefritis lupica"],
        correcta: 1,
      },
      {
        enunciado: "El estadio 3a de la enfermedad renal cronica segun KDIGO corresponde a un filtrado glomerular de:",
        opciones: [">90 mL/min", "60-89 mL/min", "45-59 mL/min", "30-44 mL/min", "15-29 mL/min"],
        correcta: 2,
      },
      {
        enunciado: "La anemia de la enfermedad renal cronica se debe principalmente a:",
        opciones: ["Deficit de hierro aislado", "Deficit de acido folico", "Deficit de eritropoyetina", "Hemolisis autoinmune", "Sangrado digestivo cronico"],
        correcta: 2,
      },
      {
        enunciado: "El tratamiento de la anemia renal incluye:",
        opciones: ["Transfusiones sanguineas periodicas como primera linea", "Agentes estimulantes de la eritropoyesis (AEE) + hierro", "Solo hierro oral", "Vitamina B12 IM", "Acido folico exclusivamente"],
        correcta: 1,
      },
      {
        enunciado: "El hiperparatiroidismo secundario de la ERC se debe a:",
        opciones: ["Adenoma paratiroideo", "Hipercalcemia cronica", "Deficit de vitamina D activa (calcitriol) e hiperfosfatemia", "Exceso de calcio en la dieta", "Hiperfuncion tiroidea"],
        correcta: 2,
      },
      {
        enunciado: "La indicacion de inicio de dialisis en la ERC se establece generalmente con un FG:",
        opciones: ["<30 mL/min siempre", "<15 mL/min o antes si hay sintomas uremicos refractarios", "<45 mL/min", "<60 mL/min", "<90 mL/min con proteinuria"],
        correcta: 1,
      },
    ],
    Electrolitos: [
      {
        enunciado: "Ante una hipopotasemia severa (<2.5 mEq/L), el tratamiento de eleccion es:",
        opciones: ["Potasio oral a dosis altas", "Potasio IV diluido con monitorizacion cardiaca", "Espironolactona oral", "Bicarbonato sodico", "Glucosa con insulina"],
        correcta: 1,
      },
      {
        enunciado: "El cambio electrocardiografico mas precoz de la hiperpotasemia es:",
        opciones: ["Ondas T picudas", "Ensanchamiento del QRS", "Desaparicion de la onda P", "Fibrilacion ventricular", "Bloqueo AV completo"],
        correcta: 0,
      },
      {
        enunciado: "La causa mas frecuente de hiponatremia en pacientes hospitalizados es:",
        opciones: ["Diabetes insipida", "Uso de diureticos tiazidicos", "SIADH", "Insuficiencia suprarrenal", "Polidipsia primaria"],
        correcta: 2,
      },
      {
        enunciado: "La correccion excesivamente rapida de la hiponatremia cronica puede causar:",
        opciones: ["Edema cerebral", "Mielinolisis pontina central (sindrome de desmielinizacion osmotica)", "Hiperpotasemia", "Acidosis metabolica", "Rabdomiolisis"],
        correcta: 1,
      },
      {
        enunciado: "El signo de Chvostek y Trousseau son tipicos de:",
        opciones: ["Hiperpotasemia", "Hipocalcemia", "Hipernatremia", "Hipercalcemia", "Hipofosfatemia"],
        correcta: 1,
      },
      {
        enunciado: "La causa mas frecuente de hipercalcemia es:",
        opciones: ["Sarcoidosis", "Hiperparatiroidismo primario (ambulatorio) y neoplasias (hospitalizado)", "Intoxicacion por vitamina D", "Tiazidas", "Inmovilizacion"],
        correcta: 1,
      },
    ],
  },

  Neumologia: {
    EPOC: [
      {
        enunciado: "El diagnostico de EPOC se confirma mediante:",
        opciones: ["Radiografia de torax", "Espirometria con cociente FEV1/FVC post-broncodilatador <0.70", "Gasometria arterial", "TAC de torax", "Pletismografia"],
        correcta: 1,
      },
      {
        enunciado: "El tratamiento broncodilatador de primera linea en EPOC estable grupo B (sintomatico, pocas exacerbaciones) es:",
        opciones: ["Corticoide inhalado solo", "LAMA (antimuscarinicos de larga duracion) o LABA", "Teofilina", "Corticoides orales cronicos", "Antibioticos profilacticos"],
        correcta: 1,
      },
      {
        enunciado: "La oxigenoterapia domiciliaria cronica (OCD) en EPOC esta indicada cuando la PaO2 es:",
        opciones: ["<70 mmHg", "<65 mmHg", "<60 mmHg o <55 mmHg con cor pulmonale/poliglobulia", "<80 mmHg", "En todos los pacientes con EPOC"],
        correcta: 2,
      },
      {
        enunciado: "La causa mas frecuente de exacerbacion de EPOC es:",
        opciones: ["Embolia pulmonar", "Infeccion respiratoria (viral o bacteriana)", "Neumotorax", "Insuficiencia cardiaca", "Incumplimiento terapeutico"],
        correcta: 1,
      },
      {
        enunciado: "El enfisema pulmonar se caracteriza anatomopatologicamente por:",
        opciones: ["Hipertrofia de glandulas submucosas", "Destruccion de paredes alveolares con atrapamiento aereo", "Fibrosis pulmonar difusa", "Edema alveolar", "Bronquiolitis obliterante"],
        correcta: 1,
      },
      {
        enunciado: "El deficit de alfa-1-antitripsina debe sospecharse en EPOC cuando:",
        opciones: ["El paciente tiene mas de 70 anos", "Hay enfisema de predominio en bases en paciente joven no fumador", "El FEV1 es mayor del 80%", "Solo hay bronquitis cronica", "Hay hipertension pulmonar aislada"],
        correcta: 1,
      },
    ],
    Asma: [
      {
        enunciado: "El patron espirometrico tipico del asma es:",
        opciones: ["Obstructivo no reversible", "Restrictivo puro", "Obstructivo con prueba broncodilatadora positiva (>12% y >200 mL)", "Normal siempre", "Mixto con DLCO baja"],
        correcta: 2,
      },
      {
        enunciado: "El tratamiento de control de primera linea en asma persistente leve en adultos es:",
        opciones: ["SABA a demanda solo", "Corticoide inhalado a dosis baja", "Antileucotrienos solos", "Corticoides orales a dosis bajas", "Teofilina retardada"],
        correcta: 1,
      },
      {
        enunciado: "En una crisis asmatica grave (estatus asmatico), el tratamiento inicial incluye:",
        opciones: ["Solo broncodilatadores orales", "SABA nebulizado + corticoides sistemicos + oxigeno", "Antibioticos IV", "Sedacion y ventilacion mecanica inmediata", "Antihistaminicos IV"],
        correcta: 1,
      },
      {
        enunciado: "El asma alérgica se asocia con niveles elevados de:",
        opciones: ["IgM", "IgG", "IgE", "IgA", "Complemento C3"],
        correcta: 2,
      },
      {
        enunciado: "Cual de los siguientes es un criterio de asma grave no controlada?",
        opciones: ["Uso de SABA 1 vez por semana", "Espirometria normal", "Necesidad de corticoides inhalados a dosis altas + LABA + un tercer controlador sin lograr control", "Sintomas nocturnos 1 vez al mes", "FEV1 >80%"],
        correcta: 2,
      },
      {
        enunciado: "El omalizumab (anti-IgE) esta indicado en:",
        opciones: ["Todo paciente asmatico", "Asma alergica grave no controlada con IgE elevada", "EPOC con eosinofilia", "Asma leve intermitente", "Bronquiectasias"],
        correcta: 1,
      },
    ],
    TEP: [
      {
        enunciado: "Ante sospecha de tromboembolismo pulmonar, la prueba diagnostica de eleccion es:",
        opciones: ["Radiografia de torax", "Gasometria arterial", "Angio-TAC pulmonar", "Gammagrafia pulmonar", "Dimero D aislado"],
        correcta: 2,
      },
      {
        enunciado: "El dimero D es util para:",
        opciones: ["Confirmar el diagnostico de TEP", "Excluir TEP en pacientes con probabilidad clinica baja-intermedia si es negativo", "Determinar la gravedad del TEP", "Guiar la duracion de la anticoagulacion", "Diagnosticar la fuente emboligena"],
        correcta: 1,
      },
      {
        enunciado: "El tratamiento de eleccion del TEP hemodinamicamente estable es:",
        opciones: ["Trombolisis sistemica", "Anticoagulacion con HBPM/ACOD", "Filtro de vena cava inferior", "Embolectomia quirurgica", "Solo medias de compresion"],
        correcta: 1,
      },
      {
        enunciado: "La trombolisis en el TEP esta indicada cuando hay:",
        opciones: ["Cualquier TEP confirmado", "TEP masivo con inestabilidad hemodinamica", "TEP subsegmentario", "Dimero D muy elevado", "Taquicardia sinusal aislada"],
        correcta: 1,
      },
      {
        enunciado: "La escala de Wells para TEP evalua:",
        opciones: ["La gravedad del TEP confirmado", "La probabilidad clinica pre-test de TEP", "El riesgo de mortalidad a 30 dias", "La indicacion de trombolisis", "El riesgo de sangrado con anticoagulacion"],
        correcta: 1,
      },
      {
        enunciado: "El factor de riesgo mas importante para la enfermedad tromboembolica venosa es:",
        opciones: ["Tabaquismo", "Inmovilizacion prolongada/cirugia reciente", "Hipertension arterial", "Diabetes mellitus", "Dislipemia"],
        correcta: 1,
      },
    ],
    Neumonias: [
      {
        enunciado: "El agente causal mas frecuente de neumonia adquirida en la comunidad es:",
        opciones: ["Haemophilus influenzae", "Streptococcus pneumoniae", "Mycoplasma pneumoniae", "Legionella pneumophila", "Staphylococcus aureus"],
        correcta: 1,
      },
      {
        enunciado: "La escala CURB-65 evalua:",
        opciones: ["La etiologia de la neumonia", "La gravedad de la neumonia y necesidad de hospitalizacion", "La respuesta al tratamiento", "El riesgo de resistencia antibiotica", "La necesidad de cirugia"],
        correcta: 1,
      },
      {
        enunciado: "El tratamiento empirico de la neumonia comunitaria leve ambulatoria en adulto joven sin comorbilidades es:",
        opciones: ["Cefalosporina de 3a generacion IV", "Amoxicilina oral o amoxicilina-clavulanico", "Vancomicina IV", "Meropenem IV", "Cotrimoxazol oral"],
        correcta: 1,
      },
      {
        enunciado: "La neumonia por Pneumocystis jirovecii se presenta tipicamente en:",
        opciones: ["Ancianos sanos", "Pacientes con VIH y CD4 <200/mm3", "Ninos vacunados", "Fumadores sin inmunodepresion", "Embarazadas"],
        correcta: 1,
      },
      {
        enunciado: "La neumonia por Legionella se asocia clasicamente con:",
        opciones: ["Expectoracion purulenta abundante", "Hiponatremia, diarrea y afectacion sistemica", "Derrame pleural masivo", "Cavitacion pulmonar", "Leucopenia severa"],
        correcta: 1,
      },
      {
        enunciado: "La neumonia nosocomial se define como aquella que aparece:",
        opciones: ["En las primeras 12 horas de ingreso", "A partir de las 48 horas de hospitalizacion", "Solo en UCI", "Solo en pacientes ventilados", "En residencias de ancianos exclusivamente"],
        correcta: 1,
      },
    ],
    "Cancer de pulmon": [
      {
        enunciado: "El tipo histologico de cancer de pulmon mas frecuente actualmente es:",
        opciones: ["Carcinoma epidermoide", "Adenocarcinoma", "Carcinoma de celulas pequenas (microcitico)", "Carcinoma de celulas grandes", "Carcinoide tipico"],
        correcta: 1,
      },
      {
        enunciado: "El sindrome de Pancoast se debe a un tumor de:",
        opciones: ["Lobulo inferior con derrame pleural", "Apex pulmonar (sulcus superior) con afectacion del plexo braquial", "Hilio pulmonar con compresion bronquial", "Mediastino anterior", "Pared toracica lateral"],
        correcta: 1,
      },
      {
        enunciado: "El sindrome paraneoplasico mas frecuentemente asociado al carcinoma microcitico de pulmon es:",
        opciones: ["Hipercalcemia", "SIADH (secrecion inadecuada de ADH)", "Sindrome de Cushing por ACTH ectopica", "Acromegalia", "Eritrocitosis"],
        correcta: 1,
      },
      {
        enunciado: "La prueba de cribado recomendada para cancer de pulmon en poblacion de alto riesgo es:",
        opciones: ["Radiografia de torax anual", "Citologia de esputo", "TAC de torax de baja dosis anual", "Broncoscopia periodica", "PET-TAC anual"],
        correcta: 2,
      },
      {
        enunciado: "El tratamiento del cancer de pulmon no microcitico en estadio I es:",
        opciones: ["Quimioterapia exclusiva", "Radioterapia exclusiva", "Cirugia (lobectomia) con intencion curativa", "Inmunoterapia de primera linea", "Tratamiento paliativo"],
        correcta: 2,
      },
      {
        enunciado: "La mutacion del receptor EGFR en adenocarcinoma de pulmon es importante porque:",
        opciones: ["Indica peor pronostico absoluto", "Permite tratamiento dirigido con inhibidores de tirosina quinasa (osimertinib)", "Contraindica la quimioterapia", "Solo tiene valor pronostico, no terapeutico", "Indica necesidad de radioterapia exclusiva"],
        correcta: 1,
      },
    ],
  },

  Endocrinologia: {
    Diabetes: [
      {
        enunciado: "El criterio diagnostico de diabetes mellitus segun la glucemia en ayunas es:",
        opciones: [">100 mg/dL", ">110 mg/dL", ">126 mg/dL en dos determinaciones", ">140 mg/dL", ">200 mg/dL"],
        correcta: 2,
      },
      {
        enunciado: "El farmaco de primera linea en diabetes mellitus tipo 2 es:",
        opciones: ["Sulfonilurea", "Insulina", "Metformina", "Inhibidor de SGLT2", "Agonista de GLP-1"],
        correcta: 2,
      },
      {
        enunciado: "La cetoacidosis diabetica se caracteriza por:",
        opciones: ["Hiperglucemia, acidosis metabolica con anion gap elevado y cetonemia", "Hiperglucemia sin cetosis", "Hipoglucemia con cetosis", "Hiperglucemia con alcalosis metabolica", "Glucemia normal con cetosis"],
        correcta: 0,
      },
      {
        enunciado: "El objetivo de HbA1c para la mayoria de pacientes con diabetes tipo 2 es:",
        opciones: ["<5.5%", "<6.0%", "<7.0%", "<8.5%", "<9.0%"],
        correcta: 2,
      },
      {
        enunciado: "Los inhibidores de SGLT2 (empagliflozina, dapagliflozina) han demostrado beneficio adicional en:",
        opciones: ["Solo control glucemico", "Reduccion de eventos cardiovasculares y progresion de insuficiencia cardiaca y renal", "Prevencion de retinopatia", "Reduccion de neuropatia", "Prevencion de cetoacidosis"],
        correcta: 1,
      },
      {
        enunciado: "El estado hiperosmolar hiperglucemico se diferencia de la cetoacidosis en que:",
        opciones: ["Presenta cetosis intensa", "Tiene osmolaridad normal", "Predomina en DM tipo 2 con hiperglucemia extrema, deshidratacion severa y minima o nula cetosis", "Siempre requiere bicarbonato", "Es menos grave que la cetoacidosis"],
        correcta: 2,
      },
    ],
    Tiroides: [
      {
        enunciado: "La causa mas frecuente de hipertiroidismo es:",
        opciones: ["Adenoma toxico", "Bocio multinodular toxico", "Enfermedad de Graves-Basedow", "Tiroiditis subaguda", "Hipertiroidismo facticio"],
        correcta: 2,
      },
      {
        enunciado: "La oftalmopatia de Graves se caracteriza por:",
        opciones: ["Miosis bilateral", "Exoftalmos, edema periorbitario, restriccion de musculatura extraocular", "Ptosis unilateral", "Anisocoria", "Enoftalmos bilateral"],
        correcta: 1,
      },
      {
        enunciado: "La causa mas frecuente de hipotiroidismo en areas con suficiente aporte de yodo es:",
        opciones: ["Tiroiditis de Hashimoto", "Tiroidectomia previa", "Tratamiento con radioyodo", "Deficit de yodo", "Hipotiroidismo central"],
        correcta: 0,
      },
      {
        enunciado: "El hipotiroidismo subclinico se define por:",
        opciones: ["TSH baja con T4 normal", "TSH elevada con T4 libre normal", "TSH y T4 bajas", "TSH normal con T4 baja", "TSH elevada con T4 baja"],
        correcta: 1,
      },
      {
        enunciado: "El nodulo tiroideo con mayor riesgo de malignidad segun la ecografia (TI-RADS 5) presenta:",
        opciones: ["Contenido quistico puro", "Hiperecogenicidad homogenea", "Hipoecogenicidad, microcalcificaciones, margenes irregulares", "Halo perinodular completo", "Vascularizacion periferica exclusiva"],
        correcta: 2,
      },
      {
        enunciado: "La tormenta tiroidea es una emergencia que se trata con:",
        opciones: ["Levotiroxina IV urgente", "PTU/metimazol + yodo + betabloqueantes + corticoides", "Solo betabloqueantes", "Tiroidectomia inmediata", "Radioyodo urgente"],
        correcta: 1,
      },
    ],
    Suprarrenales: [
      {
        enunciado: "El sindrome de Cushing se diagnostica inicialmente mediante:",
        opciones: ["Cortisol basal matutino aislado", "Test de supresion con dexametasona a dosis baja (1 mg nocturno) y/o cortisol libre urinario 24h", "ACTH basal", "RM de hipofisis", "TAC de suprarrenales"],
        correcta: 1,
      },
      {
        enunciado: "La insuficiencia suprarrenal primaria (enfermedad de Addison) se manifiesta con:",
        opciones: ["Hipertension y obesidad central", "Hiperpigmentacion, hipotension, hiponatremia e hiperpotasemia", "Facies de luna llena", "Estrias rojo-vinosas", "Hirsutismo"],
        correcta: 1,
      },
      {
        enunciado: "El feocromocitoma se sospecha ante la triada clasica de:",
        opciones: ["Poliuria, polidipsia, polifagia", "Cefalea, sudoracion, palpitaciones con HTA paroxistica", "Temblor, diarrea, perdida de peso", "Dolor abdominal, fiebre, ictericia", "Hematuria, dolor lumbar, masa palpable"],
        correcta: 1,
      },
      {
        enunciado: "El diagnostico bioquimico de feocromocitoma se realiza mediante:",
        opciones: ["Cortisol libre urinario", "Metanefrinas y catecolaminas fraccionadas en orina de 24h o metanefrinas plasmaticas", "ACTH plasmatica", "Aldosterona/renina", "17-OH progesterona"],
        correcta: 1,
      },
      {
        enunciado: "El hiperaldosteronismo primario (sindrome de Conn) se presenta con:",
        opciones: ["Hiperpigmentacion cutanea", "Hipertension con hipopotasemia y alcalosis metabolica", "Hirsutismo y amenorrea", "Hipotension ortostatica", "Hipoglucemia recurrente"],
        correcta: 1,
      },
      {
        enunciado: "La crisis suprarrenal aguda se trata con:",
        opciones: ["Dexametasona oral", "Hidrocortisona IV + reposicion de volumen con suero salino", "Fludrocortisona oral", "Solo suero glucosado", "Espironolactona IV"],
        correcta: 1,
      },
    ],
    Hipofisis: [
      {
        enunciado: "El adenoma hipofisario mas frecuente es:",
        opciones: ["Somatotropo (GH)", "Corticotropo (ACTH)", "Tirotropo (TSH)", "Prolactinoma", "No funcionante"],
        correcta: 3,
      },
      {
        enunciado: "El prolactinoma se trata en primera instancia con:",
        opciones: ["Cirugia transesfenoidal", "Radioterapia", "Agonistas dopaminergicos (cabergolina)", "Octreotido", "Observacion sin tratamiento"],
        correcta: 2,
      },
      {
        enunciado: "La acromegalia se produce por exceso de:",
        opciones: ["Prolactina", "ACTH", "Hormona del crecimiento (GH)", "TSH", "LH"],
        correcta: 2,
      },
      {
        enunciado: "La diabetes insipida central se caracteriza por:",
        opciones: ["Poliuria con orina concentrada", "Poliuria con orina diluida que responde a desmopresina", "Poliuria con glucosuria", "Oliguria con hipernatremia", "Poliuria que no responde a desmopresina"],
        correcta: 1,
      },
      {
        enunciado: "El sindrome de Sheehan se produce por:",
        opciones: ["Adenoma hipofisario gigante", "Necrosis hipofisaria postparto por hemorragia severa", "Apoplejia hipofisaria espontanea", "Craneofaringioma", "Metastasis hipofisarias"],
        correcta: 1,
      },
      {
        enunciado: "La alteracion del campo visual tipica de un macroadenoma hipofisario con compresion del quiasma optico es:",
        opciones: ["Hemianopsia homonima", "Hemianopsia bitemporal", "Escotoma central", "Amaurosis unilateral", "Cuadrantanopsia superior"],
        correcta: 1,
      },
    ],
    Osteoporosis: [
      {
        enunciado: "El diagnostico de osteoporosis por densitometria osea (DEXA) se establece con un T-score de:",
        opciones: ["<-1.0", "<-1.5", "<-2.0", "<-2.5", "<-3.0"],
        correcta: 3,
      },
      {
        enunciado: "El tratamiento de primera linea de la osteoporosis postmenopausica es:",
        opciones: ["Solo calcio y vitamina D", "Bifosfonatos (alendronato, risedronato)", "Teriparatida", "Denosumab", "Ranelato de estroncio"],
        correcta: 1,
      },
      {
        enunciado: "La principal complicacion del uso prolongado de bifosfonatos es:",
        opciones: ["Insuficiencia renal", "Osteonecrosis de maxilar y fracturas atipicas de femur", "Hepatotoxicidad", "Hipercalcemia", "Arritmias cardiacas"],
        correcta: 1,
      },
      {
        enunciado: "La osteoporosis secundaria puede ser causada por todo EXCEPTO:",
        opciones: ["Corticoides cronicos", "Hipertiroidismo", "Hiperparatiroidismo", "Ejercicio fisico regular con carga", "Hipogonadismo"],
        correcta: 3,
      },
      {
        enunciado: "La fractura por osteoporosis mas frecuente es:",
        opciones: ["Fractura de cadera", "Fractura vertebral", "Fractura de muneca (Colles)", "Fractura de humero", "Fractura de pelvis"],
        correcta: 1,
      },
      {
        enunciado: "El denosumab es un anticuerpo monoclonal que actua inhibiendo:",
        opciones: ["La osteoblastogenesis", "El RANKL, impidiendo la activacion de osteoclastos", "La PTH", "La vitamina D", "La calcitonina"],
        correcta: 1,
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generateSampleData(): PreguntaRaw[] {
  const preguntas: PreguntaRaw[] = [];
  const letras = ["A", "B", "C", "D", "E"];
  let numero = 1;

  for (const [especialidad, temas] of Object.entries(QUESTION_BANK)) {
    for (const [tema, templates] of Object.entries(temas)) {
      for (const t of templates) {
        const opciones: Opcion[] = t.opciones.map((texto, i) => ({
          letra: letras[i],
          texto,
        }));

        preguntas.push({
          numero_mir: numero++,
          enunciado: t.enunciado,
          opciones,
          respuesta_correcta: letras[t.correcta],
          imagen_url: null,
          especialidad,
          tema,
          subtema: null,
          dificultad: t.dificultad || "media",
          anio: 2025,
        });
      }
    }
  }

  return preguntas;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const outDir = path.join(__dirname, "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "preguntas.json");

  const preguntas = generateSampleData();
  fs.writeFileSync(outPath, JSON.stringify(preguntas, null, 2), "utf-8");
  console.log(`Generated ${preguntas.length} sample MIR questions to ${outPath}`);
}
