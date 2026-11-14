import type { ReactNode } from 'react'
import type { Animal, Animo } from './Monitos'
import { Fig, Zeta } from './MonitosComun'

/**
 * Piel "pluma": los animalitos como doodles de estilográfica al margen del
 * Código. Contorno abierto de 2,4u en tinta, sin relleno, perfil de tres
 * cuartos; sólo en la pausa aparece el destacador, corrido un pelo hacia
 * atrás como un subrayado mal puesto. Cada animal se reconoce por su silueta:
 *   - estudia: parado o sentado, vertical, mirando al centro;
 *   - recreo: diagonal, extremidades afuera;
 *   - siesta: ovillo bajo, con zetas y su tacita (Appa no toma té).
 * Las clases (`mono__macizo`, `__marca`, `__ojo`…) las viste el CSS.
 * Los gestos (orejas, cola, patas) viven en elementos propios, nunca en el
 * mismo nodo que lleva el `transform` de posición.
 */

/** Contorno de tinta con el destacador corrido detrás. El mismo trazo sirve a
    los dos: el relleno cierra solo lo que el contorno deja abierto, y `cierre`
    alarga el destacador por dentro de la cabeza para que no asome su corte. */
const Marcado = ({ d, clase = '', cierre = '' }: { d: string; clase?: string; cierre?: string }) => (
  <>
    <path className="mono__marca" d={d + cierre} />
    <path className={`mono__macizo ${clase}`} d={d} />
  </>
)

/** Ojos de punto, algo grandes y separados; cerrados (◡) en la siesta. */
const Ojos = ({ animo, puntos }: { animo: Animo; puntos: [number, number][] }) => (
  <>
    {puntos.map(([x, y], i) =>
      animo === 'siesta' ? (
        <path key={i} className="mono__parpadeo" d={`M${x - 3.6} ${y} Q${x} ${y + 3.6} ${x + 3.6} ${y}`} />
      ) : (
        <circle key={i} className="mono__ojo" cx={x} cy={y} r="2.3" />
      ),
    )}
  </>
)

/** La tacita de la siesta: loza con su asa y un hilo de vapor. */
const Taza = ({ x, y }: { x: number; y: number }) => (
  <g>
    <path className="mono__taza" d={`M${x} ${y} h10 v5 q0 5 -5 5 q-5 0 -5 -5 z`} />
    <path className="mono__trazo" d={`M${x + 10} ${y + 1.8} q4.2 0 4.2 3 q0 3 -4.2 3`} />
    <path className="mono__trazo mono__vapor" d={`M${x + 5} ${y - 2.5} q2 -2.4 0 -5`} />
  </g>
)

/* ------------------------------------------------------------ conejito --- */

const CARA_CONEJO =
  'M-8 9 C-14 4 -13 -6 -6 -10 C1 -13.5 11 -11.5 13.5 -3 C15.5 4 10 11.5 2 12 C0 12.2 -1.5 12.1 -3 11.8'

/** La cabeza se dibuja en torno al origen, mirando a +x; cada pose la coloca.
    En la siesta las orejas van aparte, echadas sobre el lomo. */
function CabezaConejito({ animo, orejas = true }: { animo: Animo; orejas?: boolean }) {
  return (
    <g>
      {orejas && (
        <>
          <path className="mono__trazo mono__oreja" d="M-7 -9 C-14 -20 -12 -32 -6 -34 C-1 -34.5 0 -22 -2 -11" />
          <path className="mono__trazo mono__oreja mono__oreja--otra" d="M3 -12 C0 -23 4 -34 10 -33.5 C16 -33 13 -21 9.5 -11" />
          <path className="mono__calado" d="M9.5 -28 C10.4 -24 9.8 -20 8.8 -16.5" />
        </>
      )}
      <Marcado d={CARA_CONEJO} />
      <Ojos animo={animo} puntos={[[0, -1], [9, -1]]} />
      <circle className="mono__ojo" cx="13" cy="2.8" r="1.6" />
      <path className="mono__calado" d="M8.4 7 Q10.6 9.2 12.8 6.8" />
    </g>
  )
}

function Conejito(animo: Animo): ReactNode {
  return (
    <Fig piel="pluma" animal="conejito">
      {animo === 'estudia' && (
        <>
          <Marcado d="M31 52 C25 60 24 71 29 76 C33 79.5 47 79.5 51 76 C56 71 56 60 50 52" />
          <path className="mono__trazo" d="M33 78 C33 72.5 40 72.5 40 78" />
          <path className="mono__trazo" d="M43.5 78 C43.5 72.5 50.5 72.5 50.5 78" />
          <path className="mono__trazo" d="M28 66 C21 62 18 70 22.5 75" />
          <g transform="translate(41 40)">
            <CabezaConejito animo={animo} />
          </g>
        </>
      )}
      {animo === 'recreo' && (
        <>
          <Marcado
            d="M46 42 C38 38 26 42 19 50 C13 57 15 67 23 68 C32 69 44 64 52 58"
            cierre="L60 50 L56 40"
          />
          <path className="mono__trazo mono__pata" d="M23 62 C18 68 11 71 5 73.5 C2.5 75 4 79 8 78 C15 77 24 75 31 69" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M51 57 C56 61 60 65 62.5 68 C64 70 62 72.5 59.5 71.5" />
          <path className="mono__trazo" d="M15 50 C9 47 5.5 54 10.5 58" />
          <g transform="translate(61 41) rotate(-30)">
            <CabezaConejito animo={animo} />
          </g>
        </>
      )}
      {animo === 'siesta' && (
        <>
          <path className="mono__trazo mono__oreja" d="M38 56 C30 49 19 49 11 54 C8.5 56 10.5 59.5 14 58.5 C22 56.5 31 58 38 61" />
          <path className="mono__trazo mono__oreja mono__oreja--otra" d="M41 53 C33 46 24 44 16 46 C13 47 13.4 50.6 17 50.8 C25 51 33 53.5 40 58" />
          <Marcado d="M36 64 C28 61 15 63 11 70 C8 76 12 79 20 79 L40 79" />
          <path className="mono__trazo" d="M9 69 C3 66 1 73 5.5 76" />
          <g transform="translate(48 65) rotate(8)">
            <CabezaConejito animo={animo} orejas={false} />
          </g>
          <Taza x={64} y={68} />
          <Zeta x={52} y={36} />
          <Zeta x={61} y={29} lejos />
        </>
      )}
    </Fig>
  )
}

/* -------------------------------------------------------------- gatito --- */

const CARA_GATO =
  'M-9 8 C-14 3 -13.5 -5 -9 -8.5 C-4 -12.5 6 -12.5 11 -9 C15 -5 15 3 10 8.5 C6 12 -1 12 -5 10.5'

function CabezaGatito({ animo }: { animo: Animo }) {
  return (
    <g>
      <path className="mono__trazo mono__oreja" d="M-10.5 -6.5 L-12 -21 Q-11 -23 -8.5 -21.5 L-2.5 -12" />
      <path className="mono__trazo mono__oreja mono__oreja--otra" d="M5.5 -12.2 L11.5 -22 Q13.5 -23.2 14.4 -20.8 L13.6 -7" />
      <Marcado d={CARA_GATO} />
      <Ojos animo={animo} puntos={[[0, -1], [9, -1]]} />
      <path className="mono__ojo" d="M10.8 2.6 L14 2.6 L12.4 4.6 Z" />
      <path className="mono__calado" d="M12.4 4.6 Q11 7.6 8.6 7.2 M12.4 4.6 Q13.8 7.6 16 7" />
      <path className="mono__calado" d="M15.6 1 L22 -1 M15.8 3 L22.4 4" />
      <path className="mono__calado" d="M-3.8 1 L-9.6 -0.6 M-3.6 3 L-9.8 4.6" />
    </g>
  )
}

function Gatito(animo: Animo): ReactNode {
  return (
    <Fig piel="pluma" animal="gatito">
      {animo === 'estudia' && (
        <>
          <Marcado d="M30 40 C21 54 21 70 29 76 C35 80 46 80 52 76 C58 70 57 54 50 40" />
          <path className="mono__trazo" d="M32 78 C32 72.5 39.5 72.5 39.5 78" />
          <path className="mono__trazo" d="M42.5 78 C42.5 72.5 50 72.5 50 78" />
          <path className="mono__trazo mono__cola" d="M54 75 C66 78 69 66 62 61 C57 57 61 51 66 53" />
          <g transform="translate(40 27)">
            <CabezaGatito animo={animo} />
          </g>
        </>
      )}
      {animo === 'recreo' && (
        <>
          <Marcado
            d="M50 42 C40 36 26 39 19 47 C13 54 15 63 22 64 C32 66 44 61 52 56"
            cierre="L62 52 L58 40"
          />
          <path className="mono__trazo mono__cola" d="M17 49 C8 47 4 37 9 29 C12 24 18 26 16 31" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M20 60 C16 65 13 69 12 72 Q11.5 75 15.5 74.5" />
          <path className="mono__trazo mono__pata" d="M28 64 C28 69 27 73 27 75.5 Q27.2 78 31.5 77.5" />
          <path className="mono__trazo mono__pata" d="M45 60 C47 66 48 71 48 75.5 Q48.4 78 52.5 77.5" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M53 57 C58 59 62 62 64 65 Q65 68 61 67.6" />
          <g transform="translate(62 38) rotate(-12)">
            <CabezaGatito animo={animo} />
          </g>
        </>
      )}
      {animo === 'siesta' && (
        <>
          <Marcado d="M30 59 C14 58 8 70 15 76 C22 81 40 81 49 77" />
          <path className="mono__trazo mono__cola" d="M13 75 C4 70 6 59 18 56" />
          <g transform="translate(46 64) rotate(10)">
            <CabezaGatito animo={animo} />
          </g>
          <Taza x={64} y={68} />
          <Zeta x={54} y={32} />
          <Zeta x={63} y={25} lejos />
        </>
      )}
    </Fig>
  )
}

/* ------------------------------------------------------------------ cuy --- */

const CARA_CUY =
  'M-10 9 C-15 3 -13 -6 -6 -10 C2 -13.5 11 -10 14 -2 C15.5 3 12 9 6 11.5 C3 12.5 0 12.4 -3 11.6'

function CabezaCuy({ animo }: { animo: Animo }) {
  return (
    <g>
      <path className="mono__trazo mono__oreja" d="M-8 -6 C-15 -9 -19 -2 -14 3 C-11 5.5 -8 3 -8 0" />
      <Marcado d={CARA_CUY} />
      <Ojos animo={animo} puntos={[[1, -1.5], [9.5, -1.5]]} />
      <circle className="mono__ojo" cx="14" cy="2" r="1.7" />
      <path className="mono__calado" d="M9.4 6.8 Q11.4 8.8 13.6 6.2" />
    </g>
  )
}

function Cuy(animo: Animo): ReactNode {
  return (
    <Fig piel="pluma" animal="cuy">
      {animo === 'estudia' && (
        <>
          {/* Excepción a la silueta vertical: el cuy se echa de lado mirando al
              centro — sentado parecía una papa; así se lee cuy. */}
          <Marcado d="M52 50 C40 42 22 44 14 54 C8 62 10 74 20 77 C30 79.5 48 79 58 72" cierre="L64 62 L60 46" />
          <path className="mono__calado" d="M24 62 C23 55 33 53 35 60 C37 67 29 69 27 64 C26 61 30 60 31 62" />
          <path className="mono__trazo" d="M18 78 C18 74 25 74 25 78" />
          <path className="mono__trazo" d="M38 78 C38 74 45 74 45 78" />
          <g transform="translate(58 58) scale(1.05)">
            <CabezaCuy animo={animo} />
          </g>
        </>
      )}
      {animo === 'recreo' && (
        <g transform="rotate(-12 40 56)">
          <Marcado d="M54 40 C44 34 24 36 13 46 C6 53 8 66 18 69 C30 73 50 71 60 61" cierre="L66 50 L62 38" />
          <path className="mono__trazo" d="M20 68 C19 73 22 76 26 75.5" />
          <path className="mono__trazo" d="M44 69.5 C43 74.5 46 77.5 50 76.5" />
          <g transform="translate(60 49) rotate(6)">
            <CabezaCuy animo={animo} />
          </g>
        </g>
      )}
      {animo === 'siesta' && (
        <>
          <Marcado d="M34 57 C16 56 8 68 14 75 C20 81 38 81 48 77" />
          <g transform="translate(46 65) rotate(10) scale(1.1)">
            <CabezaCuy animo={animo} />
          </g>
          <Taza x={64} y={68} />
          <Zeta x={50} y={36} />
          <Zeta x={59} y={29} lejos />
        </>
      )}
    </Fig>
  )
}

/* -------------------------------------------------------------- caracol --- */

/** La concha: círculo abierto y, adentro, una espiral que se lee como un §. */
const CONCHA_CIRCULO = (r: number) =>
  `M${r * 0.8} ${r * 0.62} C${r * 1.0} ${r * 0.1} ${r * 0.7} ${-r * 0.8} ${-r * 0.05} ${-r} C${-r * 0.9} ${-r * 1.05} ${-r * 1.15} ${r * 0.3} ${-r * 0.55} ${r * 0.85} C${-r * 0.3} ${r * 1.0} ${r * 0.1} ${r * 1.0} ${r * 0.35} ${r * 0.92}`

function Concha({ r, x, y, giro = 0 }: { r: number; x: number; y: number; giro?: number }) {
  const k = r / 20
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <Marcado d={CONCHA_CIRCULO(r)} />
      <path
        className="mono__calado"
        transform={`scale(${k})`}
        d="M-7 -7 C-1 -13 10 -9 10 -1 C10 7 1 10 -4 7 C-9 4 -7 -3 -1 -3 C3 -3 4 2 1 3"
      />
    </g>
  )
}

function Caracol(animo: Animo): ReactNode {
  return (
    <Fig piel="pluma" animal="caracol">
      {animo === 'estudia' && (
        <>
          <Concha r={21} x={29} y={55} giro={-8} />
          <path className="mono__trazo" d="M10 78 C18 78.5 40 78.5 52 78 C58 78 61 77 61 72 C61 54 59 40 57 34 C56 30 56 27 57 25" />
          <path className="mono__trazo" d="M45 77 C46 66 48 58 49 52" />
          <Marcado d="M57 25 C51 24 49 19 52 15 C55 12 60 12 63 15 C65 18 64 22 61 24.5" />
          <path className="mono__trazo mono__cuerno" d="M54 14 C52 10 52 7 53.5 4.5" />
          <path className="mono__trazo mono__cuerno mono__cuerno--otro" d="M60.5 14 C61 10 62.5 7 64.5 5.5" />
          <circle className="mono__ojo" cx="53.5" cy="4.4" r="2.1" />
          <circle className="mono__ojo" cx="64.6" cy="5.5" r="2.1" />
          <circle className="mono__ojo" cx="55" cy="19" r="2.1" />
          <circle className="mono__ojo" cx="61.5" cy="19" r="2.1" />
          <path className="mono__calado" d="M57 22 Q58.6 23.6 60.2 22" />
        </>
      )}
      {animo === 'recreo' && (
        <>
          <Concha r={19} x={30} y={53} giro={6} />
          <path className="mono__trazo" d="M3 77 C12 78.5 40 78.5 58 78 C66 77 72 72 71 64 C70 58 68 54 66 50" />
          <path className="mono__trazo" d="M3 77 C6 74 10 73 13 73" />
          <Marcado d="M66 50 C59 52 54 47 56 41 C58 36 65 35 69 38 C72 41 72 47 69 50" />
          <path className="mono__trazo mono__cuerno" d="M58 38 C54 33 53 28 54 24" />
          <path className="mono__trazo mono__cuerno mono__cuerno--otro" d="M66.5 36.5 C68 31 71 27 75 25" />
          <circle className="mono__ojo" cx="54" cy="23.5" r="2.1" />
          <circle className="mono__ojo" cx="75.4" cy="24.8" r="2.1" />
          <circle className="mono__ojo" cx="60" cy="43" r="2.1" />
          <circle className="mono__ojo" cx="66.5" cy="43" r="2.1" />
          <path className="mono__calado" d="M61.6 46.6 Q63.6 49 65.6 46.6" />
        </>
      )}
      {animo === 'siesta' && (
        <>
          <Concha r={24} x={34} y={53} giro={-6} />
          <path className="mono__trazo" d="M6 78 C14 78.5 44 78.5 58 78 C66 77.5 71 76 72 72" />
          <path className="mono__trazo" d="M56 70 C62 70 67 71 72 72" />
          <path className="mono__parpadeo" d="M63.4 74 Q65.2 75.8 67 74" />
          <Zeta x={58} y={36} />
          <Zeta x={66} y={29} lejos />
          <Taza x={64} y={58} />
        </>
      )}
    </Fig>
  )
}

/* -------------------------------------------------------------- perrito --- */

/** La cara lleva hocico: es lo que lo separa del gatito de un vistazo. */
const CARA_PERRO =
  'M-9 7 C-14 2 -13.5 -5 -9 -8.5 C-4 -12.5 5 -12.5 9 -10 C12 -8 13 -5 13.5 -2 C19 -3 22 2 20 6.5 C18.5 10.5 13 11 9 10 C5 12 -1 12 -5 10.5'

function CabezaPerrito({ animo }: { animo: Animo }) {
  return (
    <g>
      <path className="mono__trazo mono__oreja mono__oreja--otra" d="M4 -11 C9 -17 17 -13 15 -6" />
      <Marcado d={CARA_PERRO} />
      <path className="mono__trazo mono__oreja" d="M-4 -11 C-13 -12 -16 -2 -13 7 C-11 12 -5 10 -4 4" />
      <Ojos animo={animo} puntos={[[0.5, -3], [9, -3]]} />
      <path className="mono__ojo" d="M16 -0.2 Q19.6 -1 20.4 2 Q19.4 4.4 17 4.4 Q14.8 3.2 16 -0.2 Z" />
      <path className="mono__calado" d="M17.2 4.4 Q17.4 8.6 13.4 8.6" />
      {animo === 'recreo' && <path className="mono__lengua" d="M14 8.6 Q13.4 15 16.8 14.6 Q18.6 13 17.6 7.6" />}
    </g>
  )
}

function Perrito(animo: Animo): ReactNode {
  return (
    <Fig piel="pluma" animal="perrito">
      {animo === 'estudia' && (
        <>
          <Marcado d="M30 33 C21 46 21 68 29 75 C35 80 47 80 53 75 C60 68 59 46 51 33" />
          <path className="mono__trazo" d="M32 78 C32 72.5 39.5 72.5 39.5 78" />
          <path className="mono__trazo" d="M43 78 C43 72.5 50.5 72.5 50.5 78" />
          <path className="mono__trazo mono__cola" d="M26 76 C14 78 11 68 16 62 C19 58 17 54 14 55" />
          <g transform="translate(39 21)">
            <CabezaPerrito animo={animo} />
          </g>
        </>
      )}
      {animo === 'recreo' && (
        <>
          <Marcado
            d="M48 40 C38 34 24 38 17 47 C11 54 14 63 21 64 C31 66 44 61 52 56"
            cierre="L60 52 L56 38"
          />
          <path className="mono__trazo mono__cola" d="M15 48 C8 44 6 35 10 26 C11 23 14 22 15 24" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M19 61 C15 66 12 70 11 73 Q10.5 76 14.5 75.5" />
          <path className="mono__trazo mono__pata" d="M27 64 C27 69 26 73 26 75.5 Q26.2 78 30.5 77.5" />
          <path className="mono__trazo mono__pata" d="M44 61 C46 66 47 71 47 75.5 Q47.4 78 51.5 77.5" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M52 57 C57 59 61 62 63 65 Q64 68 60 67.6" />
          <g transform="translate(56 34) rotate(-8)">
            <CabezaPerrito animo={animo} />
          </g>
        </>
      )}
      {animo === 'siesta' && (
        <>
          <Marcado d="M30 60 C14 59 8 70 14 76 C21 81 38 81 47 77" />
          <path className="mono__trazo mono__cola" d="M11 73 C4 72 3 63 9 61" />
          <g transform="translate(41 65) rotate(8)">
            <CabezaPerrito animo={animo} />
          </g>
          <Taza x={64} y={68} />
          <Zeta x={50} y={36} />
          <Zeta x={59} y={29} lejos />
        </>
      )}
    </Fig>
  )
}

/* --------------------------------------------------------------- ranita --- */

/** Dos globos de ojos sobre una boca ancha: la cabeza es casi toda sonrisa. */
const CARA_RANA =
  'M-14.5 -3 C-16 -13 -6 -17 -2.5 -9 Q0 -7 2.5 -9 C6 -17 16 -13 14.5 -3 C16 5 9 11.5 0 11.5 C-8 11.5 -13 9 -15 4'

function CabezaRana({ animo }: { animo: Animo }) {
  return (
    <g>
      <Marcado d={CARA_RANA} />
      <Ojos animo={animo} puntos={[[-8.5, -7.5], [8.5, -7.5]]} />
      <path className="mono__calado" d="M-8 3.5 Q1 10 10 3.5" />
      <circle className="mono__ojo" cx="-1.4" cy="0" r="0.9" />
      <circle className="mono__ojo" cx="3.2" cy="0" r="0.9" />
    </g>
  )
}

function Ranita(animo: Animo): ReactNode {
  return (
    <Fig piel="pluma" animal="ranita">
      {animo === 'estudia' && (
        <>
          <Marcado d="M25 31 C16 42 15 62 23 72 C31 80 49 80 57 72 C65 62 64 42 55 31" />
          <path className="mono__trazo mono__pata" d="M24 62 C16 64 14 73 20 77.5 C23 79 28 78 31 76" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M56 62 C64 64 66 73 60 77.5 C57 79 52 78 49 76" />
          <path className="mono__trazo" d="M33 52 C32 58 34 63 38 65" />
          <path className="mono__trazo" d="M47 52 C48 58 46 63 42 65" />
          <g transform="translate(40 23) scale(1.2)">
            <CabezaRana animo={animo} />
          </g>
        </>
      )}
      {animo === 'recreo' && (
        <>
          <Marcado
            d="M52 46 C42 41 28 45 22 54 C18 62 24 68 32 68 C42 68 52 63 57 55"
            cierre="L64 48 L58 38"
          />
          <path className="mono__trazo mono__pata" d="M26 60 C18 63 12 69 6 75 C3.5 77.5 6 80 9.5 78 C15 75 21 72.5 29 68" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M54 57 C59 61 63 64 66 68 C67.5 70.5 65 72 62.5 70.5" />
          <g transform="translate(62 40) rotate(-14) scale(1.1)">
            <CabezaRana animo={animo} />
          </g>
        </>
      )}
      {animo === 'siesta' && (
        <>
          <Marcado d="M20 66 C8 68 8 79 18 79 L50 79 C62 79 62 68 54 65" />
          <path className="mono__trazo" d="M14 79 C14 75 19 74 22 77" />
          <g transform="translate(38 58) scale(1.4)">
            <CabezaRana animo={animo} />
          </g>
          <Taza x={64} y={68} />
          <Zeta x={52} y={30} />
          <Zeta x={61} y={23} lejos />
        </>
      )}
    </Fig>
  )
}

/* ----------------------------------------------------------------- appa --- */

const CARA_APPA =
  'M-10 7 C-15 1 -14 -8 -7 -12 C0 -15 10 -12 14 -4 C17 2 14 9 8 12 C4 13.5 -1 13 -4 11.5'

/** El bisonte volador: cabezota, dos cuernos en media luna, orejón caído y la
    flecha en la frente. */
function CabezaAppa({ animo }: { animo: Animo }) {
  return (
    <g>
      <path className="mono__trazo" d="M6 -12.4 C5 -18.5 9 -24.5 16 -22.5 C12.5 -21.5 11 -17 11.6 -11.6" />
      <path className="mono__trazo mono__oreja" d="M-9 -3 C-19 -5 -22 5 -16 8.5 C-13 10 -10.5 7.5 -10 5" />
      <Marcado d={CARA_APPA} />
      <path className="mono__trazo" d="M-6 -11 C-9.5 -18.5 -4 -25.5 4 -24 C0 -22.5 -1 -17.5 -1 -12.2" />
      <path className="mono__trazo mono__flecha" d="M3.4 -10 L6.2 -3.6 M3.2 -6.8 L6.2 -3.6 L8.6 -6.8" />
      <Ojos animo={animo} puntos={[[0, -0.5], [10, -0.5]]} />
      <circle className="mono__ojo" cx="14" cy="3.4" r="1.5" />
      <path className="mono__calado" d="M7.4 7 Q10 9.4 12.6 6.6" />
    </g>
  )
}

const COLA_APPA = 'M24 36 C11 24 1 30 2 40 C3 50 13 52 25 45'
/** El lomo va en festones, como pelaje esponjoso: lo que lo separa de un roedor.
    Es una nube alta: volumen de bisonte, no un salchichón. */
const CUERPO_APPA =
  'M80 22 C77 14 70 13 67 18 C64 11 56 11 53 17 C50 11 42 11 39 17 C34 13 27 16 26 22 C19 25 16 33 18 40 C20 49 30 54 42 54 L72 54 C82 54 91 48 92 41'

/** Seis patitas cortas, agrupadas en tres pares. */
const PATAS_APPA = [27, 48, 69]

function PatasAppa() {
  return (
    <>
      {PATAS_APPA.map((x) => (
        <g key={x}>
          <path className="mono__trazo" d={`M${x} 54 L${x} 58 Q${x} 62 ${x + 4} 62 L${x + 10} 62 Q${x + 14} 62 ${x + 14} 58 L${x + 14} 54`} />
          <path className="mono__calado" d={`M${x + 7} 57.5 L${x + 7} 61.5`} />
        </g>
      ))}
    </>
  )
}

function Appa(animo: Animo): ReactNode {
  return (
    <Fig piel="pluma" animal="appa">
      {animo === 'estudia' && (
        <>
          <path className="mono__trazo mono__cola" d={COLA_APPA} />
          <path className="mono__calado" d="M5 39 C10 38 16 39 21 41" />
          <Marcado d={CUERPO_APPA} cierre="L100 40 L96 22" />
          <PatasAppa />
          <path className="mono__calado" d="M45 28 C47 32 47 37 45 41 M58 27 C60 31 60 36 58 40" />
          <g transform="translate(98 36) scale(1.1)">
            <CabezaAppa animo={animo} />
          </g>
        </>
      )}
      {animo === 'recreo' && (
        <g transform="translate(0 -3) rotate(-10 60 36)">
          <path className="mono__trazo mono__cola" d={COLA_APPA} />
          <path className="mono__calado" d="M5 39 C10 38 16 39 21 41" />
          <Marcado d={CUERPO_APPA} cierre="L100 40 L96 22" />
          <path className="mono__trazo mono__pata" d="M29 54 C25 58 23 61 26 62.5 C29 64 33 61 35 55 M36 54 C34 58 34 62 37 63 C40 63.5 42 60 42 55" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M49 54 C47 58 46 61 49 62 C52 62.5 54 60 55 55 M56 54 C56 58 57 61.5 60 61.5 C62 61.5 63 59 62 55" />
          <path className="mono__trazo mono__pata" d="M68 54 C68 58 70 61 73 60.5 C75 60 75 57 74 54 M75 54 C77 57 80 58 82 56.5 C83 55.5 82 54.5 81 54" />
          <g transform="translate(98 36) rotate(-6) scale(1.1)">
            <CabezaAppa animo={animo} />
          </g>
        </g>
      )}
      {animo === 'siesta' && (
        <>
          {/* Un ovillo de pelo flotando: las patas van metidas y la cola lo abraza. */}
          <path className="mono__trazo mono__cola" d="M36 36 C24 24 12 30 14 40 C16 50 28 52 40 46" />
          <path className="mono__calado" d="M18 39 C22 38 27 39 31 41" />
          <Marcado
            d="M44 18 C46 10 55 9 59 14 C63 8 73 9 75 17 C82 19 85 28 82 35 C84 44 76 52 66 50 C58 55 46 53 42 46 C36 40 38 24 44 18"
            cierre="L84 40 L80 18"
          />
          <path className="mono__calado" d="M50 52 C50 55 53 56 55 54 M62 52 C62 55 65 56 67 54" />
          <g transform="translate(88 40) rotate(12) scale(1)">
            <CabezaAppa animo={animo} />
          </g>
          <Zeta x={82} y={10} />
          <Zeta x={95} y={6} lejos />
        </>
      )}
    </Fig>
  )
}

/** Cada animal entrega el svg según el ánimo; el carril y el paseo los pone Monitos. */
export const PIEL: Record<Animal, (animo: Animo) => ReactNode> = {
  gatito: Gatito,
  perrito: Perrito,
  conejito: Conejito,
  ranita: Ranita,
  caracol: Caracol,
  cuy: Cuy,
  appa: Appa,
}
