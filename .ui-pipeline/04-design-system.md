# 04 — Sistema visual de los monitos: «Útiles del escritorio» (pluma / plumón / timbre)

Autor: ui-design-system. Entrada: 01-brief, 02-ux-contract, 03-direction, `Monitos.tsx`, `estilos.css`.
Especificación, no prueba ejecutada. "Supuesto" = no medido.

## 0. Hallazgos que cambian la implementación
1. **Geometría vertical.** Pendiente 0,5 por px de alto de ventana (2 puntos del contrato).
   - Suelo libre `suelo(H) = 0,5·H − 310` (supuesto): 140@900, 90@800, 80@780, 60@740.
   - Cielo de Appa `cielo(H) = 0,5·H − 320`.
   - A ≤740px de alto los centrales (gatito, cuy, caracol, perrito) no caben: se ocultan en `max-height:740px`; laterales y Appa en 700. QA calibra 310/320 con A2.
2. **A2 ambiguo:** "top ≥ cuenta.bottom+6" solo para centrales. Conejito y ranita (fuera de la columna prohibida) se rigen por A1.
3. **Parpadeo vs tope:** manda A4 (≤2 animados en estudia) → sin parpadeo en estudia.
4. **Transición desde animación:** patrulla se congela con `animation-play-state:paused` fuera de recreo (es posición, no gesto). Gestos → `animation:none` + `transition`; si Chromium no transiciona, salto ≤19px aceptado; builder verifica.

## 1. Tokens (sección Descanso, antes de `.mono`)
Sin color literal; todo sale de tokens que ya cambian en `:root[data-tema='oscuro']` → ningún alias necesita bloque oscuro propio.
```css
.mono {
  --mono-tinta: var(--tinta-suave);       /* estudia y siesta */
  --mono-calado: var(--papel);            /* rasgos calados del timbre */
  --mono-trazo-pluma: 2.4;                /* unidades de viewBox */
  --mono-trazo-plumon: 5.5;
  --mono-escala: 1;                       /* 0.85 en ancho<=1100, 0.72 en <=980 */
  --mono-suelo: 8px;
  --mono-salto-central: 10px;
  --mono-ola: 6px;                        /* Appa; 3px en estudia */
  --mono-t-despertar: 300ms;  --mono-t-reposo: 400ms;  --mono-t-brinco: 600ms;
  --mono-t-fade: 700ms;       --mono-t-respira: 5s;    --mono-escalon: 80ms;
  --mira: 1;
  color: var(--mono-tinta);
  transition: color var(--mono-t-despertar);
}
.mono[data-animo='recreo'] { --mono-tinta: var(--azul); }
```
- `--mono-marca` por animal: conejito `--marca-rosa`, gatito `--marca-amarillo`, cuy `--marca-rosa`, caracol `--marca-verde`, perrito `--marca-amarillo`, ranita `--marca-verde`, appa `--marca-azul`.
- `.mono__marca`: `opacity:0` fuera de recreo, `1` en recreo (transición `--mono-t-despertar`).
- Cajas (`--caja-base`; `--caja-ancho = calc(min(base, tope) * var(--mono-escala))`; pieles no fijan width):

| Animal | base | tope |
|---|---|---|
| conejito | 88 | 64px en ≤760px de alto |
| ranita | 76 | idem |
| gatito, perrito | 76 | `max(0px, calc(50vh - 328px))` |
| cuy | 68 | idem |
| caracol | 64 | idem |
| appa | 96 | `max(0px, calc((50vh - 332px) * 1.875))` |

## 2. Arquitectura de archivos
| Acción | Archivo |
|---|---|
| Crear | `src/views/MonitosComun.tsx`: `Zeta`, `Fig` (svg raíz `mono__fig mono__fig--{piel}` + viewBox canónico), `CAJA` |
| Crear | `MonitosPluma.tsx`, `MonitosPlumon.tsx`, `MonitosTimbre.tsx`; cada uno exporta `PIEL: Record<Animal,(animo:Animo)=>ReactNode>` |
| Borrar | `MonitosTinta.tsx`, `MonitosPixel.tsx`, `MonitosFigura.tsx` (recuperables desde git) |
| Reescribir | `Monitos.tsx` |

`Monitos.tsx`: `Estilo = 'pluma'|'plumon'|'timbre'`; `ESTILOS = ['pluma','plumon','timbre']`; `PIELES` conserva la firma; se borra `Destello`; `Animo`, `Animal`, `animoDe` iguales; paisaje (Estrellas, Nubes, Arboles, Paisaje) intacto.

DOM por animal:
```
div.mono.mono--{animal}[data-animo][data-oculto][data-rota] aria-hidden   <- carril
  div.mono__paseo      width:100%, patrulla con transform
    div.mono__voltea   width:var(--caja-ancho), scaleX(var(--mira))
      [appa: div.mono__ola >] svg.mono__fig
```

Persistencia a nivel de módulo:
```ts
let memoria = { estilo: ESTILOS[0] as Estilo, ultimoCambio: Date.now() }
```
- `useState(memoria.estilo)`; sobrevive al desmontaje de Descanso.
- `intentarRotar()` cada 30s, en cada cambio de `animo` (leído vía ref) y en `visibilitychange`.
- Rota solo si `animo !== 'estudia'` && `!document.hidden` && `Date.now() - memoria.ultimoCambio >= 15*60*1000`.
- Al rotar: actualiza `memoria`, `setEstilo`, `data-rota` durante `--mono-t-fade`.
- `data-oculto` sigue a `document.hidden`.
- Destello = fundido de la figura: `.mono[data-rota] .mono__fig { animation: mono-aparece var(--mono-t-fade) ease-out both; }`.

## 3. Anatomía común
- viewBox `0 0 80 80`; Appa `0 0 120 64`; igual en las 3 pieles.
- Apoyo en y=78, centrado x=40. Terrestres miran a +x; el flip es CSS (`--mira`).
- Sin width/height en svg: `.mono__fig{display:block;width:100%;height:auto;overflow:visible}`.
- Silueta por ánimo: estudia vertical (alto ≥72u, ancho ≤56u); recreo diagonal (ancho ≥72u); siesta ovillo (alto ≤52u, ancho ≥68u).

| Animal | --mira | Rasgo de identidad | Recreo |
|---|---|---|---|
| conejito | +1 | orejas largas `.mono__oreja` | brinco ≤19u |
| gatito | +1 | cola en S `.mono__cola`, `.mono__pata` | tranco y cola |
| cuy | +1 | cuerpo oval, sin cola, orejas caídas | saltitos ≤10px |
| caracol | -1 | concha (espiral-§ en Pluma); en siesta se mete | cuernos y avance |
| perrito | -1 | orejas caídas, `.mono__cola`, `.mono__lengua` | tranco, cola |
| ranita | -1 | ojos altos, patas traseras dobladas | pirueta |
| appa | +1 | bisonte, cola-timón `.mono__cola`, flecha `.mono__flecha` (calada en Timbre) | planeo con `.mono__ola` |

Appa: estudia recto, recreo diagonal, siesta recogido con zetas, sin taza.

| Clase | Pluma | Plumón | Timbre |
|---|---|---|---|
| `.mono__trazo` | stroke currentColor, `--mono-trazo-pluma`, fill none, round | igual, `--mono-trazo-plumon` | `display:none` |
| `.mono__macizo` | fill none + trazo, contorno abierto | fill `--papel` + trazo cerrado | fill currentColor, sin trazo, 2–3 `.mono__muesca` en `--mono-calado` |
| `.mono__calado` | línea fina interior | fill `--papel` | fill `--mono-calado` |
| `.mono__marca` | fill `--mono-marca`, desplazada (-1,5;+1,5)u, detrás | fill `--mono-marca` dentro del contorno ≥60% | `display:none` |
| `.mono__ojo` | punto r≈1,8 | punto r≈2,6 | punto `--mono-calado` |
| `.mono__parpadeo` | arco con trazo | arco con trazo | arco `--mono-calado` ancho 2,2 |
| `.mono__taza` | loza `--papel` con trazo | igual | masa currentColor, asa calada |
| `.mono__z` | text, fill currentColor, `--serif` itálica, opacity .8 | igual | igual |

Transversal: el destacador nunca es borde exterior; opacidad <1 solo en `.mono__z` (cumple reduced-transparency sin regla extra).

## 4. Layout CSS
```css
.mono { position:absolute; bottom:var(--mono-suelo); left:var(--c-ini); width:var(--c-ancho);
  height:var(--caja-ancho); pointer-events:none; user-select:none; }
.mono__paseo { position:absolute; left:0; bottom:0; width:100%;
  --x0: calc(var(--caja-ancho) * .09); --x1: calc(100% - var(--caja-ancho) * 1.09);
  transform: translateX(var(--x0)); }
.mono__voltea { width:var(--caja-ancho); transform:scaleX(var(--mira)); transition:transform var(--mono-t-reposo); }
.mono--appa { top:6px; bottom:auto; height:auto; --c-ini:2%; --c-ancho:96%; --mira:1; }
```
Carriles (`--c-ini` / `--c-ancho`, % de `.reloj__centro`): conejito 3/15, gatito 19/16, cuy 36/11, caracol 48/10, perrito 59/16, ranita 77/15. Margen 0,09×caja por lado para squash ≤1,18×; vecinos ≥9px a 912.

- **Patrulla (solo recreo):** `@keyframes mono-patrulla` con `translateX` entre `--x0` y `--x1`, paraditas 0 / 18–30 / 55–65 / 100%, `infinite alternate`, delay `--fase`. Duraciones: conejito 12s, gatito 20s, cuy 14s, caracol 60s, perrito 16s, ranita 18s, appa 40s. Sin `left`. Flip `mono-voltea` con `calc(var(--mira) * -1)` en la segunda mitad.
- **Estudia/siesta:** `.mono__paseo` en `animation-play-state: paused`; flip vuelve a `scaleX(var(--mira))`.
- **Estudia (≤2 animados):** `mono-respira` (`scaleY 1→1.03`, origen 50% 100%, `--mono-t-respira`) solo en gatito; Appa `mono-ola` ±3px 6s. Resto quieto.
- **Despertar:** transition transform/opacity `--mono-t-despertar`, delay `calc(var(--orden) * var(--mono-escalon))`.
- **Recreo:** brinquito único ≤`--mono-t-brinco`, luego patrulla + gesto en `.mono__fig`; `will-change: transform` solo aquí.
- **Siesta:** gestos `animation:none`, `transition: transform var(--mono-t-reposo)`; solo zetas animadas.
- **Topes de salto:** centrales ≤10px, laterales ≤19px.
- Appa: `--mono-ola` 3px en `max-height:820px`.
- Ancho: `(max-width:1100px)` escala .85; `(max-width:980px)` .72.
- Alto: ≤760 laterales a min(base,64px); ≤740 `display:none` en gatito/cuy/caracol/perrito; ≤700 `display:none` en todo `.mono`.
- Oculto: `.mono[data-oculto], .mono[data-oculto] * { animation-play-state: paused !important; }`.
- Reduced-motion (reemplaza el @media ~2292):
```css
@media (prefers-reduced-motion: reduce) {
  .mono, .mono * { animation: none !important; transition: none !important; }
  .mono__paseo { transform: translateX(calc((100% - var(--caja-ancho)) / 2)); }
}
```

## 5. CSS viejo (borrar de abajo hacia arriba; numeración de hoy)
- 2195–2290 `.mono__poof`, `.poof__chispa*`, `mono-destello`.
- 2292–2298 @media reduced-motion (se reescribe).
- 1947–1985 piel pixel.
- 1750–1945 `figura__*`, `.mono__acuarela|papel|neon|plastilina`, `.mono__figura`.
- 1721–1748 `--fig-*` y `.kw__*`.
- 1621–1710 reglas por dibujo viejo (`.gatito__*`, `.perrito__*`, `.conejito__oreja`, `.appa__cola`); reponer genéricas `.mono__pata/.mono__cola/.mono__oreja` con `transform-box:fill-box`.
- 1568–1620 piel tinta global (`.mono path|circle|…`) → sustituir por `.mono__fig--pluma|plumon|timbre`.
- 1407–1566 bloque por animal viejo (`--desde/--hasta`, `scale(1.3)`).
- 1987–2026 `mono-paseo`, `mono-paseo-pausado` (`mono-voltea` se reescribe).
- `.mono__nota`, `mono-parpadeo`, `mono-aleteo` si un grep no los usa.
- Reescribir 1358–1405.
- Conservar `.mono__ola`/`mono-ola`, keyframes de gesto (`mono-tranco`, `mono-brinquito`, `mono-pirueta`, `mono-pata`, `mono-planeo`, `mono-cola`, `mono-oreja`, `mono-timon`, `mono-z`), `.mono__z`.
- **No tocar** paisaje de Gino (~1021–1357).

## 6. Checklist del builder (A1–A9)
- [ ] A1 sin intersecciones (≥8px terrestres; rótulo, anillo, mandos, tiempos, cuenta +6px) en 3 instantes, reduced-motion y `hechos`=12.
- [ ] A2 centrales `top ≥ cuenta.bottom+6`; laterales por A1; Appa `top ≥ 58`, `bottom ≤ rótulo.top−10`.
- [ ] A3 `aria-hidden`, sin focusables, `pointer-events:none`; `elementFromPoint` en mandos devuelve el control.
- [ ] A4 estudia: ≤3px en 10s, ≤2 animaciones (gatito, Appa); recreo: desplazamiento >0 dentro del carril.
- [ ] A5 reduced-motion: `getAnimations()` vacío, 3 ánimos distintos en píxeles.
- [ ] A6 IoU ≤0,80 entre pieles a 32px en gris (reportar número).
- [ ] A7 3 pieles × 3 ánimos × 2 temas sin errores de consola; contraste ≥3:1.
- [ ] A8 sin rotación en foco; rota al pasar a pausa/siesta; persiste entre pestañas; sin fundido con `document.hidden`.
- [ ] A9 `npm run build`. Pendientes: tipografía macOS (zetas), rendimiento en Electron.
- [ ] Sin `scale(1.3)`, sin `left` en keyframes, sin `filter`/`box-shadow` en animados, sin color literal nuevo, sin width en svg. Español.

## 7. Por informar a Gino
Se eliminan pixel y las 4 pieles de superficie; en foco no pasean y son gris tinta; el caracol cruza menos; centrales se ocultan con alto ≤740px.
