import { nube } from './nube.mjs'
const poof = nube()
for (const animal of process.argv.slice(2)) {
  const { anim } = await import(animal === 'conejito' ? './conejito.mjs' : './cuy.mjs')
  for (const [n, a] of Object.entries(anim)) a.cuadros.forEach((L, i) => { for (const c of [2, 3]) { const pts = []; L.cada((x, y) => { if (L.p[y * 64 + x] !== '.' && poof[c].p[y * 64 + x] === '.') pts.push(x + ',' + y) }); if (pts.length) console.log(animal, n, i, 'poof', c, pts.length, pts.slice(0, 14).join(' ')) } })
}
