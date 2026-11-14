/**
 * Arte de la pradera 8 bit del Descanso: paletas por momento del día y los
 * mapas de bits (nubes, árboles). Va en TS y no en tokens de CSS por la misma
 * razón que los PNG de los monitos: es arte pixelado con su propia paleta
 * cerrada, no chrome de la interfaz. El modo oscuro la oscurece por código.
 */

export type Momento = 'dia' | 'tarde' | 'noche'

export type Paleta = {
  /** De arriba hacia el horizonte. */
  cielo: string[]
  colinaLejos: string
  colinaCerca: string
  ribera: string
  agua: string
  aguaBrillo: string
  pastoClaro: string
  pastoOscuro: string
  pastoPunta: string
  hoja: string
  hojaOscura: string
  tronco: string
  nube: string
  nubeSombra: string
  astro: string
  astroSombra: string
  estrella: string
  luciernaga: string
}

const DIA: Paleta = {
  cielo: ['#cfe4f6', '#d8eaf8', '#e1effa', '#eaf4fb', '#f3f9fd'],
  colinaLejos: '#b9dcc2',
  colinaCerca: '#98cc9a',
  ribera: '#7fb77f',
  agua: '#8ec5ec',
  aguaBrillo: '#e4f3fd',
  pastoClaro: '#86c27c',
  pastoOscuro: '#69ad66',
  pastoPunta: '#4d9657',
  hoja: '#6cb56e',
  hojaOscura: '#4a9558',
  tronco: '#8a5a3a',
  nube: '#fffaf0',
  nubeSombra: '#d9d6ea',
  astro: '#ffe17a',
  astroSombra: '#f5c443',
  estrella: '#fffaf0',
  luciernaga: '#ffe17a',
}

const TARDE: Paleta = {
  cielo: ['#d9b8dc', '#e5b9d6', '#f0bdd3', '#f6c8cf', '#fbd6c8'],
  colinaLejos: '#c9a3c4',
  colinaCerca: '#a885ad',
  ribera: '#8d7fa0',
  agua: '#e9a9c8',
  aguaBrillo: '#fff0f4',
  pastoClaro: '#7fae74',
  pastoOscuro: '#639a66',
  pastoPunta: '#4c8458',
  hoja: '#7a9f6a',
  hojaOscura: '#587f5c',
  tronco: '#7a4f3a',
  nube: '#fff0f2',
  nubeSombra: '#f1c9da',
  astro: '#ffb870',
  astroSombra: '#f29a5c',
  estrella: '#fffaf0',
  luciernaga: '#ffe17a',
}

const NOCHE: Paleta = {
  cielo: ['#9ea4dc', '#aab0e3', '#b6bbe8', '#c2c6ee', '#cfd2f3'],
  colinaLejos: '#8d97d0',
  colinaCerca: '#7581bd',
  ribera: '#6672ac',
  agua: '#7b8fd0',
  aguaBrillo: '#dfe4ff',
  pastoClaro: '#6f8fb4',
  pastoOscuro: '#5d7ca4',
  pastoPunta: '#4b6a94',
  hoja: '#5f84a8',
  hojaOscura: '#486a92',
  tronco: '#4d4f7d',
  nube: '#d9d6ea',
  nubeSombra: '#b5b6dc',
  astro: '#fffaf0',
  astroSombra: '#d9d6ea',
  estrella: '#fffaf0',
  luciernaga: '#ffe17a',
}

const BASE: Record<Momento, Paleta> = { dia: DIA, tarde: TARDE, noche: NOCHE }

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const mezcla = (c: string, con: string, t: number) => {
  const a = hex(c)
  const b = hex(con)
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

const TINTA_NOCHE = '#0d1230'

/** El modo oscuro baja tierra, cielo y agua hacia el azul de la noche; lo que
    brilla (astros, estrellas, brillo del agua, luciérnagas) queda como está. */
function oscurecer(p: Paleta): Paleta {
  const o = (c: string) => mezcla(c, TINTA_NOCHE, 0.62)
  const n = (c: string) => mezcla(c, TINTA_NOCHE, 0.4)
  return {
    ...p,
    cielo: p.cielo.map(o),
    colinaLejos: o(p.colinaLejos),
    colinaCerca: o(p.colinaCerca),
    ribera: o(p.ribera),
    agua: o(p.agua),
    pastoClaro: o(p.pastoClaro),
    pastoOscuro: o(p.pastoOscuro),
    pastoPunta: o(p.pastoPunta),
    hoja: o(p.hoja),
    hojaOscura: o(p.hojaOscura),
    tronco: o(p.tronco),
    nube: n(p.nube),
    nubeSombra: n(p.nubeSombra),
  }
}

const cache = new Map<string, Paleta>()
export function paletaDe(momento: Momento, oscuro: boolean): Paleta {
  const k = `${momento}${oscuro ? '-o' : ''}`
  let p = cache.get(k)
  if (!p) {
    p = oscuro ? oscurecer(BASE[momento]) : BASE[momento]
    cache.set(k, p)
  }
  return p
}

/* --- Mapas de bits ------------------------------------------------------- */
/* w nube · s sombra de nube · l hoja · d hoja oscura · t tronco · . vacío. */

export type Bitmap = string[]

export const NUBES: Bitmap[] = [
  [
    '........wwww..........',
    '......wwwwwwww....ww..',
    '...wwwwwwwwwwwwwwwwww.',
    '..wwwwwwwwwwwwwwwwwwww',
    '.wwwwwwwwwwwwwwwwwwwww',
    'swwwwwwwwwwwwwwwwwwwws',
    '.sssssssssssssssssssss',
  ],
  [
    '.....ww.......',
    '...wwwwww.ww..',
    '.wwwwwwwwwwww.',
    'wwwwwwwwwwwwww',
    'swwwwwwwwwwwws',
    '.ssssssssssss.',
  ],
  [
    '......www.........',
    '....wwwwwww.wwww..',
    '..wwwwwwwwwwwwwwww',
    '.wwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwww',
    'sswwwwwwwwwwwwwwss',
    '.ssssssssssssssss.',
  ],
]

export const ARBOLES: Bitmap[] = [
  // grande
  [
    '.....llllll.....',
    '...llllllllll...',
    '..llllllllllld..',
    '.llllllllllllld.',
    '.lllllllllllldd.',
    'llllllllllllldd.',
    'lllllllllllldddd',
    'llllllllllldddd.',
    '.lllllllldddddd.',
    '..lllldddddddd..',
    '...dddddddddd...',
    '.....dddddd.....',
    '......tttt......',
    '......tttt......',
    '......tttt......',
    '......tttt......',
    '.....tttttt.....',
    '....tt.tt.tt....',
  ],
  // chico
  [
    '...llll...',
    '.llllllld.',
    'llllllllld',
    'lllllllldd',
    'llllllddd.',
    '.lldddddd.',
    '...dddd...',
    '....tt....',
    '....tt....',
    '...tttt...',
  ],
]

/** Hash entero determinista: mismas "azar" en cada cuadro, sin Math.random. */
export const azar = (x: number, y: number, sal = 0) => {
  let h = (x * 374761393 + y * 668265263 + sal * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
