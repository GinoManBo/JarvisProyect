# Fondo del Descanso: montaña con momo — contrato arte ↔ código

Pedido (2026-11-15): "un fondo con mejor calidad: una montaña con un árbol estilo
japonés arriba — un duraznero (momo) con flores rosadas —, un pequeño río pasando
a un costado y peces koi que se vean".

Estado: **fases 1 y 2 hechas**: contrato, código y los diez PNG dibujados en Aseprite
(2026-11-15). Verificado en un Electron oculto contra `vite` en 5174: la app elige la
montaña, y se revisaron día / tarde / noche en tema claro y oscuro a 1180×780 y
1512×982. Si faltara un PNG, la app vuelve a la pradera por código (`Pradera.tsx`, intacta).
Pendiente: crítica independiente y QA formal del protocolo; movimiento reducido y
ventana mínima no se capturaron.

## 1. Composición

```
 cielo por código (bandas + dither, astro a la derecha, estrellas, nubes PNG)
        ✿✿✿                                              ☼ / ☾ (x = 84 %)
      ✿✿✿✿✿✿   momo en la cima, copa ancha hacia la derecha
       ✿✿|✿
      ___|__                      (centro: sólo cielo y bruma — ahí va el reloj)
     /  ~   \__
    /    ~     \___      cordillera lejana en bruma (mosaico)
   /      ~~       \________________________________________
 ~~~~~~~~~~~~~~~ ≈espuma≈ ~~~~~ arroyo: 30 px de agua, koi ~~~~~~~~~~~   orilla lejana
 ~~~~ ><(((º> ~~~~~~~~~~~~~~~~~~~~ <º)))>< ~~~~~~~~~~~~ ><(((º> ~~~~~
 ════════════════ pasto calmo, 42 px: aquí caminan los animales ═════   suelo
```

- **Montaña a la izquierda**, pegada al borde: cima-meseta hacia x≈60–100, ladera
  larga que baja hacia la derecha y muere en x≈208. A 1180×780 el anillo del reloj
  ocupa x≈162–294 (px del fondo): la ladera ahí ya va baja y el reloj queda sobre cielo.
- **Momo** en la meseta: tronco retorcido tipo bonsái inclinado a la derecha, copa
  en nubes de flor rosada. Es lo más saturado de la escena.
- **Río**: nace bajo el árbol, baja serpenteando por la ladera derecha (pintado en
  `montana.png`) y cae con espuma al **arroyo** que cruza todo el ancho, detrás del
  carril de los animales. Los koi nadan en el arroyo, vistos desde arriba.
- **Suelo**: los 42 px de abajo son pasto de bajo contraste (tres verdes vecinos,
  sin contornos de tinta, sin flores ni piedras bajo y=H−30): los animales (tinta
  `#2b3a8c` + crema) se leen encima. Los animales tapan a ratos la parte baja del
  arroyo; la franja alta del agua queda siempre libre sobre sus cabezas.

## 2. Resolución y escalado

- **1 px del fondo = 2 px CSS** (`px: 2`; antes 4). Los animales (celda 64 a ~1,9×)
  quedan con el mismo grano que el fondo. Si el área pasa de 1400 px CSS de ancho
  sube a 3 (`pxAncho`). Siempre entero, `image-rendering: pixelated`.
- No hay lienzo de tamaño fijo: el canvas mide `ceil(área / px)`. A 1180×780 son
  ≈ 456 × 350; maximizada en un MacBook ≈ 620 × 465.
- **Todo se ancla abajo** (`abajo` = px desde el borde inferior hasta la base de la
  capa) y la montaña además a la izquierda. El cielo se estira por código; `lejos`
  y `suelo` se repiten a lo ancho (deben ser **mosaico sin costura en x**).
- Altura que necesita el árbol entero: 316 px de fondo (632 px CSS). Más baja la
  ventana, se recorta la copa por arriba.
- Sin parallax (no hay cámara): la profundidad la dan la bruma y las nubes a la deriva.

## 3. Capas y archivos — `recursos/fondo/montana/`

Fuente: un `.aseprite` por hoja con el mismo nombre que su PNG (`montana.aseprite`
con capas roca/musgo/rio, `momo.aseprite` con tronco/copa y 2 cuadros, `koi.aseprite`
con la capa oculta `base` de donde se arma el ciclo…) + estos PNG RGBA. Las
medidas son exactas: el código **rechaza** el fondo si un PNG no mide lo pactado.

| Archivo | Hoja (px) | Celda | Cuadros | Posición | Qué es |
|---|---|---|---|---|---|
| `lejos.png` | 320 × 96 | 320×96 | 1 | mosaico x, `abajo` 76 | dos filas de cumbres en bruma (`lejosClaro`, `lejosMedio`), base maciza de `bruma`; transparente arriba |
| `suelo.png` | 128 × 80 | 128×80 | 1 | mosaico x, `abajo` 0 | filas 0–7 orilla lejana (pasto, juncos, alguna piedra); **filas 8–37 agua** opaca (`agua`, vetas `aguaHonda`); filas 38–79 pasto calmo |
| `montana.png` | 208 × 176 | — | 1 | x −24, `abajo` 68 | roca + musgo, meseta en (60–100, 24), río pintado bajando hasta (168,174); transparente fuera |
| `momo.png` | 224 × 96 | 112×96 | 2 | x 0, `abajo` 220 | el árbol; cuadro 0 quieto, cuadro 1 copa 1 px a la derecha (el tronco no se mueve). Pie del tronco en celda (56, 95) |
| `brillo.png` | 256 × 30 | 64×30 | 4 | mosaico x sobre el agua | destellos sueltos de `brillo` sobre transparente, que corren hacia la derecha; mosaico en x y bucle |
| `espuma.png` | 160 × 12 | 40×12 | 4 | x 126, `abajo` 62 | espuma donde el río cae al arroyo |
| `nubes.png` | 192 × 24 | 64×24 | 3 | por código | tres nubes distintas (`nube`, `nubeSombra`) |
| `petalos.png` | 24 × 6 | 6×6 | 4 | por código | un pétalo girando (`flor`, `florLuz`, `florSombra`) |
| `koi.png` | 192 × 48 | 32×16 | 6 × 3 filas | por código | nado visto desde arriba, **mirando a +x**; fila 0 kohaku (blanco + rojo), fila 1 sumi (tinta + naranja), fila 2 ogon (oro) |
| `koi-giro.png` | 96 × 48 | 32×16 | 3 × 3 filas | por código | media vuelta: arco, media vuelta cerrada, arco espejado (el código la espeja para la otra) |
| `manifiesto.json` | — | — | — | — | ya escrito: medidas, anclas, paletas, río, copa |

Tiempos (del código): ambiente a 8 fps (cuadro = 125 ms); brillo y espuma cambian
cada 250 ms; la copa alterna 0,0,1,1 cada segundo; koi 110 ms por cuadro de nado y
120 ms por cuadro de giro, repintado a 15 fps.

Anclas ajustables sin tocar código (en `manifiesto.json`): `capas.*.x/abajo`,
`rio.puntos` (polilínea del río en coordenadas de `montana.png`, por donde corren
los destellos), `copa` (rectángulo de la copa en la celda de `momo.png`, de donde
nacen los pétalos), `agua` (franja de agua), `koi.xMin/margen`.

## 4. Paleta (cerrada, 29 colores) y momentos

Los PNG se pintan **sólo con la columna Día**. El código recolorea por nombre
(cambio de paleta indexado, no un velo): estudia = día, recreo = tarde, siesta =
noche. Un color fuera de la columna Día no se recolorea (queda igual en los tres).
Comparte con los animales `#2b3a8c`, `#fffaf0`, `#f6c2d6`, `#f5c443`.

| Llave | Día | Tarde | Noche |
|---|---|---|---|
| tinta | `#2b3a8c` | `#3a3580` | `#1f2a6e` |
| bruma | `#eef1f8` | `#fbe3dc` | `#b9bfe6` |
| lejosClaro | `#cfd9ec` | `#e3bfd4` | `#8f99d0` |
| lejosMedio | `#b3c2de` | `#c9a3c8` | `#7985c0` |
| rocaLuz | `#9aa5cc` | `#b494bd` | `#6f7bb6` |
| roca | `#7b88b8` | `#9278ab` | `#57639f` |
| rocaSombra | `#5d6aa1` | `#6f5c95` | `#414b85` |
| musgoLuz | `#b4d6a6` | `#c2c592` | `#6f97ae` |
| musgo | `#8cbd8e` | `#9aab82` | `#56809c` |
| musgoSombra | `#679d78` | `#748c74` | `#426888` |
| tronco | `#7a5548` | `#74483f` | `#4d4a78` |
| troncoSombra | `#553b3f` | `#4f343c` | `#37345f` |
| florLuz | `#fde4ec` | `#ffe6e0` | `#f3e3f5` |
| flor | `#f6c2d6` | `#fbb9c4` | `#d9b3df` |
| florSombra | `#ea96b6` | `#ee8aa4` | `#b088c6` |
| florHonda | `#c96a94` | `#c45d86` | `#8566a8` |
| agua | `#a4cde8` | `#f0b4c4` | `#6f86c8` |
| aguaHonda | `#82b3da` | `#d394b8` | `#5a70b4` |
| brillo | `#eaf6fd` | `#fff1ea` | `#dfe4ff` |
| pastoLuz | `#bcdba8` | `#c4cc98` | `#7397b2` |
| pasto | `#a3cd98` | `#a9bd8c` | `#6387a6` |
| pastoSombra | `#88b889` | `#8ca781` | `#527598` |
| piedra | `#b8b2c6` | `#c2a9bd` | `#8088bb` |
| koiNaranja | `#f08a3c` | `#f2843a` | `#e58a5c` |
| koiRojo | `#d9552f` | `#d54e30` | `#c8605a` |
| koiBlanco | `#fffaf0` | `#fff3e4` | `#eeeaf6` |
| koiOro | `#f5c443` | `#f7bd45` | `#e6c06a` |
| nube | `#fffdf6` | `#fff0ee` | `#d9d6ea` |
| nubeSombra | `#e1e4f1` | `#f3c6d2` | `#b5b6dc` |

Cielo (por código, de arriba al horizonte):
día `#cfe0f2 #d9e6f4 #e6edf5 #f3eff0 #fbe9e4`, sol `#ffe17a`/`#f5c443`;
tarde `#cfb4dc #e0b6d6 #efbdd0 #f8cbc8 #fddcc4`, sol `#ffb870`/`#f29a5c`;
noche `#8f96d4 #9ca3db #aab0e3 #b8bdea #c8cbf1`, luna `#fffaf0`, estrellas `#fffaf0`,
luciérnagas `#ffe17a`.

Reglas de uso: `tinta` sólo en los koi (manchas sumi, ojo) — el paisaje no lleva
contorno de tinta, para no competir con los animales. El "negro" de los koi es `tinta`.

**Modo oscuro** (`data-tema='oscuro'`): por código, como la pradera. De **noche** cada
color se mezcla hacia `#0d1230`: 62 % el paisaje y el cielo; 35 % flores, koi, nubes y
`brillo` (siguen siendo lo que se mira; el brillo intacto se veía como rayas blancas); los
astros quedan intactos. De **día y de tarde** (desde la v5) se multiplica y luego se tiñe
(`oscuro.atenuar`, ver §15): conserva la saturación, y ahí el sol también baja.

## 5. Movimiento

- **Koi** (3): cada uno en su carril del arroyo, nada a impulsos (0,4–1× de 9–15 px/s),
  ondula ±1,5 px, da la vuelta al llegar a un borde o cuando se le antoja (cada 8–20 s)
  con `koi-giro`. Es lo único con estado.
- **Pétalos** (14): nacen en `copa`, caen 13–22 px/s con deriva a la derecha y
  vaivén, se posan en el suelo o el agua, pausa y vuelven. Función pura del tiempo.
- **Agua**: `brillo` en mosaico sobre los koi; 9 destellos de 1×2 px bajan por
  `rio.puntos`; `espuma` al pie.
- **Copa** del momo en dos poses; **nubes** a 1–2,6 px/s; estrellas que titilan;
  luciérnagas de noche sobre la orilla.
- `prefers-reduced-motion`: una estampa fija (sin intervalo de repintado; koi quietos,
  pétalos congelados en el aire). `document.hidden`: no se repinta.

## 6. Código

- `src/views/montanaArte.ts` — carga (`import.meta.glob`, PNG como data URL para
  poder leer píxeles bajo file://), validación de medidas, recoloreo por momento.
- `src/views/Montana.tsx` — compone y anima la escena.
- `src/views/Fondo.tsx` — elige: montaña si está completa, si no `Pradera`.
- `src/views/Monitos.tsx` — monta `<Fondo>` en vez de `<Pradera>` (única línea tocada).
- CSS: reutiliza `.pradera` / `.pradera__lienzo`, sin cambios.

## 7. Ajustes de la fase 2

- Montaña, momo y espuma corridos 24 px a la izquierda (la ladera chocaba con los
  mandos del reloj). La montaña sale 24 px del borde; la copa queda entera.
- `koi-giro` quedó en 3 cuadros (96 × 48), no 4.
- `brillo` baja en modo oscuro (ver §4).

## 8. Conocido / pendiente

- Los rótulos pequeños del reloj (ESTUDIO / DESCANSO, "min", "¿En qué estás?") caen
  sobre la bruma, la orilla y el agua y pierden contraste. Es de la maqueta del reloj,
  no del fondo: pide una placa de vidrio o subir los mandos.
- El giro del koi es delgado (lee como anguila en sus 360 ms).
- Sin crítica independiente ni QA de Playwright todavía; sin captura de movimiento reducido.

## 9. Más vida (2026-11-15, segundo pedido)

Pedido: "que se sienta más vivo, sigue muy vacío: detalles en el pasto, un puente, que
el sol destaque más, más nubes" + pilas de piedras apiladas (tsumi-ishi).

Todo lo nuevo es **opcional** (`extras` en el manifiesto): si un PNG falta o no mide lo
pactado, esa pieza no sale y la escena sigue. Hecho y dibujado en Aseprite; visto en
Electron oculto contra `vite` 5174 en día / tarde / noche, claro y oscuro, a 1180×780.

| Archivo | Hoja | Celda | Cuadros | Qué es / dónde va |
|---|---|---|---|---|
| `puente.png` | 96 × 48 | — | 1 | taiko-bashi bermellón, postes oscuros, remates dorados, estribos de piedra; `abajo` 46. Se arrima a la derecha de la placa del reloj: x = centro + `placaCss`/2 + `margen` |
| `toro.png` | 40 × 36 | 20×36 | 2 | farol de piedra: apagado (día) / encendido (tarde y noche); a `toro.dx` del puente, `abajo` 72 |
| `pilas.png` | 48 × 24 | 16×24 | 3 | pilas de 3, 4 (con musgo) y 6 piedras; lugares en `pilas.lugares` (orilla cercana izquierda, junto al farol, orilla cercana derecha) |
| `hierbas.png` | 192 × 32 | 16×16 | 12 × 2 filas | mata baja, mata alta, espiga, trébol, diente de león, pompón, flor rosa, flor blanca, piedra, piedras, juncos, hongo; fila 2 = puntas mecidas 1 px |
| `mariposas.png` | 32 × 24 | 8×8 | 4 × 3 filas | blanca, amarilla, rosa; 3 de día, 2 de tarde |
| `libelulas.png` | 24 × 16 | 12×8 | 2 × 2 filas | azul y roja; 2 de día y de tarde, sobre el agua |
| `aves.png` | 64 × 12 | 16×12 | 4 | una pareja cruza el cielo cada 40 s (14 s de cruce), no de noche |
| `nubes-lejos.png` | 192 × 12 | 48×12 | 4 | jirones lejanos, 6 en pantalla, 0,5–0,8 px/s cerca del horizonte |
| `nubes-grandes.png` | 224 × 40 | 112×40 | 2 | cúmulos grandes, 2 en pantalla, 3,1–3,6 px/s arriba |

Paleta: +4 llaves (33 en total) — `bermellon` `#d84a3a`/`#d9483e`/`#9a4a78`,
`bermellonLuz` `#f0705a`/`#f27a5e`/`#b8668e`, `bermellonSombra` `#a83342`/`#a2344a`/`#6f3566`,
`amarilloLuz` `#ffe17a`/`#ffd98a`/`#e8dca0` (día/tarde/noche).

Por código:
- **Sol de día**: `#ffd23f` con núcleo `#fff6c8` y borde `#ffab2e`, halo punteado en dos
  anillos que late cada medio segundo, ocho rayos que alternan largo/corto.
- **Sol de tarde**: radio 17, bajo (66 % del cielo), en tres bandas `#ffd27a` / `#ff9a4d` /
  `#f2663f`, con halo y una columna de reflejo que tiembla en el arroyo.
- **Luna** con halo ralo y reflejo fino. El reflejo existe también de día, como un hilo.
- **Cielo de día** más luminoso: `#a6d2f6 #b9dcf8 #cce6fa #dff0fb #f1f5f6`.
- **Hierbas** sembradas por casilla de x (cada 9 px) con hash fijo, en cuatro bandas:
  orilla lejana 55 %, orilla cercana 60 %, medio 22 %, pies 10 % (sólo mata baja y trébol).
  No cambian al redimensionar.
- Pétalos 14 → 20; luciérnagas 10 → 12; nubes medianas 4 → 5.

Conocido: mariposas y libélulas son muy chicas (8 y 12 px) y pasan casi inadvertidas;
el puente está de costado sobre un arroyo que corre a lo ancho (licencia de perspectiva);
a ventana mínima el puente se mete bajo la placa. No se corrió `npm run build` (la app
de desarrollo estaba abierta): sólo `npx tsc --noEmit`, limpio.

## 10. Día más claro y reflejos de arcoíris (2026-11-15, tercer pedido)

- **`pintado` ≠ `paleta.dia`.** Los PNG siguen pintados con los colores originales, que ahora
  viven en `pintado` (manifiesto v3); `paleta.dia` es libre y se aclaró sin repintar. Los
  `.aseprite` conservan la paleta de `pintado`. Tarde y noche no cambiaron.
- Día nuevo (antes → ahora): roca `#7b88b8`→`#a3b0dc`, rocaLuz `#9aa5cc`→`#c9cfec`,
  rocaSombra `#5d6aa1`→`#8394cc`, musgo `#8cbd8e`→`#9fd98f`, pasto `#a3cd98`→`#b4e49a`,
  pastoLuz `#bcdba8`→`#d2f0a8`, pastoSombra `#88b889`→`#96d18c`, agua `#a4cde8`→`#a9defa`,
  aguaHonda `#82b3da`→`#84c4f2`, lejosClaro `#cfd9ec`→`#d9e6f7`, lejosMedio `#b3c2de`→`#bdd2ef`,
  bruma `#eef1f8`→`#f6f9fd`, piedra `#b8b2c6`→`#cfcadb` (lista completa en el manifiesto).
- **Arcoíris, sólo de día** (`arcoiris` en el manifiesto: seis colores, alfa 0,30 en claro y
  0,14 en oscuro; desde la v5, 0,22 y 0,10), por código, semitransparente pero en la grilla: un arco de bandas de 2 px
  que nace tras la cordillera; cinco fantasmas de lente en fila del sol al arroyo, por la
  derecha del reloj; trazos de colores que bailan en el agua (un turno por segundo).
  Laten cada medio segundo; con movimiento reducido quedan fijos.

## 11. Koi que saltan y quedan varados (2026-11-15, cuarto pedido)

Estado: **hecho** (2026-11-16). `koi-salto.png` y `chapoteo.png` dibujados en Aseprite
(fuentes `koi-salto.aseprite`, `chapoteo.aseprite`). Visto en la app con los intervalos
acortados sólo para la prueba: un koi en el arco del salto y otro varado en la orilla, curvado.
Sin esos PNG no hay saltos y la escena sigue igual.

Arte (colores de `pintado`, los mismos tres koi que `koi.png`, de costado, mirando a +x;
«baja» y «panza arriba» son espejos verticales de «sube» y «plano»):

| Archivo | Hoja | Celda | Cuadros | Qué es |
|---|---|---|---|---|
| `koi-salto.png` | 144 × 48 | 24×16 | 6 × 3 filas | 0 sube (diagonal arriba), 1 arco (lomo arriba), 2 baja (diagonal abajo), 3 curva en C (puntas arriba), 4 plano, 5 panza arriba; filas kohaku / sumi / ogon |
| `chapoteo.png` | 120 × 12 | 24×12 | 5 | anillo, corona, gotas altas, gotas cayendo, onda; `brillo` y `agua` |

Comportamiento (`saltos` en el manifiesto, v4):
- Cada **9–20 s** salta un koi que vaya nadando (≈ 3–6 saltos por minuto; de noche el
  intervalo se duplica). Arco de 26 px de largo y 22 de alto en 900 ms, con chapoteo al
  salir y al entrar.
- **1 de cada 4** saltos cae en el borde de la orilla cercana. Ahí aletea 2,6–4,2 s
  (plano → curva → brinco → panza arriba…, 160 ms por pose) y vuelve al agua con otro arco
  de 650 ms y su chapoteo.
- Sólo salta un koi que no quede detrás de la placa del reloj (ni al salir ni al caer).
- Con movimiento reducido no hay saltos; con la ventana oculta no corre nada.

## 12. Sol que camina y sombras (2026-11-15, quinto pedido)

Todo por código, sin arte nuevo.

- **El astro sigue al bloque del pomodoro** (`progreso = 1 − restante/total`, leído con
  `useReloj()` en `Fondo.tsx` y pasado a `Montana`). Con el reloj detenido se queda donde va.
  - Día: x = 10 % → 90 % del ancho, altura = sen(π·(0,08 + 0,84·p)). Sale **por detrás de
    la montaña del momo** (tapado hasta p ≈ 0,1), pasa alto al medio y cae a la derecha.
  - Tarde: x = 74 % → 90 %, altura 0,42 → 0,12 (se hunde hacia la cordillera).
  - Noche: la luna va al revés, x = 90 % → 14 %, altura 0,35 + 0,6·sen(π·p); termina tras la montaña.
  - `ay = horizonte · (1 − 0,92·altura)`.
- **Sombras proyectadas**: la silueta de cada cosa (leída del alfa de su PNG) acostada sobre
  el suelo y el agua, hacia el lado contrario del astro y hacia el frente. Largo
  `6 + (1 − altura)·62` px (v5: `·50`) para una altura de 248 px (momo sobre el pie de la montaña); el
  sesgo lateral crece con la distancia horizontal al astro. Montaña + momo como una sola
  silueta; puente, farol y pilas ×2,4 para que se noten. Un solo tono (`tinta`) con alfa
  0,26 de día, 0,18 de tarde, 0,10 de noche (×0,7 en tema oscuro), sin difuminar.
  **v5:** el tono es `luz[momento].sombra` (un azul de cielo, no la tinta) y el alfa
  `luz[momento].alfaSombra` (0,20 / 0,16 / 0,10); ver §15.
- **Sombras de nubes**: una mancha escalonada por cada nube mediana o grande, en el suelo y
  el agua y otra sobre la ladera (recortada a la roca); avanzan con su nube. Alfa 0,10 de día,
  0,06 de tarde, nada de noche (v5: `luz[momento].alfaNube`, 0,08 / 0,05 / 0). Con movimiento reducido no se mueven (el tiempo está fijo).
- **Arcoíris y lente**: el arco se pone al lado contrario del sol y se nota más con el sol
  bajo; los fantasmas de lente van del sol hacia el lado opuesto y no se pintan los que
  caerían tras el disco o la placa, ni ninguno con el sol tapado. Tampoco hay reflejo en el
  agua con el sol tapado.
- **Luz publicada**: `publicarLuz({ x, altura, intensidad, tapada })` de `src/lib/sol.ts`,
  sólo cuando cambia. `x` = fracción del ancho del área; intensidad 1 de día, 0,65 de tarde,
  0,3 de noche, ×0,55 si el astro está tapado (v5: de `luz[momento].intensidad`, y en tema
  oscuro ×`oscuro.atenuar[momento].intensidad`, 0,75 de día y 0,7 de tarde).

## 13. Puente (2026-11-15, sexto pedido) — hecho el 2026-11-16

Problema: el puente estaba de costado a lo largo del arroyo; sus dos pies caían en el agua y
no unía las orillas. Decisión: **(a) girarlo** a tres cuartos, de la orilla cercana (pasto,
abajo) a la lejana (arriba).

| Archivo | Hoja | Posición | Qué es |
|---|---|---|---|
| `puente.png` | 72 × 72 | `abajo` 26, x = borde derecho de la placa + `margen` | estribo de piedra cercano en el pasto (filas 57–67), tablero bermellón que sube a la derecha, hace **lomo** (cresta hacia la fila 12) y baja a un estribo en la orilla lejana (filas 18–26); barandas a los dos lados con postes oscuros y cuatro remates dorados; viga y línea del arco por el costado derecho, dos pilares al agua y trazos de sombra en el agua |
| `sendero.png` | 48 × 20 | `abajo` 14, a `puente.sendero.dx` (−22) del puente | huella clara de pasto pisado con cuatro piedras, en diagonal hacia abajo a la izquierda; termina a 14 px del borde, sobre la franja de los animales |

- El farol va ahora a `toro.dx` 70 y la pila que cuelga del puente a x 92.
- Si a la derecha de la placa del reloj no cabe (ventana mínima), no se pinta ni el puente ni
  el sendero ni el farol ni esa pila.
- Sombra: sale de su silueta con el sistema de §12. Filo de luz: sigue sin llevarlo (§15: las
  barandas de 1 px quedarían blancas).
- El puente lateral anterior quedó respaldado fuera del repo (scratchpad `puente/`).

## 14. Monumentos de piedra (2026-11-15, séptimo pedido) — arte hecho el 2026-11-16

Pedido: sekihi, tōrō, komainu, jizō, torii de piedra y pagodas en el fondo.

Estado: **hecho** (2026-11-16). Los seis PNG están dibujados a mano en Aseprite con las
medidas de la tabla (fuentes `.aseprite` junto a cada uno), van en `extras` y sus lugares en
`monumentos.piezas`. Vistos en la escena a 1180×780 en día claro, tarde clara y noche oscura:
ninguno cae bajo el disco ni la placa ni en la franja de los animales, así que los lugares
quedaron como estaban. Sin su PNG una pieza no sale y la escena queda como antes.

Diferencias con la tabla: en `pagodas.png` los techos miden 10/12/12/14/16 px (no 10/11/12/14/16)
y la celda de tres pisos mide 12×26; el torii lleva shimenawa con dos shide; los komainu, a
10×14, se leen como estatua sobre pedestal más que como perro-león.

### Arte

Todo con los colores de **`pintado`** (la paleta de los demás `.aseprite`: el código
recolorea por llave para tarde, noche y tema oscuro, así que no hay llaves nuevas). Sin
contorno de `tinta`, como el resto del paisaje. **Luz desde arriba a la izquierda**, como
`toro.png`. Rampa de piedra: `nubeSombra` (borde iluminado izquierdo) → `piedra` (cuerpo) →
`roca` (lado derecho en sombra) → `rocaSombra` (bajo vigas, tallado, contacto). Musgo en
`musgoLuz` / `musgo` / `musgoSombra`. Cada celda se apoya en su **fila de abajo** (ahí van los
pies). Guardar `.aseprite` junto al PNG en `recursos/fondo/montana/`.

| Archivo | Hoja (px) | Celda | Cuadros × filas | Qué es |
|---|---|---|---|---|
| `torii.png` | 32 × 40 | 32×40 | 1 | Torii myōjin de **piedra gris, nunca bermellón**: kasagi (filas 0–3, puntas 1 px hacia arriba, fila 0 `nubeSombra`, 1–2 `piedra`, 3 `rocaSombra`, 2–3 px de musgo encima), shimaki (4–5, cols 2–29), gakuzuka (6–10, cols 14–17), nuki (11–13, asoma por fuera de los pilares), pilares de 4 px (cols 5–8 y 23–26, filas 6–35, se abren 1 px desde la fila 22), kamebara (36–39) y tres escalones entre los pilares (filas 31–39, cols 9–22). Opcional: shimenawa en `tronco` (filas 14–15) con dos shide de `nube`. Los `rocaSombra` y `roca` son los que lo separan de la roca clara de atrás: no quitarlos. |
| `komainu.png` | 20 × 14 | 10×14 | 2 | Perro-león sentado sobre pedestal (filas 10–13). Celda 0 "a": mira a +x, **boca abierta** (muesca 2×1 `rocaSombra`). Celda 1 "un": mira a −x (dibujado, no espejado), **boca cerrada** y un cuerno de 1 px. Melena con 2–3 rulos `roca`, cola de llama de 2–3 px. |
| `jizo.png` | 18 × 11 | 6×11 | 3 | Celda 0: cabeza rapada 4×4, **babero** triangular 6×3 en `bermellonLuz`/`bermellon`/`bermellonSombra`, túnica `piedra`/`roca`, manos de 1 px `nubeSombra`, base de loto `roca`/`musgoSombra`. Celda 1: igual con **kasa** de paja (`tronco`/`troncoSombra`, 6×2). Celda 2: jizō niño 4×8 apoyado abajo, con babero y un px de `musgo` en la cabeza. |
| `yukimi.png` | 32 × 14 | 16×14 | 2 | El **tōrō** de piedra (yukimi-dōrō): hōju (fila 0, cols 7–8), kasa ancha y baja (filas 1–4, de 5–10 a 0–15, puntas caídas en la fila 4), hibukuro (5–8, cols 5–10) con **ventana en cols 7–8, filas 6–7**: `rocaSombra` en la celda 0 (apagado, día) y **`amarilloLuz` en la celda 1** (encendido, tarde y noche), chūdai (fila 9) y tres patas (10–13) que se abren hacia fuera; la última fila queda dentro del agua. |
| `sekihi.png` | 8 × 14 | 8×14 | 1 | Estela: losa de cols 1–6 con la punta redondeada (fila 0 = cols 2–5), `nubeSombra` / `piedra` / `roca`; **inscripción** como una columna de trazos `rocaSombra` en la col 3 (filas 2, 4–5, 7, 9; nada de letras); base de dos escalones (filas 11–12); fila 13 = sombra de contacto `musgoSombra`/`rocaSombra`/`musgo` (no proyecta sombra por código). |
| `pagodas.png` | 32 × 80 | 16×40 | 2 × 2 filas | Siluetas lejanas con pocas llaves: techos `roca` con puntas de 1 px, alero `rocaSombra`, muros `lejosMedio` con columna izquierda `lejosClaro`, sōrin `rocaSombra` (1–2 px con anillos de 3 px), podio `roca`. Celda 0: **cinco pisos** (sōrin filas 0–8, 5 pisos de 5 filas, techos de 10/11/12/14/16 px, podio 37–39). Celda 1: **tres pisos**, ~12×26, centrada y apoyada abajo. Fila 0 apagada; **fila 1 igual con una ventana `amarilloLuz`** en unos 3 pisos (no todos). Si se ven demasiado cerca: `roca`→`lejosMedio` y `rocaSombra`→`roca`. |

### Dónde van (`monumentos.piezas`, W ≈ 456 a 1180×780)

- **Orilla lejana, al pie de la montaña** (`ancla: montana`, x en px de montana.png, pies a
  `abajo` 70): jizō ×3 (x 30, 37, 57) en el montículo de musgo; el **santuario** = komainu "a"
  (x 67), torii (x 79, sobre la grieta oscura, que se lee como sendero que sube) y komainu "un"
  (x 113); el yukimi (x 125, `abajo` 66) con las patas en el remanso de la cascada.
- **Cima** (`ancla: cima`): el sekihi en x 60, bajo el momo; los pies se ajustan solos a la
  silueta de la montaña (≈ `abajo` 221) y el momo, que se pinta después, lo cubre por arriba.
- **Cordillera lejana** (`ancla: lejos`, x en columnas de la tesela de 320 px, que se repite):
  pagoda de cinco pisos en la loma de la columna 88 (≈ x 408) y de tres en la 18 (≈ x 338) y
  la 228 (≈ x 548, sólo en ventanas anchas). Se apoyan en lo más bajo de la loma bajo su base y
  se hunden `hundir` 1 px. Las copias que caen a la izquierda quedan tras la montaña.
- Ninguna pieza se pinta bajo la placa o el disco del reloj (`libre`: fuera de
  W/2 ± (placaCss/2/px + `margen` 4)). Si un miembro del `grupo` "santuario" no cabe (ventana
  mínima), no sale ninguno: nunca un komainu suelto.

### Luz y sombras

- Proyectan sombra con el sistema de §12 (×2,4, como las pilas): jizō, komainu, torii y
  yukimi. El sekihi (bajo la copa) y las pagodas (lejos) no.
- Las piezas del pie y la cima llevan el filo de luz del costado que da al sol (§15), y la
  sombra de las nubes de la ladera les pasa por encima.
- El yukimi usa la celda encendida de tarde y de noche; las pagodas, la fila encendida. De
  tarde y de noche el yukimi tiene además un **resplandor tibio**: un rombo de 5 px en damero de
  `amarilloLuz` alrededor de la ventana (alfa 0,35 de noche, 0,22 de tarde, con un parpadeo
  leve a 8 cuadros) y un hilo de luz de 1×4 que tiembla en el agua bajo sus patas (alfa 0,3).

## 15. Luz del sol (2026-11-15, séptimo pedido)

Pedido: "la iluminación está muy oscura, no parece que hubiese sol; el sol brilla más que el
mapa". Causas: el paisaje era más oscuro que el cielo, el disco del sol era el punto más claro
de la escena y el arte está iluminado desde la izquierda mientras el sol camina a la derecha
(se leía a contraluz). Todo por código y manifiesto (v5), sin tocar un PNG ni `pintado`.

- **Paleta de día regraduada** (`paleta.dia`): roca cálida y clara (rocaLuz `#e8dfd2`, roca
  `#c4c6e2`, rocaSombra `#8f9dd3`, que sigue fría), musgo y pasto más soleados (musgoLuz
  `#e0f4a2`, pastoLuz `#e6f5a0`, pasto `#c2ea90`), agua más honda (`#8dd3f7` / `#5cb0ea`),
  piedra cálida `#ddd3c2`, tronco `#9a6a50`. Cielo de día más hondo
  (`#7cbdf1 → #dfeef8`): ahora el paisaje es más claro que el cielo. Tarde: rocaLuz `#d2aec4`
  (no `#e9c3c0`: con ese valor la cara a la sombra quedaba tan clara como la del sol), roca
  `#a98fb8`, pastoLuz `#dcd59a`. Noche igual.
- **Escalón** (`luz.escalon`, `lienzoIluminado`): en la cara de la montaña y del momo que da
  al sol cada llave sube un tono — roca→`rocaTibia`, rocaLuz→`rocaSol`, musgo→musgoLuz,
  musgoLuz→`musgoSol` (tonos sólo de código, en `luz[momento].tonos`). rocaSombra no sube:
  los pliegues conservan su hondura. La frontera entre las caras va, fila por fila, por la
  grieta `rocaSombra` más cercana a la cresta (`luz.cresta`: montaña 78, momo 65), así la
  costura se esconde en el pliegue; donde no hay grieta, por la cresta en damero. Con el sol
  recién asomando por la cumbre (a menos de 12 px de una columna de la silueta más alta que
  él) toda la cara va en damero; con el sol tapado, sin escalón. Sigue siendo un cambio de
  paleta por píxel: ningún degradado.
- **Filo de luz** (`filosDe`): 1 px sólido en `luz[momento].borde` en el costado que da al
  sol, más los bordes de arriba si el sol va alto (altura ≥ 0,35), y detrás una banda de
  `anchoBanda` px con alfa `alfaBanda` (día 3 px / 0,35; tarde 2 / 0,30). Montaña completa;
  momo sólo el costado, a 0,7; farol, pilas y monumentos sólo el costado. El puente no lleva
  filo (sus barandas de 1 px quedaban blancas enteras). El agua de la cascada no tiene filo.
  Con el sol tapado, sólo la cresta a ±28 px del sol en `halo` (contraluz). De noche, sólo el
  costado a 0,6, sin banda. Nunca bajo la placa del reloj ni en la franja de los animales
  (18 px de abajo).
- **Sol más chico**: radio 9 (antes 11), un solo anillo en damero (sin el anillo ralo),
  núcleo más ancho, rayos cortos en `halo` desde r+7. Colores más claros y menos saturados
  (astro `#ffe48a`, astroSombra `#ffc95a`, núcleo `#fffbea`, halo `#fff4d0`). En tema oscuro
  de día y de tarde, sin anillo ralo y rayos de 1 px.
- **Sombras**: tono `luz[momento].sombra` (día `#5571b4`, tarde `#5a4a96`, noche `#1f2a6e`),
  alfa `alfaSombra` 0,20 / 0,16 / 0,10 y nubes `alfaNube` 0,08 / 0,05 / 0. Largo
  `6 + (1 − altura)·50`.
- **Arcoíris** alfa 0,22 (oscuro 0,10). Los fantasmas de lente no se pintan en tema oscuro.
- **Tema oscuro** (`oscuro.atenuar`, día y tarde): cada color ×`k` y luego `t` hacia
  `#0d1230`; flores, koi, nubes y brillo con `kTenue`/`tTenue`, cielo con `kCielo`/`tCielo`,
  astros y filo con `kAstro`/`tAstro` (el sol ya no queda intacto: brillaba 5–6 veces más
  que el paisaje). Estrellas y luciérnagas intactas. La noche sigue con la mezcla del 62 %.
- **Luz publicada** (`sol.ts`, misma interfaz): intensidad de `luz[momento].intensidad`, ×0,55
  tapado, y en tema oscuro ×`atenuar[momento].intensidad`.

Medidas (lienzo nativo 456×364, luminancia relativa Y; antes → después): día claro media del
cuadro 0,688 → 0,637 (baja porque el cielo es más hondo: 0,72 → 0,59), roca 0,49 → 0,65, roca
del lado del sol 0,41 → 0,60, pasto 0,67 → 0,72, contraste sol/roca 1,56 → 1,19; día oscuro
media 0,128 → 0,173, sol/terreno 4,3–5,3 → 1,4–1,6, saturación del pasto 0,13 → 0,21; tarde
claro roca 0,26 → 0,39.

### 15.1 Ajustes tras la crítica (2026-11-16)

- **Las dos caras de la montaña se separan.** `rocaTibia` del día sube a `#f2e6d4`; nueva tabla
  `luz[momento].sombraLado` (día `rocaLuz → #d3cfdf`, tarde `→ #b9a1c4`): con el sol a la vista,
  la cara que le da la espalda baja su `rocaLuz` (pintado con luz desde la izquierda) a un tono frío.
- **Sol (y luna) tras una nube:** el disco se cuela en damero por la nube y el canto de la nube
  alrededor se enciende de 1 px (`astro` cerca, `luz.borde` más lejos). Sobre la placa del reloj el
  astro va pegado arriba (`r + 6`) para no tapar el título; la luna sube hasta altura 1.
- **Tapado** = 3 de 5 puntos del disco (centro y cuatro a medio radio), no un solo píxel.
- **Día + tema oscuro:** `oscuro.atenuar.dia.frio` mezcla la roca y la piedra 40 % hacia `#6d7aa8`
  después de atenuar (antes quedaba gris barro `#8b8682`). De noche en oscuro, `luz.borde` baja
  con `oscuro.tenue`.
- `musgoSol` del día `#d6f0a0` (antes lima); banda del filo `alfaBanda` 0,25 y `anchoBanda` 2.
- **Sombras en un lienzo de trabajo:** se pintan opacas y se componen una vez con su alfa, así dos
  sombras que se cruzan (jizō, komainu, torii) no se oscurecen al doble. La mancha de cada nube es
  su propia celda teñida (aplastada al 30 % en el suelo, al 90 % en la ladera, recortada a la roca),
  no una franja.
- Los lugares de los monumentos se calculan una vez por ancho, escala y momento.
