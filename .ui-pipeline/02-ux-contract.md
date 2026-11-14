# 02 — Contrato UX: los monitos (DESDE_CERO)

Autor: ui-ux-architect. Medido con Playwright headless contra vite :5199. Cada cifra va con su selector.
Afecta al dibujo y al orquestador; la lógica de Descanso no cambia.

## 1. Rol de la capa y zonas
Compañía periférica, decorativa, sin información propia (el estado lo dice el reloj).
`aria-hidden="true"` + `pointer-events:none` en `.mono`, `.nubes`, `.paisaje`, `.arboles`, `.estrellas`;
sin focusables. Contenedor: `.reloj__centro` (position:relative, padding 40px); nada sale de él.
Zetas, notas y chispas cuentan dentro de la caja de cada monito.

| Selector | 1440×900 | 1180×800 |
|---|---|---|
| `.reloj__centro` | 1172×848 en (0,52) | 912×748 en (0,52) |
| `.reloj__rotulo` ("¿En qué estás?") | x376-796, y198-231 | x246-666, y148-181 |
| `.anillo` | y253-563 | y203-513 |
| `.reloj__mandos` | y585-619 | y535-569 |
| `.tiempos` | x432-741, y640-720 | x302-611, y590-670 |
| `.reloj__cuenta` ("N bloques hoy") | y742-754 | y692-704 |
| `.paisaje` | y836-900 | y736-800 |
| `.panel` (fuera del contenedor) | x≥1172 | x≥912 |

- **Zona prohibida:** columna `centro±210px` (ancho de `.reloj__rotulo`), de `.reloj__rotulo.top` a `.reloj__cuenta.bottom`, +6px de margen.
  - `.reloj__cuenta` mide 0 de ancho con 0 bloques; con 12 tomates ~260px (estimado, sin medir): QA mide con `hechos`=12.
  - `.aviso-limite` (`role=alert`) desplaza el bloque central: fuera de QA, riesgo conocido.
- **Suelo:** y ≥ `.reloj__cuenta.bottom`+6 → y≥760 (140px) a 1440×900; y≥710 (90px) a 1180×800. Terrestres apoyados en `bottom:8px` sobre `.pasto` (22px).
- **Cielo (solo Appa):** y=58 a `.reloj__rotulo.top`−10 → 130px a 1440×900, 80px a 1180×800.
- **Defectos medidos hoy:**
  - Appa ocupa y58-143 + 16px de `mono-ola` (~159): supera el 148 del rótulo a 1180×800.
  - gatito, perrito y ranita se solapan (cajas ~73×77 pegadas en x467-583).
  - conejito (y671-754) invade `.reloj__cuenta` a 1180×800.
- **Ventana por defecto de Electron:** `electron/main.ts` abre 1180×780 (mín. 900×620). QA mide también 1180×780. Bajo ~760px de alto los terrestres bajan a ≤64px; bajo ~700px se ocultan.

## 2. Territorios (un carril por animal)
Cada terrestre patrulla solo su carril: sin solape por construcción. % de `.reloj__centro.width`.

| Animal | Carril | px a 1172 | px a 912 | Alto en reposo |
|---|---|---|---|---|
| conejito | 3-18% | 35-211 | 27-164 | 84-96 |
| gatito | 19-35% | 223-410 | 173-319 | 72-80 |
| cuy | 36-47% | 422-551 | 328-429 | 64-72 |
| caracol | 48-58% | 563-680 | 438-529 | 60-72 |
| perrito | 59-75% | 691-879 | 538-684 | 72-80 |
| ranita | 77-92% | 902-1078 | 702-839 | 72-84 |
| appa | cielo, todo el ancho | | | ≤96 (≤64 si alto ≤820) |

- Laterales (conejito, ranita) saltan hasta 19px: fuera de la columna prohibida, pueden ser más altos.
- Centrales topados por el suelo: alto en reposo + excursión de gesto ≤82px a 1180×800.
- Caja con squash/stretch (≤1.18×) cabe en su carril, ≥8px de aire entre vecinos.
- Caracol cruza menos pantalla que hoy (`--dur:480s`): aceptado, es el precio de no solapar.
- Quitar `scale(1.3)` de `.mono`: se dibuja al tamaño final.
- Orquestador fija tamaño por CSS (`--caja-ancho`); la piel solo aporta viewBox. Cambiar de piel no mueve la caja.
- **Reduced-motion hoy rompe esto:** `animation:none` deja a cada animal en `--desde` (3-14%), amontonados. `--desde` debe ser el centro de su carril (o posición de reposo explícita).

## 3. Máquina de estados (ánimo de `animoDe`)
`siesta` es estado inicial y el de cualquier pausa del reloj: es el que más se ve.

| | estudia (foco corriendo) | recreo (pausa corriendo) | siesta (reloj parado) |
|---|---|---|---|
| Pose | sentado/atento, mira al centro (carril izq. mira a la der. y viceversa), ojos abiertos | alegre, boca o patas en gesto | ojos cerrados, zetas, taza |
| Movimiento | solo micro: respiración ≤3px ciclo ≥4s, parpadeo escalonado. Sin paseo, brinco ni volteo. Appa casi quieto (±3px, 6s) | patrulla en carril, gracia propia (brinco, pirueta, cola, aleteo), Appa con ola, ritmo ~1.6× | ninguno salvo zetas (opacity/translateY) |
| Tope | ≤2 animados a la vez | libre dentro del carril | 0 |

- **siesta → estudia:** despertar ≤300ms (opacity/transform, escalonado 80ms).
- **estudia → recreo:** un brinquito único por animal ≤600ms, luego patrullan.
- **→ siesta:** gestos corporales a `animation:none` y vuelven a reposo en ≤400ms con `transition:transform`. No usar `animation-play-state:paused` en gestos (hoy deja a la ranita congelada a mitad de pirueta).
- **Destello de rotación:** nunca en `estudia`.
  - Si vence en foco, queda pendiente y se aplica al entrar en recreo o siesta (≥15 min desde el último cambio).
  - No se dispara con `document.hidden`; espera a `visibilitychange`.
  - 700ms, dentro de la caja del monito +12px.

## 4. Rotación de pieles
- **Cantidad:** 3 a 4 (hoy 6). Acuarela/papel/neón/plastilina comparten geometría y son indistinguibles en miniatura. La dirección artística decide cuáles.
- **Distinguibilidad:** dos pieles del mismo animal difieren en silueta o trazo (grosor de contorno, sin contorno, paso pixelado, proporción cabeza/cuerpo), no solo filtro o color. Criterio medible: A6.
- **Cadencia:** orden fijo, ≥15 min entre cambios, solo en pausa o siesta (~1 cambio por pomodoro).
- **Persistencia:** hoy `useState('acuarela')` y el intervalo se reinician al volver a Descanso: con pestañas cortas nunca rota. Subir `{estilo, ultimoCambio}` a variable de módulo (sin colección nueva), mismo criterio que `ProveedorReloj`.
- **reduced-motion:** cambio seco, sin destello, mismas reglas de oportunidad.
- **Interfaz:** se mantiene `PIELES[estilo][animal](animo) => ReactNode`. El ánimo es el único eje de variación del dibujo; carril, tamaño y gesto viven en CSS por `.mono--animal`. Invariantes nuevos sin tocar la firma:
  - misma proporción de viewBox por animal en todas las pieles;
  - la pose de cada ánimo sale del JSX (reduced-motion sigue distinguiendo los tres);
  - la piel no fija `width`.

## 5. Accesibilidad y rendimiento
- **reduced-motion:** `animation:none` (ya existe `@media`, ~línea 2292), poses quietas por ánimo, carriles centrados, sin destello. COULD: ajuste "Monitos quietos" en el panel (al instante), por WCAG 2.2.2.
- **reduced-transparency:** silueta no depende de alfa<1; rellenos opacos.
- **Contraste de silueta ≥3:1:** contorno o relleno contra `--papel`, pasto y río (`.rio__agua`, opacity .4) en claro y oscuro. Nada de neón saturado en oscuro.
- **Animación:** solo transform/opacity.
  - `left` en `@keyframes mono-paseo` es excepción heredada: migrar a translateX (`cqw`) o justificar.
  - Sin `filter` ni `box-shadow` en nodos animados.
  - `will-change` solo en recreo.
- **Pausa fuera de vista:** con `document.hidden`, `data-oculto` pausa animaciones y temporizador de rotación.
- **Paisaje de Gino:** `.rio__agua` anima `stroke-dashoffset` (repinta). Solo se informa; propuesta: pausarlo en `estudia`.

## 6. Criterios de aceptación (Playwright)
Herramienta: `.ui-pipeline/herramientas/captura-monitos.js`, a 1440×900, 1180×800 y 1180×780, con `hechos`=0 y 12.
- **A1** En cualquier ánimo, cajas de los 7 `.mono` no se intersectan (≥8px entre terrestres) ni intersectan `.reloj__rotulo`, `.anillo`, `.reloj__mandos`, `.tiempos`, `.reloj__cuenta` (+6px). En 3 instantes de patrulla y con `reducedMotion:'reduce'`.
- **A2** Terrestre: `bottom ≤ viewport` y `top ≥ .reloj__cuenta.bottom+6`, con excursión de gesto. Appa: `top ≥ 58` y `bottom ≤ .reloj__rotulo.top−10`.
- **A3** `elementFromPoint` en el centro de `.reloj__mandos .btn` y `.reloj__rotulo` devuelve el control, no un `.mono`. Cada `.mono` con `aria-hidden="true"` y sin focusables.
- **A4** En estudia, 10s simulados (`page.clock`): desplazamiento de cada caja ≤3px, ≤2 con animación activa. En recreo: desplazamiento horizontal >0, siempre dentro del carril.
- **A5** Con `reducedMotion:'reduce'`: `getAnimations()` solo zetas o nada; sin `.mono__poof`; capturas de los 3 ánimos de un mismo animal difieren en ≥X% de píxeles de su caja (X lo calibra el builder).
- **A6** Dos pieles del mismo animal, en gris a 32px de alto: IoU de silueta ≤0.80 (calibrable).
- **A7** Piel×ánimo×tema: captura existe, consola sin `console.error`/`pageerror`, contraste silueta/fondo ≥3:1 sobre papel, pasto y río (muestreo con monitos ocultos como referencia).
- **A8** Reloj en foco al vencer 15 min: ni destello ni cambio hasta pausa o siesta. Al cambiar de pestaña y volver, piel y plazo se conservan. Con `document.hidden`, sin destello.
- **A9** `npm run build` pasa. Pendiente declarado: tipografías de macOS y rendimiento real en Electron no se verifican en Linux.

## Nota del orquestador (contraste con brief)
- Coincide con S1/S2/S5/S6 del brief. Cambio de comportamiento relevante: **en foco dejan de pasear** (hoy pasean siempre). Se acepta por S6 y se informa a Gino en la entrega como decisión revisable.
- A4/A6 con umbrales calibrables: QA debe reportar el número medido, no solo pasa/falla.
- Supuestos a confirmar con Gino: pocas pieles pero distintas; foco casi quieto; Appa con menos ola en pantallas bajas.
