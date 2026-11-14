# Especificación de arte — personajes del Pomodoro

Piloto: **gatito**, estilos **pixel** y **caricatura**. Hoy los PNG son hojas GUÍA
(`node scripts/guias-personajes.mjs` las genera; llevan la marca `GUIA-NO-ES-ARTE`).
Para entregar arte real: **reemplaza el PNG con el mismo nombre y las mismas dimensiones**
y corre `node scripts/validar-personajes.mjs`. No hay que tocar código.

## 1. Reglas comunes (los dos estilos)

| Regla | Valor |
|---|---|
| Caja lógica | 128 × 128 unidades. La celda se escala a ella. |
| **Ancla** | x = 64, y = 120 (de 128). Los pies/panza apoyada tocan y = 120 en **todo** cuadro **de todo** estilo. Es lo que impide saltos al transformar. |
| Caja segura | x 24–104, y 28–120. El dibujo vive dentro; nada toca el borde de la celda (se recorta). Excepción: `poof`, que puede llegar a 6 px del borde. |
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

## 6. Qué comprueba `validar-personajes.mjs`
Nombres y dimensiones, RGBA 8 bits, n.º de duraciones = pasos, `orden`/`fijo`/marcas en rango,
`poof` de una pasada con `cubre < libera`; y en arte real: fondo transparente, ningún píxel en el
borde de la celda, y apoyo cerca de y = 120.

## 7. Pendientes (fuera del piloto)
`estudiar`, `celebrar`, otros 6 animales, `appa` (apaisado 120×64: necesitará otra caja), un tercer estilo (cuento pictórico).
