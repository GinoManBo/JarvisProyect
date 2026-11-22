import { useEffect, useRef } from 'react'
import type { Animo } from './Monitos'
import { azar, type Momento } from './praderaArte'
import type { Luz } from '../lib/sol'
import { publicarLuz } from '../lib/sol'
import {
  alturasDe,
  capasDe,
  opaco,
  coloresDe,
  filosDe,
  lienzoIluminado,
  lienzosDe,
  type ArteMontana,
  type Capa,
  type Colores,
  type Lienzos,
  type Monumento,
  type NombreHoja,
} from './montanaArte'

/**
 * El fondo de montaña: una montaña a la izquierda con un momo (duraznero) en
 * flor en la cima, un río que baja por su ladera hasta un arroyo que cruza la
 * escena, y koi nadando en él. Las capas son PNG de Aseprite (ver
 * montanaArte.ts); aquí se componen en un <canvas> de baja resolución anclado
 * abajo-izquierda y escalado sin suavizar, igual que la pradera.
 *
 * El cielo, los astros y las estrellas siguen siendo por código (se estiran a
 * cualquier tamaño de ventana); lo demás se ancla al borde de abajo y se
 * repite a lo ancho. El ambiente — nubes, brillo del agua, copa, pétalos —
 * avanza a 8 cuadros por segundo, el tironeo de 8 bit; los koi se repintan a
 * 15 para que naden de a un píxel sin saltos.
 */

const PASO = 66 // ms entre repintados (15 fps: el nado de los koi)
const CUADRO = 125 // ms por cuadro de ambiente (8 fps)

const MOMENTO: Record<Animo, Momento> = { estudia: 'dia', recreo: 'tarde', siesta: 'noche' }

/** c = celda de la hoja, y = fracción de la altura del cielo, v = px/s, x = fase. */
const NUBES_CFG = [
  { c: 0, y: 0.09, v: 2.6, x: 0.16 },
  { c: 1, y: 0.22, v: 1.5, x: 0.52 },
  { c: 2, y: 0.05, v: 2.0, x: 0.78 },
  { c: 1, y: 0.33, v: 1.1, x: 0.93 },
  { c: 2, y: 0.27, v: 1.7, x: 0.36 },
]
const NUBES_LEJOS = [
  { c: 0, y: 0.46, v: 0.55, x: 0.08 },
  { c: 1, y: 0.55, v: 0.7, x: 0.3 },
  { c: 2, y: 0.4, v: 0.5, x: 0.55 },
  { c: 3, y: 0.6, v: 0.8, x: 0.74 },
  { c: 1, y: 0.5, v: 0.6, x: 0.9 },
  { c: 0, y: 0.63, v: 0.75, x: 0.47 },
]
const NUBES_GRANDES = [
  { c: 0, y: 0.01, v: 3.6, x: 0.42 },
  { c: 1, y: 0.12, v: 3.1, x: 0.97 },
]

/** Un koi: lo único del fondo con memoria (dónde va y hacia dónde mira). */
type Koi = {
  fila: number
  x: number
  /** 0–1 dentro de la franja de agua. */
  carril: number
  mira: 1 | -1
  vel: number
  /** ms dentro del giro; -1 si va nadando. */
  giro: number
  /** ms hasta que se le ocurra dar la vuelta a medio camino. */
  antojo: number
  /** Fuera del agua: en el arco del salto, varado en la orilla o volviendo. */
  salto?: Salto
}

/** Un salto, en px del lienzo. `salta` va de (x0,y0) a (x1,y1) por un arco;
    si `vara`, (x1,y1) es la orilla y sigue `varado` (aletea ahí) y `vuelve`
    (otro arco, de la orilla a (x2,y2) en el agua). */
type Salto = {
  fase: 'salta' | 'varado' | 'vuelve'
  t: number
  dur: number
  x0: number
  y0: number
  x1: number
  y1: number
  x2: number
  y2: number
  vara: boolean
}

/** Lo que dura más que un cuadro además de los koi: cuándo toca el próximo
    salto y los chapoteos que siguen abiertos. */
type Rio = { proximo: number; chapoteos: { x: number; y: number; t: number }[] }

/** Los cuadros de koi-salto.png. */
const SUBE = 0
const ARCO = 1
const BAJA = 2
const CURVA = 3
const PLANO = 4
const PANZA = 5
/** El aleteo de un pez fuera del agua: se dobla, brinca, se da vuelta. */
const ALETEO = [PLANO, CURVA, ARCO, PANZA, CURVA, ARCO, PLANO, CURVA]
const ALETEO_BRINCO = [0, 1, 5, 0, 1, 4, 0, 1]
const ALETEO_X = [0, 1, 2, 1, 0, -1, -2, -1]

/** Altura (px) cuya sombra mide justo `largoSombra`: la del momo sobre el pie de la montaña. */
const ALTURA_REF = 248

type Puesta = { p: Monumento; x: number; abajo: number; col: number; fila: number }

/** Dónde cae cada monumento sólo cambia con el ancho, la escala y el momento. */
const puestasHechas = new WeakMap<ArteMontana, { clave: string; v: Puesta[] }>()

/** Un lienzo de trabajo para las sombras: se pintan opacas ahí y se componen de
    una vez con su alfa, así dos sombras que se cruzan no se oscurecen al doble. */
let lienzoSombra: HTMLCanvasElement | null = null
function sombraDe(W: number, H: number) {
  if (!lienzoSombra) lienzoSombra = document.createElement('canvas')
  if (lienzoSombra.width !== W || lienzoSombra.height !== H) {
    lienzoSombra.width = W
    lienzoSombra.height = H
  }
  const c = lienzoSombra.getContext('2d')!
  c.clearRect(0, 0, W, H)
  return { cv: lienzoSombra, c }
}

const entre = ([a, b]: [number, number]) => a + Math.random() * (b - a)

const CARRILES = [0.5, 0.12, 0.88, 0.3, 0.7]

function crearKoi(arte: ArteMontana): Koi[] {
  const { koi, capas } = arte.m
  return Array.from({ length: koi.cantidad }, (_, i) => ({
    fila: i % (capas.koi.filas ?? 1),
    x: -1,
    carril: CARRILES[i % CARRILES.length],
    mira: i % 2 ? -1 : 1,
    vel: 9 + ((i * 5) % 7),
    giro: -1,
    antojo: 7000 + azar(i, 4, 3) * 9000,
  }))
}

function avanzarKoi(
  arte: ArteMontana,
  lista: Koi[],
  rio: Rio,
  W: number,
  H: number,
  dt: number,
  reloj: number,
  px: number,
  noche: boolean,
) {
  const { koi, capas, agua, saltos } = arte.m
  const medio = capas.koi.ancho / 2
  const min = koi.xMin + medio
  const max = Math.max(min + 1, W - koi.margen - medio)
  const msGiro = koi.msGiro * (capas.koiGiro.cuadros ?? 1)
  const yAgua = H - agua.abajo - agua.alto
  const yDe = (k: Koi) => yAgua + Math.max(0, agua.alto - capas.koi.alto) * k.carril + capas.koi.alto / 2
  const chapotea = (x: number, y: number) => rio.chapoteos.push({ x, y, t: 0 })

  if (saltos && arte.hojas.koiSalto && dt > 0) {
    for (const c of rio.chapoteos) c.t += dt
    rio.chapoteos = rio.chapoteos.filter((c) => c.t < saltos.chapoteoMs * (arte.m.extras?.chapoteo?.cuadros ?? 5))
    rio.proximo -= dt
    if (rio.proximo <= 0) {
      // Salta uno que vaya nadando y que no quede tapado por la placa del
      // reloj (centrada); si no hay ninguno a la vista, se reintenta pronto.
      const placa = (arte.m.puente?.placaCss ?? 0) / 2 / px + 14
      const libre = (x: number) => x > min && x < max && Math.abs(x - W / 2) > placa
      const quien = lista.filter(
        (k) => !k.salto && k.giro < 0 && libre(k.x) && libre(k.x + k.mira * saltos.largo),
      )
      const k = quien[Math.floor(Math.random() * quien.length)]
      if (!k) rio.proximo = 2000
      else {
        const vara = Math.random() < saltos.varado
        const y0 = yDe(k)
        const x1 = k.x + k.mira * saltos.largo * (vara ? 0.7 : 1)
        k.salto = {
          fase: 'salta',
          t: 0,
          dur: saltos.saltoMs,
          x0: k.x,
          y0,
          x1,
          // Varado: cae en el borde de la orilla cercana, justo sobre el pasto.
          y1: vara ? H - agua.abajo + 3 : y0,
          x2: x1 - k.mira * 6,
          y2: y0,
          vara,
        }
        chapotea(k.x, y0)
        rio.proximo = entre(saltos.cadaMs) * (noche ? saltos.nocheFactor : 1)
      }
    }
  }

  lista.forEach((k, i) => {
    if (k.x < 0) k.x = min + ((i + 0.5) / lista.length) * (max - min) // primera medida
    const s = k.salto
    if (s && saltos) {
      s.t += dt
      if (s.t < s.dur) return
      if (s.fase === 'salta' && s.vara) {
        s.fase = 'varado'
        s.t = 0
        s.dur = entre(saltos.varadoMs)
      } else if (s.fase === 'varado') {
        s.fase = 'vuelve'
        s.t = 0
        s.dur = saltos.vueltaMs
      } else {
        // De vuelta al agua, con su chapoteo, y sigue nadando desde ahí.
        const x = s.fase === 'vuelve' ? s.x2 : s.x1
        chapotea(x, s.y2)
        k.x = Math.min(max, Math.max(min, x))
        k.salto = undefined
      }
      return
    }
    if (k.giro >= 0) {
      k.giro += dt
      if (k.giro >= msGiro) {
        k.giro = -1
        k.mira = k.mira === 1 ? -1 : 1
      }
      return
    }
    // Nada a impulsos: acelera y se deja llevar, nunca a velocidad pareja.
    const impulso = 0.7 + 0.3 * Math.sin(reloj / 1300 + i * 2.1)
    k.x += (k.mira * k.vel * impulso * dt) / 1000
    k.antojo -= dt
    const topa = (k.mira === 1 && k.x >= max) || (k.mira === -1 && k.x <= min)
    if (topa || k.antojo <= 0) {
      k.x = Math.min(max, Math.max(min, k.x))
      k.giro = 0
      k.antojo = 8000 + Math.random() * 12000
    }
  })
}

type Escena = {
  arte: ArteMontana
  capas: Lienzos
  col: Colores
  momento: Momento
  koi: Koi[]
  rio: Rio
  /** px CSS por píxel del fondo: el puente se mide contra la placa del reloj. */
  px: number
  oscuro: boolean
  /** 0–1: cuánto va del bloque del pomodoro; mueve el sol y la luna. */
  progreso: number
}

function pintar(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, e: Escena): Luz {
  const { m } = e.arte
  const { paleta, cielo } = e.col
  const C = capasDe(m)
  const cuadro = Math.floor(t / CUADRO)
  const seg = t / 1000
  const dia = e.momento === 'dia'
  const noche = e.momento === 'noche'
  let actual = ''
  /** Dónde pintan `rect` y `pix`: el lienzo, o el de trabajo de las sombras. */
  let destino = ctx
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    if (c !== actual) {
      destino.fillStyle = c
      actual = c
    }
    destino.fillRect(x, y, w, h)
  }
  const pix = (x: number, y: number, c: string) => rect(x, y, 1, 1, c)
  /** Una celda de una hoja; `espejo` la voltea en x. Si la hoja es opcional y
      no llegó, no pinta nada. */
  const celda = (n: NombreHoja, col: number, fila: number, x: number, y: number, espejo = false) => {
    const hoja = e.capas[n]
    if (!hoja) return
    const c = C[n]
    if (espejo) {
      ctx.save()
      ctx.translate(x + c.ancho, y)
      ctx.scale(-1, 1)
      ctx.drawImage(hoja, col * c.ancho, fila * c.alto, c.ancho, c.alto, 0, 0, c.ancho, c.alto)
      ctx.restore()
    } else {
      ctx.drawImage(hoja, col * c.ancho, fila * c.alto, c.ancho, c.alto, x, y, c.ancho, c.alto)
    }
  }
  const arriba = (c: Capa) => H - (c.abajo ?? 0) - c.alto
  const mosaico = (n: NombreHoja, y: number, col = 0) => {
    for (let x = 0; x < W; x += C[n].ancho) celda(n, col, 0, x, y)
  }
  const cuadros = (n: NombreHoja) => C[n]?.cuadros ?? 1
  const filas = (n: NombreHoja) => C[n]?.filas ?? 1

  const yHorizonte = H - (C.lejos.abajo ?? 0)
  const yAgua = H - m.agua.abajo - m.agua.alto

  // Cielo en bandas, con una fila de dither en cada frontera.
  const nb = cielo.bandas.length
  for (let i = 0; i < nb; i++) {
    const y0 = Math.floor((yHorizonte * i) / nb)
    const y1 = Math.floor((yHorizonte * (i + 1)) / nb)
    rect(0, y0, W, y1 - y0, cielo.bandas[i])
    if (i > 0) for (let x = 0; x < W; x += 2) pix(x + (y0 & 1), y0, cielo.bandas[i - 1])
  }

  // Estrellas: de noche muchas, al atardecer unas pocas arriba.
  const nEstrellas = noche ? 70 : dia ? 0 : 14
  for (let i = 0; i < nEstrellas; i++) {
    const x = Math.floor(azar(i, 1) * W)
    const y = Math.floor(azar(i, 2) * yHorizonte * (noche ? 0.62 : 0.3))
    const s = (cuadro + Math.floor(azar(i, 3) * 8)) % 8
    if (s === 7) continue
    pix(x, y, cielo.estrella)
    if (s === 5 || s === 6) {
      pix(x - 1, y, cielo.estrella)
      pix(x + 1, y, cielo.estrella)
      pix(x, y - 1, cielo.estrella)
      pix(x, y + 1, cielo.estrella)
    }
  }

  // El astro, a la derecha y lejos de la montaña y del reloj. De día un sol
  // encendido: núcleo claro, halo punteado en dos anillos que late y ocho
  // rayos que alternan largo y corto. Al atardecer un sol grande y bajo, en
  // bandas, que se mete detrás de la cordillera. De noche, la luna creciente.
  const halo = cielo.halo ?? cielo.astro
  const nucleo = cielo.nucleo ?? cielo.astro
  // El astro camina con el bloque del pomodoro. De día sale por detrás de la
  // montaña del momo, sube y cruza el cielo hasta caer a la derecha; al
  // atardecer se va hundiendo hacia la cordillera; de noche la luna hace el
  // camino al revés y termina tras la montaña. Con el reloj detenido se queda
  // donde va.
  const p = Math.max(0, Math.min(1, e.progreso))
  const [fx, altura] = dia
    ? [0.1 + 0.8 * p, Math.sin(Math.PI * (0.08 + 0.84 * p))]
    : noche
      ? [0.9 - 0.76 * p, 0.35 + 0.65 * Math.sin(Math.PI * p)]
      : [0.74 + 0.16 * p, 0.42 - 0.3 * p]
  // De día el sol es chico y sin anillo ralo: la luz la lleva el paisaje, no el
  // disco (§15). En tema oscuro, de día o de tarde, tampoco hay anillo ralo.
  const r = dia ? 9 : noche ? 10 : 17
  const pu = m.puente ?? { placaCss: 0, margen: 0 }
  const mitadPlaca = pu.placaCss / 2 / e.px
  const ax = Math.round(W * fx)
  // Sobre la placa del reloj está el título: ahí el astro va pegado arriba, y
  // el tope se suelta de a poco al alejarse del centro (sin saltos).
  const tope = r + 6 + Math.max(0, Math.abs(ax - W / 2) - mitadPlaca * 0.5) * 2.5
  const ay = Math.min(Math.round(yHorizonte * (1 - 0.92 * altura)), Math.round(tope))
  const mx = C.montana.x ?? 0
  const my = arriba(C.montana)
  const tx = C.momo.x ?? 0
  const ty = arriba(C.momo)
  /** El astro quedó detrás de la montaña o de la copa: cuenta como tapado
      cuando lo está la mayor parte del disco (centro y cuatro puntos a medio
      radio), no por un solo píxel, para que la luz no se prenda y apague de golpe. */
  const detras = (x: number, y: number) => opaco(e.arte, 'montana', x - mx, y - my) || opaco(e.arte, 'momo', x - tx, y - ty)
  const h = r >> 1
  const tapada =
    [[0, 0], [-h, 0], [h, 0], [0, -h], [0, h]].reduce((n, [dx, dy]) => n + (detras(ax + dx, ay + dy) ? 1 : 0), 0) >= 3
  const late = (cuadro >> 2) & 1
  const r1 = r + (noche ? 2 : dia ? 3 : 4) + late // anillo denso
  const r2 = dia || (e.oscuro && !noche) ? r1 : r + (noche ? 6 : 13) + late // anillo ralo
  for (let dy = -r2; dy <= r2; dy++) {
    for (let dx = -r2; dx <= r2; dx++) {
      const d2 = dx * dx + dy * dy
      const x = ax + dx
      const y = ay + dy
      if (d2 > r * r + r * 0.5) {
        if (d2 <= r1 * r1) {
          if ((x + y) & 1) pix(x, y, halo)
        } else if (d2 <= r2 * r2 && !(x & 1) && (y & 3) === (x & 2)) pix(x, y, halo)
        continue
      }
      if (noche) {
        const ex = dx - 5
        const ey = dy + 3
        if (ex * ex + ey * ey <= r * r + r * 0.5) continue // el mordisco de la luna
        pix(x, y, cielo.astro)
      } else if (dia) {
        const nx = dx + 3
        const ny = dy + 3
        const borde = d2 > (r - 2.4) * (r - 2.4) && dx + dy > 0
        pix(x, y, borde ? cielo.astroSombra : nx * nx + ny * ny <= (r - 5) * (r - 5) ? nucleo : cielo.astro)
      } else {
        // Atardecer: claro arriba, naranja al medio, rojo abajo; fronteras en dither.
        const banda = dy < -6 || (dy === -6 && (x & 1)) ? nucleo : dy < 5 || (dy === 5 && (x & 1)) ? cielo.astro : cielo.astroSombra
        pix(x, y, banda)
      }
    }
  }
  if (dia) {
    const largo = (cuadro >> 2) & 1
    for (let k = 0; k < 8; k++) {
      const diagonal = k & 1
      const desde = r + 7
      const hasta = desde + (e.oscuro ? 1 : (diagonal ? 1 : 0) === largo ? 3 : 1)
      const ux = [1, 1, 0, -1, -1, -1, 0, 1][k]
      const uy = [0, 1, 1, 1, 0, -1, -1, -1][k]
      const f = diagonal ? 0.72 : 1
      for (let d = desde; d <= hasta; d++) pix(ax + Math.round(ux * d * f), ay + Math.round(uy * d * f), halo)
    }
  }

  // La luz del momento (§15) y la silueta de montaña + momo medida desde el pie:
  // con ella se ve si el sol recién asoma por la cumbre (el escalón va en
  // damero) y se proyecta la sombra larga.
  const L = m.luz?.[e.momento]
  const sombra = e.col.luz.sombra
  const altMontana = alturasDe(e.arte, 'montana')!
  const altMomo = alturasDe(e.arte, 'momo')!
  const silueta = Int16Array.from(altMontana)
  const pieMomo = (C.momo.abajo ?? 0) - (C.montana.abajo ?? 0)
  for (let c = 0; c < altMomo.length; c++) {
    const i = tx + c - mx
    if (altMomo[c] && i >= 0 && i < silueta.length) silueta[i] = Math.max(silueta[i], pieMomo + altMomo[c])
  }
  const yPie = H - (C.montana.abajo ?? 0)
  let cumbre = Infinity
  for (let i = 0; i < silueta.length; i++) if (silueta[i] && yPie - silueta[i] < ay) cumbre = Math.min(cumbre, Math.abs(mx + i - ax))
  const nivel: 0 | 1 | 2 = !L?.escalon || tapada ? 0 : cumbre < 12 ? 1 : 2
  const ladoMontana: 1 | -1 = ax >= mx + (m.luz?.cresta.montana ?? C.montana.ancho >> 1) ? 1 : -1

  /** El filo que da al sol, en el color del borde: sólido de 1 px y, detrás,
      una banda translúcida de `anchoBanda`. Con el sol alto se encienden
      también los bordes de arriba. Con el sol tapado sólo la cresta cerca de
      él, a contraluz. Nunca bajo la placa del reloj ni en la franja de los
      animales. `soloFilo` = sin banda ni borde de arriba (lo chico). */
  const filos = (n: NombreHoja, col: number, x0: number, y0: number, lado: 1 | -1, soloFilo = false, alfa = 1) => {
    // Lo chico lleva sólo el filo del costado: en piezas finas el de arriba
    // las pintaba enteras de claro.
    if (!L) return
    const ancho = soloFilo ? 0 : L.anchoBanda
    const F = filosDe(e.arte, n, col, ancho)
    if (!F) return
    const pon = (lista: Int16Array, c: string, cerca = false) => {
      for (let i = 0; i < lista.length; i += 2) {
        const x = x0 + lista[i]
        const y = y0 + lista[i + 1]
        if (y > H - 18 || Math.abs(x - W / 2) < mitadPlaca) continue
        if (cerca && Math.abs(x - ax) > 28) continue
        pix(x, y, c)
      }
    }
    const borde = e.col.luz.borde
    const alto = altura >= 0.35
    if (tapada) {
      velo(alfa, () => pon(F.arriba, halo, true))
      return
    }
    if (noche) {
      velo(0.6 * alfa, () => pon(F.lado[lado], borde))
      return
    }
    velo(alfa, () => {
      pon(F.lado[lado], borde)
      if (alto && !soloFilo) pon(F.arriba, borde)
    })
    if (ancho > 0 && L.alfaBanda > 0) {
      velo(L.alfaBanda * alfa, () => {
        pon(F.bandaLado[lado], borde)
        if (alto) pon(F.bandaArriba, borde)
      })
    }
  }

  // Los monumentos de piedra (§14), puestos una vez por cuadro: los del pie y
  // la cima se miden en montana.png, las pagodas sobre las lomas de la
  // cordillera (que se repite cada tesela). Ninguno bajo la placa ni el disco
  // del reloj; si un miembro de un grupo no cabe, no sale el grupo. Sin su PNG
  // no salen y la escena queda como siempre.
  const clavePuestas = `${W}|${e.px}|${e.momento}`
  const hechas = puestasHechas.get(e.arte)
  const puestas: Puesta[] = hechas?.clave === clavePuestas ? hechas.v : []
  if (m.monumentos && hechas?.clave !== clavePuestas) {
    const mitad = mitadPlaca + m.monumentos.margen
    const libre = (x0: number, x1: number) => x1 <= W / 2 - mitad || x0 >= W / 2 + mitad
    const altLejos = alturasDe(e.arte, 'lejos')!
    const tesela = C.lejos.ancho
    const caidos = new Set<string>()
    const candidatas: typeof puestas = []
    for (const p of m.monumentos.piezas) {
      const c = C[p.hoja]
      if (!c || !e.capas[p.hoja]) continue
      // Lo que se enciende: el yukimi cambia de celda; las pagodas, de fila.
      const enciende = !!p.luz && !dia
      const col = p.luz && p.ancla !== 'lejos' ? (enciende ? Math.min(1, cuadros(p.hoja) - 1) : 0) : (p.cuadro ?? 0) % cuadros(p.hoja)
      const fila = p.luz && p.ancla === 'lejos' && enciende ? Math.min(1, filas(p.hoja) - 1) : 0
      const lugares: { x: number; abajo: number }[] = []
      if (p.ancla === 'lejos') {
        // Se apoya en lo más bajo de la loma bajo su base, y se hunde un poco.
        let min = Infinity
        for (let cx = 0; cx < c.ancho; cx++) {
          if (opaco(e.arte, p.hoja, cx, c.alto - 1, col)) min = Math.min(min, altLejos[(p.x + cx) % tesela])
        }
        if (!Number.isFinite(min)) min = altLejos[p.x % tesela]
        const abajo = (C.lejos.abajo ?? 0) + min - (p.hundir ?? 0)
        for (let x = p.x; x < W; x += tesela) lugares.push({ x, abajo })
      } else if (p.ancla === 'cima') {
        let min = Infinity
        for (let i = p.x; i < p.x + c.ancho && i < altMontana.length; i++) if (altMontana[i]) min = Math.min(min, altMontana[i])
        if (!Number.isFinite(min)) continue
        lugares.push({ x: mx + p.x, abajo: (C.montana.abajo ?? 0) + min })
      } else lugares.push({ x: mx + p.x, abajo: p.abajo ?? 0 })
      for (const l of lugares) {
        if (l.x + c.ancho <= 0 || l.x >= W) continue
        if (!libre(l.x, l.x + c.ancho)) {
          if (p.grupo) caidos.add(p.grupo)
          continue
        }
        candidatas.push({ p, ...l, col, fila })
      }
    }
    for (const l of candidatas) if (!l.p.grupo || !caidos.has(l.p.grupo)) puestas.push(l)
    puestasHechas.set(e.arte, { clave: clavePuestas, v: puestas })
  }

  // Nubes en tres fondos: jirones lejanos y lentos cerca del horizonte, las
  // medianas, y cúmulos grandes y rápidos arriba. Avanzan de a un píxel.
  type NubeVista = { n: NombreHoja; c: number; x: number; ancho: number; y: number; yPx: number }
  const nubesVistas: NubeVista[] = []
  const todasNubes: NubeVista[] = []
  const nube = (n: NombreHoja, cfg: { c: number; y: number; v: number; x: number }) => {
    if (!e.capas[n]) return
    const ancho = C[n].ancho
    const span = W + ancho * 2
    const x = Math.floor((cfg.x * span + seg * cfg.v) % span) - ancho
    const c = cfg.c % cuadros(n)
    const yPx = Math.floor(yHorizonte * cfg.y)
    celda(n, c, 0, x, yPx)
    const vista = { n, c, x, ancho, y: cfg.y, yPx }
    todasNubes.push(vista)
    if (n !== 'nubesLejos') nubesVistas.push(vista)
  }
  for (const n of NUBES_LEJOS) nube('nubesLejos', n)
  for (const n of NUBES_CFG) nube('nubes', n)
  for (const n of NUBES_GRANDES) nube('nubesGrandes', n)

  // El astro detrás de una nube no desaparece: el disco se cuela en damero por
  // la nube y el canto de la nube que lo rodea se enciende de un px. Así a
  // mediodía, cuando el sol pasa bajo el cúmulo grande, sigue habiendo sol (y
  // a medianoche, luna).
  if (!tapada) {
    const enNube = (x: number, y: number) =>
      todasNubes.some((nb) => opaco(e.arte, nb.n, x - nb.x, y - nb.yPx, nb.c))
    if ([[0, 0], [-h, 0], [h, 0], [0, -h], [0, h]].some(([dx, dy]) => enNube(ax + dx, ay + dy))) {
      const R = r + 12
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const d2 = dx * dx + dy * dy
          if (d2 > R * R) continue
          const x = ax + dx
          const y = ay + dy
          if (!enNube(x, y)) continue
          if (d2 <= r * r + r * 0.5) {
            const mordida = noche && (dx - 5) * (dx - 5) + (dy + 3) * (dy + 3) <= r * r + r * 0.5
            if (!((x + y) & 1) && !mordida) pix(x, y, dia && d2 <= (r - 4) * (r - 4) ? nucleo : cielo.astro)
          } else if (!enNube(x + 1, y) || !enNube(x - 1, y) || !enNube(x, y - 1) || !enNube(x, y + 1)) {
            pix(x, y, d2 <= (r + 5) * (r + 5) ? cielo.astro : e.col.luz.borde)
          }
        }
      }
    }
  }

  // Una pareja de aves cruza el cielo cada tanto (no de noche).
  if (!noche && e.capas.aves && m.vida) {
    const { cadaMs, cruceMs } = m.vida.aves
    const vuelta = Math.floor(t / cadaMs)
    const u = (t % cadaMs) / cruceMs
    if (u < 1) {
      const aIzq = azar(vuelta, 1, 31) < 0.5
      const ancho = C.aves.ancho
      const y0 = yHorizonte * (0.1 + azar(vuelta, 2, 31) * 0.22)
      for (let i = 0; i < 2; i++) {
        const avance = u * (W + 60) - i * 15
        const x = Math.round(aIzq ? W + 8 - avance : avance - ancho - 8)
        const y = Math.round(y0 + i * 7 + 4 * Math.sin(seg * 0.9 + i))
        celda('aves', ((cuadro >> 1) + i * 2) % cuadros('aves'), 0, x, y, aIzq)
      }
    }
  }

  // Reflejos de arcoíris de la luz del día (sólo de día; en tema oscuro, apenas).
  // Son semitransparentes pero en la grilla del fondo: bandas de un color por
  // píxel, nunca un degradado. Laten despacio, al paso de los 8 cuadros.
  const iris = dia && m.arcoiris ? m.arcoiris : null
  const alfaIris = iris ? (e.oscuro ? iris.alfaOscuro : iris.alfa) : 0
  const velo = (alfa: number, pinta: () => void) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, alfa))
    pinta()
    ctx.globalAlpha = 1
  }
  if (iris) {
    // Un arco tenue que nace detrás de la cordillera, en la bruma.
    // Queda al lado contrario del sol y se nota más cuando el sol va bajo.
    const cx = Math.round(Math.max(W * 0.3, Math.min(W * 0.72, W - ax)))
    const cy = yHorizonte + 6
    const grosor = 2
    const R = Math.round(Math.min(W * 0.27, yHorizonte * 0.5))
    const pulso = 0.8 + 0.2 * Math.sin(Math.floor(seg * 2) / 2 / 1.6)
    velo(alfaIris * pulso * (0.45 + 0.55 * (1 - altura)), () => {
      for (let dy = -R; dy <= 0; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const d = Math.sqrt(dx * dx + dy * dy)
          const banda = Math.floor((R - d) / grosor)
          if (d > R || banda >= iris.colores.length) continue
          // Los pies del arco se deshacen en un punteado dentro de la bruma.
          if (dy > -R * 0.22 && ((cx + dx + cy + dy) & 1)) continue
          pix(cx + dx, cy + dy, iris.colores[banda])
        }
      }
    })
  }

  // Cordillera lejana entre la bruma y, delante, el suelo con su arroyo. Las
  // pagodas van sobre las lomas de la cordillera, dentro de la bruma.
  mosaico('lejos', arriba(C.lejos))
  for (const pz of puestas) if (pz.p.ancla === 'lejos') celda(pz.p.hoja, pz.col, pz.fila, pz.x, H - pz.abajo - C[pz.p.hoja].alto)
  // Las ventanas de las pagodas arden de tarde y de noche: un halo en damero
  // alrededor de cada una, para que se noten desde lejos.
  if (!dia) {
    const tibio = paleta.amarilloLuz ?? cielo.luciernaga
    ctx.globalAlpha = noche ? 0.45 : 0.28
    for (const pz of puestas) {
      if (pz.p.ancla !== 'lejos' || !pz.p.luz) continue
      const y0 = H - pz.abajo - C[pz.p.hoja].alto
      for (const [fx, fy] of pz.p.fuegos ?? []) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 3; dx++) {
            const ex = dx <= 0 ? -dx : dx - 1
            if (ex + Math.abs(dy) > 2 || (ex === 0 && dy === 0)) continue
            if ((pz.x + fx + dx + y0 + fy + dy) & 1) continue
            pix(pz.x + fx + dx, y0 + fy + dy, tibio)
          }
        }
      }
    }
    ctx.globalAlpha = 1
  }
  mosaico('suelo', arriba(C.suelo))

  // Hierbas, flores y piedras: sembradas por casilla de x con un hash fijo,
  // así no cambian al redimensionar (sólo aparecen más a la derecha). Tupidas
  // en las orillas, ralas y bajitas donde pisan los animales.
  const sembrar = (detras: boolean) => {
    const h = m.hierbas
    if (!h || !e.capas.hierbas) return
    const c = C.hierbas
    h.bandas.forEach((b, nb) => {
      if (!!b.detras !== detras) return
      for (let i = 0; i * h.paso < W; i++) {
        if (azar(i, nb, 21) >= b.densidad) continue
        const v = b.variantes[Math.floor(azar(i, nb, 22) * b.variantes.length)]
        const x = i * h.paso + Math.floor(azar(i, nb, 23) * (h.paso - 2)) - (c.ancho >> 1)
        const abajo = b.abajo[0] + Math.floor(azar(i, nb, 24) * (b.abajo[1] - b.abajo[0] + 1))
        const mece = filas('hierbas') > 1 && h.mecen.includes(v) && (((cuadro >> 2) + i) & 3) === 0 ? 1 : 0
        celda('hierbas', v % cuadros('hierbas'), mece, x, H - abajo - c.alto, azar(i, nb, 25) < 0.5)
      }
    })
  }
  sembrar(true)

  // Koi: nadan dentro de la franja de agua y nunca tocan las orillas.
  const kc = C.koi
  const holgura = Math.max(0, m.agua.alto - kc.alto)
  const nNado = cuadros('koi')
  const nGiro = cuadros('koiGiro')
  e.koi.forEach((k, i) => {
    if (k.salto) return // va por el aire o está en la orilla: se pinta más abajo
    const x = Math.round(k.x - kc.ancho / 2)
    const y = yAgua + Math.round(holgura * k.carril + 1.5 * Math.sin(seg * 0.7 + i * 2))
    if (k.giro >= 0) {
      // La hoja del giro va de mirar a la derecha a mirar a la izquierda.
      celda('koiGiro', Math.min(nGiro - 1, Math.floor(k.giro / m.koi.msGiro)), k.fila, x, y, k.mira === -1)
    } else {
      celda('koi', (Math.floor(t / m.koi.msCuadro) + i * 2) % nNado, k.fila, x, y, k.mira === -1)
    }
  })

  // El brillo del agua corre por encima de los peces.
  mosaico('brillo', yAgua, (cuadro >> 1) % cuadros('brillo'))

  // Chapoteos: donde un koi sale del agua y donde vuelve a entrar.
  if (m.saltos && e.capas.chapoteo) {
    const c = C.chapoteo
    for (const ch of e.rio.chapoteos) {
      const f = Math.floor(ch.t / m.saltos.chapoteoMs)
      if (f < cuadros('chapoteo')) celda('chapoteo', f, 0, Math.round(ch.x - c.ancho / 2), Math.round(ch.y - c.alto + 3))
    }
  }

  // El astro se refleja en el arroyo: una columna de trazos que tiembla. Al
  // atardecer ancha y cálida; de día y de noche, apenas un hilo.
  const reflejo = cielo.reflejo ?? cielo.astro
  const anchoReflejo = dia ? 5 : noche ? 4 : 13
  for (let f = 1; f < m.agua.alto - 1 && !tapada; f += 2) {
    const fase = (cuadro >> 1) + f
    const w = Math.max(2, Math.round(anchoReflejo * (0.45 + 0.55 * azar(f, fase & 3, 41))))
    rect(ax - (w >> 1) + ((fase & 1) ? 1 : -1), yAgua + f, w, 1, reflejo)
  }

  // Destellos de arcoíris bailando en el agua: trazos cortos que viven un
  // segundo cada uno y van cambiando de color y de sitio.
  if (iris) {
    const turno = Math.floor(seg)
    velo(alfaIris * 1.7, () => {
      for (let i = 0; i < Math.ceil(W / 26); i++) {
        const vez = turno + Math.floor(azar(i, 0, 71) * 4)
        if ((vez + i) % 3 === 0) continue // descansa un turno de cada tres
        const x = Math.floor(azar(i, vez, 72) * W)
        const y = yAgua + 2 + Math.floor(azar(i, vez, 73) * (m.agua.alto - 4))
        const c0 = Math.floor(azar(i, vez, 74) * iris.colores.length)
        const n = 2 + ((i + vez) & 1)
        for (let k = 0; k < n; k++) rect(x + k * 2, y, 2, 1, iris.colores[(c0 + k) % iris.colores.length])
      }
    })
  }

  // Sombras. Todo lo que se levanta del suelo proyecta la suya hacia el lado
  // contrario del astro y hacia el frente: larga y tendida cuando va bajo o
  // detrás de la montaña, corta cuando va alto. Son la silueta misma, acostada
  // (cada fila de sombra es un corte de la silueta a cierta altura), en un
  // solo tono frío semitransparente y sin difuminar.
  const anchoPuente = C.puente?.ancho ?? 96
  const xPuente = Math.ceil(W / 2 + pu.placaCss / 2 / e.px) + pu.margen
  /** Si a la derecha de la placa no queda sitio (ventana mínima), no hay puente
      ni lo que cuelga de él: mejor ninguno que uno metido bajo el reloj. */
  const cabePuente = xPuente + anchoPuente <= W - 2
  const largoSombra = 6 + (1 - altura) * 50
  const sesgo = (xc: number) => Math.max(-90, Math.min(90, ((xc - ax) / W) * (1 - altura * 0.6) * 150))
  const proyectar = (alt: ArrayLike<number>, x0: number, yBase: number, k = 1) => {
    const sx = sesgo(x0 + alt.length / 2)
    let tope = 0
    for (let x = 0; x < alt.length; x++) tope = Math.max(tope, alt[x])
    for (let j = 1; yBase + j < H; j++) {
      const z = ((j / largoSombra) * ALTURA_REF) / k
      if (z > tope) break
      const dx = Math.round((sx * j) / largoSombra)
      let ini = -1
      for (let x = 0; x <= alt.length; x++) {
        const dentro = x < alt.length && alt[x] >= z
        if (dentro && ini < 0) ini = x
        else if (!dentro && ini >= 0) {
          rect(x0 + ini + dx, yBase + j, x - ini, 1, sombra)
          ini = -1
        }
      }
    }
  }
  /** Pinta opaco en el lienzo de trabajo y lo compone de una vez con `alfa`;
      `recorte` deja sólo lo que cae dentro de lo que dibuje (destination-in). */
  const capaSombra = (alfa: number, pinta: () => void, recorte?: (c: CanvasRenderingContext2D) => void) => {
    if (alfa <= 0) return
    const { cv, c } = sombraDe(W, H)
    destino = c
    actual = ''
    c.imageSmoothingEnabled = false
    pinta()
    // Todo en el color de la sombra (las manchas de nube son la hoja misma).
    c.globalCompositeOperation = 'source-in'
    c.fillStyle = sombra
    c.fillRect(0, 0, W, H)
    if (recorte) {
      c.globalCompositeOperation = 'destination-in'
      recorte(c)
    }
    c.globalCompositeOperation = 'source-over'
    destino = ctx
    actual = ''
    velo(alfa, () => ctx.drawImage(cv, 0, 0))
  }
  const alfaSombra = (L?.alfaSombra ?? (dia ? 0.26 : noche ? 0.1 : 0.18)) * (e.oscuro ? 0.7 : 1)
  capaSombra(alfaSombra, () => {
    proyectar(silueta, mx, H - (C.montana.abajo ?? 0))
    const chica = (n: NombreHoja, x: number, abajo: number) => {
      const alt = alturasDe(e.arte, n)
      if (alt) proyectar(alt, x, H - abajo, 2.4)
    }
    if (C.puente && cabePuente) chica('puente', xPuente, C.puente.abajo ?? 0)
    if (C.toro && cabePuente) chica('toro', xPuente + (m.toro?.dx ?? 0), C.toro.abajo ?? 0)
    if (C.pilas) {
      for (const l of m.pilas?.lugares ?? []) {
        if (l.ancla === 'puente' && !cabePuente) continue
        chica('pilas', l.ancla === 'izq' ? l.x : l.ancla === 'der' ? W - l.x : xPuente + l.x, l.abajo)
      }
    }
    for (const pz of puestas) {
      if (!pz.p.sombra) continue
      const alt = alturasDe(e.arte, pz.p.hoja, pz.col)
      if (alt) proyectar(alt, pz.x, H - pz.abajo, 2.4)
    }
  })
  // Las nubes dejan su mancha en el suelo y el agua, y avanzan con ellas. La
  // mancha es la silueta de la propia nube (su celda, teñida), aplastada a `k`
  // de su alto sin suavizar: con sus rulos se lee como nube, no como franja.
  const alfaNube = (L?.alfaNube ?? (dia ? 0.1 : noche ? 0 : 0.06)) * (e.oscuro ? 0.7 : 1)
  const mancha = (nb: NubeVista, y0: number, k: number) => {
    const hoja = e.capas[nb.n]
    if (!hoja) return
    const c = C[nb.n]
    const alto = Math.max(2, Math.round(c.alto * k))
    const x0 = Math.round(nb.x + sesgo(nb.x + nb.ancho / 2) * 0.4)
    destino.drawImage(hoja, nb.c * c.ancho, 0, c.ancho, c.alto, x0, y0 - (alto >> 1), c.ancho, alto)
  }
  capaSombra(alfaNube, () => {
    for (const nb of nubesVistas) mancha(nb, Math.round(H - (C.montana.abajo ?? 0) + 8 + nb.y * 150), 0.3)
  })

  // La montaña, con el escalón de luz en la cara que da al sol y su filo
  // encendido; delante, los monumentos del pie y de la cima. Después, los
  // destellos que bajan por su río y la espuma al pie.
  ctx.drawImage(
    lienzoIluminado(e.arte, 'montana', e.momento, e.oscuro, ladoMontana, nivel),
    0, 0, C.montana.ancho, C.montana.alto, mx, my, C.montana.ancho, C.montana.alto,
  )
  filos('montana', 0, mx, my, ladoMontana)
  for (const pz of puestas) {
    if (pz.p.ancla === 'lejos') continue
    const c = C[pz.p.hoja]
    const y = H - pz.abajo - c.alto
    celda(pz.p.hoja, pz.col, 0, pz.x, y)
    filos(pz.p.hoja, pz.col, pz.x, y, ax >= pz.x + c.ancho / 2 ? 1 : -1, true)
  }
  // El farol de piedra (yukimi) arde de tarde y de noche: un resplandor en
  // damero alrededor de la ventana y un hilo de luz que tiembla en el agua.
  if (!dia) {
    const tibio = paleta.amarilloLuz ?? cielo.luciernaga
    for (const pz of puestas) {
      const fu = pz.p.fuego
      if (!pz.p.luz || !fu || pz.p.ancla === 'lejos') continue
      const fx = pz.x + fu[0]
      const fy = H - pz.abajo - C[pz.p.hoja].alto + fu[1]
      const parpadeo = ((cuadro >> 1) & 3) === 0 ? 0.8 : 1
      velo((noche ? 0.35 : 0.22) * parpadeo, () => {
        for (let dy = -2; dy <= 3; dy++) {
          for (let dx = -2; dx <= 3; dx++) {
            // Un rombo de 5 px centrado en la ventana de 2×2, sin pisarla.
            const ex = dx <= 0 ? -dx : dx - 1
            const ey = dy <= 0 ? -dy : dy - 1
            if (ex + ey > 2 || (ex === 0 && ey === 0)) continue
            if ((fx + dx + fy + dy) & 1) continue
            pix(fx + dx, fy + dy, tibio)
          }
        }
      })
      if (pz.abajo < H - yAgua) velo(0.3, () => rect(fx + ((cuadro >> 2) & 1 ? 1 : 0), H - pz.abajo + 1, 1, 4, tibio))
    }
  }
  // …y la sombra de las nubes cruzándole la ladera, recortada a la roca. Un
  // poco más marcada que en el suelo: sobre la roca clara, tan tenue, se leía
  // como un velo y no como sombra.
  capaSombra(
    alfaNube * 1.5,
    () => {
      for (const nb of nubesVistas) mancha(nb, Math.round(my + 30 + nb.y * 380), 0.9)
    },
    (c) => c.drawImage(lienzosDe(e.arte, e.momento, e.oscuro).montana, 0, 0, C.montana.ancho, C.montana.alto, mx, my, C.montana.ancho, C.montana.alto),
  )
  const pts = m.rio.puntos
  const tramos = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]))
  const largo = tramos.reduce((a, b) => a + b, 0)
  for (let i = 0; i < m.rio.destellos && largo > 0; i++) {
    let s = (cuadro * 3.5 + (i * largo) / m.rio.destellos + azar(i, 9) * 11) % largo
    let j = 0
    while (j < tramos.length - 1 && s > tramos[j]) s -= tramos[j++]
    const u = tramos[j] ? s / tramos[j] : 0
    const x = Math.round(mx + pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u + (azar(i, 8) - 0.5) * (m.rio.ancho - 1))
    const y = Math.round(my + pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u)
    rect(x, y, 1, 2, paleta.brillo)
  }
  celda('espuma', (cuadro >> 1) % cuadros('espuma'), 0, C.espuma.x ?? 0, arriba(C.espuma))

  // El momo: la copa se mece en dos poses, como los árboles de la pradera.
  const poseMomo = Math.min(cuadros('momo') - 1, [0, 0, 1, 1][(cuadro >> 3) & 3])
  const ladoMomo = ax >= tx + (m.luz?.cresta.momo ?? C.momo.ancho >> 1) ? 1 : -1
  ctx.drawImage(
    lienzoIluminado(e.arte, 'momo', e.momento, e.oscuro, ladoMomo, nivel),
    poseMomo * C.momo.ancho, 0, C.momo.ancho, C.momo.alto, tx, ty, C.momo.ancho, C.momo.alto,
  )
  filos('momo', poseMomo, tx, ty, ladoMomo, true, 0.7)

  // El puente va justo a la derecha de la placa del reloj, que está centrada;
  // el farol y una pila de piedras se cuelgan de él. El farol se enciende
  // cuando cae la tarde.
  const ladoDe = (x: number, ancho: number): 1 | -1 => (ax >= x + ancho / 2 ? 1 : -1)
  if (C.toro && cabePuente) {
    const x = xPuente + (m.toro?.dx ?? 0)
    const col = dia ? 0 : Math.min(1, cuadros('toro') - 1)
    celda('toro', col, 0, x, arriba(C.toro))
    filos('toro', col, x, arriba(C.toro), ladoDe(x, C.toro.ancho), true)
  }
  // El puente cruza de la orilla cercana a la lejana; un sendero pisado en el
  // pasto llega hasta su pie. No lleva filo: barandas de 1 px quedarían blancas enteras.
  if (C.sendero && C.puente && cabePuente) celda('sendero', 0, 0, xPuente + (pu.sendero?.dx ?? 0), arriba(C.sendero))
  if (C.puente && cabePuente) celda('puente', 0, 0, xPuente, arriba(C.puente))
  if (C.pilas && e.capas.pilas) {
    for (const l of m.pilas?.lugares ?? []) {
      if (l.ancla === 'puente' && !cabePuente) continue
      const x = l.ancla === 'izq' ? l.x : l.ancla === 'der' ? W - l.x : xPuente + l.x
      const col = l.variante % cuadros('pilas')
      const y = H - l.abajo - C.pilas.alto
      celda('pilas', col, 0, x, y)
      filos('pilas', col, x, y, ladoDe(x, C.pilas.ancho), true)
    }
  }

  sembrar(false)

  // Koi fuera del agua, vistos de costado: el arco del salto, el aleteo del
  // que quedó varado en la orilla (se dobla, brinca, se da vuelta) y el salto
  // de regreso. A 8 cuadros por segundo, como el resto del ambiente.
  if (m.saltos && e.capas.koiSalto) {
    const c = C.koiSalto
    for (const k of e.koi) {
      const s = k.salto
      if (!s) continue
      let x = s.x1
      let y = s.y1
      let f = PLANO
      if (s.fase === 'varado') {
        const paso = Math.floor(s.t / m.saltos.aleteoMs) % ALETEO.length
        f = ALETEO[paso]
        x += ALETEO_X[paso] * k.mira
        y -= ALETEO_BRINCO[paso]
      } else {
        const u = Math.min(1, s.t / s.dur)
        const [ax0, ay0, ax1, ay1, alto] =
          s.fase === 'salta' ? [s.x0, s.y0, s.x1, s.y1, m.saltos.alto] : [s.x1, s.y1, s.x2, s.y2, m.saltos.alto * 0.55]
        x = ax0 + (ax1 - ax0) * u
        y = ay0 + (ay1 - ay0) * u - alto * 4 * u * (1 - u)
        f = u < 0.34 ? SUBE : u < 0.67 ? ARCO : BAJA
      }
      // Al volver salta hacia atrás (x2 queda detrás de x1): mira hacia donde va.
      const haciaIzq = s.fase === 'vuelve' ? k.mira === 1 : k.mira === -1
      celda('koiSalto', Math.min(f, cuadros('koiSalto') - 1), k.fila % filas('koiSalto'), Math.round(x - c.ancho / 2), Math.round(y - c.alto / 2), haciaIzq)
    }
  }

  // Pétalos: nacen en la copa y caen meciéndose con la brisa hasta el suelo.
  // Cada uno es función pura del tiempo, sin estado.
  const nPetalo = cuadros('petalos')
  for (let i = 0; i < m.petalos.cantidad; i++) {
    const bx = tx + m.copa.x + azar(i, 1, 5) * m.copa.ancho
    const by = ty + m.copa.y + azar(i, 2, 5) * m.copa.alto
    const piso = H - 6 - azar(i, 3, 5) * (m.agua.abajo + m.agua.alto)
    const vy = 13 + azar(i, 4, 5) * 9
    const vx = 5 + azar(i, 5, 5) * 12
    const vida = (piso - by) / vy // segundos de caída
    if (vida <= 0) continue
    const u = (seg / (vida + 1.5) + azar(i, 6, 5)) % 1
    const edad = u * (vida + 1.5)
    if (edad > vida) continue // ya se posó: pausa antes del siguiente
    const x = Math.round(bx + vx * edad + 5 * Math.sin(edad * 1.7 + i))
    const y = Math.round(by + vy * edad)
    celda('petalos', ((cuadro >> 1) + i) % nPetalo, 0, x, y)
  }

  // Mariposas: revolotean sobre las orillas en un vaivén de dos senos; miran
  // hacia donde van. Libélulas: se quedan suspendidas sobre el agua y de
  // pronto saltan a otro punto.
  if (m.vida && e.capas.mariposas) {
    const c = C.mariposas
    for (let i = 0; i < m.vida.mariposas[e.momento]; i++) {
      const cx = W * (0.14 + 0.72 * azar(i, 1, 51))
      const cy = H - 52 - azar(i, 2, 51) * 60
      const fx = 0.21 + azar(i, 3, 51) * 0.15
      const x = cx + W * 0.1 * Math.sin(seg * fx + i * 2.3) + 9 * Math.sin(seg * 0.83 + i)
      const y = cy + 9 * Math.sin(seg * 0.47 + i * 1.7) + 4 * Math.sin(seg * 1.9 + i)
      const haciaIzq = Math.cos(seg * fx + i * 2.3) < 0
      celda('mariposas', (cuadro + i) % cuadros('mariposas'), i % filas('mariposas'), Math.round(x - c.ancho / 2), Math.round(y), haciaIzq)
    }
  }
  if (m.vida && e.capas.libelulas) {
    const c = C.libelulas
    const TRAMO = 2100
    const punto = (i: number, k: number) => [
      W * (0.08 + 0.84 * azar(i, k, 61)),
      yAgua - 10 + azar(i, k, 62) * (m.agua.alto + 2),
    ]
    for (let i = 0; i < m.vida.libelulas[e.momento]; i++) {
      const tt = t + i * 870
      const k = Math.floor(tt / TRAMO)
      const u = Math.min(1, ((tt % TRAMO) / TRAMO) * 5) // el salto dura un quinto del tramo
      const [x0, y0] = punto(i, k - 1)
      const [x1, y1] = punto(i, k)
      const s = u * u * (3 - 2 * u)
      const x = x0 + (x1 - x0) * s
      const y = y0 + (y1 - y0) * s + (u >= 1 ? cuadro & 1 : 0)
      celda('libelulas', cuadro % cuadros('libelulas'), i % filas('libelulas'), Math.round(x - c.ancho / 2), Math.round(y), x1 < x0)
    }
  }

  // Fantasmas de lente: anillos prismáticos en fila desde el sol, cruzando la
  // escena hacia el lado contrario. Los que caerían detrás del disco o de la
  // placa del reloj no se pintan; con el sol tapado no hay ninguno.
  if (iris && !tapada && !e.oscuro) {
    const hx = W - ax - ax
    const hy = yAgua + 4 - ay
    const fantasmas = [
      { u: 0.24, r: 5 },
      { u: 0.43, r: 9 },
      { u: 0.62, r: 4 },
      { u: 0.8, r: 12 },
      { u: 0.97, r: 6 },
    ]
    fantasmas.forEach((g, i) => {
      const vaiven = Math.sin(Math.floor(seg * 2) / 2 / 2.3 + i * 1.3)
      const gx = Math.round(ax + hx * (g.u + 0.012 * vaiven))
      const gy = Math.round(ay + hy * (g.u + 0.012 * vaiven))
      if (Math.abs(gx - W / 2) < mitadPlaca + g.r + 4) return
      velo(alfaIris * (0.75 + 0.25 * vaiven), () => {
        for (let dy = -g.r; dy <= g.r; dy++) {
          for (let dx = -g.r; dx <= g.r; dx++) {
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > g.r + 0.3) continue
            const banda = Math.floor(g.r + 0.3 - d)
            // Borde en bandas de arcoíris; el centro, un velo claro punteado.
            if (banda < iris.colores.length && banda < Math.max(2, g.r >> 1)) pix(gx + dx, gy + dy, iris.colores[(banda + i) % iris.colores.length])
            else if ((gx + dx + gy + dy) & 1) pix(gx + dx, gy + dy, nucleo)
          }
        }
      })
    })
  }

  // Luciérnagas de noche, titilando sobre la orilla.
  if (noche) {
    const yOrilla = H - m.agua.abajo
    for (let i = 0; i < 12; i++) {
      if ((cuadro + i * 3) % 10 >= 7) continue
      const x = Math.round(azar(i, 5) * W + 10 * Math.sin(seg * 0.7 + i * 2))
      const y = Math.round(yOrilla - 12 - azar(i, 6) * 46 + 5 * Math.sin(seg * 1.1 + i))
      rect(x, y, 1, 1, cielo.luciernaga)
    }
  }

  return {
    x: ax / W,
    altura,
    intensidad:
      (L?.intensidad ?? (dia ? 1 : noche ? 0.3 : 0.65)) *
      (tapada ? 0.55 : 1) *
      (e.oscuro ? (m.oscuro.atenuar?.[e.momento]?.intensidad ?? 1) : 1),
    tapada,
  }
}

export function Montana({ animo, arte, progreso }: { animo: Animo; arte: ArteMontana; progreso: number }) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const momento = useRef<Momento>(MOMENTO[animo])
  const repinta = useRef<() => void>(() => {})
  const avance = useRef(progreso)

  useEffect(() => {
    const cv = lienzo.current!
    const ctx = cv.getContext('2d')!
    const caja = cv.parentElement!
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)')
    const koi = crearKoi(arte)
    const rio: Rio = { proximo: 6000, chapoteos: [] }
    let W = 0
    let H = 0
    let previo = performance.now()
    let px = arte.m.px
    let publicada = ''

    const dibuja = () => {
      if (!W) return
      const ahora = performance.now()
      const dt = Math.min(200, ahora - previo)
      previo = ahora
      const oscuro = document.documentElement.dataset.tema === 'oscuro'
      // Con movimiento reducido la escena es una estampa: el tiempo no corre y
      // los koi se quedan donde están (un instante fijo con pétalos en el aire).
      avanzarKoi(arte, koi, rio, W, H, quieto.matches ? 0 : dt, ahora, px, momento.current === 'noche')
      ctx.imageSmoothingEnabled = false
      const luz = pintar(ctx, W, H, quieto.matches ? 5000 : ahora, {
        arte,
        capas: lienzosDe(arte, momento.current, oscuro),
        col: coloresDe(arte.m, momento.current, oscuro),
        momento: momento.current,
        koi,
        rio,
        px,
        oscuro,
        progreso: avance.current,
      })
      // Los monitos proyectan su sombra con esta luz: se avisa sólo cuando cambia.
      const firma = `${luz.x.toFixed(3)} ${luz.altura.toFixed(3)} ${luz.intensidad} ${luz.tapada}`
      if (firma !== publicada) {
        publicada = firma
        publicarLuz(luz)
      }
    }
    repinta.current = dibuja

    const medir = () => {
      const r = caja.getBoundingClientRect()
      px = arte.m.px + (r.width > arte.m.pxAncho ? 1 : 0)
      const w = Math.max(1, Math.ceil(r.width / px))
      const h = Math.max(1, Math.ceil(r.height / px))
      if (w === W && h === H && cv.style.width === `${w * px}px`) return
      W = w
      H = h
      cv.width = w
      cv.height = h
      cv.style.width = `${w * px}px`
      cv.style.height = `${h * px}px`
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
  }, [arte])

  useEffect(() => {
    momento.current = MOMENTO[animo]
    repinta.current()
  }, [animo])

  // El sol sigue al reloj aun con movimiento reducido: cada segundo que pasa
  // se repinta la estampa con el astro y las sombras en su sitio.
  useEffect(() => {
    avance.current = progreso
    repinta.current()
  }, [progreso])

  return (
    <div className="pradera" aria-hidden="true">
      <canvas ref={lienzo} className="pradera__lienzo" />
    </div>
  )
}
