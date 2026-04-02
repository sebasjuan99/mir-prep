import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tema: string }> }
) {
  const { tema } = await params
  const decodedTema = decodeURIComponent(tema)

  const resumen = await prisma.resumenTema.findFirst({
    where: { tema: decodedTema },
  })

  if (!resumen) {
    return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 })
  }

  return NextResponse.json(resumen)
}
