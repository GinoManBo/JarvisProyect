# Jarvis

App de escritorio para estudiar derecho. Hecha para Javiera.

Cuatro secciones: **Apuntes**, **Calendario**, **Descanso**, **Planificación**.

## Correrla en desarrollo

```bash
npm install
npm run dev      # abre la ventana de Electron con recarga en caliente
```

## Empaquetarla para macOS (desde Linux)

```bash
npm run build:mac
```

Deja dos archivos en `release/`:

- `Jarvis-1.0.0-arm64-mac.zip` — Macs con chip M1/M2/M3/M4
- `Jarvis-1.0.0-mac.zip` — Macs con Intel

Manda el que corresponda. La app **no está firmada con Apple**, así que la primera
vez macOS la bloquea. Para abrirla: descomprimir, arrastrar `Jarvis.app` a
Aplicaciones, y ahí **clic derecho → Abrir → Abrir**. Una sola vez; después se
abre con doble clic como cualquier app.

## Dónde quedan los datos

Todo vive en el Mac de ella, en texto plano, sin cuentas ni internet:

```
~/Library/Application Support/Jarvis/datos/
  ramos.json  notas.json  citas.json  flashcards.json  eventos.json  ajustes.json
```

El botón **Exportar** de la barra guarda una copia de todo en un solo `.json`.

## Qué hace cada sección

**Apuntes** — Tres pestañas.
- *Apuntes*: editor con negrita, títulos, listas, citas y cuatro subrayadores.
  Se agrupan por ramo y se buscan por texto o etiqueta. Guarda solo.
- *Citas*: artículos y fallos. La referencia (`Art. 1545 CC`) queda escrita al
  margen izquierdo, como en un código anotado. Se filtran por etiqueta.
- *Repaso*: tarjetas con repetición espaciada (SM-2). Marcar texto en un apunte
  y apretar *Hacer tarjeta* convierte la selección en pregunta.
  Atajos: `espacio` descubre, `1` difícil, `2` bien, `3` fácil.

**Calendario** — Mes completo, con las pruebas y entregas marcadas con el color
de su ramo. El 9 de noviembre está marcado aparte.

**Descanso** — Pomodoro con duraciones configurables y un título para saber en
qué estabas cuando suene. Avisa por notificación de macOS. Abajo, un guía de
respiración 4-7-8 para antes de una prueba.

**Planificación** — Donde se crean las pruebas, entregas y clases que aparecen en
el calendario, con cuenta regresiva. También se editan los ramos y sus colores.

`Cmd+1` … `Cmd+4` saltan entre secciones.
