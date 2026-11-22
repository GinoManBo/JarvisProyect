import { useEffect, useRef } from 'react'
import { useDatos } from './datos'
import { puente, type EventoAviso } from './almacen'
import { diasHasta } from './fechas'
import type { AvisoEvento } from './types'

/*
 * Recordatorios de eventos por Telegram.
 *
 * Quien decide cuándo avisar es el servicio en Railway (`servidor/index.mjs`),
 * que está siempre prendido: así el aviso llega aunque el Mac esté apagado. Acá
 * sólo se le manda la lista de eventos que vienen cada vez que cambia.
 */

/** Las frecuencias. `desde`/`cada` se repiten en `AVISOS` de `servidor/index.mjs`: cambiar ambas. */
export const AVISOS: { valor: AvisoEvento; rotulo: string; corto: string; desde: number; cada: number }[] = [
  { valor: 'dia', rotulo: 'El día antes', corto: '1 día', desde: 1, cada: 1 },
  { valor: 'semana', rotulo: 'Cada día, la última semana', corto: '1 sem', desde: 7, cada: 1 },
  { valor: 'quincena', rotulo: 'Cada 2 días, las últimas 2 semanas', corto: '2 sem', desde: 14, cada: 2 },
  { valor: 'mes', rotulo: 'Cada semana, el último mes', corto: '1 mes', desde: 28, cada: 7 },
]

const REINTENTO_MS = 5 * 60 * 1000

/**
 * Manda al servicio los eventos que vienen (con o sin aviso: /proximos los lista
 * todos) al abrir y cada vez que cambian. Si no hay internet, reintenta cada 5
 * minutos hasta que pase. Se monta una vez, en `App`.
 */
export function useSincronizarAvisos() {
  const { eventos, ramos, cargados } = useDatos()
  const pendiente = useRef<EventoAviso[] | null>(null)
  const enviando = useRef(false)

  const intentar = useRef(async () => {
    if (enviando.current || !pendiente.current) return
    enviando.current = true
    const lista = pendiente.current
    const ok = await puente().avisos.sincronizar(lista)
    // Si mientras tanto cambió algo, `pendiente` ya es otra lista y se manda después.
    if (ok && pendiente.current === lista) pendiente.current = null
    enviando.current = false
    if (pendiente.current && ok) void intentar.current()
  })

  // Con rebote: no mandar mientras se escribe el título de un evento.
  useEffect(() => {
    // Antes de leer el disco `eventos` vale [] y borraría la lista en Railway.
    if (!cargados) return
    const t = window.setTimeout(() => {
      const nombre = new Map(ramos.map((r) => [r.id, r.nombre]))
      pendiente.current = eventos
        .filter((e) => diasHasta(e.fecha) >= 0)
        .map((e) => ({
          id: e.id,
          titulo: e.titulo,
          fecha: e.fecha,
          tipo: e.tipo,
          ramo: e.ramoId ? (nombre.get(e.ramoId) ?? null) : null,
          aviso: e.aviso ?? null,
        }))
      void intentar.current()
    }, 2000)
    return () => window.clearTimeout(t)
  }, [eventos, ramos, cargados])

  useEffect(() => {
    const t = window.setInterval(() => void intentar.current(), REINTENTO_MS)
    return () => window.clearInterval(t)
  }, [])
}
