# Terminal 3 — HEADLESS — cuy → appa

Lee y sigue `.ui-pipeline/pedidos/base-comun.md`. Primer llamado: `preflight mode="headless"`.
Uno terminado (exportado y guardado) antes de empezar el siguiente.

## cuy
Cuy (cobayo) redondito, sin cola visible, orejitas pétalo, tricolor: café `#a8673a` con
sombra `#7a4527`, crema `#f3d9a8`, y blanco común. Mancha blanca en la frente. Patitas cortas
casi escondidas. `caminar` = trotecito corto (el cuerpo se mece, las patas apenas asoman).
`dormir` = bolita aplastada. Reglas extra: `rules://53-small-creatures`.

## appa
Appa (bisonte volador de Avatar) en versión chibi: cuerpo blanco esponjoso, flecha café
`#8a5a3a` en la cabeza, cuernos cortos ocre `#e0a75a`, cola ancha de castor, 6 patitas cortas,
nariz rosa. Azul cielo `#9cc4ea` como color propio (sombra fría del pelaje y estrellitas).
Cabe en 64×64 (versión compacta, no apaisada). `reposo` = flota con un vaivén de 1 px (el apoyo
en y=60 no aplica: deja la panza en y≈54 y no lo muevas más de 1 px). `caminar` = vuela (patas
remando, cola ondulando). `dormir` = acostado en el suelo, apoyo y=60.
Reglas extra: `rules://50-quadrupeds`, `rules://52-birds-and-flight`, `rules://45-secondary-motion`.

## AVISO (agregado después) — la referencia de estilo cambió
Hasta las 13:30 de hoy `recursos/personajes/gatito/pixel/reposo.png` era una hoja GUÍA
(cuadros con números y cruces). **Ya no: ahora es el gato real terminado.** Si leíste la hoja
antes de esa hora, lo que tomaste como estilo es la guía y saldrá con nivel bajo. Antes de dibujar:
1. Vuelve a abrir ese `reposo.png` (puedes abrir el PNG en headless; el `.aseprite` NO, lo tiene abierta la terminal 1) y mira el cuadro 0 a escala 14.
2. Copia su lenguaje: sombra con hue-shift (lavanda `#d9d6ea` sobre el blanco; el tono propio también con luz/medio/sombra),
   ojos grandes de tinta con brillo de 1 px, rubor rosa de 2 px, nariz rosa de 3 px, cabeza ancha
   (~45 %) sobre cuerpo en pera, contorno 1 px, luz arriba-izquierda.
3. `poof` = copia exacta de `recursos/personajes/gatito/pixel/poof.png` (también ya es arte real).
4. `caminar` = saltitos reales (agacha → estira → 4–6 px en el aire → aterriza), no un vaivén.
5. `dormir`: la cabeza se funde con el cuerpo, sin contorno propio encima.
6. Pasa el cuadro clave por `aseprite:pixel-critic` ANTES de animar, y de nuevo antes de exportar.
