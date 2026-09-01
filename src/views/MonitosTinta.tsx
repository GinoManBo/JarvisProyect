import type { ReactNode } from 'react'
import type { Animal, Animo } from './Monitos'

/**
 * Piel "tinta": los animalitos dibujados a pluma y pintados con destacador,
 * como doodles al borde del apunte. Comparten los tres estados del pomodoro:
 * enfocados con la mirada fija, celebrando con confeti y bracitos arriba, y
 * relajados con su tecito. Cada función entrega sólo el svg; el paseo, el
 * volteo y el ánimo los maneja el orquestador en Monitos.tsx.
 */

const Zeta = ({ x, y, lejos }: { x: number; y: number; lejos?: boolean }) => (
  <text className={`mono__z ${lejos ? 'mono__z--lejos' : ''}`} x={x} y={y} fontSize={lejos ? 7 : 9}>
    z
  </text>
)


/** El tecito de la siesta, tacita de loza con vapor. */
function Taza({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect className="mono__loza" x={x} y={y} width="8.5" height="7.5" rx="2" />
      <path d={`M ${x + 8.3} ${y + 1.5} Q ${x + 11} ${y + 3.5} ${x + 8.3} ${y + 5.5}`} />
      <path d={`M ${x + 4} ${y - 2.5} Q ${x + 5.5} ${y - 5.5} ${x + 4} ${y - 8.5}`} />
    </g>
  )
}

/** Confeti de celebración: puntitos de destacador con su contorno de pluma. */
const Confeti = ({ puntos }: { puntos: [number, number, string][] }) => (
  <g>
    {puntos.map(([cx, cy, clase], i) => (
      <circle key={i} className={clase} cx={cx} cy={cy} r="1.8" />
    ))}
  </g>
)

function Gatito(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 72 54" width="64">
      <path className="gatito__cola" d="M12 34 Q2 32 4 21 Q5 16 11 18" />
      <line className="gatito__pata" x1="20" y1="40" x2="20" y2="50" />
      <line className="gatito__pata gatito__pata--otra" x1="48" y1="40" x2="48" y2="50" />
      <ellipse className="mono__pelaje" cx="36" cy="34" rx="24" ry="13" />
      <path className="mono__pelaje" d="M41 12 L38 1 L49 6 Z" />
      <path className="mono__pelaje" d="M56 5 L65 0 L63 11 Z" />
      <circle className="mono__pelaje" cx="52" cy="19" r="13.5" />
      {animo === 'estudia' ? (
        <>
          <circle className="mono__relleno gatito__ojo" cx="47.5" cy="17" r="1.8" />
          <circle className="mono__relleno gatito__ojo" cx="58" cy="17" r="1.8" />
        </>
      ) : (
        <>
          <path d="M44.5 17 Q47.5 20 50.5 17" />
          <path d="M55 17 Q58 20 61 17" />
        </>
      )}
      <circle className="mono__relleno" cx="53.5" cy="22.5" r="1" />
      <path d="M50.5 25.5 Q52 27.5 53.5 25.5 Q55 27.5 56.5 25.5" />
      <line x1="63" y1="21" x2="69.5" y2="20" />
      <line x1="63" y1="24" x2="69.5" y2="25.5" />
      <circle className="mono__rubor" cx="45.5" cy="23" r="1.9" />
      {animo === 'siesta' && <Taza x={62} y={44} />}
      {animo === 'recreo' && (
        <Confeti
          puntos={[
            [8, 6, 'kw__menta'],
            [30, 2, 'kw__cielo'],
            [68, 8, 'kw__chapita'],
            [4, 44, 'kw__cielo'],
          ]}
        />
      )}
      {animo === 'siesta' && (
        <>
          <Zeta x={62} y={8} />
          <Zeta x={68} y={3} lejos />
        </>
      )}
    </svg>
  )
}

function Perrito(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 72 54" width="64">
      <path className="perrito__cola" d="M13 35 Q3 30 7 21" />
      <line className="perrito__pata" x1="23" y1="40" x2="23" y2="50" />
      <line className="perrito__pata perrito__pata--otra" x1="45" y1="40" x2="45" y2="50" />
      <ellipse className="mono__pelaje" cx="34" cy="34" rx="23" ry="13" />
      <path className="mono__pelaje" d="M45 9 Q36 6 35 21 Q36 29 43 26 Q45 16 48 12 Z" />
      <path className="mono__pelaje" d="M59 9 Q68 6 69 21 Q68 29 61 26 Q59 16 56 12 Z" />
      <circle className="mono__pelaje" cx="52" cy="19" r="13" />
      <ellipse className="mono__cuerpo" cx="53" cy="25" rx="8" ry="6" />
      {animo === 'siesta' ? (
        <>
          <path d="M45 17 Q48 20 51 17" />
          <path d="M55 17 Q58 20 61 17" />
        </>
      ) : (
        <>
          <circle className="mono__relleno" cx="48" cy="16.5" r="1.8" />
          <circle className="mono__relleno" cx="57" cy="16.5" r="1.8" />
        </>
      )}
      <ellipse className="mono__relleno" cx="53" cy="22" rx="2.2" ry="1.6" />
      <path d="M53 23.5 Q53 26 50 26.5" />
      <path d="M53 23.5 Q53 26 56 26.5" />
      {animo === 'recreo' && (
        <path className="mono__lengua" d="M52 26 Q52 31 55 30 Q56 27 55 26 Z" />
      )}
      <circle className="mono__rubor" cx="45" cy="24" r="1.9" />
      <circle className="mono__rubor" cx="61" cy="24" r="1.9" />
      {animo === 'siesta' && <Taza x={62} y={44} />}
      {animo === 'recreo' && (
        <Confeti
          puntos={[
            [8, 6, 'kw__cielo'],
            [30, 2, 'kw__menta'],
            [68, 8, 'kw__chapita'],
            [4, 44, 'kw__menta'],
          ]}
        />
      )}
      {animo === 'siesta' && (
        <>
          <Zeta x={62} y={8} />
          <Zeta x={68} y={3} lejos />
        </>
      )}
    </svg>
  )
}

function Conejito(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 50 62" width="46">
      <path className="mono__pelaje conejito__oreja" d="M18 24 Q12 3 20 2 Q26 3 23 24 Z" />
      <path
        className="mono__pelaje conejito__oreja conejito__oreja--otra"
        d="M27 24 Q28 2 35 4 Q40 6 32 25 Z"
      />
      <ellipse className="mono__cuerpo" cx="17" cy="58.5" rx="5" ry="2.8" />
      <ellipse className="mono__cuerpo" cx="33" cy="58.5" rx="5" ry="2.8" />
      <ellipse className="mono__pelaje" cx="25" cy="45" rx="15.5" ry="13.5" />
      <ellipse className="mono__cuerpo" cx="25" cy="48" rx="9" ry="8" />
      {animo === 'recreo' ? (
        <>
          <path d="M13 44 Q7 40 10 35" />
          <path d="M37 44 Q43 40 40 35" />
        </>
      ) : (
        <>
          <path d="M12 42 Q8 45 11 48" />
          <path d="M38 42 Q42 45 39 48" />
        </>
      )}
      <circle className="mono__pelaje" cx="25" cy="27" r="12.5" />
      {animo === 'siesta' ? (
        <>
          <path d="M17 26 Q20 29 23 26" />
          <path d="M27 26 Q30 29 33 26" />
        </>
      ) : (
        <>
          <circle className="mono__relleno" cx="20" cy="26" r="1.9" />
          <circle className="mono__relleno" cx="30" cy="26" r="1.9" />
        </>
      )}
      <circle className="mono__relleno" cx="25" cy="30" r="1" />
      <line x1="25" y1="31" x2="25" y2="33.2" />
      <path d="M21.5 33.2 Q25 36 28.5 33.2" />
      <circle className="mono__rubor" cx="15.5" cy="30" r="1.9" />
      <circle className="mono__rubor" cx="34.5" cy="30" r="1.9" />
      {animo === 'siesta' && <Taza x={40} y={52} />}
      {animo === 'recreo' && (
        <Confeti
          puntos={[
            [5, 8, 'kw__cielo'],
            [45, 6, 'kw__menta'],
            [3, 36, 'kw__menta'],
            [47, 34, 'kw__chapita'],
          ]}
        />
      )}
      {animo === 'siesta' && <Zeta x={40} y={12} lejos />}
    </svg>
  )
}

function Ranita(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 62 48" width="52">
      <ellipse className="mono__pelaje" cx="9" cy="38" rx="8" ry="5" transform="rotate(-25 9 38)" />
      <ellipse className="mono__pelaje" cx="53" cy="38" rx="8" ry="5" transform="rotate(25 53 38)" />
      <ellipse className="mono__pelaje" cx="31" cy="29" rx="21.5" ry="14.5" />
      <ellipse className="mono__cuerpo" cx="31" cy="35" rx="13" ry="7.5" />
      <circle className="mono__pelaje" cx="20" cy="12" r="7.5" />
      <circle className="mono__pelaje" cx="42" cy="12" r="7.5" />
      {animo === 'siesta' ? (
        <>
          <path d="M16.5 11 Q20 14 23.5 11" />
          <path d="M38.5 11 Q42 14 45.5 11" />
        </>
      ) : (
        <>
          <circle className="mono__relleno" cx="20" cy="11" r="2" />
          <circle className="mono__relleno" cx="42" cy="11" r="2" />
        </>
      )}
      <path d="M21 22 Q31 28 41 22" />
      {animo === 'recreo' ? (
        <>
          <line x1="23" y1="41" x2="19" y2="34" />
          <line x1="39" y1="41" x2="43" y2="34" />
        </>
      ) : (
        <>
          <line x1="24" y1="40" x2="24" y2="44.5" />
          <line x1="38" y1="40" x2="38" y2="44.5" />
          <path d="M20 44.5 Q24 47 28 44.5" />
          <path d="M34 44.5 Q38 47 42 44.5" />
        </>
      )}
      <circle className="mono__rubor" cx="13" cy="21" r="1.9" />
      <circle className="mono__rubor" cx="49" cy="21" r="1.9" />
      {animo === 'siesta' && <Taza x={52} y={12} />}
      {animo === 'recreo' && (
        <Confeti
          puntos={[
            [4, 6, 'kw__menta'],
            [58, 4, 'kw__chapita'],
            [2, 26, 'kw__cielo'],
            [60, 24, 'kw__menta'],
          ]}
        />
      )}
      {animo === 'siesta' && <Zeta x={5} y={8} lejos />}
    </svg>
  )
}

function Caracol(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 54 36" width="44">
      <ellipse className="mono__cuerpo" cx="25" cy="28.5" rx="19" ry="4.5" />
      <circle className="mono__pelaje" cx="20" cy="17" r="11" />
      <path d="M27 13 A8 8 0 1 0 28 21" />
      <circle className="mono__relleno" cx="21" cy="17" r="2" />
      <line x1="40" y1="15" x2="38" y2="9" />
      <circle className="mono__relleno" cx="37.8" cy="8" r="1.2" />
      <line x1="44" y1="15" x2="46" y2="9" />
      <circle className="mono__relleno" cx="46.2" cy="8" r="1.2" />
      <circle className="mono__cuerpo" cx="42" cy="21" r="6.5" />
      {animo === 'siesta' ? (
        <path d="M39.5 21 Q42 23 44.5 21" />
      ) : (
        <circle className="mono__relleno" cx="43.5" cy="20" r="1.5" />
      )}
      <circle className="mono__rubor" cx="44.8" cy="23.5" r="1.3" />
      {animo === 'siesta' && <Taza x={2} y={10} />}
      {animo === 'recreo' && (
        <Confeti
          puntos={[
            [4, 4, 'kw__menta'],
            [30, 2, 'kw__chapita'],
            [51, 12, 'kw__cielo'],
            [6, 24, 'kw__cielo'],
          ]}
        />
      )}
      {animo === 'siesta' && <Zeta x={8} y={5} lejos />}
    </svg>
  )
}

/** Cuy: cuerpo de pan, orejitas de pétalo, remolino de pelo al frente. */
function Cuy(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 60 48" width="50">
      <ellipse className="mono__cuerpo" cx="19" cy="44" rx="4.5" ry="2.6" />
      <ellipse className="mono__cuerpo" cx="41" cy="44" rx="4.5" ry="2.6" />
      <ellipse className="mono__pelaje" cx="16" cy="13" rx="5" ry="4" transform="rotate(-22 16 13)" />
      <ellipse className="mono__pelaje" cx="44" cy="13" rx="5" ry="4" transform="rotate(22 44 13)" />
      <ellipse className="mono__pelaje" cx="30" cy="28" rx="24" ry="17.5" />
      <path className="mono__cuerpo" d="M30 43 Q17 42 20 31 Q25 35 30 34 Q35 35 40 31 Q43 42 30 43 Z" />
      {animo === 'siesta' ? (
        <>
          <path d="M19 24 Q22 27 25 24" />
          <path d="M35 24 Q38 27 41 24" />
        </>
      ) : (
        <>
          <circle className="mono__relleno" cx="22" cy="24" r="2" />
          <circle className="mono__relleno" cx="38" cy="24" r="2" />
        </>
      )}
      <ellipse className="mono__relleno" cx="30" cy="30" rx="2.1" ry="1.5" />
      <path d="M30 31.4 L30 33.2" />
      <path d="M30 33.2 Q27.5 34 27 33" />
      <path d="M30 33.2 Q32.5 34 33 33" />
      <circle className="mono__rubor" cx="14" cy="31" r="2.1" />
      <circle className="mono__rubor" cx="46" cy="31" r="2.1" />
      {animo === 'siesta' && <Taza x={48} y={34} />}
      {animo === 'recreo' && (
        <Confeti
          puntos={[
            [6, 8, 'kw__menta'],
            [54, 6, 'kw__cielo'],
            [4, 32, 'kw__chapita'],
            [56, 30, 'kw__menta'],
          ]}
        />
      )}
      {animo === 'siesta' && <Zeta x={48} y={10} lejos />}
    </svg>
  )
}

/** Appa, el bisonte volador: pelaje claro, flecha en el lomo, cola-timón. */
function Appa(animo: Animo): ReactNode {
  return (
    <svg viewBox="0 0 66 44" width="120">
      <ellipse className="appa__cola mono__cuerpo" cx="9" cy="23" rx="8.5" ry="11" />
      <ellipse className="mono__cuerpo" cx="22" cy="36" rx="4.5" ry="4" />
      <ellipse className="mono__cuerpo" cx="33" cy="37" rx="4.5" ry="4" />
      <ellipse className="mono__cuerpo" cx="44" cy="36" rx="4.5" ry="4" />
      <ellipse className="mono__cuerpo" cx="32" cy="22" rx="25" ry="14" />
      <path className="mono__pelaje" d="M12 16 Q32 8 54 13 Q54 16 53 18 Q32 12 13 20 Z" />
      <path className="mono__cuerpo" d="M44 12 Q40 4 47 6 Q48 9 47 13 Z" />
      <path className="mono__cuerpo" d="M60 12 Q64 4 57 6 Q56 9 57 13 Z" />
      <circle className="mono__cuerpo" cx="52" cy="20" r="12.5" />
      <path className="mono__pelaje" d="M52 9 L48 16.5 L52 14 L56 16.5 Z" />
      {animo === 'siesta' ? (
        <>
          <path d="M45 19 Q48 22 51 19" />
          <path d="M53 19 Q56 22 59 19" />
        </>
      ) : (
        <>
          <circle className="mono__relleno" cx="48" cy="19" r="1.9" />
          <circle className="mono__relleno" cx="56" cy="19" r="1.9" />
        </>
      )}
      <ellipse className="mono__relleno" cx="52" cy="25" rx="4" ry="2.6" />
      <path d="M46 28 Q52 32 58 28" />
      <circle className="mono__rubor" cx="44.5" cy="24" r="1.9" />
      <circle className="mono__rubor" cx="59.5" cy="24" r="1.9" />
      {animo === 'siesta' && <Taza x={2} y={10} />}
      {animo === 'recreo' && (
        <Confeti
          puntos={[
            [6, 6, 'kw__cielo'],
            [32, 2, 'kw__menta'],
            [62, 8, 'kw__chapita'],
            [4, 38, 'kw__menta'],
          ]}
        />
      )}
      {animo === 'siesta' && (
        <>
          <Zeta x={62} y={9} />
          <Zeta x={64} y={3} lejos />
        </>
      )}
    </svg>
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
