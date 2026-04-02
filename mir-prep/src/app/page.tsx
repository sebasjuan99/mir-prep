import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="font-[var(--font-display)] text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            MIR Prep
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <h1
          className="font-[var(--font-display)] text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          Aprueba el MIR.
          <br />
          <span style={{ color: 'var(--accent)' }}>Pregunta a pregunta.</span>
        </h1>
        <p
          className="font-[var(--font-body)] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Simulacros interactivos con las preguntas reales del MIR 2025.
          Retroalimentación inmediata, fichas de estudio y seguimiento
          de tu progreso por especialidad.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/register"
            className="px-8 py-4 text-lg font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            style={{ background: 'var(--accent)' }}
          >
            Comenzar gratis →
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 text-lg font-medium rounded-xl border-2 transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 text-left mt-8">
          <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-[var(--font-display)] text-lg font-bold mb-2">Preguntas reales MIR 2025</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Todas las preguntas oficiales publicadas por Sanidad, clasificadas por especialidad y tema.
            </p>
          </div>
          <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div className="text-3xl mb-3">📖</div>
            <h3 className="font-[var(--font-display)] text-lg font-bold mb-2">Fichas de estudio</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Cuando falles una pregunta, recibirás un resumen con los puntos clave del tema para reforzar.
            </p>
          </div>
          <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-[var(--font-display)] text-lg font-bold mb-2">Progreso inteligente</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Detectamos tus debilidades y te recomendamos qué repasar. Tu avance por especialidad siempre visible.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <p>MIR Prep — Hecho con dedicación para futuros residentes 🩺</p>
      </footer>
    </div>
  )
}
