# Monitos que juegan — contrato arte ↔ motor

Pedido (2026-11-14): rediseñar los 7 animales del pomodoro en Aseprite, que cada
uno camine y duerma distinto, que jueguen entre ellos (p. ej. el gato se lanza
sobre el perro) y que se puedan tomar y arrastrar con el mouse.
Paleta: se mantiene la de tinta (≤ 8 colores + transparente, familia `#2b3a8c`
tinta, `#fbf3d6` crema, `#f6c2d6` rosa). Todos los animales comparten la paleta.

## 1. Hojas (lo que entrega Aseprite)

- Carpeta: `recursos/personajes/<animal>/pixel/` con `<animal>.aseprite` (fuente,
  una etiqueta por animación) y un PNG por animación.
- Celda **64 × 64**. Cada PNG es **una sola fila**: ancho = 64 × cuadros, alto 64.
  En el manifiesto: `fuente: { tipo: 'hoja', archivo, columnas: cuadros, cuadros }`.
  (Excepción heredada: `poof.png` de gatito/perrito/conejito puede seguir 4×2.)
- **Ancla**: pies en **y = 60**, centro en **x = 32** (es 64,120 de la caja de 128).
  Caja segura x 12–52, y 14–60. Appa es ancho: puede usar x 2–62.
- Mira a **+x (derecha)**. Sin sombra horneada. Contorno 1 px de tinta, luz arriba-izq.,
  sin antialias, sin dithering.

## 2. Animaciones (nombres exactos — `NombreAnimacion`)

| Nombre | Bucle | Qué es | Notas para el motor |
|---|---|---|---|
| `reposo` | sí | quieto, respira, parpadea, gesto propio | estudia |
| `caminar` | sí | su forma de desplazarse, **en sitio** | el motor mueve x |
| `dormir` | sí | su forma de dormir | siesta |
| `colgar` | sí | lo tienen tomado con el mouse: patalea / cuelga | **punto de agarre = x 32, y 8**: el motor pone ese punto bajo el puntero |
| `caer` | no | aterriza: aplaste al tocar suelo y se recupera | se reproduce al tocar el suelo tras soltarlo o tras un salto |
| `jugar` | no | su jugada: la anticipación + el gesto | el motor puede mover x/y durante la jugada (arco del salto) |
| `reaccion` | no | le hicieron algo: susto / sorpresa | la víctima de un juego |
| `poof` | no | nube de cambio de estilo | marcas `cubre` < `libera` |

Duraciones por cuadro en ms en `duraciones`, variables a propósito (pausas expresivas).
`fijo` = paso a mostrar con "reducir movimiento".
Animaciones de una pasada: manifiesto con `marcas.impacto` (cuadro donde la jugada
"golpea": ahí reacciona la víctima) en `jugar`.

## 3. Personalidad (arte y motor la comparten)

| Animal | Caminar | Dormir | Jugar | Reacción | Colgar |
|---|---|---|---|---|---|
| gatito | sigiloso, cola en S | ovillo, cola sobre nariz | se agazapa, menea el trasero y **se abalanza** | erizado, cola esponjada | cuelga del pescuezo, laxo, cola balancea |
| perrito | trote alegre, orejas rebotan | panza arriba, patas al aire | **reverencia de juego** y salta, cola a mil | sorpresa → ladrido | patalea feliz, lengua afuera |
| conejito | **a saltos** | bolita, orejas planas | **binky** (salto con giro en el aire) | se para en dos patas, orejas tiesas | patas traseras pedalean |
| ranita | **salto en arco** largo | ojos cerrados, papada se infla | **lengüetazo** | brinco de susto | piernas largas colgando |
| caracol | se arrastra, antenas ondulan | dentro de la concha | estira antenas y "saluda" | **se esconde en la concha** | dentro de la concha, gira |
| cuy | correteo rápido y bajito | estirado plano | **popcorning** (saltitos verticales) | chillido, se estira | bolita que patalea |
| appa | vuela, 6 patas nadan en el aire, cola de castor | aterrizado, ovillo enorme | voltereta en el aire | bufido | flota (no le importa) |

## 4. Juegos (los decide el motor, sólo en `recreo`)

| Actor → objetivo | Juego |
|---|---|
| gatito → perrito | se acerca agazapado y **se lanza en arco** encima; perrito `reaccion` en `impacto` |
| perrito → conejito | lo persigue corriendo; conejito huye a saltos |
| conejito → cuy | binky al lado; cuy responde con popcorning (`jugar`) |
| ranita → caracol | salta por encima; caracol `reaccion` (se esconde) |
| cuy → gatito | popcorning frente al gato; gatito `reaccion` |
| appa → cualquiera | pasa volando bajo y da una voltereta; el de abajo `reaccion` |
| soltado encima de otro | el de abajo `reaccion` |

En `estudia` no hay juegos (no distraer): reposo con paseos cortos y lentos.
En `siesta` todos duermen. Arrastrar se puede siempre; al soltarlo cae con gravedad.
Con `prefers-reduced-motion`: sin juegos autónomos ni paseos; arrastrar sí.

## 5. Ampliación (2026-11-15): el gato trepador y el perro bicolor

Pedido: el gato salta y se agarra del borde del marco intentando escalar; se lanza
hacia abajo dando vueltas; cae de patas o de espalda; si cae de espalda queda
acostado descansando, tomando aire, y luego se para. Aleatoriamente se asusta con
el perro y se eriza. Juega subiéndose encima de otros animales y se acuesta a
dormir ahí. El perro cambia de colores: negro, café y un poco de gris.

### Animaciones nuevas (sólo gatito; opcionales en el tipo para los demás)

| Nombre | Bucle | Qué es | Notas para el motor |
|---|---|---|---|
| `trepar` | sí | colgado del borde con las patas delanteras, patas traseras escarbando, intenta subir | **punto de agarre = x 32, y 6** (las patas delanteras): el motor pone ese punto en el borde del marco |
| `voltereta` | sí | hecho bolita girando en el aire (4–6 cuadros = una vuelta) | centro de giro x 32, y 34; se reproduce mientras cae; el motor NO rota el sprite |
| `tendido` | no | cayó de espalda: acostado panza arriba/de lado, jadea (respira 2–3 veces), se da vuelta y se para; termina cerca de `reposo` | `fijo` = un cuadro acostado |

`caer` (de patas) ya existe. `reaccion` del gatito ya es el erizado.

### Comportamientos nuevos (motor)

- **Escalar el marco** (recreo, aleatorio, sólo gatito): corre, salta hacia el borde
  del marco, queda en `trepar` unos segundos (puede subir un poco y resbalar), se
  suelta y se lanza hacia abajo en `voltereta`; al tocar el suelo, al azar
  **~60 % cae de patas** (`caer` → `reposo`) o **~40 % de espalda** (`tendido` → `reposo`).
- **Susto con el perro** (recreo o estudia, aleatorio, raro): si el perrito pasa cerca
  o corre hacia él, el gatito hace `reaccion` (erizado) y se aleja.
- **Subirse encima a dormir** (recreo y sobre todo siesta): el gatito salta encima de
  otro animal quieto o dormido (perrito, cuy, appa aterrizado…) y se acuesta en
  `dormir` sobre su lomo; si el de abajo se mueve o lo arrastran, el gatito cae
  (`voltereta` corta → `caer`/`tendido`). Altura del lomo por animal en `RASGOS`.

### Perrito: nueva coloración

Negro + café (tipo "black and tan": cuerpo/lomo negro, cejas, hocico, pecho y patas
café), con un poco de gris (canas en el hocico o reflejos). La paleta compartida se
**amplía** con un negro cálido y un gris (aprobado por el usuario); el resto de la
paleta no cambia.

## 6. Ampliación (2026-11-15): Appa baja en zigzag, se estira y despega

Pedido: que Appa no baje a dormir en vertical sino dando vueltas, en zigzag; y que al
despertar se estire y después se prepare para saltar al cielo a volar de nuevo.

### Animaciones nuevas (sólo appa; opcionales en el tipo para los demás)

| Nombre | Bucle | Cuadros (ms) | Qué es | Notas para el motor |
|---|---|---|---|---|
| `planear` | sí | 4 (140, 110, 140, 110) | planea en picada: lomo inclinado con la nariz abajo, patas recogidas que reman, cola arriba de timón | se reproduce durante cada barrido de la bajada; en el aire, no se le pide suelo |
| `virar` | no | 5 (110, 90, 90, 90, 120) | el viraje: frena encabritado → tres cuartos → **de frente** → tres cuartos → entra otra vez en picada | **marca `giro` = 2** (el cuadro de frente, simétrico): ahí el motor le cambia `mira`, y el volteo no se nota. Empieza `giro` ms antes del extremo del barrido |
| `despertar` | no | 8 (320, 240, 160, 420, 380, 300, 170, 220) | abre un ojo, levanta la cabeza, se incorpora, **se estira** (grupa y cola arriba, patas delanteras al frente), **bosteza** ×2, se endereza, de pie | en el suelo, en sitio; `fijo` = de pie |
| `despegar` | no | 6 (150, 140, 280, 90, 110, 130) | mira al cielo, se agacha, **agazapado a fondo** (la pausa), **el impulso** (encabritado, patas estiradas), en el aire con las patas colgando, ya volando | **marca `impulso` = 3**: ahí el motor lo lanza hacia arriba. Desde ese cuadro se dibuja en el aire (el motor pone la altura) |

Suplentes si faltan: `planear` → `caminar`; `virar` → `planear`; `despertar` y `despegar` →
`reposo` con los tiempos de `SUPLENTE_MS` (`virar` 500, `giro` 200, `despertar` 1200,
`despegar` 700, `impulso` 420).

### Comportamientos (motor)

- **Bajada** (estado `bajar`). En la siesta Appa vuela hasta quedar sobre su sitio y de
  ahí baja como una hoja: `x = cx ± A·sen(π·t/P)`, con la amplitud `A` (hasta ~0,95 de
  su caja, sin salirse de las paredes) que se angosta a 0 al llegar; cae a ~110 px/s
  (con la caja de 128), entre 1,4 y 7,5 s en total, en barridos enteros de 1,1–1,9 s
  para terminar justo sobre su sitio. Se hunde al cruzar el centro y se frena en cada
  extremo, donde reproduce `virar` y se da vuelta en la marca. Al tocar suelo: `caer`
  (el aplaste) y de ahí directo a `dormir`.
- **Despertar y despegue** (estados `despertar` → `despegar`). Cada vez que Appa sale
  del sueño (siesta → estudia o recreo) reproduce `despertar` entero en el suelo, luego
  `despegar`: quieto hasta la marca `impulso` y de ahí sube rápido y frenando
  (`1 − (1 − u)³`, 650–1500 ms según la altura) hasta su altura de vuelo, avanzando un
  poco hacia donde mira. También despega así (sin estirarse) si lo dejan en el suelo
  con el puntero fuera de la siesta. Si vuelve la siesta antes del impulso, se ovilla
  otra vez; si lo toman, se corta.
- Con `prefers-reduced-motion`: no hay bajada ni despegue; pasa de volar a dormido (y
  al revés) de una vez, como antes.

## 7. Sombras (2026-11-15)

Cada animal (y la piedra) echa sombra en el suelo. Son dos elipses de píxel duro por
bulto (escalones con `clip-path`, sin desenfoque, color `--sombra-escena`), hermanas de
los `.mono` y pintadas antes que ellos: la **de contacto**, siempre bajo las patas, y la
**proyectada**, que se alarga y se corre al lado contrario de la luz que publica el fondo
en `src/lib/sol.ts` (`luz()` → `x`, `altura`, `intensidad`, `tapada`): larga con el sol
bajo, corta con el sol alto, opacidad según `intensidad`, más ancha y tenue si la montaña
tapa la luz. En el aire (saltos, lanzados, Appa volando o bajando) la sombra se queda en
el suelo, se encoge y se aclara con la altura, sin llegar a desaparecer. El que duerme
encima de otro y el cuy escondido no echan sombra. Las posiciones se escriben por refs
en el mismo bucle del motor; al cambiar la luz se repintan aunque todos duerman.

## 8. La piedra del cuy (2026-11-15)

Pedido: una piedra hecha en Aseprite, parte del mapa e interactiva: el cuy puede
esconderse adentro y la piedra cambia cuando está escondido; y que el mouse pueda
interactuar con ella.

No es un animal: vive en `recursos/objetos/piedra/` (`piedra.aseprite`, una hoja por
animación y `manifiesto.json`) con el **mismo formato de hojas** que los personajes
(celda 64, una fila, apoyo en y = 60, contorno de tinta). Colores de roca tomados de las
pilas de piedra del fondo. La boca queda en x = 41 de la celda (`manifiesto.boca`).

| Animación | Bucle | Cuadros | Qué es |
|---|---|---|---|
| `vacia` | sí | 2 | nadie adentro; la flor de arriba se mece |
| `entra` | no | 5 | el cuy se mete: la grupa y las patas en la boca, la piedra se ladea, quedan dos ojos |
| `dentro` | sí | 4 | ocupada: ojos que brillan en lo oscuro, respira, parpadea, asoma nariz y bigotes |
| `duerme` | sí | 3 | ocupada en la siesta: ojos cerrados y zetas |
| `asoma` | no | 5 | saca la cabeza, mira y se guarda |
| `sale` | no | 4 | sale de un salto; queda el polvo |
| `toque` | no | 4 | la tocaron vacía: se bambolea |
| `chillido` | no | 4 | la tocaron (o la levantaron, o cayó) con el cuy adentro: ojos enormes y «!» |

Motor (`mu.piedra`, `avanzarPiedra`): la piedra tiene x, altura y una maquinita
`vacia → entrando → ocupada ⇄ asomando → saliendo`, más `toque`. El cuy adentro queda en
estado `escondido` (no se pinta ni se puede tomar) y viaja con la piedra.

- **Por gusto** (recreo): cada 25–50 s el cuy corre a la boca y se mete; se queda 9–18 s
  asomándose cada 3–8 s y sale.
- **A dormir** (siesta): la mitad de las siestas se va a dormir adentro (`duerme`); al
  acabar la siesta despierta en su turno y sale.
- **Del susto**: si a menos de 2,5 cuerpos suyos alguien reacciona a una jugada o cae al
  suelo (lo soltaron, se cayó), corre a esconderse.
- **Lo sueltan encima**: arrastrar al cuy y soltarlo sobre la piedra lo mete.
- **Puntero**: pasar por encima hace que el cuy se asome; un **clic** la bambolea
  (`toque`) y, si el cuy está adentro, chilla (`chillido`), sale y hace su `reaccion`;
  **arrastrarla** la levanta (pesa: sigue al puntero con retraso y sale con menos
  impulso) y al soltarla cae con gravedad, con el cuy adentro si lo había.
- Con `prefers-reduced-motion`: nada autónomo (el cuy no entra ni sale solo); el clic y
  el roce siguen, como cambios de cuadro fijo.
- En ventanas bajas se esconde junto con el cuy (misma regla CSS); si tenía al cuy
  adentro, el cuy queda afuera.

## 9. Zonas del reloj (2026-11-16)

Appa se quedaba volando encima del rótulo «¿En qué estás?». Ahora la vista mide el
rótulo (`.reloj__rotulo`), el disco (`.anillo`) y la placa de mandos (`.reloj__placa`)
— en cada cambio de tamaño — y se los pasa al motor como **zonas** (`mu.zonas`), junto
con el lado real del dibujo de cada animal (`dibujo`: la hoja se pinta a un múltiplo
entero de 64 px dentro de una caja más grande, apoyada abajo).

- **Vuela por encima del rótulo**: la altura de crucero pone el lomo a 8 px del borde de
  arriba del área (la caja asoma sobre el borde: su mitad de arriba va vacía), y la
  silueta cabe entre la barra de navegación y el rótulo. Si en una ventana no cabe, el
  rótulo cuenta como zona a esa altura: no elige destinos ahí y lo cruza al triple.
- **No sube ni baja por delante del reloj**: si tiene que cambiar de altura y está en la
  columna de una zona, primero se corre de lado al borde libre y recién ahí sube o baja;
  y mientras cambia de altura no entra a la columna.
- **Bajada**: va al costado de la columna que le queda más cerca de su sitio, hace ahí
  el zigzag (el primer barrido hacia la pared) y sólo al final, ya por debajo de la
  placa, se desliza hasta su sitio.
- **Despegue**: con la placa encima, sale rasante de lado por debajo de ella y se
  dispara hacia arriba recién al costado.
- **Juegos**: la pasada rasante de Appa baja lo necesario para caber bajo la placa; el
  gatito no se cuelga del borde delante del rótulo (el sitio del salto se corre).
- Lo que el usuario arrastra y suelta cae por donde sea, también sobre el disco o la
  placa; Appa soltado ahí se corre solo al borde libre.
