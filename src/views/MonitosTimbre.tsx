import type { ReactNode } from 'react'
import type { Animal, Animo } from './Monitos'
import { Fig, Zeta } from './MonitosComun'

/**
 * Piel "timbre": el sello de goma de la notaría. Masa sólida de tinta, sin
 * contorno ni marco; armada con círculos, cápsulas y triángulos, de perfil. Los
 * rasgos — ojos, boca, pezuñas y la flecha de Appa — van calados en el color
 * del papel, igual que las dos o tres muescas de goma gastada por animal.
 * No usa `mono__trazo` ni destacador: el timbre no tiene línea ni color.
 */

/** Cápsula rotable: el ladrillo de orejas, patas y pies. */
const Cap = ({
  x,
  y,
  w,
  h,
  giro = 0,
  clase = '',
}: {
  x: number
  y: number
  w: number
  h: number
  giro?: number
  clase?: string
}) => (
  <g transform={giro ? `rotate(${giro} ${x + w / 2} ${y + h / 2})` : undefined}>
    <rect className={`mono__macizo ${clase}`} x={x} y={y} width={w} height={h} rx={Math.min(w, h) / 2} />
  </g>
)

/** Una muesca de goma gastada: una rendija calada en el borde. */
const Muesca = ({ x, y, w = 3.4, h = 1.8, giro = 0 }: { x: number; y: number; w?: number; h?: number; giro?: number }) => (
  <rect className="mono__muesca" x={x} y={y} width={w} height={h} rx={0.9} transform={giro ? `rotate(${giro} ${x} ${y})` : undefined} />
)

/** Ojos calados; cerrados (arco calado) en la siesta. */
const Ojos = ({ animo, puntos }: { animo: Animo; puntos: [number, number][] }) => (
  <>
    {puntos.map(([x, y], i) =>
      animo === 'siesta' ? (
        <path key={i} className="mono__parpadeo" d={`M${x - 3.4} ${y} Q${x} ${y + 3.4} ${x + 3.4} ${y}`} />
      ) : (
        <circle key={i} className="mono__ojo" cx={x} cy={y} r="2.5" />
      ),
    )}
  </>
)

/** La taza es masa con el asa calada: un anillo con el hueco del papel. */
const Taza = ({ x, y }: { x: number; y: number }) => (
  <g>
    <path className="mono__taza" d={`M${x} ${y} h10 v4 q0 5.5 -5 5.5 q-5 0 -5 -5.5 z`} />
    <circle className="mono__taza" cx={x + 11} cy={y + 5} r="3.6" />
    <circle className="mono__calado" cx={x + 11} cy={y + 5} r="1.6" />
    <rect className="mono__calado" x={x + 1.8} y={y + 1.6} width="6.4" height="1.6" rx="0.8" />
  </g>
)

/* ------------------------------------------------------------ conejito --- */

function Conejito(animo: Animo): ReactNode {
  return (
    <Fig piel="timbre" animal="conejito">
      {animo === 'estudia' && (
        <>
          <Cap x={38} y={4} w={8} h={27} giro={-4} />
          <Cap x={49} y={7} w={8} h={25} giro={8} />
          <circle className="mono__macizo" cx="46" cy="38" r="12.5" />
          <circle className="mono__macizo" cx="36" cy="62" r="16" />
          <circle className="mono__macizo" cx="19" cy="68" r="5.5" />
          <Cap x={36} y={73} w={19} h={5.5} />
          <Ojos animo={animo} puntos={[[51, 36]]} />
          <circle className="mono__calado" cx="57.5" cy="40" r="1.3" />
          <rect className="mono__calado" x="44" y="73.4" width="1.8" height="6" />
          <Muesca x={46} y={9} />
          <Muesca x={21} y={56} w={4} h={2} giro={50} />
          <Muesca x={50} y={52} w={2} h={4} />
        </>
      )}
      {animo === 'recreo' && (
        <g transform="translate(0 -3) rotate(-16 40 56)">
          <Cap x={42} y={10} w={8} h={27} giro={-62} />
          <Cap x={46} y={8} w={8} h={27} giro={-76} />
          <Cap x={0} y={64} w={30} h={7} giro={-20} />
          <Cap x={56} y={58} w={22} h={6.5} giro={22} />
          <ellipse className="mono__macizo" cx="31" cy="58" rx="19" ry="11.5" />
          <circle className="mono__macizo" cx="54" cy="46" r="12" />
          <circle className="mono__macizo" cx="11" cy="52" r="5" />
          <Ojos animo={animo} puntos={[[58, 44]]} />
          <circle className="mono__calado" cx="64" cy="48" r="1.3" />
          <Muesca x={27} y={48} w={5} />
          <Muesca x={36} y={65} w={4} giro={20} />
        </g>
      )}
      {animo === 'siesta' && (
        <>
          <Cap x={8} y={47} w={34} h={7} giro={-3} />
          <Cap x={13} y={54} w={32} h={7} giro={2} />
          <ellipse className="mono__macizo" cx="28" cy="67" rx="21" ry="10.5" />
          <circle className="mono__macizo" cx="50" cy="66" r="11" />
          <rect className="mono__calado" x="12" y="53.4" width="28" height="1.5" rx="0.75" />
          <Ojos animo={animo} puntos={[[50, 64]]} />
          <circle className="mono__calado" cx="59" cy="68" r="1.2" />
          <Muesca x={10} y={70} w={4} giro={-30} />
          <Taza x={66} y={68} />
          <Zeta x={48} y={40} />
          <Zeta x={58} y={33} lejos />
        </>
      )}
    </Fig>
  )
}

/* -------------------------------------------------------------- gatito --- */

function Gatito(animo: Animo): ReactNode {
  return (
    <Fig piel="timbre" animal="gatito">
      {animo === 'estudia' && (
        <>
          <path className="mono__macizo mono__cola" d="M48 74 C64 78 68 64 60 58 L64 53 C76 62 71 82 48 80 Z" />
          <path className="mono__macizo mono__oreja" d="M31 30 L31 8 L46 22 Z" />
          <path className="mono__macizo mono__oreja" d="M58 30 L60 8 L45 22 Z" />
          <ellipse className="mono__macizo" cx="40" cy="60" rx="15" ry="18" />
          <circle className="mono__macizo" cx="45" cy="32" r="13.5" />
          <Ojos animo={animo} puntos={[[50, 30]]} />
          <path className="mono__calado" d="M55.5 33.4 L59.4 33.4 L57.5 35.6 Z" />
          <rect className="mono__calado" x="38" y="73.4" width="1.8" height="6" />
          <Muesca x={33} y={13} w={2} h={4} />
          <Muesca x={25} y={56} w={4} h={2} giro={40} />
          <Muesca x={54} y={66} w={2} h={4} />
        </>
      )}
      {animo === 'recreo' && (
        <g transform="translate(0 -3) rotate(-14 40 56)">
          <path className="mono__macizo mono__cola" d="M20 56 C4 54 2 38 12 30 L16 34 C10 40 12 48 22 49 Z" />
          <Cap x={15} y={60} w={7} h={17} giro={20} />
          <Cap x={31} y={62} w={7} h={16} giro={-8} />
          <Cap x={46} y={60} w={7} h={17} giro={14} />
          <Cap x={55} y={58} w={20} h={7} giro={22} />
          <ellipse className="mono__macizo" cx="34" cy="55" rx="20" ry="11.5" />
          <path className="mono__macizo mono__oreja" d="M50 42 L50 24 L63 37 Z" />
          <path className="mono__macizo mono__oreja" d="M72 42 L74 24 L61 37 Z" />
          <circle className="mono__macizo" cx="60" cy="46" r="13" />
          <Ojos animo={animo} puntos={[[65, 44]]} />
          <path className="mono__calado" d="M70.5 47.4 L74 47.4 L72.2 49.6 Z" />
          <Muesca x={22} y={48} w={5} />
          <Muesca x={40} y={60} w={4} />
        </g>
      )}
      {animo === 'siesta' && (
        <>
          <path className="mono__macizo mono__cola" d="M12 74 C0 70 2 54 16 54 L18 60 C10 61 10 68 16 72 Z" />
          <path className="mono__macizo mono__oreja" d="M43 62 L43 46 L55 55 Z" />
          <path className="mono__macizo mono__oreja" d="M65 62 L66 46 L54 55 Z" />
          <ellipse className="mono__macizo" cx="29" cy="67" rx="21" ry="10.5" />
          <circle className="mono__macizo" cx="54" cy="66" r="11.5" />
          <Ojos animo={animo} puntos={[[56, 64]]} />
          <path className="mono__calado" d="M60 67.4 L63.6 67.4 L61.8 69.4 Z" />
          <Muesca x={19} y={59} w={4} giro={20} />
          <Taza x={66} y={68} />
          <Zeta x={48} y={38} />
          <Zeta x={58} y={31} lejos />
        </>
      )}
    </Fig>
  )
}

/* ------------------------------------------------------------------ cuy --- */

function Cuy(animo: Animo): ReactNode {
  const oreja = (x: number, y: number) => (
    <ellipse className="mono__calado" cx={x} cy={y} rx="4.2" ry="6.5" transform={`rotate(-20 ${x} ${y})`} />
  )
  return (
    <Fig piel="timbre" animal="cuy">
      {animo === 'estudia' && (
        <>
          {/* Excepción a la silueta vertical: echado de lado mirando al centro. */}
          <ellipse className="mono__macizo" cx="35" cy="61" rx="26" ry="16.5" />
          <circle className="mono__macizo" cx="60" cy="57" r="13.5" />
          <rect className="mono__calado" x="21" y="74" width="1.8" height="5" />
          <rect className="mono__calado" x="43" y="74" width="1.8" height="5" />
          {oreja(53, 49)}
          <Ojos animo={animo} puntos={[[61, 54]]} />
          <circle className="mono__calado" cx="72.4" cy="59" r="1.7" />
          <path className="mono__parpadeo" d="M24 60 C23 54 32 53 34 59 C36 65 28 67 26 62" />
          <Muesca x={14} y={52} w={4} giro={-40} />
          <Muesca x={40} y={46} w={4} />
        </>
      )}
      {animo === 'recreo' && (
        <g transform="translate(0 -3) rotate(-14 40 56)">
          <Cap x={14} y={68} w={6} h={9} giro={20} />
          <Cap x={42} y={68} w={6} h={9} giro={-20} />
          <ellipse className="mono__macizo" cx="33" cy="58" rx="25" ry="16" />
          <circle className="mono__macizo" cx="58" cy="54" r="13.5" />
          {oreja(51, 46)}
          <Ojos animo={animo} puntos={[[60, 51]]} />
          <circle className="mono__calado" cx="71.4" cy="56" r="1.7" />
          <path className="mono__parpadeo" d="M22 58 C21 52 30 51 32 57 C34 63 26 65 24 60" />
          <Muesca x={12} y={52} w={4} giro={-40} />
        </g>
      )}
      {animo === 'siesta' && (
        <>
          <ellipse className="mono__macizo" cx="30" cy="67" rx="23" ry="11" />
          <circle className="mono__macizo" cx="52" cy="66" r="12" />
          {oreja(46, 59)}
          <Ojos animo={animo} puntos={[[54, 64]]} />
          <circle className="mono__calado" cx="63" cy="68" r="1.6" />
          <path className="mono__parpadeo" d="M18 66 C17 61 25 60 27 65 C29 70 22 71 20 67" />
          <Muesca x={10} y={70} w={4} giro={-30} />
          <Taza x={67} y={68} />
          <Zeta x={44} y={42} />
          <Zeta x={54} y={35} lejos />
        </>
      )}
    </Fig>
  )
}

/* -------------------------------------------------------------- caracol --- */

const ESPIRAL = 'M0 0 C0 -4 6 -4 6 0 C6 7 -6 8 -9 1 C-12 -8 -2 -14 8 -12 C18 -10 20 3 14 10'

function Caracol(animo: Animo): ReactNode {
  return (
    <Fig piel="timbre" animal="caracol">
      {animo === 'estudia' && (
        <>
          <Cap x={4} y={68} w={52} h={10} />
          <Cap x={44} y={22} w={11} h={56} />
          <Cap x={44} y={4} w={3} h={16} />
          <Cap x={53} y={4} w={3} h={16} />
          <circle className="mono__macizo" cx="45.5" cy="5" r="3.6" />
          <circle className="mono__macizo" cx="54.5" cy="5" r="3.6" />
          <circle className="mono__macizo" cx="50" cy="24" r="10" />
          <circle className="mono__macizo" cx="25" cy="52" r="21" />
          <g transform="translate(22 52) scale(.85)">
            <path className="mono__parpadeo" d={ESPIRAL} />
          </g>
          <Ojos animo={animo} puntos={[[47, 23], [54, 23]]} />
          <Muesca x={8} y={44} w={4} giro={-70} />
          <Muesca x={38} y={64} w={4} h={2} giro={30} />
        </>
      )}
      {animo === 'recreo' && (
        <>
          <Cap x={3} y={68} w={69} h={10} />
          <Cap x={60} y={34} w={11} h={40} giro={14} />
          <Cap x={59} y={14} w={3} h={16} giro={-8} />
          <Cap x={69} y={14} w={3} h={16} giro={14} />
          <circle className="mono__macizo" cx="60.5" cy="14" r="3.6" />
          <circle className="mono__macizo" cx="71" cy="14" r="3.6" />
          <circle className="mono__macizo" cx="67" cy="34" r="10" />
          <circle className="mono__macizo" cx="28" cy="52" r="19" />
          <g transform="translate(25 52) scale(.75)">
            <path className="mono__parpadeo" d={ESPIRAL} />
          </g>
          <Ojos animo={animo} puntos={[[64, 33], [71, 33]]} />
          <Muesca x={12} y={46} w={4} giro={-70} />
          <Muesca x={46} y={70} w={4} h={2} />
        </>
      )}
      {animo === 'siesta' && (
        <>
          <Cap x={6} y={68} w={64} h={10} />
          <circle className="mono__macizo" cx="34" cy="51" r="23" />
          <g transform="translate(30 51)">
            <path className="mono__parpadeo" d={ESPIRAL} />
          </g>
          <path className="mono__parpadeo" d="M62 72 Q65 75.4 68 72" />
          <Muesca x={14} y={40} w={4} giro={-60} />
          <Taza x={63} y={50} />
          <Zeta x={52} y={28} />
          <Zeta x={62} y={21} lejos />
        </>
      )}
    </Fig>
  )
}

/* -------------------------------------------------------------- perrito --- */

function Perrito(animo: Animo): ReactNode {
  return (
    <Fig piel="timbre" animal="perrito">
      {animo === 'estudia' && (
        <>
          <path className="mono__macizo mono__cola" d="M24 74 C10 76 8 64 14 58 L18 61 C14 66 18 70 26 69 Z" />
          <ellipse className="mono__macizo" cx="38" cy="58" rx="14.5" ry="20" />
          <ellipse className="mono__macizo" cx="43" cy="24" rx="14" ry="13.5" />
          <ellipse className="mono__macizo" cx="56" cy="29" rx="9" ry="6" />
          <ellipse className="mono__macizo mono__oreja" cx="33" cy="26" rx="6" ry="12" transform="rotate(10 33 26)" />
          <path className="mono__parpadeo" d="M38 16 C34 22 34 30 37 36" />
          <Ojos animo={animo} puntos={[[48, 21]]} />
          <ellipse className="mono__calado" cx="62" cy="27" rx="3" ry="2.1" />
          <rect className="mono__calado" x="38" y="73.4" width="1.8" height="6" />
          <Muesca x={26} y={52} w={4} giro={40} />
          <Muesca x={50} y={58} w={2} h={4} />
        </>
      )}
      {animo === 'recreo' && (
        <g transform="translate(0 -3) rotate(-14 40 56)">
          <path className="mono__macizo mono__cola" d="M20 54 C6 52 4 36 12 28 L16 32 C10 38 12 46 22 47 Z" />
          <Cap x={15} y={60} w={7} h={17} giro={20} />
          <Cap x={31} y={62} w={7} h={16} giro={-8} />
          <Cap x={46} y={60} w={7} h={17} giro={14} />
          <Cap x={55} y={58} w={20} h={7} giro={22} />
          <ellipse className="mono__macizo" cx="34" cy="55" rx="20" ry="11.5" />
          <ellipse className="mono__macizo" cx="58" cy="43" rx="13.5" ry="13" />
          <ellipse className="mono__macizo" cx="71" cy="48" rx="8" ry="5.5" />
          <ellipse className="mono__macizo mono__oreja" cx="50" cy="45" rx="5.5" ry="11" transform="rotate(14 50 45)" />
          <Ojos animo={animo} puntos={[[62, 40]]} />
          <ellipse className="mono__calado" cx="77" cy="47" rx="2.8" ry="2" />
          <path className="mono__lengua" d="M70 53 Q69 60 73 59.6 Q74.6 57.6 74 53 Z" />
          <Muesca x={24} y={48} w={5} />
        </g>
      )}
      {animo === 'siesta' && (
        <>
          <path className="mono__macizo mono__cola" d="M12 74 C0 72 0 58 12 56 L14 62 C8 63 8 68 14 70 Z" />
          <ellipse className="mono__macizo" cx="29" cy="67" rx="21" ry="10.5" />
          <ellipse className="mono__macizo" cx="50" cy="65" rx="12" ry="11.5" />
          <ellipse className="mono__macizo" cx="60" cy="69" rx="7.5" ry="5.2" />
          <ellipse className="mono__macizo mono__oreja" cx="44" cy="63" rx="5" ry="9.5" transform="rotate(8 44 63)" />
          <path className="mono__parpadeo" d="M40 56 C37 61 37 67 40 71" />
          <Ojos animo={animo} puntos={[[52, 62]]} />
          <ellipse className="mono__calado" cx="65" cy="67.5" rx="2.6" ry="1.9" />
          <Taza x={68} y={68} />
          <Zeta x={44} y={40} />
          <Zeta x={54} y={33} lejos />
        </>
      )}
    </Fig>
  )
}

/* --------------------------------------------------------------- ranita --- */

function Ranita(animo: Animo): ReactNode {
  const ojos = (xs: [number, number], y: number) => (
    <>
      {animo === 'siesta' ? (
        <Ojos animo={animo} puntos={[[xs[0], y], [xs[1], y]]} />
      ) : (
        xs.map((x) => <circle key={x} className="mono__calado" cx={x} cy={y} r="3.4" />)
      )}
    </>
  )
  return (
    <Fig piel="timbre" animal="ranita">
      {animo === 'estudia' && (
        <>
          <Cap x={13} y={73} w={20} h={6} />
          <Cap x={47} y={73} w={20} h={6} />
          <ellipse className="mono__macizo" cx="40" cy="58" rx="17" ry="18" />
          <circle className="mono__macizo" cx="28" cy="16" r="8.5" />
          <circle className="mono__macizo" cx="52" cy="16" r="8.5" />
          <ellipse className="mono__macizo" cx="40" cy="30" rx="21" ry="13" />
          {ojos([28, 52], 16)}
          <path className="mono__parpadeo" d="M27 33 Q40 42 53 33" />
          <rect className="mono__calado" x="39.1" y="68" width="1.8" height="11" />
          <Muesca x={22} y={52} w={4} giro={50} />
          <Muesca x={52} y={62} w={2} h={4} />
        </>
      )}
      {animo === 'recreo' && (
        <g transform="translate(0 -3) rotate(-18 40 56)">
          <Cap x={0} y={62} w={32} h={7} giro={-18} />
          <Cap x={54} y={56} w={22} h={7} giro={22} />
          <ellipse className="mono__macizo" cx="40" cy="58" rx="17" ry="18" />
          <circle className="mono__macizo" cx="28" cy="16" r="8.5" />
          <circle className="mono__macizo" cx="52" cy="16" r="8.5" />
          <ellipse className="mono__macizo" cx="40" cy="30" rx="21" ry="13" />
          {ojos([28, 52], 16)}
          <path className="mono__parpadeo" d="M27 33 Q40 42 53 33" />
          <Muesca x={22} y={52} w={4} giro={50} />
        </g>
      )}
      {animo === 'siesta' && (
        <>
          <Cap x={4} y={73} w={22} h={6} />
          <Cap x={48} y={73} w={22} h={6} />
          <circle className="mono__macizo" cx="26" cy="51" r="8" />
          <circle className="mono__macizo" cx="46" cy="51" r="8" />
          <ellipse className="mono__macizo" cx="36" cy="65" rx="27" ry="12" />
          {ojos([26, 46], 51)}
          <path className="mono__parpadeo" d="M24 65 Q36 72 48 65" />
          <Muesca x={12} y={60} w={4} giro={-40} />
          <Taza x={67} y={68} />
          <Zeta x={52} y={30} />
          <Zeta x={62} y={23} lejos />
        </>
      )}
    </Fig>
  )
}

/* ----------------------------------------------------------------- appa --- */

/** La nube del lomo: círculos de pelo que se funden en una sola masa. */
const NUBE: [number, number, number][] = [
  [30, 36, 12],
  [42, 28, 13.5],
  [57, 26, 13.5],
  [72, 31, 12.5],
  [40, 44, 12],
  [56, 44, 12],
  [72, 43, 11],
  [26, 46, 9],
]

const Nube = () => (
  <>
    {NUBE.map(([cx, cy, r]) => (
      <circle key={`${cx}-${cy}`} className="mono__macizo" cx={cx} cy={cy} r={r} />
    ))}
  </>
)

function CabezaAppa({ animo }: { animo: Animo }) {
  return (
    <g>
      <path className="mono__macizo" d="M-13 -8 C-17 -19 -11 -26 -3 -25 C-5 -21 -4 -15 -3 -10 Z" />
      <path className="mono__macizo" d="M13 -8 C17 -19 12 -26 4 -25 C6 -21 5 -15 4 -10 Z" />
      <circle className="mono__macizo" cx="0" cy="0" r="16" />
      <path className="mono__calado mono__flecha" d="M0 -13 L5 -2 L0 -5 L-5 -2 Z" />
      <Ojos animo={animo} puntos={[[-7, 3], [7, 3]]} />
      <path className="mono__parpadeo" d="M-3 9 Q0 12 3 9" />
    </g>
  )
}

function Appa(animo: Animo): ReactNode {
  return (
    <Fig piel="timbre" animal="appa">
      {animo === 'estudia' && (
        <>
          <ellipse className="mono__macizo mono__cola" cx="13" cy="40" rx="12" ry="8" transform="rotate(-10 13 40)" />
          {[26, 46, 66].map((x) => (
            <Cap key={x} x={x} y={50} w={15} h={11} />
          ))}
          <Nube />
          <g transform="translate(96 37)">
            <CabezaAppa animo={animo} />
          </g>
          <rect className="mono__calado" x="12" y="39" width="12" height="1.6" rx="0.8" />
          <Muesca x={44} y={18} w={5} />
          <Muesca x={30} y={50} w={4} h={2} />
          {[26, 46, 66].map((x) => (
            <rect key={x} className="mono__calado" x={x + 6.7} y={54} width="1.6" height="7" />
          ))}
        </>
      )}
      {animo === 'recreo' && (
        <g transform="translate(0 -4) rotate(-10 60 36)">
          <ellipse className="mono__macizo mono__cola" cx="13" cy="40" rx="12" ry="8" transform="rotate(-10 13 40)" />
          {[26, 46, 66].map((x, i) => (
            <Cap key={x} x={x} y={50} w={15} h={11} giro={i % 2 ? 14 : -14} clase="mono__pata" />
          ))}
          <Nube />
          <g transform="translate(96 37) rotate(-6)">
            <CabezaAppa animo={animo} />
          </g>
          <rect className="mono__calado" x="12" y="39" width="12" height="1.6" rx="0.8" />
          <Muesca x={44} y={18} w={5} />
        </g>
      )}
      {animo === 'siesta' && (
        <>
          <ellipse className="mono__macizo mono__cola" cx="26" cy="42" rx="12" ry="8.5" transform="rotate(-18 26 42)" />
          <Cap x={46} y={50} w={12} h={7} />
          <Cap x={62} y={50} w={12} h={7} />
          <circle className="mono__macizo" cx="48" cy="30" r="13" />
          <circle className="mono__macizo" cx="62" cy="26" r="13" />
          <circle className="mono__macizo" cx="72" cy="38" r="12" />
          <circle className="mono__macizo" cx="46" cy="42" r="12" />
          <circle className="mono__macizo" cx="60" cy="42" r="14" />
          <g transform="translate(88 42) rotate(12) scale(.95)">
            <CabezaAppa animo={animo} />
          </g>
          <Muesca x={50} y={20} w={5} />
          <Zeta x={80} y={9} />
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
