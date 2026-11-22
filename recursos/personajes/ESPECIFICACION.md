# Especificación de arte — personajes del Pomodoro

Piloto: **gatito**, estilos **pixel** y **caricatura**. Hoy los PNG son hojas GUÍA
(`node scripts/guias-personajes.mjs` las genera; llevan la marca `GUIA-NO-ES-ARTE`).
Para entregar arte real: **reemplaza el PNG con el mismo nombre y las mismas dimensiones**
y corre `node scripts/validar-personajes.mjs`. No hay que tocar código.

## 1. Reglas comunes (los dos estilos)

| Regla | Valor |
|---|---|
| Caja lógica | 128 × 128 unidades. La celda se escala a ella. |
| **Ancla** | x = 64, y = 120 (de 128) — en la celda pixel de 64 es **x = 32, y = 60**. Los pies/panza apoyada tocan ahí en **todo** cuadro **de todo** estilo (salvo `colgar` y los cuadros en el aire de `jugar`/`reaccion`). Es lo que impide saltos al transformar. |
| Caja segura | x 24–104, y 28–120 (pixel: x 12–52, y 14–60; Appa, que es ancho, x 2–62). El dibujo vive dentro; nada toca el borde de la celda (se recorta). Excepción: `poof`, que puede llegar a 6 px del borde. |
| **Agarre** | Sólo `colgar`: el punto por donde lo toman es x = 32, y = 8 de la celda de 64 (64, 16 de 128). El motor pone ese punto bajo el puntero y lo mece desde ahí. |
| Mira a | **+x (derecha)**. La app lo voltea con `scaleX(-1)`. |
| Formato | PNG RGBA 8 bits, **alfa recto (no premultiplicado)**, sRGB, sin entrelazado, fondo 100 % transparente. |
| Sombra | No se hornea sombra de suelo. |
| Hojas | Cuadros en orden de lectura (izq→der, arriba→abajo), sin separación ni margen entre celdas. |

## 2. Identidad del gatito (igual en ambos estilos)

Gato doméstico **sentado/de lado, compacto, sin raza**: cabeza grande (≈ 45 % de la altura),
cuerpo en pera, orejas triangulares altas, cola larga que sube en S, hocico corto.
Rasgos que **deben** sobrevivir al cambio de estilo (es lo que lo hace "el mismo"):
1. Proporción cabeza:cuerpo ≈ 1:1,2 y orejas altas.
2. Cola larga en S, con **punta clara**.
3. **Antifaz/mancha** oscura sobre un ojo (el izquierdo, el del espectador) y pecho claro.
4. Ojos ovalados grandes, separados; nariz triangular pequeña; 3 bigotes por lado.
5. Paleta de referencia: tinta `#2b3a8c`, crema `#fbf3d6`, rosa nariz/oreja `#f6c2d6`. El pixel usa
   máximo 8 colores de esa familia; la caricatura es **monocromática** (negros, blancos y grises; el rosa no existe).
6. Expresión base: serena y curiosa. Dormido: ojos como arcos. Caminar: ojos abiertos, boca cerrada.

## 3. Estilo `pixel` — retro 8-bit

- `celdaPx` **64**. Dibujado en 64 × 64 reales, sin antialias ni subpíxel, paleta ≤ 8 colores + transparente.
- Contorno de 1 px en tinta oscura; luz arriba-izquierda; sin degradados ni dithering.
- Se muestra a múltiplos enteros (el reproductor ajusta); `image-rendering: pixelated`.
- Siluetas más angulares (orejas de 2 px de punta, cola en escalones).

## 4. Estilo `caricatura` — años treinta, rubber hose

- `celdaPx` **256** (2× retina de la caja de 128). Dibujo vectorial rasterizado, antialias activo.
- Monocromo: negro `#16181d`, blanco `#ffffff`, grises. Trazo de contorno ≈ 6 px, **grosor constante**.
- **Rubber hose**: brazos, piernas y cola como tubos sin articulaciones, curvas en S; ojos de
  "pie-cut" (pupila con corte), guantes/patas redondas, cola con rebote. Squash & stretch marcado, sobrelapado.
- Textura de película (granulado) **no** se hornea.

## 5. Animaciones y archivos exactos

`n` = cuadros dibujados · `pasos` = entradas de reproducción (con `orden` se reusan dibujos). Duraciones en ms; **mandan los `manifiesto.json`**.

### pixel (`recursos/personajes/gatito/pixel/`, celda 64)

| Archivo | Tamaño | Cuadros / lectura |
|---|---|---|
| `reposo.png` | 192 × 128 (3×2) | 0 sentado 800 · 1 inhala 300 · 2 neutro 600 · 3 **parpadeo** 110 · 4 cola izq 400 · 5 cola der 400. Bucle. |
| `dormir.png` | 256 × 64 (4×1) | Hecho un ovillo. 0 exhala 700 · 1 medio 500 · 2 inhala 500 · 3 inhala+*z* 700. Orden 0,1,2,3,2,1. Bucle. |
| `caminar.png` | 256 × 128 (4×2) | Ciclo de 8: contacto, abajo, paso, arriba ×2 patas. 110 c/u. Bucle. Avanza en sitio. |
| `poof.png` | 256 × 128 (4×2) | Nube: 0-1 brota · **2 cubre todo** · 3 máxima · **4 se abre** · 5-7 se disipa. 60,60,60,90,90,70,70,80. Una pasada. |

### caricatura (`recursos/personajes/gatito/caricatura/`, celda 256)

| Archivo | Tamaño | Cuadros / lectura |
|---|---|---|
| `reposo.png` | 1024 × 768 (4×3) | Respiración con squash suave 0-4 (pausa larga en 0), 5 **pausa expresiva** 440, parpadeo en 6-10 anticipando, 11 vuelve 320. Cola siempre con *overlap*. Bucle. |
| `dormir.png` | 1024 × 512 (4×2) | Ovillo; ciclo de respiración de 8 con pausas largas (350) en reposo del pecho, *Z* que sube con *overshoot*. Bucle. |
| `caminar/caminar_00…11.png` | 256 × 256 c/u | Secuencia (no hoja): 12 cuadros; **0 y 6 son contacto** (100 ms), resto 80. Bote de cuerpo en S, cola en onda. Bucle. |
| `poof.png` | 1280 × 512 (5×2) | Nube de dibujo animado con "estrellitas": **3 cubre** · 4 máxima · **5 se abre** · 6-9 se disipa. Una pasada. |

### Transformación `poof`
Usa la nube del estilo **de destino**. En el cuadro `cubre` la nube tapa **por completo** el
silueta (cualquier estilo) para que el cambio de hoja no se vea; en `libera` el nuevo estilo reaparece
ya en su animación. Las marcas están en `manifiesto.json > animaciones.poof.marcas`.

## 6. Animaciones del juego (pixel, los 7 animales)

Contrato completo — personalidad de cada animal y tabla de juegos — en
`.ui-pipeline/05-monitos-juego.md`. Resumen de lo que afecta a los archivos:

- **Obligatorias**: `reposo`, `dormir`, `caminar` (bucle). **Opcionales**: `colgar` (bucle),
  `caer`, `jugar`, `reaccion` (una pasada) y `poof`. A un animal que aún no trae las opcionales
  el reproductor le muestra `reposo` en su lugar y el motor usa tiempos suplentes
  (`SUPLENTE_MS` en `src/personajes/tipos.ts`): nada se rompe, sólo no se ve el gesto.
- **Hojas nuevas: una sola fila**, celda 64 × 64 → ancho = 64 × cuadros, alto 64, y en el
  manifiesto `columnas = cuadros`. Las hojas heredadas de varias filas (gatito, perrito, conejito:
  `reposo` 3×2, `caminar` 4×2, `poof` 4×2) se siguen leyendo; el validador sólo avisa.
- `caminar` se dibuja **en sitio**: el motor mueve x, y a los que andan a saltos (conejito,
  ranita, cuy) les pone además el arco. Una vuelta de `caminar` es un salto: el motor toma de ahí
  el periodo y supone el animal en el aire entre el 25 % y el 85 % del ciclo.
- `colgar`: cuelga del punto de agarre (32, 8); no toca el suelo.
- `caer`: el aplaste al tocar suelo. `jugar`: anticipación + gesto, con `marcas.impacto` = paso en
  que la jugada "golpea" (ahí reacciona la víctima; sin marca, el motor supone el 60 %). El motor
  mueve x/y durante la jugada (el arco del salto), así que se dibuja en sitio. `reaccion`: el susto.
- Appa usa la misma celda cuadrada de 64 (caja segura x 2–62); vuela a la altura que le pone el motor.

### Ampliación: el gatito trepador (opcionales, hoy sólo `gatito/pixel`)

Mismas reglas de hoja (una fila, celda 64). Si faltan, el reproductor pone un suplente y nada se rompe.

| Nombre | Bucle | Qué es | Para el motor | Suplente si falta |
|---|---|---|---|---|
| `trepar` | sí | colgado del borde con las patas delanteras, las traseras escarban | **agarre x 32, y 6** (las patas): el motor pone ese punto en el borde de arriba del área | `colgar` → `reposo` |
| `voltereta` | sí | hecho bolita girando (4–6 cuadros = una vuelta), centro x 32, y 34 | se reproduce mientras cae; **el motor no rota el sprite** | `colgar` → `reposo` |
| `tendido` | no | cayó de espalda: jadea 2–3 veces, se da vuelta y se para; `fijo` = un cuadro acostado | dura lo que sus cuadros; al terminar pasa a `reposo` | `reposo` durante 2400 ms |

**Lomo.** El gatito se acuesta sobre otros animales. La altura del lomo de cada uno (sentado y
dormido, en fracción de la caja sobre el suelo) está en `RASGOS.lomo` de `src/personajes/motor.ts`.
El validador imprime una medida gruesa (`· lomo …`), pero a veces lo que mide es la cabeza o una
pata levantada: el valor de `RASGOS` se decide mirando las columnas del cuerpo en `reposo` cuadro 0
y en `dormir`, y se le resta ~0,03. Un animal que sentado no ofrece lomo (el perrito, de frente)
lleva `reposo: null` y despierto no sirve de cama.

### Ampliación: Appa baja en zigzag y despega (opcionales, hoy sólo `appa/pixel`)

Mismas reglas de hoja (una fila, celda 64; Appa usa x 2–62). Contrato en el §6 de
`.ui-pipeline/05-monitos-juego.md`. Dibujadas en `appa.aseprite`, una etiqueta por animación
(la capa oculta `piezas` guarda el torso, la cabeza y las patas sueltas con que se armaron).

| Nombre | Bucle | Qué es | Para el motor | Suplente si falta |
|---|---|---|---|---|
| `planear` | sí | 4 cuadros en picada, patas recogidas remando, cola arriba | se reproduce en cada barrido de la bajada; no se le pide suelo | `caminar` |
| `virar` | no | 5 cuadros: frena → tres cuartos → de frente → tres cuartos → picada | **marca `giro`** (el cuadro de frente): ahí el motor lo da vuelta | `planear` → `caminar`, 500 ms (giro a los 200) |
| `despertar` | no | 8 cuadros: abre un ojo, se incorpora, se estira, bosteza, de pie | en el suelo; al terminar pasa a `despegar` | `reposo` durante 1200 ms |
| `despegar` | no | 6 cuadros: se agacha, se agazapa a fondo, salta, ya vuela | **marca `impulso`**: ahí el motor lo lanza; desde ese cuadro va en el aire | `reposo` durante 700 ms (impulso a los 420) |

### La piedra del cuy (`recursos/objetos/piedra/`)

No es un personaje, pero sus hojas siguen las mismas reglas (celda 64, una fila por
animación, apoyo en y = 60, fondo transparente) y las pinta el mismo reproductor. Animaciones
`vacia`, `dentro`, `duerme` (bucle) y `entra`, `asoma`, `sale`, `toque`, `chillido` (una
pasada); `manifiesto.boca` = por dónde entra el cuy (x 41). Contrato en el §8 de
`.ui-pipeline/05-monitos-juego.md`. `validar-personajes.mjs` sólo recorre
`recursos/personajes/`: la piedra no pasa por él.

## 7. Qué comprueba `validar-personajes.mjs`
Nombres y dimensiones, RGBA 8 bits, n.º de duraciones = pasos, `orden`/`fijo`/marcas en rango,
`poof` de una pasada con `cubre < libera`; `colgar` bucle y `caer`/`jugar`/`reaccion` de una pasada,
en hojas de una fila, `impacto` en rango; y en arte real: fondo transparente, ningún píxel en el
borde de la celda, apoyo cerca de y = 120 (60 en pixel) — salvo `colgar`, que debe empezar cerca del
agarre, y `jugar`/`reaccion`, donde sólo se exige no pasarse del suelo. `trepar` (bucle) debe
llegar con las patas a y = 6, `voltereta` (bucle) no necesita suelo y `tendido` es de una pasada. Avisa (no falla) por las
opcionales que falten y por hojas heredadas de varias filas. De Appa: `planear` (bucle) y
`virar` no necesitan suelo; `virar`, `despertar` y `despegar` son de una pasada; las marcas
`giro` y `impulso` deben caer en rango (si faltan, avisa); en `despegar` sólo se exige suelo
hasta la marca `impulso`.

## 8. Pendientes
`estudiar`, `celebrar`, un tercer estilo (cuento pictórico); caricatura para los otros 6 animales.
