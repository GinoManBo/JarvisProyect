import type { ReactNode } from 'react'
import type { Animal, Animo } from './Monitos'
import { Fig, Zeta } from './MonitosComun'

/**
 * Piel "plumón": el mismo animalito dibujado con un marcador grueso. Contorno
 * CERRADO de 5,5u y relleno de papel; de frente, cabezón (la cabeza pesa lo
 * mismo que el cuerpo) y de patas cortas. En el recreo el destacador rellena
 * por dentro — el contorno sigue siendo tinta, nunca el color. El cuy es la
 * excepción de siempre: echado de lado, que parado no se lee.
 * Las formas que se rellenan llevan `mono__macizo`; las líneas finas, `mono__calado`.
 */

const Ojos = ({ animo, puntos }: { animo: Animo; puntos: [number, number][] }) => (
  <>
    {puntos.map(([x, y], i) =>
      animo === 'siesta' ? (
        <path key={i} className="mono__parpadeo" d={`M${x - 4} ${y} Q${x} ${y + 4} ${x + 4} ${y}`} />
      ) : (
        <circle key={i} className="mono__ojo" cx={x} cy={y} r="2.6" />
      ),
    )}
  </>
)

const Taza = ({ x, y }: { x: number; y: number }) => (
  <g>
    <path className="mono__taza" d={`M${x} ${y} h10 v4 q0 5 -5 5 q-5 0 -5 -5 z`} />
    <path className="mono__calado" d={`M${x + 10} ${y + 2} q4 0 4 3 q0 3 -4 3`} />
  </g>
)

/** Un rectángulo de esquinas redondas (orejas, patas, pies). */
const Capsula = ({
  x,
  y,
  w,
  h,
  clase = '',
}: {
  x: number
  y: number
  w: number
  h: number
  clase?: string
}) => <rect className={`mono__macizo ${clase}`} x={x} y={y} width={w} height={h} rx={Math.min(w, h) / 2} />

/** Los animales de recreo van en diagonal: se inclinan y estiran las extremidades. */
const Diagonal = ({ giro = -16, sube = 5, children }: { giro?: number; sube?: number; children: ReactNode }) => (
  <g transform={`translate(0 ${-sube}) rotate(${giro} 40 56)`}>{children}</g>
)

/* ------------------------------------------------------------ conejito --- */

function Conejito(animo: Animo): ReactNode {
  const cara = (
    <>
      <Ojos animo={animo} puntos={[[33, 38], [47, 38]]} />
      <circle className="mono__ojo" cx="40" cy="43.5" r="1.8" />
      <path className="mono__calado" d="M36.5 47.2 Q40 50.2 43.5 47.2" />
    </>
  )
  return (
    <Fig piel="plumon" animal="conejito">
      {animo === 'estudia' && (
        <>
          <Capsula x={27} y={5} w={9} h={27} clase="mono__oreja" />
          <Capsula x={44} y={5} w={9} h={27} clase="mono__oreja mono__oreja--otra" />
          <ellipse className="mono__macizo" cx="31" cy="73.5" rx="6" ry="3" />
          <ellipse className="mono__macizo" cx="49" cy="73.5" rx="6" ry="3" />
          <ellipse className="mono__macizo" cx="40" cy="62" rx="15" ry="11" />
          <ellipse className="mono__macizo" cx="40" cy="40" rx="17" ry="14" />
          {cara}
        </>
      )}
      {animo === 'recreo' && (
        <Diagonal>
          <path className="mono__trazo mono__pata" d="M30 66 L9 72" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M52 62 L72 56" />
          <g transform="rotate(-22 33 31)">
            <Capsula x={27} y={5} w={9} h={27} clase="mono__oreja" />
          </g>
          <g transform="rotate(-10 49 31)">
            <Capsula x={44} y={6} w={9} h={26} clase="mono__oreja mono__oreja--otra" />
          </g>
          <ellipse className="mono__macizo" cx="40" cy="62" rx="15" ry="11" />
          <ellipse className="mono__macizo" cx="40" cy="40" rx="17" ry="14" />
          {cara}
        </Diagonal>
      )}
      {animo === 'siesta' && (
        <>
          <Capsula x={8} y={44} w={28} h={9} clase="mono__oreja" />
          <Capsula x={12} y={51} w={28} h={9} clase="mono__oreja mono__oreja--otra" />
          <ellipse className="mono__macizo" cx="26" cy="67" rx="20" ry="10" />
          <ellipse className="mono__macizo" cx="47" cy="64" rx="15" ry="12.5" />
          <Ojos animo={animo} puntos={[[41, 62], [53, 62]]} />
          <circle className="mono__ojo" cx="47" cy="67" r="1.6" />
          <Taza x={66} y={68} />
          <Zeta x={48} y={36} />
          <Zeta x={58} y={29} lejos />
        </>
      )}
    </Fig>
  )
}

/* -------------------------------------------------------------- gatito --- */

function Gatito(animo: Animo): ReactNode {
  const cara = (
    <>
      <Ojos animo={animo} puntos={[[33, 38], [47, 38]]} />
      <path className="mono__ojo" d="M38.4 42.4 L41.6 42.4 L40 44.6 Z" />
      <path className="mono__calado" d="M40 44.6 Q37.6 48 35 46.4 M40 44.6 Q42.4 48 45 46.4" />
      <path className="mono__calado" d="M22 41 L13 39 M22 45 L13 47 M58 41 L67 39 M58 45 L67 47" />
    </>
  )
  const orejas = (
    <>
      <path className="mono__macizo mono__oreja" d="M24 38 L24 9 L43 25 Z" />
      <path className="mono__macizo mono__oreja mono__oreja--otra" d="M56 38 L56 9 L37 25 Z" />
    </>
  )
  return (
    <Fig piel="plumon" animal="gatito">
      {animo === 'estudia' && (
        <>
          <path className="mono__trazo mono__cola" d="M52 68 C68 70 70 56 62 52" />
          {orejas}
          <ellipse className="mono__macizo" cx="31" cy="73.5" rx="6" ry="3" />
          <ellipse className="mono__macizo" cx="49" cy="73.5" rx="6" ry="3" />
          <ellipse className="mono__macizo" cx="40" cy="62" rx="14" ry="11" />
          <ellipse className="mono__macizo" cx="40" cy="40" rx="17" ry="14" />
          {cara}
        </>
      )}
      {animo === 'recreo' && (
        <Diagonal giro={-14}>
          <path className="mono__trazo mono__cola" d="M26 62 C10 62 6 46 14 36" />
          <path className="mono__trazo mono__pata" d="M30 68 L10 73" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M52 64 L72 58" />
          {orejas}
          <ellipse className="mono__macizo" cx="40" cy="62" rx="14" ry="11" />
          <ellipse className="mono__macizo" cx="40" cy="40" rx="17" ry="14" />
          {cara}
        </Diagonal>
      )}
      {animo === 'siesta' && (
        <>
          <path className="mono__trazo mono__cola" d="M12 70 C3 66 6 55 18 56" />
          <path className="mono__macizo mono__oreja" d="M37 56 L36 40 L49 50 Z" />
          <path className="mono__macizo mono__oreja mono__oreja--otra" d="M61 56 L61 40 L48 50 Z" />
          <ellipse className="mono__macizo" cx="26" cy="67" rx="20" ry="10" />
          <ellipse className="mono__macizo" cx="48" cy="64" rx="15" ry="12.5" />
          <Ojos animo={animo} puntos={[[42, 62], [54, 62]]} />
          <path className="mono__ojo" d="M46 66 L50 66 L48 68 Z" />
          <Taza x={66} y={68} />
          <Zeta x={48} y={34} />
          <Zeta x={58} y={27} lejos />
        </>
      )}
    </Fig>
  )
}

/* ------------------------------------------------------------------ cuy --- */

function Cuy(animo: Animo): ReactNode {
  const oreja = (x: number, y: number) => (
    <g transform={`rotate(-18 ${x} ${y})`}>
      <ellipse className="mono__macizo mono__oreja" cx={x} cy={y} rx="5.5" ry="8" />
    </g>
  )
  return (
    <Fig piel="plumon" animal="cuy">
      {animo === 'estudia' && (
        <>
          {/* Excepción a la silueta vertical: echado de lado mirando al centro. */}
          <ellipse className="mono__macizo" cx="22" cy="75" rx="6" ry="3" />
          <ellipse className="mono__macizo" cx="44" cy="75" rx="6" ry="3" />
          <ellipse className="mono__macizo" cx="34" cy="60" rx="25" ry="16" />
          <path className="mono__calado" d="M24 60 C23 53 33 52 35 59 C37 66 28 68 26 63 C25 60 29 59 30 61" />
          <ellipse className="mono__macizo" cx="58" cy="56" rx="15" ry="13" />
          {oreja(51, 47)}
          <Ojos animo={animo} puntos={[[58, 53], [68, 53]]} />
          <circle className="mono__ojo" cx="72" cy="58" r="2" />
          <path className="mono__calado" d="M63 62 Q66 64.6 69 62" />
        </>
      )}
      {animo === 'recreo' && (
        <Diagonal giro={-14} sube={4}>
          <path className="mono__trazo mono__pata" d="M22 70 L16 77" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M44 71 L50 77" />
          <ellipse className="mono__macizo" cx="32" cy="58" rx="25" ry="16" />
          <ellipse className="mono__macizo" cx="58" cy="54" rx="15" ry="13" />
          {oreja(51, 45)}
          <Ojos animo={animo} puntos={[[58, 51], [68, 51]]} />
          <circle className="mono__ojo" cx="72" cy="56" r="2" />
          <path className="mono__calado" d="M63 60 Q66 62.6 69 60" />
        </Diagonal>
      )}
      {animo === 'siesta' && (
        <>
          <ellipse className="mono__macizo" cx="28" cy="67" rx="22" ry="10.5" />
          <ellipse className="mono__macizo" cx="50" cy="65" rx="14" ry="12" />
          {oreja(43, 58)}
          <Ojos animo={animo} puntos={[[50, 62], [60, 62]]} />
          <circle className="mono__ojo" cx="63" cy="67" r="1.8" />
          <Taza x={66} y={68} />
          <Zeta x={44} y={40} />
          <Zeta x={54} y={33} lejos />
        </>
      )}
    </Fig>
  )
}

/* -------------------------------------------------------------- caracol --- */

const ESPIRAL = 'M0 0 C0 -4 6 -4 6 0 C6 7 -6 8 -9 1 C-12 -8 -2 -14 8 -12 C18 -10 20 3 14 10'

function Caracol(animo: Animo): ReactNode {
  return (
    <Fig piel="plumon" animal="caracol">
      {animo === 'estudia' && (
        <>
          <Capsula x={6} y={68} w={50} h={10} />
          <Capsula x={44} y={24} w={12} h={54} />
          <path className="mono__trazo mono__cuerno" d="M47 18 L45 7" />
          <path className="mono__trazo mono__cuerno mono__cuerno--otro" d="M54 18 L57 7" />
          <circle className="mono__macizo" cx="24" cy="54" r="18" />
          <g transform="translate(21 54) scale(.82)">
            <path className="mono__calado" d={ESPIRAL} />
          </g>
          <ellipse className="mono__macizo" cx="50" cy="26" rx="13" ry="11" />
          <circle className="mono__ojo" cx="45" cy="6" r="2.6" />
          <circle className="mono__ojo" cx="57" cy="6" r="2.6" />
          <circle className="mono__ojo" cx="45" cy="25" r="2.6" />
          <circle className="mono__ojo" cx="55" cy="25" r="2.6" />
          <path className="mono__calado" d="M46.5 31 Q50 34 53.5 31" />
        </>
      )}
      {animo === 'recreo' && (
        <>
          <Capsula x={4} y={68} w={66} h={10} />
          <g transform="rotate(16 54 74)">
            <Capsula x={48} y={30} w={12} h={46} />
          </g>
          <path className="mono__trazo mono__cuerno" d="M58 22 L54 11" />
          <path className="mono__trazo mono__cuerno mono__cuerno--otro" d="M69 22 L74 12" />
          <circle className="mono__macizo" cx="28" cy="53" r="18" />
          <g transform="translate(25 53) scale(.82)">
            <path className="mono__calado" d={ESPIRAL} />
          </g>
          <ellipse className="mono__macizo" cx="64" cy="32" rx="13" ry="11" />
          <circle className="mono__ojo" cx="54" cy="10" r="2.6" />
          <circle className="mono__ojo" cx="74" cy="11" r="2.6" />
          <circle className="mono__ojo" cx="59" cy="30" r="2.6" />
          <circle className="mono__ojo" cx="69" cy="30" r="2.6" />
          <path className="mono__calado" d="M60 36 Q64 39.6 68 36" />
        </>
      )}
      {animo === 'siesta' && (
        <>
          <Capsula x={6} y={68} w={64} h={10} />
          <circle className="mono__macizo" cx="34" cy="52" r="22" />
          <g transform="translate(30 52) scale(1)">
            <path className="mono__calado" d={ESPIRAL} />
          </g>
          <path className="mono__parpadeo" d="M62 72.5 Q65 76 68 72.5" />
          <Taza x={63} y={50} />
          <Zeta x={52} y={30} />
          <Zeta x={62} y={23} lejos />
        </>
      )}
    </Fig>
  )
}

/* -------------------------------------------------------------- perrito --- */

function Perrito(animo: Animo): ReactNode {
  const cara = (
    <>
      <ellipse className="mono__macizo" cx="40" cy="35" rx="9" ry="6.5" />
      <Ojos animo={animo} puntos={[[32, 24], [48, 24]]} />
      <ellipse className="mono__ojo" cx="40" cy="32.5" rx="3.4" ry="2.4" />
      <path className="mono__calado" d="M40 35 L40 38.4 M40 38.4 Q37.4 41 34.6 39.4 M40 38.4 Q42.6 41 45.4 39.4" />
      {animo === 'recreo' && <path className="mono__lengua" d="M38.4 40 Q38 47 41.6 46.6 Q43 45 42.6 40" />}
    </>
  )
  const orejas = (
    <>
      <g transform="rotate(10 24 38)">
        <ellipse className="mono__macizo mono__oreja" cx="23" cy="36" rx="7" ry="12.5" />
      </g>
      <g transform="rotate(-10 56 38)">
        <ellipse className="mono__macizo mono__oreja mono__oreja--otra" cx="57" cy="36" rx="7" ry="12.5" />
      </g>
    </>
  )
  return (
    <Fig piel="plumon" animal="perrito">
      {animo === 'estudia' && (
        <>
          <path className="mono__trazo mono__cola" d="M52 66 C66 68 68 56 62 50" />
          <ellipse className="mono__macizo" cx="31" cy="76" rx="6" ry="3" />
          <ellipse className="mono__macizo" cx="49" cy="76" rx="6" ry="3" />
          <ellipse className="mono__macizo" cx="40" cy="61" rx="15" ry="14" />
          {orejas}
          <ellipse className="mono__macizo" cx="40" cy="27" rx="18" ry="16" />
          {cara}
        </>
      )}
      {animo === 'recreo' && (
        <Diagonal giro={-14}>
          <path className="mono__trazo mono__cola" d="M28 64 C12 64 8 48 16 38" />
          <path className="mono__trazo mono__pata" d="M30 70 L10 74" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M52 66 L72 60" />
          <ellipse className="mono__macizo" cx="40" cy="61" rx="15" ry="14" />
          {orejas}
          <ellipse className="mono__macizo" cx="40" cy="27" rx="18" ry="16" />
          {cara}
        </Diagonal>
      )}
      {animo === 'siesta' && (
        <>
          <path className="mono__trazo mono__cola" d="M12 70 C3 68 4 58 12 58" />
          <ellipse className="mono__macizo" cx="26" cy="67" rx="20" ry="10" />
          <ellipse className="mono__macizo" cx="48" cy="64" rx="15" ry="12.5" />
          <g transform="rotate(8 38 62)">
            <ellipse className="mono__macizo mono__oreja" cx="38" cy="62" rx="5.5" ry="10" />
          </g>
          <ellipse className="mono__macizo" cx="55" cy="68" rx="8" ry="5.5" />
          <Ojos animo={animo} puntos={[[46, 60]]} />
          <ellipse className="mono__ojo" cx="60" cy="66" rx="3" ry="2.2" />
          <Taza x={66} y={68} />
          <Zeta x={46} y={36} />
          <Zeta x={56} y={29} lejos />
        </>
      )}
    </Fig>
  )
}

/* --------------------------------------------------------------- ranita --- */

function Ranita(animo: Animo): ReactNode {
  const ojos = (x1: number, x2: number, y: number) => (
    <>
      <Ojos animo={animo} puntos={[[x1, y], [x2, y]]} />
    </>
  )
  return (
    <Fig piel="plumon" animal="ranita">
      {animo === 'estudia' && (
        <>
          <ellipse className="mono__macizo mono__pata" cx="27" cy="76" rx="9" ry="3.2" />
          <ellipse className="mono__macizo mono__pata mono__pata--otra" cx="53" cy="76" rx="9" ry="3.2" />
          <ellipse className="mono__macizo" cx="40" cy="58" rx="16" ry="17" />
          <circle className="mono__macizo" cx="29" cy="16" r="8.5" />
          <circle className="mono__macizo" cx="51" cy="16" r="8.5" />
          <ellipse className="mono__macizo" cx="40" cy="30" rx="20" ry="13" />
          {ojos(29, 51, 15)}
          <path className="mono__calado" d="M28 33 Q40 42 52 33" />
        </>
      )}
      {animo === 'recreo' && (
        <Diagonal giro={-18} sube={4}>
          <path className="mono__trazo mono__pata" d="M28 64 L7 71" />
          <path className="mono__trazo mono__pata mono__pata--otra" d="M53 58 L73 64" />
          <ellipse className="mono__macizo" cx="40" cy="58" rx="16" ry="17" />
          <circle className="mono__macizo" cx="29" cy="16" r="8.5" />
          <circle className="mono__macizo" cx="51" cy="16" r="8.5" />
          <ellipse className="mono__macizo" cx="40" cy="30" rx="20" ry="13" />
          {ojos(29, 51, 15)}
          <path className="mono__calado" d="M28 33 Q40 42 52 33" />
        </Diagonal>
      )}
      {animo === 'siesta' && (
        <>
          <ellipse className="mono__macizo" cx="14" cy="76" rx="8" ry="3" />
          <ellipse className="mono__macizo" cx="58" cy="76" rx="8" ry="3" />
          <circle className="mono__macizo" cx="26" cy="51" r="8" />
          <circle className="mono__macizo" cx="46" cy="51" r="8" />
          <ellipse className="mono__macizo" cx="36" cy="65" rx="26" ry="12" />
          {ojos(26, 46, 51)}
          <path className="mono__calado" d="M25 65 Q36 72 47 65" />
          <Taza x={67} y={68} />
          <Zeta x={50} y={30} />
          <Zeta x={60} y={23} lejos />
        </>
      )}
    </Fig>
  )
}

/* ----------------------------------------------------------------- appa --- */

const NUBE_APPA =
  'M80 22 C77 14 70 13 67 18 C64 11 56 11 53 17 C50 11 42 11 39 17 C34 13 27 16 26 22 C19 25 16 33 18 40 C20 49 30 54 42 54 L72 54 C82 54 91 48 92 41 Z'
const COLA_APPA = 'M27 38 C14 26 3 32 4 41 C5 50 15 52 27 46 Z'

function CabezaAppa({ animo }: { animo: Animo }) {
  return (
    <g>
      <path className="mono__macizo" d="M-12 -9 C-16 -19 -10 -26 -2 -25 C-4 -21 -3 -15 -2 -11 Z" />
      <path className="mono__macizo" d="M12 -9 C16 -19 11 -26 3 -25 C5 -21 4 -15 3 -11 Z" />
      <circle className="mono__macizo" cx="0" cy="0" r="16" />
      <path className="mono__calado mono__flecha" d="M0 -12 L0 -3 M-4 -7 L0 -3 L4 -7" />
      <Ojos animo={animo} puntos={[[-7, 2], [7, 2]]} />
      <path className="mono__calado" d="M-3 8 Q0 11 3 8" />
    </g>
  )
}

function Appa(animo: Animo): ReactNode {
  return (
    <Fig piel="plumon" animal="appa">
      {animo === 'estudia' && (
        <>
          <path className="mono__macizo mono__cola" d={COLA_APPA} />
          {[24, 46, 68].map((x) => (
            <Capsula key={x} x={x} y={52} w={15} h={9} />
          ))}
          <path className="mono__macizo" d={NUBE_APPA} />
          <g transform="translate(98 36)">
            <CabezaAppa animo={animo} />
          </g>
        </>
      )}
      {animo === 'recreo' && (
        <g transform="translate(0 -4) rotate(-10 60 36)">
          <path className="mono__macizo mono__cola" d={COLA_APPA} />
          {[24, 46, 68].map((x, i) => (
            <g key={x} transform={`rotate(${i % 2 ? 12 : -12} ${x + 7} 52)`}>
              <Capsula x={x} y={52} w={15} h={9} clase="mono__pata" />
            </g>
          ))}
          <path className="mono__macizo" d={NUBE_APPA} />
          <g transform="translate(98 36) rotate(-6)">
            <CabezaAppa animo={animo} />
          </g>
        </g>
      )}
      {animo === 'siesta' && (
        <>
          <path className="mono__macizo mono__cola" d="M38 38 C25 26 12 32 14 42 C16 52 28 54 40 47 Z" />
          <Capsula x={46} y={50} w={12} h={7} />
          <Capsula x={62} y={50} w={12} h={7} />
          <path
            className="mono__macizo"
            d="M44 18 C46 10 55 9 59 14 C63 8 73 9 75 17 C82 19 85 28 82 35 C84 44 76 53 66 51 C58 56 46 54 42 46 C36 40 38 24 44 18 Z"
          />
          <g transform="translate(90 42) rotate(12) scale(.95)">
            <CabezaAppa animo={animo} />
          </g>
          <Zeta x={80} y={8} />
          <Zeta x={94} y={5} lejos />
        </>
      )}
    </Fig>
  )
}

export const PIEL: Record<Animal, (animo: Animo) => ReactNode> = {
  gatito: Gatito,
  perrito: Perrito,
  conejito: Conejito,
  ranita: Ranita,
  caracol: Caracol,
  cuy: Cuy,
  appa: Appa,
}
