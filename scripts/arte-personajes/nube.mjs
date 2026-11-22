import { tiraAPartes, Parte } from './lib.mjs'
/** La nube del gatito con un copo extra arriba (cuadros 2 y 3) para tapar orejas tiesas y el agarre. */
export function nube() {
  const poof = tiraAPartes('/home/ginol/Escritorio/JarvisProyect/recursos/personajes/gatito/pixel/poof.png')
  for (const [i, cx, cy, rx, ry] of [[2, 34, 13, 11.5, 9], [3, 33, 14, 12, 8.5]]) {
    const P = poof[i]
    const copo = new Parte().elipse(cx, cy, rx, ry, 'F')
    const antes = P.p.slice()
    const en = (x, y) => x >= 0 && y >= 0 && x < 64 && y < 64 && (antes[y * 64 + x] !== '.' || copo.p[y * 64 + x] !== '.')
    P.cada((x, y) => {
      if (copo.p[y * 64 + x] === '.') return
      const borde = !en(x - 1, y) || !en(x + 1, y) || !en(x, y - 1) || !en(x, y + 1)
      if (borde) P.p[y * 64 + x] = 'B'
      else if (antes[y * 64 + x] === '.' || antes[y * 64 + x] === 'B') P.p[y * 64 + x] = 'F'
    })
  }
  return poof
}
