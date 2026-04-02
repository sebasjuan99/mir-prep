# MIR Prep Platform

Plataforma web para preparar el examen MIR (Medico Interno Residente) de Espana mediante simulacros interactivos con retroalimentacion pedagogica.

## Stack tecnologico

- **Frontend**: Next.js 16 (App Router) + React 19 + TailwindCSS 4 + Framer Motion
- **Backend**: Next.js API Routes
- **Base de datos**: PostgreSQL (Supabase)
- **ORM**: Prisma 7 con adaptador PostgreSQL
- **Auth**: Supabase Auth (email/password)
- **Deploy**: Vercel + GitHub Actions CI/CD

## Funcionalidades

- Simulacros de 20 preguntas con preguntas reales del MIR 2025
- Retroalimentacion inmediata por pregunta (correcto/incorrecto)
- Fichas de estudio por tema cuando fallas una pregunta
- Progreso por especialidad y tema
- Deteccion de debilidades (<60% aciertos)
- Modo repaso de errores
- Filtrado por especialidad
- 210 preguntas de muestra en 7 especialidades y 35 temas
- 35 fichas de estudio con contenido medico real

## Requisitos previos

- Node.js 20+
- Cuenta de [Supabase](https://supabase.com) (gratuita)

## Instalacion

```bash
# 1. Clonar el repositorio
git clone https://github.com/[tu-usuario]/mir-prep
cd mir-prep

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Generar Prisma Client
npx prisma generate

# 5. Aplicar schema a la base de datos
npx prisma db push

# 6. Generar datos de muestra y sembrar la BD
npm run db:seed

# 7. Iniciar el servidor de desarrollo
npm run dev
```

La app estara en **http://localhost:3000**

## Configuracion de Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. En Settings > API, copiar:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY`
3. En Settings > Database, copiar el **Connection string (URI)** -> `DATABASE_URL`
4. En Authentication > Settings, habilitar Email/Password provider

## Variables de entorno (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

## Scripts disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (localhost:3000) |
| `npm run build` | Build de produccion |
| `npm run db:seed` | Genera datos de muestra + fichas + siembra BD |
| `npm run db:push` | Aplica schema Prisma a la BD |
| `npm run db:reset` | Resetea BD y re-siembra |
| `npm run scrape` | Intenta scrapear preguntas reales del MIR 2025 |
| `npm run generate-data` | Genera 210 preguntas de muestra |
| `npm run generate-resumenes` | Genera 35 fichas de estudio |

## Estructura del proyecto

```
mir-prep/
├── prisma/schema.prisma          # Schema de la BD
├── scripts/
│   ├── scrape-mir.ts             # Scraping de preguntas reales
│   ├── generate-sample-data.ts   # Generador de datos de muestra
│   ├── generate-resumenes.ts     # Generador de fichas de estudio
│   └── seed.ts                   # Siembra de la BD
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── (auth)/               # Login + Register
│   │   ├── (protected)/          # Dashboard + Simulacro + Especialidades
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── FlashCard.tsx         # Componente principal de preguntas
│   │   ├── ResultadoSimulacro.tsx # Resultados del simulacro
│   │   └── NavBar.tsx            # Navegacion
│   ├── hooks/                    # useAuth, useSimulacro, useProgreso
│   └── lib/                      # Supabase clients, Prisma, constants
└── vercel.json                   # Config de deploy
```

## Deploy en Vercel

1. Conectar el repo de GitHub a Vercel
2. Configurar las variables de entorno en Vercel Dashboard
3. Deploy automatico con cada push a `main`

## Especialidades cubiertas

Pediatria, Cardiologia, Neurologia, Digestivo, Nefrologia, Neumologia, Endocrinologia (7 especialidades, 35 temas, 210 preguntas de muestra, 35 fichas de estudio)
