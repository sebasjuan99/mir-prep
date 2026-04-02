export const PREGUNTAS_POR_SIMULACRO = 20
export const TIEMPO_POR_PREGUNTA_SEGUNDOS = 90

export const ESPECIALIDADES = [
  'Pediatría', 'Cardiología', 'Neurología', 'Digestivo',
  'Nefrología', 'Neumología', 'Endocrinología', 'Dermatología',
  'Traumatología', 'Ginecología', 'Urología', 'Hematología',
  'Reumatología', 'Infecciosas', 'Psiquiatría', 'Oftalmología',
  'ORL', 'Cirugía General', 'Farmacología', 'Medicina Preventiva',
  'Bioética', 'Estadística', 'Anatomía Patológica', 'Radiología',
  'Oncología', 'Medicina Interna', 'Inmunología', 'Genética',
] as const

export const ESPECIALIDAD_ICONS: Record<string, string> = {
  'Pediatría': '👶',
  'Cardiología': '❤️',
  'Neurología': '🧠',
  'Digestivo': '🫁',
  'Nefrología': '🫘',
  'Neumología': '🌬️',
  'Endocrinología': '🦋',
  'Dermatología': '🧴',
  'Traumatología': '🦴',
  'Ginecología': '🩺',
  'Urología': '💧',
  'Hematología': '🩸',
  'Reumatología': '🦵',
  'Infecciosas': '🦠',
  'Psiquiatría': '🧩',
  'Oftalmología': '👁️',
  'ORL': '👂',
  'Cirugía General': '🔪',
  'Farmacología': '💊',
  'Medicina Preventiva': '🛡️',
  'Bioética': '⚖️',
  'Estadística': '📊',
  'Anatomía Patológica': '🔬',
  'Radiología': '📡',
  'Oncología': '🎗️',
  'Medicina Interna': '🏥',
  'Inmunología': '🧬',
  'Genética': '🧬',
}

export function getScoreLabel(percentage: number): { label: string; color: string } {
  if (percentage >= 80) return { label: 'Sobresaliente', color: 'var(--success)' }
  if (percentage >= 70) return { label: 'Notable', color: 'var(--success)' }
  if (percentage >= 50) return { label: 'Aprobado', color: 'var(--accent)' }
  return { label: 'Necesitas repasar', color: 'var(--error)' }
}
