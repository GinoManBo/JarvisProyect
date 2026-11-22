// Servicio de avisos de Jarvis. Corre en Railway, siempre prendido.
//
// Jarvis (el Mac) le manda la lista de eventos cada vez que cambia; este servicio
// la guarda en el volumen, revisa cada 10 minutos qué toca recordar y lo manda
// por Telegram. También reenvía al tiro los avisos del pomodoro y contesta
// /start (vincular) y /proximos en el bot.
//
// Node puro, sin dependencias. Variables de entorno: ver README.md.

import http from 'node:http'
import { createHash, timingSafeEqual } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const TOKEN = (process.env.TELEGRAM_TOKEN ?? '').trim()
const CLAVE = (process.env.CLAVE_JARVIS ?? '').trim()
const CHAT_FIJO = /^-?\d+$/.test(process.env.TELEGRAM_CHAT_ID ?? '')
  ? Number(process.env.TELEGRAM_CHAT_ID)
  : null
const DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATOS_DIR || './datos'
const HORA_AVISO = Number(process.env.HORA_AVISO ?? 9) // hora de Chile desde la que se avisa
const HORA_SILENCIO = 23 // y hasta la que se avisa
const ZONA = 'America/Santiago'
const PUERTO = Number(process.env.PORT ?? 3000)
const DOMINIO = process.env.URL_PUBLICA || process.env.RAILWAY_PUBLIC_DOMAIN || ''

if (!TOKEN || !CLAVE) {
  console.error('Faltan TELEGRAM_TOKEN o CLAVE_JARVIS.')
  process.exit(1)
}
if (CLAVE.length < 24) {
  console.error('CLAVE_JARVIS es muy corta: usa al menos 24 caracteres al azar.')
  process.exit(1)
}

// Telegram manda este secreto en cada webhook; así nadie más puede fingir mensajes.
const SECRETO_WEBHOOK = createHash('sha256').update(`webhook:${CLAVE}`).digest('hex').slice(0, 48)

/* --- Estado en el volumen ------------------------------------------------ */

/**
 * @typedef {{ id: string, titulo: string, fecha: string, tipo: string, ramo: string | null,
 *             aviso: 'dia' | 'semana' | 'quincena' | 'mes' | null }} Evento
 * @typedef {{ chatId: number | null, nombre: string | null, eventos: Evento[],
 *             avisados: Record<string, string> }} Estado
 */

const ARCHIVO = path.join(DIR, 'estado.json')

/** @type {Estado} */
let estado = { chatId: null, nombre: null, eventos: [], avisados: {} }

async function cargar() {
  try {
    estado = { ...estado, ...JSON.parse(await fs.readFile(ARCHIVO, 'utf8')) }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
  if (CHAT_FIJO !== null) estado.chatId = CHAT_FIJO
}

// Escribe a un temporal y renombra: un reinicio a mitad de escritura no deja el
// archivo cortado.
async function guardar() {
  await fs.mkdir(DIR, { recursive: true })
  const tmp = `${ARCHIVO}.tmp`
  await fs.writeFile(tmp, JSON.stringify(estado, null, 2), 'utf8')
  await fs.rename(tmp, ARCHIVO)
}

/* --- Fechas (siempre en hora de Chile, nunca la del servidor) ------------ */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre']

/** Fecha YYYY-MM-DD y hora actuales en Chile. */
function ahoraEnChile() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  )
  return { hoy: `${partes.year}-${partes.month}-${partes.day}`, hora: Number(partes.hour) }
}

// Aritmética de días sobre las claves en UTC puro: no hay zona horaria que la corra.
const aDia = (clave) => Date.UTC(...clave.split('-').map((n, i) => Number(n) - (i === 1 ? 1 : 0))) / 86_400_000
const desdeDia = (n) => new Date(n * 86_400_000).toISOString().slice(0, 10)
const diasEntre = (desde, hasta) => Math.round(aDia(hasta) - aDia(desde))

function cuando(fecha, hoy) {
  const d = diasEntre(hoy, fecha)
  if (d === 0) return 'Hoy'
  if (d === 1) return 'Mañana'
  const [, m, dia] = fecha.split('-').map(Number)
  return `En ${d} días (${dia} de ${MESES[m - 1]})`
}

/* --- Qué toca avisar (misma tabla que AVISOS en src/lib/avisos.ts) ------- */

const AVISOS = {
  dia: { desde: 1, cada: 1 },
  semana: { desde: 7, cada: 1 },
  quincena: { desde: 14, cada: 2 },
  mes: { desde: 28, cada: 7 },
}

/** Días antes del evento en que toca avisar. Siempre incluye la víspera y el mismo día. */
function diasDeAviso(aviso) {
  const a = AVISOS[aviso]
  if (!a) return []
  const dias = new Set([0, 1])
  for (let d = a.desde; d >= 1; d -= a.cada) dias.add(d)
  return [...dias]
}

/**
 * Toca si alguno de sus días de aviso ya llegó y es posterior al último aviso
 * mandado. Así, si el servicio estuvo caído, el aviso perdido sale igual (una vez).
 */
function tocaAviso(e, hoy) {
  if (!e.aviso) return false
  const faltan = diasEntre(hoy, e.fecha)
  const ultimo = estado.avisados[e.id]
  if (faltan < 0 || ultimo === hoy) return false
  return diasDeAviso(e.aviso).some((d) => d >= faltan && (!ultimo || desdeDia(aDia(e.fecha) - d) > ultimo))
}

const linea = (e, hoy) => `• ${cuando(e.fecha, hoy)}: ${e.titulo} (${e.tipo}${e.ramo ? `, ${e.ramo}` : ''})`

let revisando = false
async function revisar() {
  if (revisando || estado.chatId === null) return
  const { hoy, hora } = ahoraEnChile()
  if (hora < HORA_AVISO || hora >= HORA_SILENCIO) return

  const toca = estado.eventos.filter((e) => tocaAviso(e, hoy)).sort((a, b) => a.fecha.localeCompare(b.fecha))
  if (toca.length === 0) return

  revisando = true
  try {
    const ok = await enviar(`Lo que viene\n\n${toca.map((e) => linea(e, hoy)).join('\n')}`)
    if (!ok) return
    for (const e of toca) estado.avisados[e.id] = hoy
    await guardar()
  } finally {
    revisando = false
  }
}

/* --- Telegram ------------------------------------------------------------ */

async function telegram(metodo, cuerpo) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${metodo}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(15_000),
  })
  const r = await res.json()
  if (!r.ok) throw new Error(r.description ?? `Telegram respondió ${res.status}`)
  return r.result
}

async function enviar(texto, chatId = estado.chatId) {
  if (chatId === null) return false
  try {
    await telegram('sendMessage', { chat_id: chatId, text: texto })
    return true
  } catch (err) {
    console.error('No se pudo mandar:', err.message)
    return false
  }
}

let usuarioBot = ''

async function alMensaje(msg) {
  const chat = msg?.chat
  const texto = (msg?.text ?? '').trim()
  if (!chat || chat.type !== 'private') return

  // Sólo se le contesta a Javiera. El primer /start vincula, si nadie lo hizo antes.
  if (estado.chatId === null && texto.startsWith('/start')) {
    estado.chatId = chat.id
    estado.nombre = chat.first_name ?? null
    await guardar()
    await enviar('Listo. Desde ahora Jarvis te avisa por acá de tus pausas y de lo que viene en el calendario.\n\n/proximos muestra lo que viene.')
    return
  }
  if (chat.id !== estado.chatId) return

  if (texto.startsWith('/proximos')) {
    const { hoy } = ahoraEnChile()
    const lista = estado.eventos
      .filter((e) => diasEntre(hoy, e.fecha) >= 0)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 12)
    await enviar(lista.length ? `Lo que viene\n\n${lista.map((e) => linea(e, hoy)).join('\n')}` : 'No hay nada agendado.')
  } else if (texto.startsWith('/start')) {
    await enviar('Ya estás vinculada. /proximos muestra lo que viene.')
  }
}

/* --- HTTP ---------------------------------------------------------------- */

const CLAVE_HASH = createHash('sha256').update(CLAVE).digest()
function autorizado(req) {
  const dada = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  return timingSafeEqual(createHash('sha256').update(dada).digest(), CLAVE_HASH)
}

async function leerCuerpo(req) {
  let crudo = ''
  for await (const trozo of req) {
    crudo += trozo
    if (crudo.length > 1_000_000) throw new Error('demasiado grande')
  }
  return crudo ? JSON.parse(crudo) : {}
}

function responder(res, codigo, cuerpo) {
  res.writeHead(codigo, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(cuerpo))
}

const esClave = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
const texto = (s, max) => (typeof s === 'string' ? s.slice(0, max) : '')

/** Valida lo que manda Jarvis: nada que no tenga la forma esperada entra al estado. */
function limpiarEventos(lista) {
  if (!Array.isArray(lista)) throw new Error('eventos debe ser una lista')
  return lista
    .filter((e) => e && typeof e.id === 'string' && esClave(e.fecha))
    .slice(0, 2000)
    .map((e) => ({
      id: texto(e.id, 80),
      titulo: texto(e.titulo, 200),
      fecha: e.fecha,
      tipo: texto(e.tipo, 20),
      ramo: e.ramo ? texto(e.ramo, 80) : null,
      aviso: e.aviso in AVISOS ? e.aviso : null,
    }))
}

const servidor = http.createServer(async (req, res) => {
  try {
    const ruta = new URL(req.url ?? '/', 'http://x').pathname

    if (req.method === 'GET' && ruta === '/salud') return responder(res, 200, { ok: true })

    if (req.method === 'POST' && ruta === '/telegram') {
      if (req.headers['x-telegram-bot-api-secret-token'] !== SECRETO_WEBHOOK) return responder(res, 403, {})
      const update = await leerCuerpo(req)
      responder(res, 200, {}) // Telegram reintenta si no contestamos rápido.
      await alMensaje(update.message).catch((err) => console.error('webhook:', err.message))
      return
    }

    if (!autorizado(req)) return responder(res, 401, { error: 'clave' })

    if (req.method === 'GET' && ruta === '/estado') {
      return responder(res, 200, { bot: usuarioBot, vinculado: estado.chatId !== null, nombre: estado.nombre })
    }

    if (req.method === 'PUT' && ruta === '/eventos') {
      const { eventos } = await leerCuerpo(req)
      const antes = new Map(estado.eventos.map((e) => [e.id, e]))
      estado.eventos = limpiarEventos(eventos)
      // Se conserva lo ya avisado sólo si el evento sigue igual: con otra fecha u
      // otra frecuencia la cuenta empieza de nuevo (y puede tocar avisar altiro).
      const avisados = {}
      for (const e of estado.eventos) {
        const previo = antes.get(e.id)
        const ultimo = estado.avisados[e.id]
        if (ultimo && previo && previo.fecha === e.fecha && previo.aviso === e.aviso) avisados[e.id] = ultimo
      }
      estado.avisados = avisados
      await guardar()
      void revisar()
      return responder(res, 200, { ok: true, vinculado: estado.chatId !== null })
    }

    if (req.method === 'POST' && ruta === '/mensaje') {
      const { texto: t } = await leerCuerpo(req)
      const ok = typeof t === 'string' && t.trim() ? await enviar(t.slice(0, 4000)) : false
      return responder(res, ok ? 200 : 409, { ok })
    }

    responder(res, 404, {})
  } catch (err) {
    console.error(err)
    if (!res.headersSent) responder(res, 400, { error: 'pedido inválido' })
  }
})

/* --- Arranque ------------------------------------------------------------ */

await cargar()
servidor.listen(PUERTO, () => console.log(`Avisos de Jarvis escuchando en ${PUERTO}`))

try {
  usuarioBot = (await telegram('getMe', {})).username
  if (DOMINIO) {
    const url = `https://${DOMINIO.replace(/^https?:\/\//, '').replace(/\/$/, '')}/telegram`
    await telegram('setWebhook', { url, secret_token: SECRETO_WEBHOOK, allowed_updates: ['message'] })
    console.log(`Webhook en ${url} (@${usuarioBot})`)
  } else {
    console.warn('Sin dominio público: el bot no recibirá /start ni /proximos. Genera uno en Railway.')
  }
} catch (err) {
  console.error('Telegram:', err.message)
}

setInterval(() => void revisar().catch((err) => console.error('revisar:', err.message)), 10 * 60 * 1000)
void revisar()
