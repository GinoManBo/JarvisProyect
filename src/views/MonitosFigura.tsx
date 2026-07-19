import { cloneElement, type ReactElement, type ReactNode } from 'react'
import type { Animal, Animo, Estilo } from './Monitos'

/**
 * Geometría chibi compartida por las pieles "de superficie" — acuarela, papel
 * recortado, neón y plastilina. Todas dibujan el mismo animalito redondo y
 * cambian sólo por CSS (aguada difusa, sombra de recorte, glow, brillo 3D).
 * Clases genéricas que cada tema estiliza:
 *   figura__piel   cuerpo/cabeza (color del animal, var --pelaje)
 *   figura__crema  panza/hocico claro
 *   figura__cuerpo patitas/interior (papel)
 *   figura__ojo    ojos e iris (tinta)
 *   figura__luz    brillo del ojo / blanco
 *   figura__chapa  rubor
 *   figura__acento pico/flecha/detalle
 *   figura__rasgo  líneas de la cara (boca, párpados, cejas)
 *   figura__brillo reflejo de plastilina (oculto en los otros temas)
 * El paseo, el volteo y el vuelo de Appa los maneja el orquestador.
 */

const Zeta = ({ x, y, lejos }: { x: number; y: number; lejos?: boolean }) => (
  <text className={`mono__z ${lejos ? 'mono__z--lejos' : ''}`} x={x} y={y} fontSize={lejos ? 7 : 9}>
    z
  </text>
)

function Ojos({ x1, x2, y, r = 3 }: { x1: number; x2: number; y: number; r?: number }) {
  return (
    <>
      <circle className="figura__ojo" cx={x1} cy={y} r={r} />
      <circle className="figura__ojo" cx={x2} cy={y} r={r} />
      <circle className="figura__luz" cx={x1 + r * 0.35} cy={y - r * 0.4} r={r * 0.34} />
      <circle className="figura__luz" cx={x2 + r * 0.35} cy={y - r * 0.4} r={r * 0.34} />
    </>
  )
}

function Cara({ x1, x2, y, animo, r }: { x1: number; x2: number; y: number; animo: Animo; r?: number }) {
  const cx = (x1 + x2) / 2
  if (animo === 'siesta') {
    return (
      <>
        <path className="figura__rasgo" d={`M ${x1 - 3.5} ${y} Q ${x1} ${y + 3.2} ${x1 + 3.5} ${y}`} />
        <path className="figura__rasgo" d={`M ${x2 - 3.5} ${y} Q ${x2} ${y + 3.2} ${x2 + 3.5} ${y}`} />
      </>
    )
  }
  if (animo === 'recreo') {
    return (
      <>
        <path className="figura__rasgo" d={`M ${x1 - 3.5} ${y + 1} Q ${x1} ${y - 3.4} ${x1 + 3.5} ${y + 1}`} />
        <path className="figura__rasgo" d={`M ${x2 - 3.5} ${y + 1} Q ${x2} ${y - 3.4} ${x2 + 3.5} ${y + 1}`} />
        <path className="figura__ojo" d={`M ${cx - 3.5} ${y + 5} Q ${cx} ${y + 9.5} ${cx + 3.5} ${y + 5} Z`} />
      </>
    )
  }
  return (
    <>
      <path className="figura__rasgo" d={`M ${x1 - 4} ${y - 4.5} L ${x1 + 3.5} ${y - 3}`} />
      <path className="figura__rasgo" d={`M ${x2 + 4} ${y - 4.5} L ${x2 - 3.5} ${y - 3}`} />
      <Ojos x1={x1} x2={x2} y={y} r={r} />
      <path className="figura__rasgo" d={`M ${cx - 2.5} ${y + 5.5} Q ${cx} ${y + 7} ${cx + 2.5} ${y + 5.5}`} />
    </>
  )
}

const Chapas = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => (
  <>
    <ellipse className="figura__chapa" cx={x1} cy={y} rx="3.6" ry="2.4" />
    <ellipse className="figura__chapa" cx={x2} cy={y} rx="3.6" ry="2.4" />
  </>
)

function Taza({ x, y }: { x: number; y: number }) {
  return (
    <g className="figura__props">
      <rect className="figura__crema" x={x} y={y} width="9" height="8" rx="2.2" />
      <path className="figura__vapor" d={`M ${x + 8.7} ${y + 1.6} Q ${x + 11.6} ${y + 4} ${x + 8.7} ${y + 6}`} />
      <path className="figura__vapor" d={`M ${x + 4.5} ${y - 2.5} Q ${x + 6} ${y - 5.5} ${x + 4.5} ${y - 8.5}`} />
    </g>
  )
}

function Confeti({ puntos }: { puntos: [number, number, number][] }) {
  return (
    <g className="figura__props">
      {puntos.map(([cx, cy, n], i) => (
        <circle key={i} className={`figura__conf figura__conf--${n}`} cx={cx} cy={cy} r="1.9" />
      ))}
    </g>
  )
}

function Patitas({ x1, x2, yBase, animo }: { x1: number; x2: number; yBase: number; animo: Animo }) {
  const y = animo === 'recreo' ? yBase - 4 : yBase
  return (
    <>
      <ellipse className="figura__cuerpo" cx={x1} cy={y} rx="4.6" ry="2.6" />
      <ellipse className="figura__cuerpo" cx={x2} cy={y} rx="4.6" ry="2.6" />
    </>
  )
}

function Brazos({ cx, y, span, animo }: { cx: number; y: number; span: number; animo: Animo }) {
  if (animo === 'recreo') {
    return (
      <>
        <ellipse className="figura__piel" cx={cx - span} cy={y - 8} rx="3.4" ry="6" transform={`rotate(-35 ${cx - span} ${y - 8})`} />
        <ellipse className="figura__piel" cx={cx + span} cy={y - 8} rx="3.4" ry="6" transform={`rotate(35 ${cx + span} ${y - 8})`} />
      </>
    )
  }
  return (
    <>
      <ellipse className="figura__piel" cx={cx - span - 1} cy={y} rx="3.4" ry="6" />
      <ellipse className="figura__piel" cx={cx + span + 1} cy={y} rx="3.4" ry="6" />
    </>
  )
}

/** Reflejo de plastilina: sólo se ve bajo .mono__plastilina. */
const Brillo = ({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) => (
  <ellipse className="figura__brillo" cx={cx} cy={cy} rx={rx} ry={ry} />
)

function Gatito(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 64 68" width="56">
      <g className="figura__cuerpo-g">
        <Patitas x1={25} x2={39} yBase={64} animo={animo} />
        <path className="figura__piel" d="M16 62 Q14 42 32 42 Q50 42 48 62 Z" />
        <ellipse className="figura__crema" cx="32" cy="55" rx="9" ry="7.5" />
        <Brazos cx={32} y={52} span={16} animo={animo} />
        <path className="figura__piel" d="M47 56 Q59 55 57 45 Q56 41 51 43 Q54 46 52 50 Q50 54 46 53 Z" />
      </g>
      <g className="figura__cabeza-g">
        <path className="figura__piel" d="M14 20 Q11 3 24 10 Q26 13 24 17 Z" />
        <path className="figura__piel" d="M50 20 Q53 3 40 10 Q38 13 40 17 Z" />
        <ellipse className="figura__piel" cx="32" cy="27" rx="21" ry="18.5" />
        <Brillo cx={24} cy={19} rx={7} ry={5} />
      </g>
      <g className="figura__cara-g">
        <Cara x1={24} x2={40} y={26} animo={animo} />
        <Chapas x1={18} x2={46} y={32} />
      </g>
      {animo === 'siesta' && <Taza x={52} y={54} />}
      {animo === 'recreo' && <Confeti puntos={[[7, 9, 1], [57, 7, 2], [4, 30, 3], [60, 28, 1]]} />}
    </svg>
  )
}

function Perrito(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 64 68" width="56">
      <g className="figura__cuerpo-g">
        <Patitas x1={25} x2={39} yBase={64} animo={animo} />
        <path className="figura__piel" d="M16 62 Q14 42 32 42 Q50 42 48 62 Z" />
        <ellipse className="figura__crema" cx="32" cy="55" rx="9" ry="7.5" />
        <Brazos cx={32} y={52} span={16} animo={animo} />
        <path className="figura__piel" d="M48 58 Q58 54 55 46 Q53 42 49 45 Q52 48 50 52 Z" />
      </g>
      <g className="figura__cabeza-g">
        <ellipse className="figura__piel" cx="14" cy="26" rx="6.5" ry="11" transform="rotate(-8 14 26)" />
        <ellipse className="figura__piel" cx="50" cy="26" rx="6.5" ry="11" transform="rotate(8 50 26)" />
        <ellipse className="figura__piel" cx="32" cy="26" rx="20" ry="18" />
        <ellipse className="figura__crema" cx="32" cy="34" rx="11" ry="8.5" />
        <Brillo cx={24} cy={18} rx={7} ry={5} />
      </g>
      <g className="figura__cara-g">
        <Cara x1={25} x2={39} y={24} animo={animo} />
        <ellipse className="figura__ojo" cx="32" cy="31" rx="2.6" ry="1.9" />
        <Chapas x1={19} x2={45} y={31} />
      </g>
      {animo === 'siesta' && <Taza x={52} y={54} />}
      {animo === 'recreo' && <Confeti puntos={[[7, 8, 2], [57, 6, 1], [4, 30, 3], [60, 30, 2]]} />}
    </svg>
  )
}

function Conejito(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 60 74" width="52">
      <g className="figura__cabeza-g">
        <ellipse className="figura__piel" cx="21" cy="16" rx="5.5" ry="14" transform="rotate(-6 21 16)" />
        <ellipse className="figura__piel" cx="39" cy="16" rx="5.5" ry="14" transform="rotate(6 39 16)" />
      </g>
      <g className="figura__cuerpo-g">
        <Patitas x1={23} x2={37} yBase={70} animo={animo} />
        <path className="figura__piel" d="M15 68 Q13 50 30 50 Q47 50 45 68 Z" />
        <ellipse className="figura__crema" cx="30" cy="61" rx="8" ry="7" />
        <Brazos cx={30} y={58} span={15} animo={animo} />
      </g>
      <g className="figura__cabeza-g">
        <ellipse className="figura__piel" cx="30" cy="38" rx="18.5" ry="16.5" />
        <Brillo cx={22} cy={30} rx={6} ry={4.5} />
      </g>
      <g className="figura__cara-g">
        <Cara x1={23} x2={37} y={37} animo={animo} r={3} />
        <Chapas x1={17} x2={43} y={42} />
      </g>
      {animo === 'siesta' && <Taza x={48} y={60} />}
      {animo === 'recreo' && <Confeti puntos={[[6, 14, 2], [54, 12, 1], [4, 36, 3], [56, 34, 2]]} />}
    </svg>
  )
}

function Ranita(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 66 60" width="56">
      <g className="figura__cuerpo-g">
        <Patitas x1={20} x2={46} yBase={56} animo={animo} />
        <Brazos cx={33} y={40} span={22} animo={animo} />
      </g>
      <g className="figura__cabeza-g">
        <circle className="figura__piel" cx="22" cy="14" r="8.5" />
        <circle className="figura__piel" cx="44" cy="14" r="8.5" />
        <ellipse className="figura__piel" cx="33" cy="35" rx="24" ry="20" />
        <ellipse className="figura__crema" cx="33" cy="43" rx="14" ry="10" />
        <Brillo cx={22} cy={28} rx={7} ry={5} />
      </g>
      <g className="figura__cara-g">
        <Ojos x1={22} x2={44} y={14} r={3.4} />
        {animo === 'recreo' && <path className="figura__ojo" d="M27 28 Q33 34 39 28 Z" />}
        {animo === 'estudia' && <path className="figura__rasgo" d="M27 29 Q33 33 39 29" />}
        {animo === 'siesta' && <path className="figura__rasgo" d="M28 29 Q33 31 38 29" />}
        <Chapas x1={13} x2={53} y={22} />
      </g>
      {animo === 'siesta' && <Taza x={55} y={48} />}
      {animo === 'recreo' && <Confeti puntos={[[5, 6, 3], [61, 4, 1], [3, 30, 2], [63, 28, 3]]} />}
    </svg>
  )
}

function Caracol(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 66 50" width="54">
      <g className="figura__cuerpo-g">
        <path className="figura__crema" d="M8 44 Q28 48 48 43 Q52 42 50 34 L14 40 Z" />
        <ellipse className="figura__crema" cx="12" cy="44" rx="6" ry="3" />
        <circle className="figura__piel" cx="48" cy="30" r="10" />
        <path className="figura__vapor" d="M43 22 Q42 17 40 14" />
        <circle className="figura__chapa" cx="39.5" cy="12.5" r="1.9" />
        <path className="figura__vapor" d="M53 22 Q54 17 56 14" />
        <circle className="figura__chapa" cx="56.5" cy="12.5" r="1.9" />
      </g>
      <g className="figura__cabeza-g">
        <circle className="figura__piel" cx="24" cy="24" r="16.5" />
        <circle className="figura__crema" cx="24" cy="24" r="10.5" />
        <circle className="figura__piel" cx="24" cy="24" r="4.5" />
        <Brillo cx={18} cy={17} rx={5} ry={3.5} />
      </g>
      <g className="figura__cara-g">
        <Ojos x1={44} x2={52} y={29} r={2.6} />
        {animo === 'recreo' ? (
          <path className="figura__ojo" d="M45 34 Q48 37 51 34 Z" />
        ) : (
          <path className="figura__rasgo" d={animo === 'siesta' ? 'M46 34 Q48 35.5 50 34' : 'M45.5 34 Q48 36 50.5 34'} />
        )}
        <ellipse className="figura__chapa" cx="41" cy="33" rx="2.4" ry="1.7" />
        <ellipse className="figura__chapa" cx="55" cy="33" rx="2.4" ry="1.7" />
      </g>
      {animo === 'siesta' && <Taza x={4} y={38} />}
      {animo === 'recreo' && <Confeti puntos={[[8, 6, 2], [30, 3, 1], [62, 22, 2], [10, 34, 3]]} />}
    </svg>
  )
}

function Cuy(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 60 48" width="50">
      <g className="figura__cuerpo-g">
        <ellipse className="figura__cuerpo" cx="19" cy="44" rx="4.5" ry="2.6" />
        <ellipse className="figura__cuerpo" cx="41" cy="44" rx="4.5" ry="2.6" />
      </g>
      <g className="figura__cabeza-g">
        <ellipse className="figura__piel" cx="16" cy="13" rx="5" ry="4" transform="rotate(-22 16 13)" />
        <ellipse className="figura__piel" cx="44" cy="13" rx="5" ry="4" transform="rotate(22 44 13)" />
        <ellipse className="figura__chapa" cx="16" cy="13.5" rx="2.4" ry="1.8" transform="rotate(-22 16 13.5)" />
        <ellipse className="figura__chapa" cx="44" cy="13.5" rx="2.4" ry="1.8" transform="rotate(22 44 13.5)" />
        <ellipse className="figura__piel" cx="30" cy="28" rx="24" ry="17.5" />
        <path className="figura__crema" d="M30 43 Q17 42 20 31 Q25 35 30 34 Q35 35 40 31 Q43 42 30 43 Z" />
        <Brillo cx={20} cy={18} rx={7} ry={5} />
      </g>
      <g className="figura__cara-g">
        <Cara x1={22} x2={38} y={24} animo={animo} r={3} />
        <ellipse className="figura__ojo" cx="30" cy="30" rx="2.1" ry="1.5" />
        <path className="figura__rasgo" d="M30 31.4 L30 33.2 M30 33.2 Q27.5 34 27 33 M30 33.2 Q32.5 34 33 33" />
        <Chapas x1={14} x2={46} y={31} />
      </g>
      {animo === 'siesta' && <Taza x={48} y={34} />}
      {animo === 'recreo' && <Confeti puntos={[[6, 8, 1], [54, 6, 2], [4, 32, 3], [56, 30, 1]]} />}
    </svg>
  )
}

function Appa(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 68 48" width="120">
      <g className="figura__cuerpo-g">
        <ellipse className="appa__cola figura__crema" cx="9" cy="25" rx="8.5" ry="11" />
        <ellipse className="figura__cuerpo" cx="22" cy="40" rx="5" ry="3" />
        <ellipse className="figura__cuerpo" cx="34" cy="41" rx="5" ry="3" />
        <ellipse className="figura__cuerpo" cx="46" cy="40" rx="5" ry="3" />
        <ellipse className="figura__crema" cx="33" cy="24" rx="26" ry="15" />
      </g>
      <g className="figura__cabeza-g">
        <path className="figura__acento" d="M13 17 Q34 9 56 14 Q56 18 54 20 Q34 13 14 22 Z" />
        <path className="figura__crema" d="M46 13 Q42 3 49 6 Q50 10 49 15 Z" />
        <path className="figura__crema" d="M62 13 Q66 3 59 6 Q58 10 59 15 Z" />
        <circle className="figura__crema" cx="54" cy="22" r="13" />
        <path className="figura__acento" d="M54 11 L50 19 L54 16 L58 19 Z" />
        <Brillo cx={48} cy={16} rx={5} ry={3.5} />
      </g>
      <g className="figura__cara-g">
        {animo === 'siesta' ? (
          <>
            <path className="figura__rasgo" d="M46 21 Q49 24 52 21" />
            <path className="figura__rasgo" d="M56 21 Q59 24 62 21" />
          </>
        ) : animo === 'recreo' ? (
          <>
            <path className="figura__rasgo" d="M46 22 Q49 18 52 22" />
            <path className="figura__rasgo" d="M56 22 Q59 18 62 22" />
          </>
        ) : (
          <Ojos x1={49} x2={59} y={21} r={3} />
        )}
        <ellipse className="figura__ojo" cx="54" cy="27" rx="3.4" ry="2.3" />
        {animo === 'recreo' ? (
          <path className="figura__ojo" d="M49 30 Q54 35 59 30 Z" />
        ) : (
          <path className="figura__rasgo" d="M49.5 30 Q54 33 58.5 30" />
        )}
        <Chapas x1={46} x2={62} y={28} />
      </g>
      {animo === 'siesta' && <Taza x={2} y={14} />}
      {animo === 'recreo' && <Confeti puntos={[[6, 8, 1], [34, 3, 2], [64, 10, 3], [4, 40, 2]]} />}
      {animo === 'siesta' && <Zeta x={62} y={9} />}
    </svg>
  )
}

const GEOMETRIA: Record<Animal, (animo: Animo) => ReactNode> = {
  gatito: Gatito,
  perrito: Perrito,
  conejito: Conejito,
  ranita: Ranita,
  caracol: Caracol,
  cuy: Cuy,
  appa: Appa,
}

/** Pone la clase del tema en el propio svg para que el CSS lo vista. */
export function pielFigura(tema: Estilo): Record<Animal, (animo: Animo) => ReactNode> {
  const piel = {} as Record<Animal, (animo: Animo) => ReactNode>
  for (const animal of Object.keys(GEOMETRIA) as Animal[]) {
    piel[animal] = (animo) => {
      const svg = GEOMETRIA[animal](animo) as ReactElement<{ className?: string }>
      return cloneElement(svg, { className: `mono__figura mono__${tema}` })
    }
  }
  return piel
}
