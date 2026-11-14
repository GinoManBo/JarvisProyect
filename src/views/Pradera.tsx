import { useEffect, useRef } from 'react'
import type { Animo } from './Monitos'
import { ARBOLES, NUBES, azar, paletaDe, type Bitmap, type Momento, type Paleta } from './praderaArte'

/**
 * La pradera 8 bit detrás de los monitos. Se dibuja en un <canvas> de baja
 * resolución (un píxel del fondo = PX px de pantalla) y el CSS lo escala sin
 * suavizar, así que cada "pixel" es un cuadrado duro como en los sprites.
 *
 * Todo se calcula en cada cuadro a partir del tiempo — sin estado, sin
 * Math.random — y se repinta a 8 cuadros por segundo: ese tironeo es el
 * movimiento de 8 bit (las nubes avanzan de a un píxel, el río corre a saltos,
 * el pasto se mece en dos poses). El momento sigue el ánimo del reloj: estudia
 * es de día, el recreo es el atardecer y la siesta es de noche.
 */

const PX = 4 // lado de un píxel del fondo, en px CSS
const PASO = 125 // ms por cuadro (8 fps)
const PASTO = 7 // filas de pasto al ras del suelo
const RIO = 5 // filas de río

const MOMENTO: Record<Animo, Momento> = { estudia: 'dia', recreo: 'tarde', siesta: 'noche' }

const NUBES_CFG = [
  { b: 0, y: 0.08, v: 1.7, x: 0.12 },
  { b: 1, y: 0.18, v: 1.0, x: 0.47 },
  { b: 2, y: 0.05, v: 1.3, x: 0.72 },
  { b: 1, y: 0.3, v: 0.75, x: 0.9 },
  { b: 0, y: 0.24, v: 0.9, x: 0.28 },
]

function pintar(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, p: Paleta, momento: Momento) {
  const cuadro = Math.floor(t / PASO)
  const seg = t / 1000
  let actual = ''
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    if (c !== actual) {
      ctx.fillStyle = c
      actual = c
    }
    ctx.fillRect(x, y, w, h)
  }
  const pix = (x: number, y: number, c: string) => rect(x, y, 1, 1, c)
  const mapa = (b: Bitmap, x: number, y: number, col: Record<string, string>, mece = 0) => {
    for (let r = 0; r < b.length; r++) {
      const fila = b[r]
      const dx = mece && !fila.includes('t') ? mece : 0
      for (let c = 0; c < fila.length; c++) {
        const k = col[fila[c]]
        if (k) pix(x + c + dx, y + r, k)
      }
    }
  }

  const yPasto = H - PASTO
  const yRioFin = yPasto - 2
  const yRio = yRioFin - RIO + 1

  // Cielo en bandas, con una fila de dither en cada frontera.
  const nb = p.cielo.length
  for (let i = 0; i < nb; i++) {
    const y0 = Math.floor((yRio * i) / nb)
    const y1 = Math.floor((yRio * (i + 1)) / nb)
    rect(0, y0, W, y1 - y0, p.cielo[i])
    if (i > 0) for (let x = 0; x < W; x += 2) pix(x + (y0 & 1), y0, p.cielo[i - 1])
  }

  // Estrellas: de noche muchas, al atardecer unas pocas arriba.
  const nEstrellas = momento === 'noche' ? 46 : momento === 'tarde' ? 10 : 0
  for (let i = 0; i < nEstrellas; i++) {
    const x = Math.floor(azar(i, 1) * W)
    const y = Math.floor(azar(i, 2) * yRio * (momento === 'noche' ? 0.62 : 0.3))
    const s = (cuadro + Math.floor(azar(i, 3) * 8)) % 8
    if (s === 7) continue
    pix(x, y, p.estrella)
    if (s === 5 || s === 6) {
      pix(x - 1, y, p.estrella)
      pix(x + 1, y, p.estrella)
      pix(x, y - 1, p.estrella)
      pix(x, y + 1, p.estrella)
    }
  }

  // Sol del día, sol bajo del atardecer, luna de la noche.
  const ax = Math.round(W * 0.8)
  const ay = Math.round(yRio * (momento === 'dia' ? 0.15 : momento === 'tarde' ? 0.5 : 0.14))
  const r = momento === 'tarde' ? 8 : 6
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d2 = dx * dx + dy * dy
      if (d2 > r * r + r * 0.5) continue
      if (momento === 'noche') {
        const ex = dx - 3
        const ey = dy + 2
        if (ex * ex + ey * ey <= r * r + r * 0.5) continue // el mordisco de la luna creciente
        pix(ax + dx, ay + dy, p.astro)
      } else {
        const borde = d2 > (r - 1.7) * (r - 1.7) && dx + dy > 0
        pix(ax + dx, ay + dy, borde ? p.astroSombra : p.astro)
      }
    }
  }
  if (momento === 'dia') {
    // Rayos que alternan entre "+" y "x" cada medio segundo.
    const rr = r + 3
    const cruz = (cuadro >> 2) & 1
    const pts = cruz
      ? [[rr, 0], [-rr, 0], [0, rr], [0, -rr]]
      : [[rr - 1, rr - 1], [-rr + 1, rr - 1], [rr - 1, -rr + 1], [-rr + 1, -rr + 1]]
    for (const [dx, dy] of pts) {
      pix(ax + dx, ay + dy, p.astroSombra)
      pix(ax + (dx > 0 ? 1 : dx < 0 ? -1 : 0) * 1 + dx, ay + dy, p.astroSombra)
    }
  }

  // Nubes a la deriva: avanzan de a un píxel, por eso se ven a saltitos.
  const colNube = { w: p.nube, s: p.nubeSombra }
  for (const n of NUBES_CFG) {
    const b = NUBES[n.b]
    const ancho = b[0].length
    const span = W + ancho * 2
    const x = Math.floor((n.x * span + seg * n.v) % span) - ancho
    mapa(b, x, Math.floor(yRio * n.y), colNube)
  }

  // Colinas: dos filas de siluetas escalonadas, la lejana más clara.
  for (let x = 0; x < W; x++) {
    const lejos = Math.round(yRio - 16 - 6 * Math.sin(x * 0.03 + 1) - 3 * Math.sin(x * 0.08))
    rect(x, lejos, 1, yRio - lejos, p.colinaLejos)
  }
  for (let x = 0; x < W; x++) {
    const cerca = Math.round(yRio - 7 - 4 * Math.sin(x * 0.05 + 2) - 2 * Math.sin(x * 0.13))
    rect(x, cerca, 1, yRio - cerca, p.colinaCerca)
  }

  // Árboles plantados en la colina cercana, con su copa meciéndose.
  const col = { l: p.hoja, d: p.hojaOscura, t: p.tronco }
  const mece = [0, 0, 1, 1][(cuadro >> 3) & 3]
  const base = yRio - 2
  const arboles = [
    { b: 0, x: Math.round(W * 0.035) },
    { b: 1, x: Math.round(W * 0.2) },
    { b: 0, x: Math.round(W * 0.91) },
    { b: 1, x: Math.round(W * 0.78) },
  ]
  for (const a of arboles) {
    const m = ARBOLES[a.b]
    mapa(m, a.x, base - m.length + 1, col, a.x % 2 ? 1 - mece : mece)
  }

  // Río: ribera, agua y un brillo que corre.
  rect(0, yRio - 1, W, 1, p.ribera)
  rect(0, yRio, W, RIO, p.agua)
  for (let f = 0; f < RIO; f++) {
    for (let x = 0; x < W; x++) {
      if ((((x - cuadro + f * 3) % 14) + 14) % 14 < 3) pix(x, yRio + f, p.aguaBrillo)
    }
  }
  rect(0, yRioFin + 1, W, 1, p.ribera)

  // Pasto: tapiz con motas más oscuras y briznas que se mecen en dos poses.
  rect(0, yPasto, W, PASTO, p.pastoClaro)
  for (let y = yPasto + 1; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const q = azar(x, y, 11)
      if (q < 0.26) pix(x, y, p.pastoOscuro)
      else if (y > H - 3 && q < 0.5) pix(x, y, p.pastoPunta)
    }
  }
  for (let x = 0; x < W; x++) {
    if (azar(x, 0, 7) >= 0.24) continue
    const sw = ((cuadro >> 2) + Math.floor(azar(x, 3, 7) * 4)) & 1
    pix(x, yPasto - 1, p.pastoClaro)
    if (azar(x, 1, 7) < 0.55) pix(x + sw, yPasto - 2, p.pastoClaro)
  }

  // Luciérnagas de noche, titilando sobre el pasto.
  if (momento === 'noche') {
    for (let i = 0; i < 8; i++) {
      if ((cuadro + i * 3) % 10 >= 7) continue
      const x = Math.round(azar(i, 5) * W + 6 * Math.sin(seg * 0.7 + i * 2))
      const y = Math.round(yPasto - 9 - azar(i, 6) * 20 + 3 * Math.sin(seg * 1.1 + i))
      pix(x, y, p.luciernaga)
    }
  }
}

export function Pradera({ animo }: { animo: Animo }) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const momento = useRef<Momento>(MOMENTO[animo])
  const repinta = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = lienzo.current!
    const ctx = cv.getContext('2d')!
    const caja = cv.parentElement!
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)')
    let W = 0
    let H = 0

    const dibuja = () => {
      if (!W) return
      const oscuro = document.documentElement.dataset.tema === 'oscuro'
      pintar(ctx, W, H, quieto.matches ? 0 : performance.now(), paletaDe(momento.current, oscuro), momento.current)
    }
    repinta.current = dibuja

    const medir = () => {
      const r = caja.getBoundingClientRect()
      const w = Math.max(1, Math.ceil(r.width / PX))
      const h = Math.max(1, Math.ceil(r.height / PX))
      if (w === W && h === H) return
      W = w
      H = h
      cv.width = w
      cv.height = h
      cv.style.width = `${w * PX}px`
      cv.style.height = `${h * PX}px`
      dibuja()
    }

    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(caja)
    const tema = new MutationObserver(dibuja)
    tema.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] })
    quieto.addEventListener('change', dibuja)
    const t = window.setInterval(() => {
      if (!document.hidden && !quieto.matches) dibuja()
    }, PASO)
    return () => {
      obs.disconnect()
      tema.disconnect()
      quieto.removeEventListener('change', dibuja)
      window.clearInterval(t)
    }
  }, [])

  useEffect(() => {
    momento.current = MOMENTO[animo]
    repinta.current()
  }, [animo])

  return (
    <div className="pradera" aria-hidden="true">
      <canvas ref={lienzo} className="pradera__lienzo" />
    </div>
  )
}
