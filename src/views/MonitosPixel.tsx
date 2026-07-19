import type { ReactNode } from 'react'
import type { Animal, Animo } from './Monitos'

/**
 * Piel "pixel": los mismos animalitos como sprites de pixel art, al estilo
 * del cangrejito de Claude. Cada sprite son grillas de caracteres — '#' tinta,
 * 'o' pelaje, 'b' papel/guata, 'r' rubor, 'p' rosa, 'a' pico amarillo — con
 * dos cuadros (A/B) que el CSS alterna con steps() para la caminata, el
 * aleteo o la respiración, y un cuadro S para la siesta.
 */

type Cuadros = {
  A: string[]
  B: string[]
  S: string[]
  zeta: [number, number]
  /** Esquina donde queda el tecito de la siesta. */
  taza: [number, number]
}

const COLOR: Record<string, string> = {
  '#': 'var(--tinta)',
  o: 'var(--pelaje)',
  b: 'var(--papel)',
  r: 'var(--marca-rosa)',
  p: 'var(--marca-rosa)',
  a: 'var(--marca-amarillo)',
  g: 'var(--tinta-tenue)',
  v: 'var(--marca-verde)',
  z: 'var(--marca-azul)',
}

const Celda = ({ x, y, c }: { x: number; y: number; c: string }) => (
  <rect x={x} y={y} width="1.06" height="1.06" fill={COLOR[c]} />
)


/** Tecito pixel con vapor, apoyado junto al sprite. */
function TazaPixel({ x, y }: { x: number; y: number }) {
  const tinta: [number, number][] = [
    [x, y], [x + 1, y], [x + 2, y], [x + 3, y],
    [x, y + 1], [x + 3, y + 1], [x + 4, y + 1],
    [x, y + 2], [x + 1, y + 2], [x + 2, y + 2], [x + 3, y + 2],
    [x + 1, y - 2], [x + 2, y - 3],
  ]
  return (
    <g>
      {tinta.map(([cx, cy], i) => (
        <Celda key={i} x={cx} y={cy} c="#" />
      ))}
      <Celda x={x + 1} y={y + 1} c="b" />
      <Celda x={x + 2} y={y + 1} c="b" />
    </g>
  )
}

/** Confeti pixel: puntitos de colores alrededor del sprite. */
function ConfetiPixel({ cols, filas }: { cols: number; filas: number }) {
  const puntos: [number, number, string][] = [
    [-2, 1, 'r'],
    [cols + 1, 0, 'v'],
    [-1.5, filas * 0.45, 'a'],
    [cols + 2, filas * 0.55, 'z'],
    [2, -2, 'p'],
  ]
  return (
    <g>
      {puntos.map(([x, y, c], i) => (
        <Celda key={i} x={x} y={y} c={c} />
      ))}
    </g>
  )
}

const GATITO: Cuadros = {
  A: [
    '..................',
    '..........#.....#.',
    '..........##...##.',
    '..........#######.',
    '.#........#ooooo#.',
    '.#........#o#o#o#.',
    '.#.#######ro#or#..',
    '.##ooooooo#oo#oo#.',
    '.##ooooooo#######.',
    '..#ooooooooooooo#.',
    '..##oo######oo###.',
    '....##......##....',
    '....##......##....',
  ],
  B: [
    '..................',
    '..........#.....#.',
    '..........##...##.',
    '..........#######.',
    '#.........#ooooo#.',
    '#.........#o#o#o#.',
    '#..#######ro#or#..',
    '.##ooooooo#oo#oo#.',
    '.##ooooooo#######.',
    '..#ooooooooooooo#.',
    '..###oo####oo####.',
    '.....##....##.....',
    '.....##....##.....',
  ],
  S: [
    '..................',
    '..........#.....#.',
    '..........##...##.',
    '..........#######.',
    '.#........#ooooo#.',
    '.#........###o###.',
    '.#.#######ro#or#..',
    '.##ooooooo#oo#oo#.',
    '.##ooooooo#######.',
    '..#ooooooooooooo#.',
    '..##oo######oo###.',
    '....##......##....',
    '....##......##....',
  ],
  zeta: [15.5, 1],
  taza: [19, 10],
}

const PERRITO: Cuadros = {
  A: [
    '..................',
    '.........####.....',
    '.#.......#oooo#...',
    '.#......#oooooo#..',
    '.##.....#o#oo#obb#',
    '.###....#ooooo#b#.',
    '.#o#######obbbo##.',
    '.##ooooooo#bbb#...',
    '.##oooooooo###....',
    '..#ooooooooooooo#.',
    '..##oo######oo###.',
    '....##......##....',
    '....##......##....',
  ],
  B: [
    '..................',
    '.........####.....',
    '#........#oooo#...',
    '#.......#oooooo#..',
    '##......#o#oo#obb#',
    '###.....#ooooo#b#.',
    '#o########obbbo##.',
    '.##ooooooo#bbb#...',
    '.##oooooooo###....',
    '..#ooooooooooooo#.',
    '..###oo####oo####.',
    '.....##....##.....',
    '.....##....##.....',
  ],
  S: [
    '..................',
    '.........####.....',
    '.#.......#oooo#...',
    '.#......#oooooo#..',
    '.##.....#oooo#obb#',
    '.###....#o##oo#b#.',
    '.#o#######obbbo##.',
    '.##ooooooo#bbb#...',
    '.##oooooooo###....',
    '..#ooooooooooooo#.',
    '..##oo######oo###.',
    '....##......##....',
    '....##......##....',
  ],
  zeta: [14, 1],
  taza: [19, 9],
}

const CONEJITO: Cuadros = {
  A: [
    '...#......#...',
    '..#p#....#p#..',
    '..#p#....#p#..',
    '..#p#....#p#..',
    '..#p#....#p#..',
    '..##########..',
    '.#bbbbbbbbbb#.',
    '.#bb#bbbb#bb#.',
    '.#rbbbppbbbr#.',
    '.#bbbb##bbbb#.',
    '.#bbbbbbbbbb#.',
    '#bbbbbbbbbbbb#',
    '#bbbbbbbbbbbb#',
    '#bb#bbbbbb#bb#',
    '.#bbbbbbbbbb#.',
    '..###...###...',
  ],
  B: [
    '..............',
    '..............',
    '..............',
    '.##........##.',
    '#p#........#p#',
    '#p##########p#',
    '.#bbbbbbbbbb#.',
    '.#bb#bbbb#bb#.',
    '.#rbbbppbbbr#.',
    '.#bbbb##bbbb#.',
    '.#bbbbbbbbbb#.',
    '#bbbbbbbbbbbb#',
    '#bbbbbbbbbbbb#',
    '#bb#bbbbbb#bb#',
    '.#bbbbbbbbbb#.',
    '.###......###.',
  ],
  S: [
    '..............',
    '..............',
    '..............',
    '.##........##.',
    '#p#........#p#',
    '#p##########p#',
    '.#bbbbbbbbbb#.',
    '.#b##bbbb##b#.',
    '.#rbbbppbbbr#.',
    '.#bbbb##bbbb#.',
    '.#bbbbbbbbbb#.',
    '#bbbbbbbbbbbb#',
    '#bbbbbbbbbbbb#',
    '#bb#bbbbbb#bb#',
    '.#bbbbbbbbbb#.',
    '..###...###...',
  ],
  zeta: [12, 2],
  taza: [15, 13],
}

const RANITA: Cuadros = {
  A: [
    '..###......###..',
    '.#o#o#....#o#o#.',
    '.#ooo#....#ooo#.',
    '##ooo######ooo##',
    '#oooooooooooooo#',
    '#roooo####oooor#',
    '#oobbbbbbbbbboo#',
    '#oobbbbbbbbbboo#',
    '#oobbbbbbbbbboo#',
    '.#oooooooooooo#.',
    '#ooo##....##ooo#',
    '###..........###',
  ],
  B: [
    '..###......###..',
    '.#o#o#....#o#o#.',
    '.#ooo#....#ooo#.',
    '##ooo######ooo##',
    '#oooooooooooooo#',
    '#roooo####oooor#',
    '#obbbbbbbbbbbbo#',
    '#obbbbbbbbbbbbo#',
    '#oobbbbbbbbbboo#',
    '.#oooooooooooo#.',
    '#ooo##....##ooo#',
    '###..........###',
  ],
  S: [
    '..###......###..',
    '.#ooo#....#ooo#.',
    '.#####....#####.',
    '##ooo######ooo##',
    '#oooooooooooooo#',
    '#roooo####oooor#',
    '#oobbbbbbbbbboo#',
    '#oobbbbbbbbbboo#',
    '#oobbbbbbbbbboo#',
    '.#oooooooooooo#.',
    '#ooo##....##ooo#',
    '###..........###',
  ],
  zeta: [1.5, -0.5],
  taza: [17, 9],
}

const CARACOL: Cuadros = {
  A: [
    '..........#..#.',
    '...####...#..#.',
    '..#oooo#.#####.',
    '.#oooooo##bbb#.',
    '.#oo##oo##b#b#.',
    '.#oo##oo##brb#.',
    '.#oooooo##bbb#.',
    '..#oooo#.#bb#..',
    '...####..#bb#..',
    '.#bbbbbbbbbbb#.',
    '.#############.',
  ],
  B: [
    '.........#...#.',
    '..........#.#..',
    '..#oooo#.#####.',
    '.#oooooo##bbb#.',
    '.#oo##oo##b#b#.',
    '.#oo##oo##brb#.',
    '.#oooooo##bbb#.',
    '..#oooo#.#bb#..',
    '...####..#bb#..',
    '.#bbbbbbbbbbb#.',
    '.#############.',
  ],
  S: [
    '..........#..#.',
    '...####...#..#.',
    '..#oooo#.#####.',
    '.#oooooo##bbb#.',
    '.#oo##oo##bbb#.',
    '.#oo##oo###rb#.',
    '.#oooooo##bbb#.',
    '..#oooo#.#bb#..',
    '...####..#bb#..',
    '.#bbbbbbbbbbb#.',
    '.#############.',
  ],
  zeta: [4, -0.5],
  taza: [16, 8],
}

const CUY: Cuadros = {
  A: [
    '..................',
    '..................',
    '....###....###....',
    '....#oo####oo#....',
    '....#ooooooooo#...',
    '...#ooooooooooo#..',
    '..#oo##oooo##ooo#.',
    '..#oo##oooo##ooo#.',
    '.#orooooooooooroo#',
    '..#ooooo##oooooo#.',
    '..#oooobbbbooooo#.',
    '...#oooobbooooo#..',
    '....#oooooooo##...',
    '.....########.....',
  ],
  B: [
    '..................',
    '..................',
    '....###....###....',
    '....#oo####oo#....',
    '....#ooooooooo#...',
    '...#ooooooooooo#..',
    '..#oo##oooo##ooo#.',
    '..#oo##oooo##ooo#.',
    '.#orooooooooooroo#',
    '..#ooooo##oooooo#.',
    '..#oooobbbbooooo#.',
    '...#oooobbooooo#..',
    '....##ooooooo##...',
    '......#######.....',
  ],
  S: [
    '..................',
    '..................',
    '....###....###....',
    '....#oo####oo#....',
    '....#ooooooooo#...',
    '...#ooooooooooo#..',
    '..#ooooooooooooo#.',
    '..#oo##oooo##ooo#.',
    '.#orooooooooooroo#',
    '..#ooooo##oooooo#.',
    '..#oooobbbbooooo#.',
    '...#oooobbooooo#..',
    '....#oooooooo##...',
    '.....########.....',
  ],
  zeta: [13, 1],
  taza: [16, 8],
}

const APPA: Cuadros = {
  A: [
    '.......#...............#......',
    '......#b#.............#b#.....',
    '.....#bbb#.....#.....#bbb#....',
    '.....#bbbb####zzz####bbbb#....',
    '.....#bbbbbbbbzzzbbbbbbbb#....',
    '......#bbbbbbbzzzbbbbbbb#.....',
    '......#bbbbbbzzzzzbbbbbb#.....',
    '.....#bbbbbbbbzzzbbbbbbbb#....',
    '.....#bb###bbbbzbbb###bbb#....',
    '.....#bb#b#bbbbbbbb#b#bbb#....',
    '....#bbb###bbbbbbbb###bbbb#...',
    '.....#rrbbbbbbbgbbbbbbrrb#....',
    '.....#bbbbgg######gggbbbb#....',
    '.....#bbbggg#gggg#ggggbbb#....',
    '......#bgggg#g##g#gggggb#.....',
    '.......#bggg######ggggb#......',
    '.......#b#ggg####gggg#b#......',
    '......#b#.#bbbbgbbbb#.#b#.....',
    '.....#bbb##bbb###bbb##bbb#....',
    '......###..###...###..###.....',
  ],
  B: [
    '.......#...............#......',
    '......#b#.............#b#.....',
    '.....#bbb#.....#.....#bbb#....',
    '.....#bbbb####zzz####bbbb#....',
    '.....#bbbbbbbbzzzbbbbbbbb#....',
    '......#bbbbbbbzzzbbbbbbb#.....',
    '......#bbbbbbzzzzzbbbbbb#.....',
    '.....#bbbbbbbbzzzbbbbbbbb#....',
    '.....#bb###bbbbzbbb###bbb#....',
    '.....#bb#b#bbbbbbbb#b#bbb#....',
    '....#bbb###bbbbbbbb###bbbb#...',
    '.....#rrbbbbbbbgbbbbbbrrb#....',
    '.....#bbbbgg######gggbbbb#....',
    '.....#bbbggg#gggg#ggggbbb#....',
    '......#bgggg#g##g#gggggb#.....',
    '.......#bggg######ggggb#......',
    '........#bggg####ggggb#.......',
    '.......#bbbbbbbgbbbbbbb#......',
    '......#bbb#bbb###bbb#bbb#.....',
    '.......###.###...###.###......',
  ],
  S: [
    '.......#...............#......',
    '......#b#.............#b#.....',
    '.....#bbb#.....#.....#bbb#....',
    '.....#bbbb####zzz####bbbb#....',
    '.....#bbbbbbbbzzzbbbbbbbb#....',
    '......#bbbbbbbzzzbbbbbbb#.....',
    '......#bbbbbbzzzzzbbbbbb#.....',
    '.....#bbbbbbbbzzzbbbbbbbb#....',
    '.....#bbbbbbbbbzbbbbbbbbb#....',
    '.....#bbbbbbbbbbbbbbbbbbb#....',
    '....#bbb####bbbbbb####bbbb#...',
    '.....#rrbbbbbbbgbbbbbbrrb#....',
    '.....#bbbbgg######gggbbbb#....',
    '.....#bbbggg#gggg#ggggbbb#....',
    '......#bgggg#g##g#gggggb#.....',
    '.......#bggg######ggggb#......',
    '.......#b#ggg####gggg#b#......',
    '......#b#.#bbbbgbbbb#.#b#.....',
    '.....#bbb##bbb###bbb##bbb#....',
    '......###..###...###..###.....',
  ],
  zeta: [25, 3],
  taza: [25, 15],
}

const SPRITES: Record<Animal, Cuadros> = {
  gatito: GATITO,
  perrito: PERRITO,
  conejito: CONEJITO,
  ranita: RANITA,
  caracol: CARACOL,
  cuy: CUY,
  appa: APPA,
}

/** Cada celda es un rect de 1x1 (con un pelito extra para que no queden ranuras). */
function Pixeles({ cuadro }: { cuadro: string[] }) {
  return (
    <>
      {cuadro.flatMap((fila, y) =>
        [...fila].map((c, x) =>
          c === '.' ? null : (
            <rect key={`${x}.${y}`} x={x} y={y} width="1.06" height="1.06" fill={COLOR[c]} />
          ),
        ),
      )}
    </>
  )
}

function Sprite({ animal, animo }: { animal: Animal; animo: Animo }) {
  const s = SPRITES[animal]
  const filas = s.A.length
  const cols = s.A[0].length
  const [zx, zy] = s.zeta
  return (
    <svg className="mono__sprite" viewBox={`0 0 ${cols} ${filas}`} width={cols * 4}>
      {animo === 'siesta' ? (
        <>
          <Pixeles cuadro={s.S} />
          <TazaPixel x={s.taza[0]} y={s.taza[1]} />
          <text className="mono__z" x={zx} y={zy} fontSize="4.5">
            z
          </text>
          <text className="mono__z mono__z--lejos" x={zx + 2.5} y={zy - 2.5} fontSize="3.5">
            z
          </text>
        </>
      ) : (
        <>
          <g className="mono__cuadroA">
            <Pixeles cuadro={s.A} />
          </g>
          <g className="mono__cuadroB">
            <Pixeles cuadro={s.B} />
          </g>
          {animo === 'recreo' && <ConfetiPixel cols={cols} filas={filas} />}
        </>
      )}
    </svg>
  )
}

export const PIEL: Record<Animal, (animo: Animo) => ReactNode> = {
  gatito: (animo) => <Sprite animal="gatito" animo={animo} />,
  perrito: (animo) => <Sprite animal="perrito" animo={animo} />,
  conejito: (animo) => <Sprite animal="conejito" animo={animo} />,
  ranita: (animo) => <Sprite animal="ranita" animo={animo} />,
  caracol: (animo) => <Sprite animal="caracol" animo={animo} />,
  cuy: (animo) => <Sprite animal="cuy" animo={animo} />,
  appa: (animo) => <Sprite animal="appa" animo={animo} />,
}
