# 03 — Dirección elegida: «Útiles del escritorio»

Autor de las propuestas: ui-art-director. Decisión: orquestador (2026-11-12).

## Las tres propuestas
| | A «Glosa» (doodle de pluma al margen) | B «Timbre» (sello de goma notarial) | C «Glifo» (animal armado con tipos) |
|---|---|---|---|
| Idea | línea continua 2,4u abierta, sin relleno, perfil 3/4 | masa sólida geométrica, rasgos calados en `--papel` | piezas de letra: "(", "o", "^", "~", "§", "→" |
| Vínculo con el producto | mismo gesto que la regla del margen: anotar el Código a mano | el timbre de notaría: "timbrado y firmado" | ADN tipográfico New York |
| Identidad / legibilidad / ánimos / oscuro / costo / no-genérico / poca distracción | 5/3/4/4/3/5/5 = **29** | 4/5/4/3/5/4/3 = **28** | 4/2/3/2/2/5/4 = **22** |
| Riesgo principal | trazo frágil a 60px; si sale tieso parece ícono de línea | peso visual en foco; 7 bloques azules en recreo oscuro | finas de 1,5u desaparecen; "chiste de diseñador" que cansa |

Gate antígenérico: **pasa**. Las tres son específicas de Jarvis (instrumentos de la mesa de estudio de Derecho), vetan cachetes, brillos, degradados, glow y `filter`, y cuantifican el contraste.

## Elección: A como familia + B como tercera piel
Las tres pieles son instrumentos reales del escritorio de una estudiante de Derecho y se diferencian en **construcción de silueta**, no en filtro (lo que pide A6):

1. **Pluma**: contorno abierto de 2,4u, sin relleno, perfil 3/4, proporción casi real. `MonitosTinta.tsx` se reescribe como esta piel.
2. **Plumón**: contorno cerrado de 5,5u, frontal cabezón (cabeza ≈ cuerpo), patas cortas. En recreo el destacador rellena por dentro.
3. **Timbre**: masa sólida, sin contorno, rasgos y patas calados, 2–3 muescas de goma gastada.

C se descarta por legibilidad (rompe A6/A7) y costo. Queda como guiño la concha del caracol en espiral-§ en Pluma.

IoU esperado a 32px en gris (estimado; QA mide): pluma–timbre ~0,25, pluma–plumón ~0,35, plumón–timbre ~0,55–0,65.

## Reglas comunes (de la propuesta, aceptadas)
- **El color sigue al reloj** (`color` en `.mono[data-animo]`, pieles solo con `currentColor`):
  - estudia y siesta: `--tinta-suave` (6,7:1 claro, 8,1:1 oscuro).
  - recreo: `--azul` + destacador del animal. Único momento saturado: marca la pausa, como "PAUSA" en el reloj.
- **El destacador nunca es borde exterior** (rosa/verde oscuro dan 2,2–2,4:1): el contorno siempre es tinta; destacador ≥60% por dentro o detrás.
- **La pose cambia la silueta** (para reduced-motion y A5): estudia vertical (sentado mirando al centro), recreo diagonal (extremidades afuera), siesta horizontal baja (ovillo) + zetas `--serif` itálica + taza.
- **Marca por animal** (vecinos de carril no repiten): conejito rosa, gatito amarillo, cuy rosa, caracol verde, perrito amarillo, ranita verde, appa azul.
- **Sin colores nuevos**: solo alias en la sección Descanso (`--mono-tinta`, `--mono-marca`), resueltos por tema.
- **Destello de rotación**: fundido de opacidad de 700ms, sin trazo animado.

## Ajustes del orquestador
1. **Ternura obligatoria.** Es un regalo para Javiera: sin cachetes ni brillos no quiere decir frío. Proporciones amables (ojos de punto un poco grandes y separados, formas redondeadas, cola y orejas con gesto). Criterio de revisión: a 1:1 cada animal debe verse *simpático*, no un pictograma. Si Pluma sale tiesa, se corrige el dibujo; la dirección no cambia.
2. **Pixel y las cuatro pieles de superficie salen** (`MonitosPixel.tsx`, `MonitosFigura.tsx`), porque son justo el defecto diagnosticado. Se informa a Gino, porque el pixel venía de un commit suyo ("Animals in pomodoro"). Recuperable desde git.
3. **No hay cuarta piel ("Calco")** salvo que Gino la pida.
4. **Appa en timbre** no puede ser un bloque de 120px en el cielo, porque competiría con el reloj. Su caja se mantiene en ≤96 de ancho (contrato §2), con la flecha calada como firma.
5. **Interfaz**: `PIELES[estilo][animal](animo) => ReactNode` se mantiene, con `Estilo = 'pluma' | 'plumon' | 'timbre'`.

## Por confirmar con Gino en la entrega
- estudia en gris tinta (ya no azul) y el foco casi quieto (ya no pasean mientras estudia).
- Reducir de 6 a 3 pieles y sacar pixel.
