'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { C, mono, kicker, inkBorder } from '@/lib/cm'

interface UniversidadStat { universidad: string; total: number; correctas: number; porcentaje: number }
interface SesionesPorExamen { universidad: string; sesiones: number }

const COLOR: Record<string, string> = {
  MIR: C.ink, ENARM: C.pink, UNAL: C.green, 'El Bosque': C.cream2, Rosario: C.orange, CES: '#2E4057',
}
const LABEL: Record<string, string> = {
  MIR: 'MIR', ENARM: 'ENARM', UNAL: 'UNAL', 'El Bosque': 'BOSQUE', Rosario: 'ROSARIO', CES: 'CES',
}
const colorOf = (u: string) => COLOR[u] || C.ink2
const labelOf = (u: string) => LABEL[u] || u.toUpperCase()

function Chart({ titulo, data, dataKey, suffix }: {
  titulo: string
  data: { label: string; key: string; value: number }[]
  dataKey: string
  suffix?: string
}) {
  return (
    <div style={{ borderRight: inkBorder, display: 'flex', flexDirection: 'column' }} className="chart-cell">
      <div style={{ padding: '16px 20px', borderBottom: inkBorder }}>
        <div style={{ ...kicker() }}>{titulo}</div>
      </div>
      <div style={{ padding: '16px 8px 8px', flex: 1, minHeight: 200 }}>
        {data.length === 0 ? (
          <div style={{ ...mono, fontSize: 11, color: C.ink2, padding: '40px 12px', textAlign: 'center' }}>SIN DATOS TODAVÍA</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'monospace', fill: C.ink2 }} axisLine={{ stroke: C.ink }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fontFamily: 'monospace', fill: C.ink2 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                formatter={(v) => [`${v}${suffix || ''}`, '']}
                contentStyle={{ border: `2px solid ${C.ink}`, borderRadius: 0, fontFamily: 'monospace', fontSize: 11 }}
                labelStyle={{ fontWeight: 700 }}
              />
              <Bar dataKey={dataKey} radius={[0, 0, 0, 0]}>
                {data.map((d) => <Cell key={d.key} fill={colorOf(d.key)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default function DashboardCharts({ universidades, sesionesPorExamen }: {
  universidades: UniversidadStat[]
  sesionesPorExamen: SesionesPorExamen[]
}) {
  const sesionesData = sesionesPorExamen.map((s) => ({ label: labelOf(s.universidad), key: s.universidad, value: s.sesiones }))
  const aciertosData = universidades.map((u) => ({ label: labelOf(u.universidad), key: u.universidad, value: u.porcentaje }))
  const respuestasData = universidades.map((u) => ({ label: labelOf(u.universidad), key: u.universidad, value: u.total }))

  return (
    <div style={{ border: inkBorder, marginBottom: 48 }}>
      <div style={{ borderBottom: inkBorder, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...kicker() }}>GRÁFICAS POR TIPO DE EXAMEN</div>
        <span style={{ ...mono, fontSize: 10, color: C.ink2, letterSpacing: '0.08em' }}>UNAL · BOSQUE · MIR · ENARM · ROSARIO · CES</span>
      </div>
      <div className="grid-charts">
        <Chart titulo="SESIONES POR EXAMEN" data={sesionesData} dataKey="value" />
        <Chart titulo="% ACIERTOS POR EXAMEN" data={aciertosData} dataKey="value" suffix="%" />
        <Chart titulo="RESPUESTAS POR EXAMEN" data={respuestasData} dataKey="value" />
      </div>
    </div>
  )
}
