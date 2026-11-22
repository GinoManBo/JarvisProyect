/*
 * Cliente del servicio de avisos (`servidor/`, corre en Railway).
 *
 * Jarvis ya no habla con Telegram: el token del bot vive sólo en Railway. Acá
 * hay una URL y una clave, inyectadas al compilar desde `.env` (ver
 * `vite.config.ts`). Sin ellas el panel de Telegram queda apagado y nada sale
 * a la red.
 */

declare const __AVISOS_URL__: string
declare const __AVISOS_CLAVE__: string

const URL_BASE = __AVISOS_URL__.trim().replace(/\/$/, '')
const CLAVE = __AVISOS_CLAVE__.trim()
const configurado = Boolean(URL_BASE && CLAVE)

export type EstadoTelegram =
  | { estado: 'apagado' }
  | { estado: 'sin-conexion' }
  | { estado: 'esperando'; bot: string }
  | { estado: 'vinculado'; bot: string; nombre: string }

/** Lo que el servicio necesita de cada evento. El ramo va por nombre, no por id. */
export type EventoAviso = {
  id: string
  titulo: string
  fecha: string
  tipo: string
  ramo: string | null
  aviso: string | null
}

async function pedir(metodo: string, ruta: string, cuerpo?: unknown) {
  return fetch(`${URL_BASE}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${CLAVE}`, 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(15_000),
  })
}

export async function estado(): Promise<EstadoTelegram> {
  if (!configurado) return { estado: 'apagado' }
  try {
    const res = await pedir('GET', '/estado')
    if (!res.ok) return { estado: 'sin-conexion' }
    const r = (await res.json()) as { bot: string; vinculado: boolean; nombre: string | null }
    return r.vinculado
      ? { estado: 'vinculado', bot: r.bot, nombre: r.nombre ?? '' }
      : { estado: 'esperando', bot: r.bot }
  } catch {
    return { estado: 'sin-conexion' }
  }
}

/** Reemplaza la lista de eventos en el servicio. `false` si no se pudo. */
export async function sincronizar(eventos: EventoAviso[]): Promise<boolean> {
  if (!configurado) return false
  try {
    return (await pedir('PUT', '/eventos', { eventos })).ok
  } catch {
    return false
  }
}

/** Mensaje inmediato (el pomodoro). `false` si no hay servicio o falló. */
export async function enviar(texto: string): Promise<boolean> {
  if (!configurado) return false
  try {
    return (await pedir('POST', '/mensaje', { texto })).ok
  } catch {
    return false
  }
}
