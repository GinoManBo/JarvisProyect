import { AGARRE, AGARRE_TREPAR, type Animal, type NombreAnimacion, type Tiempos } from './tipos'
import type { AnimacionPiedra } from './piedra'

/**
 * El motor de los monitos: dónde está cada animal, hacia dónde va y qué está
 * haciendo. Lógica pura — no toca el DOM ni React —; la vista (Monitos.tsx)
 * llama a `avanzar` en cada cuadro y pinta lo que encuentra en cada `Mono`.
 * El contrato con el arte está en .ui-pipeline/05-monitos-juego.md.
 *
 * Coordenadas: `x` es el centro del animal en px desde el borde izquierdo del
 * área; `y` es la ALTURA de la base de su caja sobre el suelo (0 = apoyado,
 * positivo = arriba). Las velocidades están en px/s y los tiempos en ms.
 *
 * Cada mono es una máquina de estados:
 *   reposo   quieto; al vencer `espera` el cerebro decide (pasear, dormir…)
 *   caminar  va a `destino` con su andar (pasos, saltos o vuelo)
 *   dormir   la siesta; despierta cuando el ánimo deja de ser siesta
 *   colgar   lo tienen tomado con el puntero
 *   trepar   (gatito) colgado del borde de arriba del área, intentando subir
 *   caer     fase `aire` (lo soltaron o se soltó: gravedad y rebote en las
 *            paredes; con `rueda`, cae hecho bolita en `voltereta`) y fase
 *            `suelo` (el aplaste del aterrizaje, o `tendido` si cayó de espalda)
 *   jugar    su jugada dentro de un juego (el juego le mueve x/y con un arco)
 *   reaccion le hicieron algo
 *   bajar    (Appa) baja a dormir en zigzag: planea de lado a lado, vira en cada
 *            extremo y el vaivén se angosta hasta posarse
 *   despertar (Appa) sale del sueño: se estira y bosteza, en el suelo
 *   despegar (Appa) se agazapa, salta en la marca `impulso` y sube a volar
 *   escondido (cuy) metido en la piedra: no se ve ni se mueve; lo lleva la piedra
 *
 * La piedra (`mu.piedra`) no es un animal: es un objeto del mapa con su propia
 * maquinita — vacía, entrando, ocupada, asomando, saliendo, toque — y su propia
 * física para cuando la arrastran. El cuy se esconde en ella por gusto (recreo),
 * a dormir (siesta) o del susto; ver `avanzarPiedra`.
 *
 * Los juegos (sólo en recreo) son guiones de a dos — actor y objetivo — que
 * avanzan por fases; mientras dura, el juego manda sobre sus dos monos y el
 * cerebro no los toca. Un planificador lanza uno cada tanto, a lo más dos a la vez.
 * Las gracias del gatito (escalar el marco, asustarse con el perro, subirse a
 * dormir encima de otro) son juegos también y cuentan para ese tope.
 *
 * "El marco" es el borde de ARRIBA del área de los monitos (el canto de la barra
 * de navegación): el reloj no vive en una tarjeta con borde propio. Sale de
 * `mu.alto`, que la vista mide del DOM y sigue a la ventana.
 */

export type Animo = 'estudia' | 'recreo' | 'siesta'
export type EstadoMono =
  | 'reposo' | 'caminar' | 'dormir' | 'colgar' | 'trepar' | 'caer' | 'jugar' | 'reaccion'
  | 'bajar' | 'despertar' | 'despegar' | 'escondido'

type Rango = readonly [number, number]

type Rasgos = {
  /** Su sitio, en fracción del ancho: ahí duerme y alrededor pasea. */
  casa: number
  /** Cuánto se aleja de casa paseando, en fracción del ancho. */
  radio: number
  /** El orden en que despiertan (80 ms entre uno y otro). */
  orden: number
  /** px/s con la caja de 128; escala con la caja. */
  vel: number
  paso: 'andar' | 'saltos' | 'vuelo'
  /** Altura del salto al andar, en fracción de la caja. */
  saltoAlto: number
  /** Periodo de un salto si el arte no da uno razonable. */
  saltoMs: number
  /** Cuánto dura un paseo y cuánto un descanso, en recreo. */
  camina: Rango
  reposa: Rango
  /** El respingo del susto, en fracción de la caja (el caracol se esconde: 0). */
  susto: number
  /** Altura del lomo sobre el suelo, en fracción de la caja, sentado y dormido:
      ahí se acuesta el gatito cuando se le sube encima. Sale de la silueta real
      (columnas del cuerpo, no el tope de la caja: el validador imprime una
      medida gruesa que a veces es la cabeza o una pata levantada), con ~0,03
      menos porque el gato se hunde un poco. `reposo: null` = sentado no ofrece
      lomo (el perrito se sienta de frente y lo único de arriba es la cabeza):
      despierto no sirve de cama. */
  lomo: {
    reposo: number | null
    dormir: number
    /** Cuánto hacia la grupa queda el lomo respecto del ancla, en fracción de la
        caja (el conejito y la ranita se sientan erguidos: el lomo va atrás). */
    atras: number
  }
}

/** La personalidad de cada uno (tabla 3 del contrato). Las casas van repartidas
    para que en la siesta no duerman unos encima de otros (Appa, que aterriza,
    tiene su hueco entre el caracol y el perrito). */
export const RASGOS: Record<Animal, Rasgos> = {
  conejito: { casa: 0.07, radio: 0.16, orden: 0, vel: 74, paso: 'saltos', saltoAlto: 0.2, saltoMs: 620, camina: [1800, 4200], reposa: [2000, 5000], susto: 0.12, lomo: { reposo: 0.31, dormir: 0.24, atras: 0.13 } },
  gatito: { casa: 0.2, radio: 0.16, orden: 1, vel: 44, paso: 'andar', saltoAlto: 0, saltoMs: 0, camina: [2500, 5500], reposa: [3500, 8000], susto: 0.14, lomo: { reposo: 0.39, dormir: 0.25, atras: 0.05 } },
  cuy: { casa: 0.33, radio: 0.14, orden: 2, vel: 104, paso: 'saltos', saltoAlto: 0.05, saltoMs: 240, camina: [700, 1800], reposa: [1200, 3200], susto: 0.1, lomo: { reposo: 0.31, dormir: 0.19, atras: 0.03 } },
  caracol: { casa: 0.45, radio: 0.08, orden: 3, vel: 7, paso: 'andar', saltoAlto: 0, saltoMs: 0, camina: [7000, 14000], reposa: [4000, 9000], susto: 0, lomo: { reposo: 0.31, dormir: 0.28, atras: 0.06 } },
  perrito: { casa: 0.74, radio: 0.18, orden: 4, vel: 80, paso: 'andar', saltoAlto: 0, saltoMs: 0, camina: [3000, 6000], reposa: [1500, 4000], susto: 0.12, lomo: { reposo: null, dormir: 0.23, atras: 0 } },
  ranita: { casa: 0.9, radio: 0.16, orden: 5, vel: 82, paso: 'saltos', saltoAlto: 0.42, saltoMs: 1100, camina: [1500, 3600], reposa: [3500, 8500], susto: 0.3, lomo: { reposo: 0.28, dormir: 0.25, atras: 0.1 } },
  appa: { casa: 0.59, radio: 0.42, orden: 6, vel: 52, paso: 'vuelo', saltoAlto: 0, saltoMs: 0, camina: [5000, 10000], reposa: [3000, 6500], susto: 0, lomo: { reposo: 0.49, dormir: 0.34, atras: 0.05 } },
}

export const ANIMALES = Object.keys(RASGOS) as Animal[]

const GRAVEDAD = 2600 // px/s²
const LANCE_MAX = 1500 // tope de la velocidad con que sale lanzado
const REBOTE_PARED = 0.55
const AIRE: Rango = [0.25, 0.85] // tramo del ciclo de `caminar` en que el saltarín va en el aire
const MARGEN_TECHO = 8 // Appa vuela con el lomo a 8 px del borde de arriba
const JUEGOS_A_LA_VEZ = 2
const JUEGO_MAX_MS = 22000
const DE_ESPALDA = 0.4 // de cada voltereta, cuántas terminan de espalda (`tendido`)
const SUSTO_PROB = 0.25 // de las veces que el perro se le viene encima, cuántas se asusta
const SIESTA_ENCIMA_PROB = 0.6 // de las siestas, en cuántas se va a dormir sobre otro
const BAJADA_VEL = 110 // px/s de caída de Appa en la bajada, con la caja de 128
const BARRIDO_MS = 1500 // lo que tarda un barrido de la bajada, de un extremo al otro

/** La bajada en zigzag de Appa: x = cx + A·sen(π·t/P), con la amplitud A que se
    angosta hasta 0 al tocar suelo; cada medio periodo impar es un extremo: ahí vira. */
type Bajada = { cx: number; cxLado: number; casa: number; libre: number; y0: number; amplitud: number; ms: number; periodo: number; lado: 1 | -1; t: number; viraje: number; finViraje: number }

/** Un movimiento guionado: de x0 a x1, con un arco de `alto` encima y, si
    `sube` no es 0, terminando a otra altura (el salto al borde o a un lomo). */
type Arco = { x0: number; x1: number; y0: number; alto: number; sube: number; ms: number; t: number; rebotes: number }

export type Mono = {
  animal: Animal
  rasgos: Rasgos
  tiempos: Tiempos
  /** Falso cuando el CSS lo esconde (ventana baja): no existe para el motor. */
  presente: boolean
  /** Ya tiene sitio (la primera vez que aparece se pone en su casa). */
  colocado: boolean
  ancho: number
  alto: number
  /** Lado, en px, de la hoja ya pintada dentro de la caja (≤ ancho). */
  dibujo: number
  x: number
  y: number
  vx: number
  vy: number
  mira: 1 | -1
  /** Grados: el péndulo mientras cuelga. */
  inclinacion: number
  /** px extra de altura: el vaivén de Appa en el aire. */
  bamboleo: number
  estado: EstadoMono
  fase: 'aire' | 'suelo'
  /** ms en el estado, y cuánto dura si es de una pasada. */
  t: number
  fin: number
  /** ms que le quedan de reposo (o de sueño al despertar). */
  espera: number
  /** Lo que debe mostrar la vista; `serie` sube cada vez que (re)empieza. */
  animacion: NombreAnimacion
  serie: number
  destino: number
  factor: number
  llego: boolean
  tPaso: number
  arco: Arco | null
  juego: Juego | null
  /** Appa: ya llegó a su sitio de siesta y puede bajar. */
  posado: boolean
  /** Appa bajando a dormir. */
  bajada: Bajada | null
  /** Appa despegando: de qué altura a cuál sube, y en cuántos ms tras el impulso. */
  subida: { x0: number; x1: number; y0: number; y1: number; bajo: number | null; ms: number } | null
  alturaJuego: number | null
  rebotes: number
  /** Cae hecho bolita (`voltereta`): al tocar suelo, de patas o de espalda. */
  rueda: boolean
  /** Metido en la piedra: la vista no lo pinta. */
  oculto: boolean
  /** Va camino a la piedra a esconderse (se borra si le mandan otra cosa). */
  aPiedra: boolean
  /** Sobre quién está acostado, y a cuánto de su centro. */
  sobre: Mono | null
  sobreDx: number
  // El puntero mientras cuelga: posición en el área, velocidad suavizada, hora.
  px: number
  py: number
  pvx: number
  pvy: number
  pt: number
}

type TipoJuego =
  | 'acecho'
  | 'persecucion'
  | 'binky'
  | 'salto'
  | 'palomitas'
  | 'sobrevuelo'
  // Las gracias del gatito (ampliación del contrato).
  | 'escalada'
  | 'susto'
  | 'encima'

/** Cada cuánto puede repetirse un juego, en ms. */
const ENFRIAMIENTO: Partial<Record<TipoJuego, Rango>> & { resto: Rango } = {
  resto: [18000, 36000],
  escalada: [35000, 70000],
  encima: [40000, 80000],
  susto: [60000, 120000],
}

type Juego = {
  tipo: TipoJuego
  actor: Mono
  objetivo: Mono
  fase: number
  /** ms en la fase y en el juego entero. */
  t: number
  total: number
  /** De qué lado del objetivo se para el actor. */
  lado: 1 | -1
  dato: number
}

/** Tabla 4 del contrato y las gracias del gatito. `objetivo: null` = cualquiera
    que esté libre en el suelo; un juego de uno solo (escalada) se apunta a sí
    mismo. El susto no se planifica: lo provoca el perro al acercarse. */
const PAREJAS: { tipo: TipoJuego; actor: Animal; objetivo: Animal | null }[] = [
  { tipo: 'acecho', actor: 'gatito', objetivo: 'perrito' },
  { tipo: 'persecucion', actor: 'perrito', objetivo: 'conejito' },
  { tipo: 'binky', actor: 'conejito', objetivo: 'cuy' },
  { tipo: 'salto', actor: 'ranita', objetivo: 'caracol' },
  { tipo: 'palomitas', actor: 'cuy', objetivo: 'gatito' },
  { tipo: 'sobrevuelo', actor: 'appa', objetivo: null },
  { tipo: 'escalada', actor: 'gatito', objetivo: 'gatito' },
  { tipo: 'encima', actor: 'gatito', objetivo: null },
]

/** La boca de la piedra, en fracción del ancho desde el centro de su celda: (41, 60) de 64. */
const BOCA = 9 / 64
const PESO_PIEDRA = 0.45 // de la velocidad del puntero, cuánta se lleva al soltarla (pesa)

export type Piedra = {
  presente: boolean
  colocada: boolean
  ancho: number
  alto: number
  /** Centro de la celda y altura sobre el suelo, como los monos. */
  x: number
  y: number
  vx: number
  vy: number
  estado: 'quieta' | 'colgar' | 'caer'
  /** Lo que pasa en la boca. */
  modo: 'vacia' | 'entrando' | 'ocupada' | 'asomando' | 'saliendo' | 'toque'
  /** ms en el modo, y cuánto dura si es de una pasada. */
  t: number
  fin: number
  /** Quién está adentro (hoy sólo el cuy). */
  dentro: Mono | null
  animacion: AnimacionPiedra
  serie: number
  tiempos: Record<AnimacionPiedra, number>
  /** ms que le quedan adentro y hasta el próximo asomo. */
  permanencia: number
  asomaEn: number
  /** Entró (o pasó) una siesta adentro: al acabar, despierta y sale. */
  durmio: boolean
  /** Al terminar el toque, el de adentro sale; y si sale asustado. */
  echar: boolean
  susto: boolean
  /** Hora del reloj desde la que el cuy puede volver a esconderse por gusto. */
  proximo: number
  // El puntero mientras la llevan, y cuánto se ha movido (para distinguir un clic).
  px: number
  py: number
  pvx: number
  pvy: number
  pt: number
  p0: number
  movida: number
}

/** Un rectángulo del reloj que los monitos no deben tapar por su cuenta (el
    rótulo «¿En qué estás?», el disco, la placa de mandos), en coordenadas del
    motor: x en px del área, y = altura sobre el suelo (y0 abajo, y1 arriba). */
export type Zona = { x0: number; x1: number; y0: number; y1: number }

export type Mundo = {
  /** Zonas vedadas a lo autónomo: Appa no se estaciona ni planea encima, el gato no
      se cuelga ahí. Lo que el usuario arrastra y suelta cae por donde sea. */
  zonas: Zona[]
  piedra: Piedra
  monos: Record<Animal, Mono>
  lista: Mono[]
  ancho: number
  alto: number
  /** px entre el borde de abajo del área y el suelo (--mono-suelo). */
  suelo: number
  animo: Animo
  reducido: boolean
  reloj: number
  juegos: Juego[]
  /** ms hasta intentar el próximo juego, y desde cuándo puede repetirse cada uno. */
  proximo: number
  listo: Record<TipoJuego, number>
  /** En la siesta: a qué hora del reloj el gatito intenta irse a dormir sobre
      otro. Infinity = esta siesta no (o ya lo hizo). */
  siestaEncima: number
}

// --- Utilidades ---------------------------------------------------------------

const azar = (a: number, b: number) => a + Math.random() * (b - a)
const entre = ([a, b]: Rango) => azar(a, b)
const acotar = (v: number, a: number, b: number) => (b < a ? (a + b) / 2 : Math.min(b, Math.max(a, v)))
const vuela = (m: Mono) => m.rasgos.paso === 'vuelo'
const escala = (m: Mono) => m.ancho / 128

/** Hasta dónde llega su centro: deja asomar media silueta, no la caja entera. */
const limites = (mu: Mundo, m: Mono): Rango => [m.ancho * 0.3, mu.ancho - m.ancho * 0.3]
const dentro = (mu: Mundo, m: Mono, x: number) => acotar(x, ...limites(mu, m))
/** La altura de vuelo: pegado al borde de arriba, para pasar POR ENCIMA del rótulo
    «¿En qué estás?» (entre la barra y el rótulo cabe su silueta, no su celda entera). */
const crucero = (mu: Mundo, m: Mono) => Math.max(0, mu.alto - mu.suelo - MARGEN_TECHO - lomoDe(m))
/** La silueta dentro de la caja. La hoja se pinta a un múltiplo entero de sus
    píxeles (`dibujo` px de lado, ≤ la caja), apoyada abajo: `pieDe` es cuánto
    sobre la base de la caja quedan las patas, `lomoDe` hasta dónde llega arriba
    (Appa ocupa las filas 21–60 de su celda; los demás, casi toda). */
const pieDe = (m: Mono) => (m.alto - m.dibujo) / 16 + m.dibujo * 0.05
const lomoDe = (m: Mono) => (m.alto - m.dibujo) / 16 + m.dibujo * (vuela(m) ? 0.69 : 0.95)
/** La altura a la que queda colgado del borde de arriba (las patas en el canto). */
const alturaBorde = (mu: Mundo, m: Mono) => mu.alto - mu.suelo - m.alto * (1 - AGARRE_TREPAR.y)
/** La altura del lomo de `o`, tal como está (sentado o dormido). */
const alturaLomo = (o: Mono) =>
  o.y + o.alto * (o.estado === 'dormir' ? o.rasgos.lomo.dormir : (o.rasgos.lomo.reposo ?? o.rasgos.lomo.dormir))
/** Adónde va cada uno a dormir: a su casa; Appa, al costado de la columna del
    reloj que le quede más cerca de su casa — desde ahí baja sin pasar por delante. */
const sitioDeSiesta = (mu: Mundo, m: Mono) => {
  const casa = m.rasgos.casa * mu.ancho
  return vuela(m) ? fuera(mu, m, dentro(mu, m, casa), null) : casa
}
const sorteaSiesta = (mu: Mundo) => {
  mu.siestaEncima = Math.random() < SIESTA_ENCIMA_PROB ? mu.reloj + azar(5000, 12000) : Infinity
}
const alturaMeta = (mu: Mundo, m: Mono) =>
  !vuela(m) ? 0 : (m.alturaJuego ?? (mu.animo === 'siesta' && m.posado ? 0 : crucero(mu, m)))

// --- Zonas vedadas ------------------------------------------------------------

const HOLGURA = 6 // px de aire entre la silueta y la zona
/** Medio ancho de la silueta (Appa llena su celda; los demás, poco más de la mitad). */
const medioAncho = (m: Mono) => m.dibujo * (vuela(m) ? 0.47 : 0.33)
/** ¿La silueta, con la base de la caja a la altura `y`, queda a la altura de la zona? */
const aLaAltura = (m: Mono, z: Zona, y: number) => y + lomoDe(m) > z.y0 - HOLGURA && y + pieDe(m) < z.y1 + HOLGURA

/** Los tramos de x en que el centro de `m` taparía una zona estando a la altura `y`
    (o a cualquier altura, si `y` es null), unidos y ordenados. */
function vedados(mu: Mundo, m: Mono, y: number | null, extra = 0): [number, number][] {
  const hw = medioAncho(m) + HOLGURA + extra
  const tramos = mu.zonas
    .filter((z) => y === null || aLaAltura(m, z, y))
    .map((z): [number, number] => [z.x0 - hw, z.x1 + hw])
    .sort((a, b) => a[0] - b[0])
  const unidos: [number, number][] = []
  for (const t of tramos) {
    const u = unidos[unidos.length - 1]
    if (u && t[0] <= u[1]) u[1] = Math.max(u[1], t[1])
    else unidos.push([t[0], t[1]])
  }
  return unidos
}

/** El x más cercano a `x` en que `m`, a la altura `y`, no tapa ninguna zona. Si
    no cabe a ningún lado (ventana angosta), devuelve `x` tal cual. */
function fuera(mu: Mundo, m: Mono, x: number, y: number | null, extra = 0): number {
  const [x0, x1] = limites(mu, m)
  const t = vedados(mu, m, y, extra).find(([a, b]) => x > a && x < b)
  if (!t) return x
  const izq = t[0] >= x0 ? t[0] : null
  const der = t[1] <= x1 ? t[1] : null
  if (izq === null && der === null) return x
  if (izq === null) return der!
  if (der === null) return izq
  return x - izq <= der - x ? izq : der
}

const tapa = (mu: Mundo, m: Mono, x: number, y: number) => vedados(mu, m, y).some(([a, b]) => x > a && x < b)

/** Los tramos de x que Appa no puede ocupar mientras cambia de altura de `m.y` a
    `meta`: los de las zonas que quedan en ese trecho vertical. */
function columna(mu: Mundo, m: Mono, meta: number): [number, number][] {
  const [abajo, arriba] = [Math.min(m.y, meta), Math.max(m.y, meta)]
  const hw = medioAncho(m) + HOLGURA
  return mu.zonas
    .filter((z) => arriba + lomoDe(m) > z.y0 - HOLGURA && abajo + pieDe(m) < z.y1 + HOLGURA)
    .map((z): [number, number] => [z.x0 - hw, z.x1 + hw])
}

/** Appa no sube ni baja por delante del reloj: si tiene que cambiar de altura y
    está en la columna del rótulo, el disco o la placa, primero se corre de lado
    hasta el borde libre (a su altura de ahora) y recién ahí sube o baja.
    Devuelve si ya puede cambiar de altura. */
function esquivar(mu: Mundo, m: Mono, meta: number, dt: number): boolean {
  if (Math.abs(meta - m.y) <= 6) return true
  const t = columna(mu, m, meta).find(([a, b]) => m.x > a && m.x < b)
  if (!t) return true
  const [x0, x1] = limites(mu, m)
  const izq = t[0] >= x0 ? t[0] : null
  const der = t[1] <= x1 ? t[1] : null
  if (izq === null && der === null) return true // no hay por dónde: pasa igual
  // Hacia el borde más cercano; si va a alguna parte, hacia el que le queda de camino.
  const quiere = m.estado === 'caminar' ? m.destino : m.x
  const meta_x = izq === null ? der! : der === null ? izq : Math.abs(quiere - izq) <= Math.abs(quiere - der) ? izq : der
  const paso = (m.rasgos.vel * escala(m) * 3 * dt) / 1000
  m.mira = meta_x > m.x ? 1 : -1
  m.x += Math.sign(meta_x - m.x) * Math.min(Math.abs(meta_x - m.x) + 0.5, paso)
  return false
}

function animar(m: Mono, nombre: NombreAnimacion) {
  m.animacion = nombre
  m.serie++
}

/** Un bucle que ya está puesto no se reinicia (no da el tirón de volver al cuadro 0). */
function seguir(m: Mono, nombre: NombreAnimacion) {
  if (m.animacion !== nombre) animar(m, nombre)
}

function nuevoMono(animal: Animal, tiempos: Tiempos): Mono {
  return {
    animal, rasgos: RASGOS[animal], tiempos,
    presente: false, colocado: false, ancho: 0, alto: 0, dibujo: 0,
    x: 0, y: 0, vx: 0, vy: 0, mira: RASGOS[animal].casa < 0.5 ? 1 : -1,
    inclinacion: 0, bamboleo: 0,
    estado: 'reposo', fase: 'suelo', t: 0, fin: 0, espera: 0,
    animacion: 'reposo', serie: 0,
    destino: 0, factor: 1, llego: false, tPaso: 0,
    arco: null, juego: null, posado: false, bajada: null, subida: null, alturaJuego: null, rebotes: 0,
    rueda: false, oculto: false, aPiedra: false, sobre: null, sobreDx: 0,
    px: 0, py: 0, pvx: 0, pvy: 0, pt: 0,
  }
}

export function crearMundo(tiempos: Record<Animal, Tiempos>, tiemposPiedra: Record<AnimacionPiedra, number>): Mundo {
  const monos = Object.fromEntries(ANIMALES.map((a) => [a, nuevoMono(a, tiempos[a])])) as Record<Animal, Mono>
  return {
    zonas: [],
    piedra: {
      presente: false, colocada: false, ancho: 0, alto: 0, x: 0, y: 0, vx: 0, vy: 0,
      estado: 'quieta', modo: 'vacia', t: 0, fin: 0, dentro: null,
      animacion: 'vacia', serie: 0, tiempos: tiemposPiedra,
      permanencia: 0, asomaEn: 0, durmio: false, echar: false, susto: false, proximo: azar(6000, 14000),
      px: 0, py: 0, pvx: 0, pvy: 0, pt: 0, p0: 0, movida: 0,
    },
    monos,
    lista: ANIMALES.map((a) => monos[a]),
    ancho: 0, alto: 0, suelo: 8,
    animo: 'siesta', reducido: false, reloj: 0,
    juegos: [], proximo: 0,
    listo: { acecho: 0, persecucion: 0, binky: 0, salto: 0, palomitas: 0, sobrevuelo: 0, escalada: 0, susto: 0, encima: 0 },
    siestaEncima: Infinity,
  }
}

// --- Transiciones ---------------------------------------------------------------

/** A reposo. Dentro de un juego espera a que el juego lo mande; fuera, el
    cerebro lo mueve cuando venza la espera. */
function descansar(mu: Mundo, m: Mono) {
  m.estado = 'reposo'
  m.t = 0
  m.arco = null
  m.bajada = m.subida = null
  m.inclinacion = 0
  m.espera = m.juego
    ? Infinity
    : mu.animo === 'siesta'
      ? 500
      : mu.animo === 'estudia'
        ? entre(m.rasgos.reposa) * 2.5
        : entre(m.rasgos.reposa)
  // Appa quieto en el aire sigue volando (su `caminar`); `reposo` es de pie en el suelo.
  if (vuela(m) && alturaMeta(mu, m) > 2) seguir(m, 'caminar')
  else animar(m, 'reposo')
}

function dormir(m: Mono) {
  m.estado = 'dormir'
  m.t = 0
  m.arco = null
  m.bajada = m.subida = null
  m.posado = true
  m.espera = m.rasgos.orden * 80
  animar(m, 'dormir')
}

function mandar(mu: Mundo, m: Mono, x: number, factor = 1) {
  m.aPiedra = false
  // Appa no se estaciona tapando el rótulo ni el reloj: el destino se corre al borde libre.
  m.destino = vuela(m) ? fuera(mu, m, dentro(mu, m, x), alturaMeta(mu, m)) : dentro(mu, m, x)
  m.factor = factor
  m.llego = false
  if (m.estado !== 'caminar') {
    m.estado = 'caminar'
    m.t = 0
    m.tPaso = 0
    m.bajada = m.subida = null
    if (vuela(m)) seguir(m, 'caminar')
    else animar(m, 'caminar')
  }
}

function actuar(m: Mono, estado: 'jugar' | 'reaccion', fin: number, animacion: NombreAnimacion = estado) {
  m.estado = estado
  m.t = 0
  m.fin = fin
  animar(m, animacion)
}

function trazar(m: Mono, x1: number, alto: number, ms: number, retraso = 0, rebotes = 1, sube = 0) {
  m.arco = { x0: m.x, x1, y0: m.y, alto, sube, ms, t: -retraso, rebotes }
}

/** Appa llegó sobre su sitio de siesta: baja en zigzag. El vaivén parte hacia
    donde venía mirando, cabe entre las paredes y da barridos enteros, así
    termina justo encima de su sitio. */
function empezarBajada(mu: Mundo, m: Mono) {
  const [x0, x1] = limites(mu, m)
  const ms = acotar((m.y / (BAJADA_VEL * escala(m))) * 1000, 1400, 7500)
  const barridos = Math.max(1, Math.round(ms / BARRIDO_MS))
  const casa = dentro(mu, m, m.rasgos.casa * mu.ancho)
  // Baja al costado del reloj, no por delante: el centro del vaivén se pone al
  // lado de toda la columna (rótulo, disco, placa) y el vaivén cabe entre ella y
  // la pared. Sólo al final, ya por debajo de la placa, se desliza hasta su sitio.
  // (Si encima de su sitio no hay nada, baja derecho sobre él, como siempre.)
  const hw = medioAncho(m) + HOLGURA
  const encima = mu.zonas.filter((z) => casa + hw > z.x0 && casa - hw < z.x1)
  // Altura bajo la cual su sitio queda despejado (lo más bajo de lo que hay encima).
  const libre = encima.length ? Math.min(...encima.map((z) => z.y0)) - lomoDe(m) - HOLGURA : Infinity
  const borde = fuera(mu, m, m.x, null)
  const hacia: 1 | -1 = borde >= casa ? 1 : -1 // de qué lado de la columna baja
  const amplitud = encima.length
    ? Math.max(0, Math.min(m.ancho * 0.95, (hacia > 0 ? x1 - borde : borde - x0) / 2))
    : Math.max(0, Math.min(m.ancho * 0.95, casa - x0, x1 - casa))
  m.estado = 'bajar'
  m.t = 0
  m.arco = null
  m.subida = null
  m.bajada = {
    cx: m.x, cxLado: encima.length ? borde + hacia * amplitud : casa, casa, libre, y0: m.y, t: 0, viraje: 0, finViraje: 0,
    lado: encima.length ? hacia : m.mira, // el primer barrido sale hacia la pared, lejos del reloj
    amplitud,
    periodo: acotar(ms / barridos, 1100, 1900),
    ms: barridos * acotar(ms / barridos, 1100, 1900),
  }
  m.mira = m.bajada.lado
  animar(m, 'planear')
}

/** Un cuadro de la bajada. Como una hoja que cae: se hunde al cruzar por el
    centro y se frena (sube un poco) en cada extremo, donde vira. `virar` empieza
    antes del extremo para que su marca `giro` — ahí se da vuelta — caiga justo en él. */
function bajar(mu: Mundo, m: Mono, dt: number) {
  const b = m.bajada!
  b.t += dt
  const u = Math.min(1, b.t / b.ms)
  const queda = 1 - u
  const fase = (Math.PI * b.t) / b.periodo
  const hoja = m.alto * 0.07 * queda * (1 - Math.cos(2 * fase))
  m.y = Math.min(Math.max(0, b.y0 * queda * (0.75 + 0.25 * queda) + hoja), Math.max(b.y0, crucero(mu, m)))
  // El centro del vaivén: de donde partió se va al costado del reloj y, cuando
  // su sitio ya queda despejado (o en el último tercio, si no hay por dónde
  // pasar por debajo), se desliza hasta él.
  const alto = b.libre > m.alto * 0.25 ? b.libre : b.y0 * 0.33
  const w = Math.min(1, m.y / alto)
  const costado = b.cxLado + (b.cx - b.cxLado) * Math.exp(-b.t / 450)
  const centro = b.casa + (costado - b.casa) * (w * w * (3 - 2 * w))
  m.x = dentro(mu, m, centro + b.lado * b.amplitud * Math.pow(queda, 0.8) * Math.sin(fase))
  m.bamboleo = 0
  // El extremo k cae en (k + ½)·periodo. Cerca del suelo ya no vira: se posa.
  const extremo = (b.viraje + 0.5) * b.periodo
  if (extremo < b.ms - 250) {
    if (m.animacion !== 'virar' && b.t >= extremo - m.tiempos.giro) {
      animar(m, 'virar')
      b.finViraje = b.t + m.tiempos.virar
    }
    if (b.t >= extremo) {
      m.mira = (b.viraje % 2 === 0 ? -b.lado : b.lado) as 1 | -1
      b.viraje++
    }
  }
  if (m.animacion === 'virar' && b.t >= b.finViraje) animar(m, 'planear')
  if (u >= 1) {
    // Toca suelo con el aplaste y, al recuperarse, se ovilla (en la siesta `caer`
    // termina en `descansar`, que lo manda a dormir).
    m.x = b.casa
    m.y = 0
    m.bajada = null
    m.estado = 'caer'
    m.fase = 'suelo'
    m.t = 0
    m.fin = m.tiempos.caer
    animar(m, 'caer')
  }
}

/** Appa sale del sueño: primero se estira y bosteza; después despega. */
function despertarse(m: Mono) {
  m.estado = 'despertar'
  m.t = 0
  m.fin = m.tiempos.despertar
  m.arco = null
  m.bajada = m.subida = null
  m.posado = false
  m.y = 0
  animar(m, 'despertar')
}

/** Se agazapa y, en la marca `impulso`, salta al cielo. */
function empezarDespegue(m: Mono) {
  m.estado = 'despegar'
  m.t = 0
  m.fin = m.tiempos.despegar
  m.arco = null
  m.bajada = m.subida = null
  m.posado = false
  animar(m, 'despegar')
}

/** Un cuadro del despegue: en el suelo hasta el impulso; de ahí sube rápido y
    frenando (y avanza un poco hacia donde mira) hasta su altura de vuelo. */
function despegar(mu: Mundo, m: Mono) {
  m.bamboleo = 0
  const tras = m.t - m.tiempos.impulso
  if (tras < 0) return
  if (!m.subida) {
    const y1 = Math.max(m.y, crucero(mu, m))
    // No sube por delante del reloj: sale en diagonal hacia el costado libre de
    // toda la columna (o, si no hay columna encima, avanza un poco hacia donde mira).
    const libre = fuera(mu, m, m.x, null)
    const x1 = libre !== m.x ? libre : dentro(mu, m, fuera(mu, m, m.x + m.mira * m.ancho * 0.35, y1))
    if (x1 !== m.x) m.mira = x1 > m.x ? 1 : -1
    // Si tiene la placa encima, el salto parte rasante: sale de lado por debajo de
    // ella (hasta `bajo` de altura) y recién al costado se dispara hacia arriba.
    const hw = medioAncho(m) + HOLGURA
    const encima = mu.zonas.filter((z) => m.x + hw > z.x0 && m.x - hw < z.x1)
    const bajo = encima.length ? Math.min(...encima.map((z) => z.y0)) - lomoDe(m) - HOLGURA : 0
    const ms = acotar(950 * Math.sqrt((y1 - m.y) / (300 * escala(m) || 1)), 650, 1500)
    m.subida = { x0: m.x, x1, y0: m.y, y1, bajo: libre !== m.x && bajo > m.y + 4 ? bajo : null, ms: ms * (libre !== m.x ? 1.3 : 1) }
  }
  const { x0, x1, y0, y1, bajo, ms } = m.subida
  const u = Math.min(1, tras / ms)
  // El tramo de lado se hace al principio, rápido.
  const k = Math.min(1, u / 0.3)
  const lado = 1 - (1 - k) * (1 - k)
  m.x = dentro(mu, m, x0 + (x1 - x0) * lado)
  if (bajo === null) m.y = y0 + (y1 - y0) * (1 - (1 - u) ** 3)
  else if (k < 1) m.y = y0 + (bajo - y0) * lado
  else m.y = bajo + (y1 - bajo) * (1 - (1 - (u - 0.3) / 0.7) ** 3)
  if (m.t >= m.fin) seguir(m, 'caminar') // ya en el aire: sigue subiendo con su vuelo
  if (u >= 1 && m.t >= m.fin) descansar(mu, m)
}

/** Al aire sin que nadie lo lance: cae; con `rueda`, hecho bolita. */
function despenar(m: Mono, rueda: boolean, vx = 0, vy = 0) {
  m.estado = 'caer'
  m.fase = 'aire'
  m.t = 0
  m.arco = null
  m.bajada = m.subida = null
  m.sobre = null
  m.vx = vx
  m.vy = vy
  m.inclinacion = 0
  m.rebotes = 0
  m.rueda = rueda && m.animal === 'gatito' // la voltereta es sólo suya
  if (m.rueda) animar(m, 'voltereta')
}

/** Se cae de encima de otro (el de abajo se movió): una voltereta corta. */
function caerse(mu: Mundo, m: Mono) {
  const g = m.juego
  despenar(m, true, (Math.random() < 0.5 ? -1 : 1) * azar(50, 120) * escala(m), 200)
  if (g) cerrar(mu, g)
}

const mirarA = (m: Mono, o: Mono) => {
  m.mira = o.x >= m.x ? 1 : -1
}

/** Le hicieron algo: el susto, con su respingo. No interrumpe al que cuelga o va cayendo. */
function reaccionar(mu: Mundo, m: Mono, desde?: Juego) {
  if (!m.presente || mu.reducido || m.estado === 'colgar' || (m.estado === 'caer' && m.fase === 'aire')) return
  if (m.estado === 'bajar' || m.estado === 'despertar' || m.estado === 'despegar') return // Appa en lo suyo
  if (m.estado === 'escondido') return // adentro de la piedra no se entera
  if (m.juego && m.juego !== desde) cerrar(mu, m.juego)
  actuar(m, 'reaccion', m.tiempos.reaccion)
  m.arco = null
  if (m.rasgos.susto && m.y < 2) trazar(m, m.x, m.alto * m.rasgos.susto, 240)
  huirALaPiedra(mu, m.x, m)
}

/** Lo que pasa al tocar suelo tras soltarlo: si cae encima de otro, el de abajo
    reacciona y éste rebota hacia un lado; si no, el aplaste y a reposo. */
function aterrizar(mu: Mundo, m: Mono) {
  m.y = 0
  m.inclinacion = 0
  // Al cuy lo soltaron encima de la piedra: se mete.
  if (cabeEnPiedra(mu, m, 0.45)) return meterse(mu, m)
  huirALaPiedra(mu, m.x, m)
  const abajo = mu.lista.find(
    (o) => o !== m && o.presente && !o.oculto && o.estado !== 'colgar' && o.y < o.alto * 0.3 &&
      Math.abs(o.x - m.x) < (o.ancho + m.ancho) * 0.21,
  )
  if (abajo && m.rebotes < 3) {
    m.rebotes++
    reaccionar(mu, abajo)
    const lado = m.x === abajo.x ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(m.x - abajo.x)
    m.vx = lado * 210 * escala(m)
    m.vy = 520 * Math.sqrt(escala(m))
    return
  }
  m.vx = m.vy = 0
  m.fase = 'suelo'
  m.t = 0
  // De la voltereta sale de patas o de espalda (tendido, jadea y se para).
  const espalda = m.rueda && Math.random() < DE_ESPALDA
  m.rueda = false
  m.fin = espalda ? m.tiempos.tendido : m.tiempos.caer
  animar(m, espalda ? 'tendido' : 'caer')
}

/** Deja al mono en una pose tranquila según el ánimo, sin animación de paso. */
function acomodar(mu: Mundo, m: Mono) {
  if (m.estado === 'escondido' && mu.piedra.dentro === m && mu.piedra.presente) return // sigue en su piedra
  m.oculto = false
  m.aPiedra = false
  m.arco = null
  m.bajada = m.subida = null
  m.juego = null
  m.alturaJuego = null
  m.vx = m.vy = 0
  m.inclinacion = 0
  m.rebotes = 0
  m.rueda = false
  if (mu.animo === 'siesta') {
    // El gatito que dormía encima de otro sigue ahí (al volver a Descanso).
    if (mu.reducido || !m.sobre?.colocado) m.sobre = null
    dormir(m)
    m.y = m.sobre ? m.sobre.alto * m.sobre.rasgos.lomo.dormir : 0
  } else {
    m.sobre = null
    m.posado = false
    m.y = alturaMeta(mu, m)
    descansar(mu, m)
  }
}

// --- API de la vista ------------------------------------------------------------

/** El área y las cajas, medidas del DOM. Una caja de ancho 0 = animal escondido. */
export function medir(
  mu: Mundo,
  ancho: number,
  alto: number,
  suelo: number,
  cajas: Record<Animal, { ancho: number; alto: number; dibujo?: number }>,
  cajaPiedra: { ancho: number; alto: number } = { ancho: 0, alto: 0 },
  zonas: Zona[] = [],
) {
  mu.zonas = zonas
  const antes = mu.ancho
  mu.ancho = ancho
  mu.alto = alto
  mu.suelo = suelo
  const p = mu.piedra
  p.presente = cajaPiedra.ancho > 0 && ancho > 0
  p.ancho = cajaPiedra.ancho
  p.alto = cajaPiedra.alto
  if (p.presente) {
    if (!p.colocada) p.x = 0.39 * ancho
    else if (antes > 0 && antes !== ancho) p.x *= ancho / antes
    p.colocada = true
    p.x = acotar(p.x, p.ancho * 0.45, ancho - p.ancho * 0.45)
  } else if (p.dentro) {
    // La piedra se escondió (ventana baja) con el cuy adentro: el cuy queda afuera.
    const m = p.dentro
    p.dentro = null
    p.modo = 'vacia'
    p.animacion = 'vacia'
    p.estado = 'quieta'
    p.y = 0
    m.oculto = false
    m.estado = 'reposo'
  }
  for (const m of mu.lista) {
    const c = cajas[m.animal]
    const estaba = m.presente
    m.presente = c.ancho > 0 && ancho > 0
    m.ancho = c.ancho
    m.alto = c.alto
    m.dibujo = Math.min(c.dibujo ?? c.ancho, c.ancho)
    if (!m.presente) {
      if (m.juego) cerrar(mu, m.juego)
      continue
    }
    if (!m.colocado) m.x = m.rasgos.casa * ancho
    else if (antes > 0 && antes !== ancho) {
      // La ventana cambió de ancho: cada uno conserva su lugar relativo.
      m.x *= ancho / antes
      m.destino *= ancho / antes
    }
    m.colocado = true
    m.x = dentro(mu, m, m.x)
    if (!estaba) acomodar(mu, m)
    else if (vuela(m) && m.estado !== 'colgar' && m.estado !== 'caer') m.y = Math.min(m.y, crucero(mu, m))
  }
}

/** Al volver a montar la vista: las posiciones se conservan, lo demás parte en calma. */
export function reanudar(mu: Mundo, animo: Animo, reducido: boolean, tiempos: Record<Animal, Tiempos>) {
  mu.animo = animo
  mu.reducido = reducido
  mu.juegos = []
  mu.proximo = azar(2500, 5000)
  mu.siestaEncima = Infinity
  if (animo === 'siesta' && !mu.monos.gatito.sobre) sorteaSiesta(mu)
  for (const m of mu.lista) {
    m.tiempos = tiempos[m.animal]
    m.presente = false // `medir` lo acomoda al encontrarlo
  }
  // La piedra vuelve a tierra y en calma; si el cuy estaba adentro, ahí sigue.
  const p = mu.piedra
  p.estado = 'quieta'
  p.y = p.vx = p.vy = 0
  p.echar = false
  if (p.dentro) ocupar(mu)
  else ponerPiedra(mu, 'vacia', 'vacia')
}

export function cambiarAnimo(mu: Mundo, animo: Animo) {
  if (mu.animo === animo) return
  mu.animo = animo
  for (const g of [...mu.juegos]) cerrar(mu, g)
  mu.proximo = azar(2500, 5000)
  mu.siestaEncima = Infinity
  if (animo === 'siesta') sorteaSiesta(mu)
  for (const m of mu.lista) {
    if (!m.presente || m.estado === 'colgar' || m.estado === 'caer') continue
    if (m.estado === 'escondido') continue // el que está en la piedra lo lleva la piedra
    if (mu.reducido) {
      acomodar(mu, m)
    } else if (animo === 'siesta' && m.animal === 'cuy' && piedraLibre(mu) && Math.random() < 0.5) {
      // Esta siesta el cuy la duerme adentro de la piedra.
      m.posado = false
      irALaPiedra(mu, m)
    } else if (animo === 'siesta') {
      // Cada uno camina a su sitio y ahí se duerme (Appa baja en zigzag).
      // Appa, si aún no despegaba (se estiraba o estaba agazapado), se vuelve a ovillar.
      if (m.estado === 'despertar' || (m.estado === 'despegar' && !m.subida)) {
        dormir(m)
        continue
      }
      m.posado = false
      mandar(mu, m, sitioDeSiesta(mu, m))
    } else if (m.estado === 'bajar') {
      descansar(mu, m) // iba bajando a dormir y ya no es siesta: vuelve a subir
      if (animo === 'recreo') m.espera = azar(300, 2600)
    } else if (m.estado === 'dormir') {
      m.posado = false
      m.espera = m.rasgos.orden * 80 // despiertan en escalera
    } else if (animo === 'estudia') {
      descansar(mu, m)
    } else if (m.estado === 'reposo') {
      m.espera = Math.min(m.espera, azar(300, 2600))
    }
  }
}

export function fijarReducido(mu: Mundo, reducido: boolean) {
  if (mu.reducido === reducido) return
  mu.reducido = reducido
  if (!reducido) return
  for (const g of [...mu.juegos]) cerrar(mu, g)
  for (const m of mu.lista) if (m.presente && m.estado !== 'colgar') acomodar(mu, m)
}

/** Lo toman con el puntero (px, py en coordenadas del área; `ahora` en ms). */
export function tomar(mu: Mundo, animal: Animal, px: number, py: number, ahora: number) {
  const m = mu.monos[animal]
  if (!m.presente || m.oculto) return
  m.aPiedra = false
  if (m.juego) cerrar(mu, m.juego)
  m.arco = null
  m.bajada = m.subida = null
  m.alturaJuego = null
  m.posado = false
  m.rebotes = 0
  m.rueda = false
  m.sobre = null
  m.estado = 'colgar'
  m.t = 0
  m.px = px
  m.py = py
  m.pvx = m.pvy = 0
  m.pt = ahora
  animar(m, 'colgar')
}

export function arrastrar(mu: Mundo, animal: Animal, px: number, py: number, ahora: number) {
  const m = mu.monos[animal]
  if (m.estado !== 'colgar') return
  const dt = ahora - m.pt
  if (dt > 0) {
    // Suavizado: un solo evento brusco no decide el lance.
    m.pvx += (((px - m.px) / dt) * 1000 - m.pvx) * 0.6
    m.pvy += (((py - m.py) / dt) * 1000 - m.pvy) * 0.6
    m.pt = ahora
  }
  m.px = px
  m.py = py
}

/** Lo sueltan: sale con la velocidad del puntero y cae. Con movimiento reducido
    no hay lance: queda apoyado donde lo dejaron. */
export function soltar(mu: Mundo, animal: Animal, ahora: number) {
  const m = mu.monos[animal]
  if (m.estado !== 'colgar') return
  m.inclinacion = 0
  if (mu.reducido) {
    acomodar(mu, m)
    return
  }
  const parado = ahora - m.pt > 90 // lo sostuvo quieto antes de soltar
  m.vx = parado ? 0 : acotar(m.pvx, -LANCE_MAX, LANCE_MAX)
  m.vy = parado ? 0 : acotar(-m.pvy, -LANCE_MAX, LANCE_MAX)
  m.estado = 'caer'
  m.fase = 'aire'
  m.t = 0
  m.rueda = false
}

/** Nada que animar: el bucle de la vista puede dormirse hasta el próximo evento. */
export function enCalma(mu: Mundo): boolean {
  if (mu.juegos.length) return false
  const p = mu.piedra
  if (p.presente) {
    if (p.estado !== 'quieta') return false
    if (p.modo !== 'vacia' && p.modo !== 'ocupada') return false
    // Ocupada sólo está en calma durmiendo la siesta (despierto, el cuy asoma y sale).
    if (p.modo === 'ocupada' && !mu.reducido && (mu.animo !== 'siesta' || p.animacion !== 'duerme')) return false
  }
  if (!mu.reducido && mu.animo === 'siesta' && mu.siestaEncima < Infinity) return false
  return mu.lista.every((m) => {
    if (!m.presente) return true
    if (m.estado === 'colgar' || m.estado === 'caer' || m.arco) return false
    if (!m.sobre && Math.abs(alturaMeta(mu, m) - m.y) > 0.5) return false
    return mu.reducido || (mu.animo === 'siesta' && (m.estado === 'dormir' || m.estado === 'escondido'))
  })
}

// --- El cuadro ------------------------------------------------------------------

export function avanzar(mu: Mundo, dtMs: number) {
  if (mu.ancho <= 0) return
  const dt = Math.min(dtMs, 50) // tras una pausa larga no hay salto
  if (!(dt > 0)) return
  mu.reloj += dt
  for (const m of mu.lista) if (m.presente) avanzarMono(mu, m, dt)
  avanzarPiedra(mu, dt)
  if (mu.reducido) return
  for (const g of [...mu.juegos]) avanzarJuego(mu, g, dt)
  planificar(mu, dt)
  asustar(mu)
  siestaEncima(mu)
}

function avanzarMono(mu: Mundo, m: Mono, dt: number) {
  const s = dt / 1000
  m.t += dt

  if (m.estado === 'escondido') return // adentro de la piedra: ella lo lleva
  if (m.estado === 'colgar') return colgar(mu, m, dt)
  if (m.estado === 'caer' && m.fase === 'aire') return volar(mu, m, dt)
  if (m.estado === 'trepar') return // la altura la lleva el juego (sube y resbala)
  if (m.estado === 'bajar') return bajar(mu, m, dt)
  if (m.estado === 'despegar') return despegar(mu, m)
  if (m.estado === 'despertar') {
    m.bamboleo = 0
    if (m.t >= m.fin) empezarDespegue(m)
    return
  }

  if (m.sobre) {
    const o = m.sobre
    if (m.estado !== 'dormir' && m.estado !== 'jugar') {
      m.sobre = null // lo sacaron de ahí de otra forma (un susto): se posa solo
    } else if (m.estado === 'dormir') {
      // El de abajo se movió, despertó o se lo llevaron: el gatito se cae.
      const firme =
        o.presente && (o.estado === 'dormir' || o.estado === 'reposo') && o.y < 2 &&
        Math.abs(o.x + m.sobreDx - m.x) < 3
      if (!firme) return caerse(mu, m)
      m.y = alturaLomo(o)
    }
  }

  if (m.arco) {
    avanzarArco(m, dt)
  } else if (m.sobre) {
    // acostado (o aterrizando) en el lomo de otro
  } else if (vuela(m) && m.estado !== 'dormir') {
    // (dormido no sube solo: al despertar se estira y despega)
    const meta = alturaMeta(mu, m)
    if (mu.reducido || Math.abs(meta - m.y) < 0.5) m.y = meta
    else if (esquivar(mu, m, meta, dt)) m.y += (meta - m.y) * (1 - Math.exp(-dt / 550))
  } else if (m.y > 0 && m.estado !== 'caminar') {
    m.y = Math.max(0, m.y - 600 * s) // quedó a medio salto: se posa
  }
  m.bamboleo =
    vuela(m) && !mu.reducido && m.estado !== 'dormir' && m.y > 6 ? Math.sin(mu.reloj / 850) * 5 * escala(m) : 0

  switch (m.estado) {
    case 'reposo':
      if (m.juego || mu.reducido) break
      // Appa quedó quieto tapando el rótulo o el reloj (lo soltaron ahí, terminó un
      // juego, cambió la ventana): se corre al borde libre de inmediato.
      if (vuela(m) && m.y > 2 && tapa(mu, m, m.x, m.y) && Math.abs(fuera(mu, m, m.x, m.y) - m.x) > 1) {
        mandar(mu, m, m.x, 1.6)
        break
      }
      m.espera -= dt
      if (m.espera <= 0) pensar(mu, m)
      break
    case 'caminar':
      if (!m.arco) caminar(mu, m, dt)
      break
    case 'dormir':
      if (mu.animo === 'siesta' || mu.reducido || m.juego) break // en un juego, lo despierta el juego
      m.espera -= dt
      if (m.espera <= 0) {
        // Appa no sube sin más: se estira, se agazapa y despega.
        if (vuela(m) && m.y < 2) return despertarse(m)
        const cama = m.sobre
        descansar(mu, m)
        if (mu.animo === 'recreo') m.espera = azar(300, 2600)
        if (cama) {
          // Dormía encima de otro: se baja de un brinco hacia el lado libre.
          const lado = m.x < mu.ancho / 2 ? 1 : -1
          m.sobre = null
          m.mira = lado
          trazar(m, dentro(mu, m, m.x + lado * m.ancho * 0.9), m.alto * 0.15, 300, 0, 1, -m.y)
        }
      }
      break
    case 'caer':
      if (m.t < m.fin) break
      // Appa recién posado para la siesta se ovilla de una vez, sin pararse antes.
      if (vuela(m) && mu.animo === 'siesta' && m.posado && m.y < 2 && !m.juego) dormir(m)
      else descansar(mu, m)
      break
    case 'jugar':
    case 'reaccion':
      if (m.t >= m.fin && !m.arco) descansar(mu, m)
      break
  }
}

/** Qué hace un mono libre al terminar de descansar. */
function pensar(mu: Mundo, m: Mono) {
  const casa = m.rasgos.casa * mu.ancho
  if (mu.animo === 'siesta') {
    // Se duerme donde está; Appa baja primero (sigue "volando" hasta posarse).
    if (m.y < 2) dormir(m)
    else mandar(mu, m, vuela(m) ? fuera(mu, m, m.x, null) : m.x)
  } else if (mu.animo === 'estudia') {
    // Un paseo corto y lento, tirando hacia su sitio.
    const hacia = Math.abs(casa - m.x) > m.ancho ? Math.sign(casa - m.x) : Math.random() < 0.5 ? -1 : 1
    const tramo = azar(0.3, 0.8) * m.ancho
    // (Appa: si hacia allá sólo hay rótulo o reloj que tapar, pasea para el otro lado.)
    const cerrado = vuela(m) && Math.abs(fuera(mu, m, dentro(mu, m, m.x + hacia * tramo), alturaMeta(mu, m)) - m.x) < 4
    mandar(mu, m, m.x + (cerrado ? -hacia : hacia) * tramo, 1)
  } else {
    const meta = dentro(mu, m, casa + azar(-1, 1) * m.rasgos.radio * mu.ancho)
    const tramo = (m.rasgos.vel * escala(m) * entre(m.rasgos.camina)) / 1000
    mandar(mu, m, m.x + acotar(meta - m.x, -tramo, tramo))
  }
}

/** El andar de cada uno hacia `destino`: pasos parejos, saltos en arco o vuelo. */
function caminar(mu: Mundo, m: Mono, dt: number) {
  const calmo = mu.animo === 'estudia' && !m.juego ? 0.5 : 1
  // Appa cruza de pasada lo que no debe tapar: por delante del rótulo va al triple.
  const apuro = vuela(m) && m.y > 2 && tapa(mu, m, m.x, m.y) ? 3 / calmo : 1
  const v = m.rasgos.vel * escala(m) * m.factor * calmo * apuro
  const d = m.destino - m.x
  const cerca = Math.abs(d) < 1
  if (!cerca) m.mira = d > 0 ? 1 : -1

  if (m.rasgos.paso === 'saltos') {
    // El salto dura lo que una vuelta del dibujo de `caminar`, si es razonable.
    const propio = m.tiempos.caminar
    const P = propio >= m.rasgos.saltoMs * 0.5 && propio <= m.rasgos.saltoMs * 2 ? propio : m.rasgos.saltoMs
    m.tPaso += dt
    const f = (m.tPaso % P) / P
    if (f >= AIRE[0] && f < AIRE[1]) {
      const u = (f - AIRE[0]) / (AIRE[1] - AIRE[0])
      m.y = m.alto * m.rasgos.saltoAlto * (calmo < 1 ? 0.6 : 1) * 4 * u * (1 - u)
      if (!cerca) m.x += Math.sign(d) * Math.min(Math.abs(d), ((v / (AIRE[1] - AIRE[0])) * dt) / 1000)
      return
    }
    m.y = 0
  } else if (!cerca) {
    let x = m.x + Math.sign(d) * Math.min(Math.abs(d), (v * dt) / 1000)
    if (vuela(m)) {
      // Mientras sube o baja no se mete en la columna del reloj: espera en el borde
      // a tener su altura (arriba pasa por encima del rótulo; abajo, bajo la placa).
      const meta = alturaMeta(mu, m)
      if (Math.abs(meta - m.y) > 6) {
        const col = columna(mu, m, meta)
        if (col.some(([a, b]) => m.x > a && m.x < b)) return // lo está sacando `esquivar`
        if (col.some(([a, b]) => x > a && x < b)) x = m.x
      }
    }
    m.x = x
    return
  }
  if (cerca) llegar(mu, m)
}

function llegar(mu: Mundo, m: Mono) {
  m.llego = true
  if (m.aPiedra) {
    m.aPiedra = false
    if (cabeEnPiedra(mu, m, 0.3)) return meterse(mu, m)
  }
  if (m.juego) {
    descansar(mu, m)
  } else if (mu.animo === 'siesta') {
    m.posado = true
    if (m.y < 2) dormir(m)
    else if (vuela(m)) empezarBajada(mu, m) // Appa no cae a plomo: baja en zigzag
  } else {
    descansar(mu, m)
  }
}

function avanzarArco(m: Mono, dt: number) {
  const a = m.arco!
  a.t += dt
  if (a.t < 0) return
  const u = Math.min(1, a.t / a.ms)
  m.x = a.x0 + (a.x1 - a.x0) * u
  m.y =
    a.y0 +
    a.sube * (1 - (1 - u) * (1 - u)) + // sube frenando, como un salto
    a.alto * (a.rebotes > 1 ? Math.abs(Math.sin(Math.PI * a.rebotes * u)) : 4 * u * (1 - u))
  if (u >= 1) {
    m.y = Math.max(0, a.y0 + a.sube)
    m.arco = null
  }
}

/** Tomado: sigue al puntero con un poco de retraso, con el punto de agarre
    debajo, y se mece según lo zarandeen. */
function colgar(mu: Mundo, m: Mono, dt: number) {
  const [x0, x1] = limites(mu, m)
  const techo = Math.max(0, mu.alto - mu.suelo - m.alto * 0.5)
  const tx = acotar(m.px, x0, x1)
  const ty = acotar(mu.alto - mu.suelo - m.alto * (1 - AGARRE.y) - m.py, 0, techo)
  if (mu.reducido) {
    m.x = tx
    m.y = ty
    m.inclinacion = 0
    return
  }
  const k = 1 - Math.exp(-dt / 45)
  const dx = (tx - m.x) * k
  m.x += dx
  m.y += (ty - m.y) * k
  const meta = acotar((dx / dt) * 1000 * 0.045, -34, 34)
  m.inclinacion += (meta - m.inclinacion) * (1 - Math.exp(-dt / 110))
  m.bamboleo = 0
}

/** Suelto en el aire. Appa no cae: planea con el impulso hasta frenarse. */
function volar(mu: Mundo, m: Mono, dt: number) {
  const s = dt / 1000
  const [x0, x1] = limites(mu, m)
  const techo = Math.max(0, mu.alto - mu.suelo - m.alto * 0.5)
  m.inclinacion *= Math.exp(-dt / 160)
  m.bamboleo = 0
  const flota = vuela(m)
  if (flota) {
    const freno = Math.exp(-dt / 380)
    m.vx *= freno
    m.vy *= freno
  } else {
    m.vy -= GRAVEDAD * (m.rueda ? 0.7 : 1) * s // la voltereta cae un poco más lento: se alcanza a ver
  }
  if (m.rueda) m.inclinacion = 0 // el giro ya viene dibujado: el motor no rota el sprite
  m.x += m.vx * s
  m.y += m.vy * s
  if (m.x < x0 || m.x > x1) {
    m.x = acotar(m.x, x0, x1)
    m.vx = -m.vx * REBOTE_PARED
    if (Math.abs(m.vx) > 40) m.mira = m.vx > 0 ? 1 : -1
  }
  if (m.y > techo) {
    m.y = techo
    m.vy = -Math.abs(m.vy) * 0.4
  }
  if (flota) {
    if (m.y < 0) {
      m.y = 0
      m.vy = 0
    }
    if (Math.hypot(m.vx, m.vy) < 30) {
      // Lo dejaron en el suelo y no es hora de dormir: despega de un salto.
      if (m.y < 2 && mu.animo !== 'siesta' && !mu.reducido) empezarDespegue(m)
      else descansar(mu, m)
    }
  } else if (m.y <= 0) {
    aterrizar(mu, m)
  }
}

// --- La piedra --------------------------------------------------------------------

const bocaX = (mu: Mundo) => mu.piedra.x + mu.piedra.ancho * BOCA
/** Vacía, quieta y en el suelo: se puede entrar. */
const piedraLibre = (mu: Mundo) => {
  const p = mu.piedra
  return p.presente && p.modo === 'vacia' && p.estado === 'quieta' && p.y < 1
}
/** ¿Puede `m` meterse ahora? Sólo el cuy, y si está a menos de `cerca` anchos de piedra de la boca. */
const cabeEnPiedra = (mu: Mundo, m: Mono, cerca: number) =>
  m.animal === 'cuy' && piedraLibre(mu) && Math.abs(m.x - bocaX(mu)) < mu.piedra.ancho * cerca

function ponerPiedra(mu: Mundo, modo: Piedra['modo'], animacion: AnimacionPiedra) {
  const p = mu.piedra
  p.modo = modo
  p.t = 0
  p.fin = p.tiempos[animacion]
  p.animacion = animacion
  p.serie++
}

/** Ocupada y tranquila: despierto mira desde lo oscuro; en la siesta, duerme. */
function ocupar(mu: Mundo) {
  if (mu.animo === 'siesta') mu.piedra.durmio = true
  ponerPiedra(mu, 'ocupada', mu.animo === 'siesta' ? 'duerme' : 'dentro')
}

function irALaPiedra(mu: Mundo, m: Mono, factor = 1.4) {
  mandar(mu, m, bocaX(mu), factor)
  m.aPiedra = true
}

/** Algo brusco pasó en `x` (un susto, alguien que cayó): si fue cerca del cuy y
    la piedra está libre, corre a esconderse. `quien` es el que lo causó. */
function huirALaPiedra(mu: Mundo, x: number, quien: Mono) {
  const c = mu.monos.cuy
  if (mu.reducido || mu.animo === 'siesta' || quien === c || !piedraLibre(mu)) return
  if (!libre(c) || c.y > 2 || Math.abs(c.x - x) > c.ancho * 2.5) return
  irALaPiedra(mu, c, 1.9)
}

function meterse(mu: Mundo, m: Mono) {
  const p = mu.piedra
  if (m.juego) cerrar(mu, m.juego)
  m.estado = 'escondido'
  m.oculto = true
  m.aPiedra = false
  m.arco = null
  m.sobre = null
  m.rueda = false
  m.fase = 'suelo'
  m.vx = m.vy = 0
  m.inclinacion = 0
  m.x = bocaX(mu)
  m.y = 0
  p.dentro = m
  p.echar = false
  p.durmio = false
  p.permanencia = azar(9000, 18000)
  p.asomaEn = azar(3000, 6000)
  ponerPiedra(mu, 'entrando', 'entra')
}

/** El de adentro sale; con `susto`, sale espantado. */
function sacar(mu: Mundo, susto: boolean) {
  mu.piedra.susto = susto
  mu.piedra.echar = false
  ponerPiedra(mu, 'saliendo', 'sale')
}

function terminarSalida(mu: Mundo) {
  const p = mu.piedra
  const m = p.dentro
  p.dentro = null
  p.proximo = mu.reloj + azar(25000, 50000)
  ponerPiedra(mu, 'vacia', 'vacia')
  if (!m) return
  // Queda parado delante de la boca, mirando hacia donde salió.
  m.oculto = false
  m.x = dentro(mu, m, bocaX(mu) + m.ancho * 0.3)
  m.y = p.y
  m.mira = 1
  if (p.y > 2) return despenar(m, false) // la piedra iba en el aire: cae
  descansar(mu, m)
  if (p.susto) reaccionar(mu, m)
}

function avanzarPiedra(mu: Mundo, dt: number) {
  const p = mu.piedra
  if (!p.presente) return
  const s = dt / 1000
  const [x0, x1] = [p.ancho * 0.45, mu.ancho - p.ancho * 0.45]

  if (p.estado === 'colgar' && p.movida > 6) {
    // La llevan por el medio; pesa: sigue al puntero con más retraso que un animal.
    // (Hasta que no la mueven de verdad no se despega del suelo: puede ser un clic.)
    const techo = Math.max(0, mu.alto - mu.suelo - p.alto)
    const tx = acotar(p.px, x0, x1)
    const ty = acotar(mu.alto - mu.suelo - p.alto * 0.42 - p.py, 0, techo)
    const k = mu.reducido ? 1 : 1 - Math.exp(-dt / 70)
    p.x += (tx - p.x) * k
    p.y += (ty - p.y) * k
  } else if (p.estado === 'caer') {
    p.vy -= GRAVEDAD * s
    p.x += p.vx * s
    p.y += p.vy * s
    if (p.x < x0 || p.x > x1) {
      p.x = acotar(p.x, x0, x1)
      p.vx = -p.vx * 0.3
    }
    if (p.y <= 0) {
      // Toca suelo: se bambolea; si iba alguien adentro, chilla.
      p.y = p.vx = p.vy = 0
      p.estado = 'quieta'
      if (p.modo === 'vacia' || p.modo === 'ocupada') ponerPiedra(mu, 'toque', p.dentro ? 'chillido' : 'toque')
    }
  }
  if (p.dentro) {
    p.dentro.x = bocaX(mu)
    p.dentro.y = p.y
  }

  p.t += dt
  switch (p.modo) {
    case 'vacia': {
      // En el recreo, cada tanto, el cuy se va a esconder por gusto.
      const c = mu.monos.cuy
      if (mu.reducido || mu.animo !== 'recreo' || mu.reloj < p.proximo || !piedraLibre(mu)) break
      p.proximo = mu.reloj + 4000 // si ahora no puede, reintenta pronto
      if (libre(c) && c.y < 2) irALaPiedra(mu, c)
      break
    }
    case 'entrando':
    case 'asomando':
      if (p.t >= p.fin) ocupar(mu)
      break
    case 'toque':
      if (p.t < p.fin) break
      if (!p.dentro) ponerPiedra(mu, 'vacia', 'vacia')
      else if (p.echar) sacar(mu, true)
      else ocupar(mu)
      break
    case 'saliendo':
      if (p.t >= p.fin) terminarSalida(mu)
      break
    case 'ocupada': {
      const quiere: AnimacionPiedra = mu.animo === 'siesta' ? 'duerme' : 'dentro'
      if (p.animacion !== quiere) ocupar(mu)
      if (mu.reducido || p.estado !== 'quieta') break // con movimiento reducido no sale solo
      if (mu.animo === 'siesta') break // duerme hasta que acabe la siesta
      if (p.durmio) {
        // Acabó la siesta: despierta con los demás, en su turno, y sale.
        p.durmio = false
        p.permanencia = (p.dentro?.rasgos.orden ?? 0) * 80 + 500
        p.asomaEn = Infinity
      }
      p.permanencia -= dt
      p.asomaEn -= dt
      if (p.permanencia <= 0) sacar(mu, false)
      else if (p.asomaEn <= 0) {
        ponerPiedra(mu, 'asomando', 'asoma')
        p.asomaEn = azar(4000, 8000)
      }
      break
    }
  }
}

/** Toman la piedra con el puntero (px, py en coordenadas del área). */
export function tomarPiedra(mu: Mundo, px: number, py: number, ahora: number) {
  const p = mu.piedra
  if (!p.presente) return
  p.estado = 'colgar'
  p.px = px
  p.py = py
  p.pvx = p.pvy = 0
  p.pt = p.p0 = ahora
  p.movida = 0
  p.vx = p.vy = 0
}

export function arrastrarPiedra(mu: Mundo, px: number, py: number, ahora: number) {
  const p = mu.piedra
  if (p.estado !== 'colgar') return
  const dt = ahora - p.pt
  if (dt > 0) {
    p.pvx += (((px - p.px) / dt) * 1000 - p.pvx) * 0.6
    p.pvy += (((py - p.py) / dt) * 1000 - p.pvy) * 0.6
    p.pt = ahora
  }
  const antes = p.movida
  p.movida += Math.abs(px - p.px) + Math.abs(py - p.py)
  // Recién al moverla de verdad se nota que la levantaron: el de adentro chilla.
  if (antes <= 6 && p.movida > 6 && p.dentro && p.modo === 'ocupada') ponerPiedra(mu, 'toque', 'chillido')
  p.px = px
  p.py = py
}

/** La sueltan. Si casi no la movieron fue un clic: se bambolea y, si el cuy
    estaba adentro, se espanta y sale. Si la arrastraron, cae donde la dejan
    (con el cuy adentro, que viaja con ella). */
export function soltarPiedra(mu: Mundo, ahora: number) {
  const p = mu.piedra
  if (p.estado !== 'colgar') return
  const clic = p.movida <= 6 && ahora - p.p0 < 600
  if (clic) {
    p.estado = p.y > 0.5 ? 'caer' : 'quieta'
    tocarPiedra(mu)
    return
  }
  if (mu.reducido) {
    p.estado = 'quieta'
    p.y = 0
    return
  }
  const parada = ahora - p.pt > 90
  p.vx = parada ? 0 : acotar(p.pvx, -LANCE_MAX, LANCE_MAX) * PESO_PIEDRA
  p.vy = parada ? 0 : acotar(-p.pvy, -LANCE_MAX, LANCE_MAX) * PESO_PIEDRA
  p.estado = 'caer'
}

/** Un toque: la piedra se bambolea; con el cuy adentro, chilla y sale espantado. */
export function tocarPiedra(mu: Mundo) {
  const p = mu.piedra
  if (!p.presente || p.modo === 'saliendo' || p.modo === 'entrando') return
  if (p.dentro) {
    ponerPiedra(mu, 'toque', 'chillido')
    p.echar = true
  } else ponerPiedra(mu, 'toque', 'toque')
}

/** El puntero pasa por encima: si el cuy está adentro y despierto, se asoma a mirar. */
export function rozarPiedra(mu: Mundo) {
  const p = mu.piedra
  if (!p.presente || p.modo !== 'ocupada' || p.estado !== 'quieta' || mu.animo === 'siesta') return
  ponerPiedra(mu, 'asomando', 'asoma')
  p.asomaEn = azar(4000, 8000)
}

// --- Juegos -----------------------------------------------------------------------

const libre = (m: Mono) =>
  m.presente && !m.juego && !m.arco && !m.aPiedra && (m.estado === 'reposo' || m.estado === 'caminar')

/** Cada cierto rato, y sólo en recreo, lanza un juego cuyos dos monos estén libres. */
function planificar(mu: Mundo, dt: number) {
  if (mu.animo !== 'recreo') return
  mu.proximo -= dt
  if (mu.proximo > 0) return
  mu.proximo = 1500 // si ahora no se puede, reintenta pronto
  if (mu.juegos.length >= JUEGOS_A_LA_VEZ) return
  const posibles = PAREJAS.filter(
    (p) => mu.reloj >= mu.listo[p.tipo] && libre(mu.monos[p.actor]) && candidatos(mu, p).length > 0,
  )
  if (!posibles.length) return
  const p = posibles[Math.floor(Math.random() * posibles.length)]
  const actor = mu.monos[p.actor]
  const elegibles = candidatos(mu, p)
  const objetivo = elegibles[Math.floor(Math.random() * elegibles.length)]
  empezar(mu, p.tipo, actor, objetivo)
  mu.proximo = azar(3500, 8000)
}

/** A quién puede apuntar un juego ahora mismo. */
function candidatos(mu: Mundo, p: (typeof PAREJAS)[number]): Mono[] {
  const actor = mu.monos[p.actor]
  if (p.tipo === 'escalada') return alturaBorde(mu, actor) > actor.alto * 1.2 ? [actor] : []
  if (p.objetivo) return libre(mu.monos[p.objetivo]) ? [mu.monos[p.objetivo]] : []
  const sueltos = mu.lista.filter((m) => m !== actor && !vuela(m) && libre(m) && m.y < 2)
  // Para subirse encima, sólo los que despiertos tienen lomo.
  return p.tipo === 'encima' ? sueltos.filter((m) => m.rasgos.lomo.reposo !== null) : sueltos
}

function empezar(mu: Mundo, tipo: TipoJuego, actor: Mono, objetivo: Mono) {
  const g: Juego = { tipo, actor, objetivo, fase: 0, t: 0, total: 0, lado: actor.x <= objetivo.x ? -1 : 1, dato: 0 }
  actor.juego = objetivo.juego = g
  mu.juegos.push(g)
  mu.listo[tipo] = mu.reloj + entre(ENFRIAMIENTO[tipo] ?? ENFRIAMIENTO.resto)
}

/** El perro se le viene encima — camina o corre hacia él y ya está cerca —: a
    veces el gatito se eriza y se aleja. En recreo y en estudia; raro, con enfriamiento. */
function asustar(mu: Mundo) {
  if (mu.animo === 'siesta' || mu.reloj < mu.listo.susto || mu.juegos.length >= JUEGOS_A_LA_VEZ) return
  const { gatito: g, perrito: p } = mu.monos
  if (!libre(g) || g.y > 2 || !p.presente || p.estado !== 'caminar') return
  const d = g.x - p.x
  if (Math.abs(d) > g.ancho * 1.1 || Math.sign(p.destino - p.x) !== Math.sign(d)) return
  if (Math.random() < SUSTO_PROB) empezar(mu, 'susto', g, g)
  else mu.listo.susto = mu.reloj + 8000 // esta vez no le importó
}

/** En la siesta, si le tocó: el gatito despierta, se va donde otro que duerme y
    se acuesta encima. */
function siestaEncima(mu: Mundo) {
  if (mu.animo !== 'siesta' || mu.reloj < mu.siestaEncima) return
  const g = mu.monos.gatito
  if (!g.presente || g.sobre || g.estado === 'colgar') {
    mu.siestaEncima = Infinity
    return
  }
  const camas = mu.lista.filter((m) => m !== g && m.presente && m.estado === 'dormir' && m.y < 2 && !m.juego)
  if (g.juego || g.estado !== 'dormir' || !camas.length) {
    mu.siestaEncima = mu.reloj + 2000 // todavía se están acomodando
    return
  }
  mu.siestaEncima = Infinity
  // La mitad de las veces el más cercano; si no, cruza hasta cualquiera.
  camas.sort((a, b) => Math.abs(a.x - g.x) - Math.abs(b.x - g.x))
  empezar(mu, 'encima', g, camas[Math.random() < 0.5 ? 0 : Math.floor(Math.random() * camas.length)])
}

/** Termina (o corta) un juego: suelta a sus dos monos. El que quedó en el aire cae. */
function cerrar(mu: Mundo, g: Juego) {
  mu.juegos = mu.juegos.filter((j) => j !== g)
  for (const m of [g.actor, g.objetivo]) {
    if (m.juego !== g) continue
    m.juego = null
    m.alturaJuego = null
    if (m.estado === 'colgar' || m.estado === 'caer') continue
    // El que duerme encima de otro, o el que duerme la siesta debajo, sigue durmiendo.
    if (m.estado === 'dormir' && (m.sobre || mu.animo === 'siesta')) continue
    m.arco = null
    if (!vuela(m) && m.y > 4 && m.presente) {
      despenar(m, m.y > m.alto * 0.8) // desde alto (el borde del marco), hecho bolita
    } else {
      m.sobre = null
      descansar(mu, m)
    }
  }
}

/** Manda al actor a pararse a `dist` del objetivo, por su lado (o el otro si no cabe). */
function acercar(mu: Mundo, g: Juego, dist: number, factor = 1) {
  const { actor: a, objetivo: o } = g
  const [x0, x1] = limites(mu, a)
  const x = o.x + g.lado * dist
  if (x < x0 || x > x1) g.lado = g.lado === 1 ? -1 : 1
  descansar(mu, o)
  mandar(mu, a, o.x + g.lado * dist, factor)
}

const pasar = (g: Juego) => {
  g.fase++
  g.t = 0
}

const quietos = (g: Juego) =>
  g.actor.estado === 'reposo' && g.objetivo.estado === 'reposo' && !g.actor.arco && !g.objetivo.arco

function avanzarJuego(mu: Mundo, g: Juego, dt: number) {
  const { actor: a, objetivo: o } = g
  g.t += dt
  g.total += dt
  if (g.total > JUEGO_MAX_MS || !a.presente || !o.presente) return cerrar(mu, g)
  const imp = a.tiempos.impacto
  const dur = a.tiempos.jugar

  switch (g.tipo) {
    // Gatito se acerca agazapado y se lanza en arco sobre el perrito.
    case 'acecho':
      if (g.fase === 0) {
        acercar(mu, g, a.ancho * 1.15, 0.6)
        pasar(g)
      } else if (g.fase === 1 && a.llego) {
        mirarA(a, o)
        actuar(a, 'jugar', dur)
        const vuelo = Math.min(imp, 420)
        trazar(a, o.x + g.lado * a.ancho * 0.3, a.alto * 0.55, vuelo, imp - vuelo)
        pasar(g)
      } else if (g.fase === 2 && (a.t >= imp || a.estado !== 'jugar')) {
        mirarA(o, a)
        reaccionar(mu, o, g)
        pasar(g)
      } else if (g.fase === 3 && a.estado === 'reposo') {
        trazar(a, dentro(mu, a, o.x + g.lado * a.ancho * 0.95), a.alto * 0.18, 260) // se baja de un brinco
        pasar(g)
      } else if (g.fase === 4 && quietos(g)) cerrar(mu, g)
      break

    // Perrito hace la reverencia de juego y persigue al conejito, que huye a saltos.
    case 'persecucion':
      if (g.fase === 0) {
        descansar(mu, o)
        mirarA(a, o)
        mirarA(o, a)
        actuar(a, 'jugar', dur)
        pasar(g)
      } else if (g.fase === 1 && (a.t >= imp || a.estado !== 'jugar')) {
        reaccionar(mu, o, g)
        pasar(g)
      } else if (g.fase === 2 && quietos(g)) {
        g.dato = azar(3500, 5500)
        g.lado = o.x >= a.x ? 1 : -1 // hacia dónde huye
        mandar(mu, o, g.lado > 0 ? mu.ancho : 0, 1.6)
        pasar(g)
      } else if (g.fase === 3) {
        if (g.t > g.dato) return cerrar(mu, g)
        if (o.llego) {
          g.lado = g.lado === 1 ? -1 : 1 // topó con la pared: se devuelve
          mandar(mu, o, g.lado > 0 ? mu.ancho : 0, 1.6)
        }
        // El perro corre tras él pero nunca lo alcanza: se queda a medio cuerpo.
        const meta = o.x - Math.sign(o.x - a.x || 1) * a.ancho * 0.55
        if (Math.abs(meta - a.x) > a.ancho * 0.25 || a.estado === 'caminar') mandar(mu, a, meta, 1.35)
      }
      break

    // Conejito hace un binky al lado del cuy, y el cuy contesta con palomitas.
    case 'binky':
      if (g.fase === 0) {
        acercar(mu, g, a.ancho * 0.95)
        pasar(g)
      } else if (g.fase === 1 && a.llego) {
        mirarA(a, o)
        mirarA(o, a)
        actuar(a, 'jugar', dur)
        const vuelo = Math.min(dur, 480)
        trazar(a, a.x, a.alto * 0.6, vuelo, Math.max(0, Math.min(imp - vuelo / 2, dur - vuelo)))
        pasar(g)
      } else if (g.fase === 2 && (a.t >= imp || a.estado !== 'jugar')) {
        actuar(o, 'jugar', o.tiempos.jugar)
        trazar(o, o.x, o.alto * 0.3, o.tiempos.jugar * 0.85, 0, 3)
        pasar(g)
      } else if (g.fase === 3 && quietos(g)) cerrar(mu, g)
      break

    // Ranita salta por encima del caracol, que se esconde; al caer, un lengüetazo.
    case 'salto':
      if (g.fase === 0) {
        acercar(mu, g, a.ancho * 1.15)
        pasar(g)
      } else if (g.fase === 1 && a.llego) {
        const x1 = o.x - g.lado * a.ancho * 1.15
        const cabe = x1 === dentro(mu, a, x1)
        if (!cabe) return cerrar(mu, g)
        mirarA(a, o)
        reaccionar(mu, o, g)
        actuar(a, 'jugar', 200 + 720, 'caminar') // el salto es su andar, en grande
        trazar(a, x1, o.alto * 0.95, 720, 200)
        pasar(g)
      } else if (g.fase === 2 && a.estado === 'reposo') {
        a.estado = 'caer' // el aplaste del aterrizaje
        a.fase = 'suelo'
        a.t = 0
        a.fin = a.tiempos.caer
        animar(a, 'caer')
        pasar(g)
      } else if (g.fase === 3 && a.estado === 'reposo') {
        mirarA(a, o)
        actuar(a, 'jugar', dur)
        pasar(g)
      } else if (g.fase === 4 && quietos(g)) cerrar(mu, g)
      break

    // Cuy hace palomitas frente al gatito, que se eriza.
    case 'palomitas':
      if (g.fase === 0) {
        acercar(mu, g, (a.ancho + o.ancho) * 0.45)
        pasar(g)
      } else if (g.fase === 1 && a.llego) {
        mirarA(a, o)
        mirarA(o, a)
        actuar(a, 'jugar', dur)
        trazar(a, a.x, a.alto * 0.3, dur * 0.85, 0, 3)
        pasar(g)
      } else if (g.fase === 2 && (a.t >= imp || a.estado !== 'jugar')) {
        reaccionar(mu, o, g)
        pasar(g)
      } else if (g.fase === 3 && quietos(g)) cerrar(mu, g)
      break

    // Gatito corre, salta al borde de arriba del marco, cuelga un rato intentando
    // subir (sube un poco y resbala), se suelta y cae dando vueltas.
    case 'escalada': {
      const borde = alturaBorde(mu, a)
      if (g.fase === 0) {
        const lado = Math.random() < 0.5 ? -1 : 1
        const tramo = azar(1.2, 2.6) * a.ancho
        const x = dentro(mu, a, a.x + lado * tramo)
        // No se cuelga delante del rótulo: el sitio del salto (y medio cuerpo a cada
        // lado, por donde quede colgado) se corre fuera de las zonas del reloj.
        const sitio = Math.abs(x - a.x) > a.ancho * 0.6 ? x : dentro(mu, a, a.x - lado * tramo)
        mandar(mu, a, dentro(mu, a, fuera(mu, a, sitio, borde, a.ancho * 0.45)), 1.8)
        pasar(g)
      } else if (g.fase === 1 && a.llego) {
        const impulso = Math.min(imp * 0.45, 400) // se agazapa antes de saltar
        const ms = acotar(900 * Math.sqrt(borde / 600), 450, 950)
        actuar(a, 'jugar', impulso + ms)
        trazar(a, dentro(mu, a, fuera(mu, a, a.x + a.mira * a.ancho * 0.4, borde)), 0, ms, impulso, 1, borde)
        pasar(g)
      } else if (g.fase === 2 && a.estado === 'reposo') {
        a.estado = 'trepar'
        a.t = 0
        a.y = borde
        animar(a, 'trepar')
        g.dato = azar(3000, 6000)
        pasar(g)
      } else if (g.fase === 3) {
        // Cada 1,6 s gana un poco de altura y al final resbala hasta el agarre.
        const u = (g.t % 1600) / 1600
        const gana = u < 0.75 ? u / 0.75 : (1 - (u - 0.75) / 0.25) ** 2
        a.y = borde + a.alto * 0.12 * gana
        if (g.t > g.dato) {
          despenar(a, true, a.mira * azar(30, 110) * escala(a), 140)
          return cerrar(mu, g)
        }
      }
      break
    }

    // El perro se le vino encima: se eriza y se aleja corriendo.
    case 'susto': {
      const perro = mu.monos.perrito
      if (g.fase === 0) {
        mirarA(a, perro)
        reaccionar(mu, a, g)
        g.lado = a.x >= perro.x ? 1 : -1
        pasar(g)
      } else if (g.fase === 1 && a.estado === 'reposo') {
        const tramo = azar(1.5, 2.6) * a.ancho
        const x = dentro(mu, a, a.x + g.lado * tramo)
        // Arrinconado contra la pared, escapa por el otro lado.
        mandar(mu, a, Math.abs(x - a.x) > a.ancho * 0.7 ? x : dentro(mu, a, a.x - g.lado * tramo), 1.7)
        pasar(g)
      } else if (g.fase === 2 && a.llego) {
        mirarA(a, perro)
        return cerrar(mu, g)
      }
      break
    }

    // Gatito salta sobre otro que está quieto o dormido y se acuesta en su lomo.
    // En recreo duerme un rato y se baja; en la siesta se queda (si el de abajo
    // se mueve o despierta, se cae: eso lo vigila avanzarMono).
    case 'encima':
      if (g.fase === 0) {
        if (o.estado !== 'dormir') descansar(mu, o)
        if (a.estado === 'dormir') descansar(mu, a)
        const dist = (a.ancho + o.ancho) * 0.45
        if (o.x + g.lado * dist !== dentro(mu, a, o.x + g.lado * dist)) g.lado = g.lado === 1 ? -1 : 1
        mandar(mu, a, o.x + g.lado * dist)
        pasar(g)
      } else if (g.fase === 1 && a.llego) {
        mirarA(a, o)
        actuar(a, 'jugar', dur)
        const vuelo = Math.min(imp, 420)
        a.sobre = o
        a.sobreDx = -o.mira * o.ancho * o.rasgos.lomo.atras // hacia la grupa
        trazar(a, o.x + a.sobreDx, a.alto * 0.3, vuelo, imp - vuelo, 1, alturaLomo(o))
        pasar(g)
      } else if (g.fase === 2 && a.estado === 'reposo') {
        if (a.sobre !== o) return cerrar(mu, g)
        dormir(a)
        a.posado = false
        if (mu.animo === 'siesta') return cerrar(mu, g) // se queda toda la siesta
        g.dato = azar(7000, 14000)
        pasar(g)
      } else if (g.fase === 3 && g.t > g.dato && a.estado === 'dormir') {
        a.sobre = null
        descansar(mu, a)
        a.mira = g.lado
        trazar(a, dentro(mu, a, o.x + g.lado * (a.ancho + o.ancho) * 0.45), a.alto * 0.15, 300, 0, 1, -a.y)
        pasar(g)
      } else if (g.fase === 4 && quietos(g)) cerrar(mu, g)
      break

    // Appa baja, pasa rasante con una voltereta y el de abajo reacciona.
    case 'sobrevuelo':
      if (g.fase === 0) {
        // Rasante, y por debajo de lo que haya encima del objetivo (la placa de mandos).
        const techo = Math.min(...mu.zonas.filter((z) => o.x + a.ancho * 1.8 > z.x0 && o.x - a.ancho * 1.8 < z.x1).map((z) => z.y0), Infinity)
        a.alturaJuego = Math.max(0, Math.min(crucero(mu, a), o.alto * 0.7, techo - lomoDe(a) - HOLGURA - a.alto * 0.12 - 14)) // (el arco de la voltereta y los 14 px con que da por buena la altura)
        acercar(mu, g, a.ancho * 1.3, 1.4)
        pasar(g)
      } else if (g.fase === 1 && a.llego && (Math.abs(a.y - a.alturaJuego!) < 14 || g.t > 6000)) {
        mirarA(a, o)
        const ms = Math.max(dur, 1100)
        actuar(a, 'jugar', ms)
        trazar(a, dentro(mu, a, o.x - g.lado * a.ancho * 1.3), a.alto * 0.12, ms)
        pasar(g)
      } else if (g.fase === 2 && (a.t >= imp || a.estado !== 'jugar' || (a.x - o.x) * g.lado <= 0)) {
        mirarA(o, a)
        reaccionar(mu, o, g)
        pasar(g)
      } else if (g.fase === 3 && quietos(g)) cerrar(mu, g)
      break
  }
}
