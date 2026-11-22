# Jarvis

App de escritorio para estudiar derecho. Hecha para Javiera.

Cinco secciones: **Apuntes**, **Calendario**, **Descanso**, **Planificación**, **Malla**.

Se desarrolla y empaqueta en Linux; corre en macOS. Los avisos por Telegram pasan
por un pequeño servicio en Railway (`servidor/`).

---

## Setup completo, paso a paso

Hazlo en este orden: cada paso usa algo del anterior. Lo que dice **(una vez)**
no se repite en los builds siguientes.

### 1. Requisitos (una vez)

- **Node 20 o más nuevo** (`node -v`).
- **Una cuenta de Telegram**, para crear el bot.
- **Una cuenta de Railway** con saldo o plan activo.
- Este repo en GitHub (Railway despliega desde ahí). Alternativa: la CLI de
  Railway (`npm i -g @railway/cli`).

### 2. Instalar dependencias

```bash
npm install
```

Con eso ya puedes probar la app sin Telegram: `npm run dev`. En Planificación →
Telegram dirá "no están configurados"; es normal hasta el paso 6.

### 3. Crear el bot de Telegram (una vez)

1. En Telegram, abre el chat con **@BotFather**.
2. Mándale `/newbot`. Te pide un nombre visible (p. ej. *Jarvis*) y un usuario que
   termine en `bot` (p. ej. *jarvis_javiera_bot*).
3. Te responde con el **token**: `123456789:AAH…`. Guárdalo; lo usas en el paso 4.

> El token es la llave del bot. No lo pegues en chats, issues ni en el código.
> Si se filtra: @BotFather → `/revoke`, y actualizas la variable en Railway.

### 4. Desplegar el servicio en Railway (una vez)

1. **Nuevo proyecto**: *New Project → Deploy from GitHub repo →* este repo.
2. **Carpeta**: en el servicio, *Settings → Source → Root Directory* = `servidor`.
3. **Volumen**: click derecho en el servicio → *Attach volume*, montado en
   `/datos`. Sin volumen, cada deploy olvida a quién avisar.
4. **Dominio**: *Settings → Networking → Generate Domain*. Anota la URL
   (`https://algo.up.railway.app`).
5. **Variables** (*Variables*):

   | Variable         | Valor                                                                |
   |------------------|----------------------------------------------------------------------|
   | `TELEGRAM_TOKEN` | El token del paso 3.                                                 |
   | `CLAVE_JARVIS`   | Generada en **tu** terminal con `openssl rand -hex 32` (64 caracteres). Guárdala: va también en el paso 6. |
   | `HORA_AVISO`     | Opcional. Hora de Chile desde la que salen los recordatorios. Vacía = 9. |

   No crees `PORT`, `RAILWAY_VOLUME_MOUNT_PATH` ni `TELEGRAM_CHAT_ID`.
6. Railway redespliega solo al guardar variables.

**Comprobar:**
- `https://<tu-dominio>/salud` responde `{"ok":true}`.
- En *Deployments → Logs* aparece `Webhook en https://…/telegram (@tu_bot)`.

Detalles del servicio (cómo decide qué avisar, seguridad): `servidor/README.md`.

### 5. Vincular el bot con Javiera (una vez)

Desde **su** Telegram (el celular de ella), abre `t.me/<usuario_del_bot>` y toca
**Iniciar**. El bot responde *"Listo. Desde ahora Jarvis te avisa por acá…"*.

> El primer `/start` que reciba el bot es el que queda vinculado.

**Cambiar de cuenta** (p. ej. lo probaste con la tuya y ahora va la de ella):

1. Desde el chat vinculado, mándale `/desvincular` al bot. Sólo ese chat puede.
2. Ella abre `t.me/<usuario_del_bot>` y toca **Iniciar** (si ya había abierto el
   bot antes, que mande `/start`).
3. En Jarvis, Planificación → Telegram dice *Conectado … con <su nombre>*.

Entre el paso 1 y el 2 el bot acepta el primer `/start` que llegue: hazlos seguidos.

> **Un solo Jarvis por servicio.** Cada Jarvis abierto le manda *su* lista de
> eventos al servicio y reemplaza la anterior. Si ella ya usa la app, no corras
> `npm run dev` con el mismo `.env`: tus eventos de prueba pisarían los de ella
> (se corrige solo la próxima vez que ella abra la app o cambie un evento, pero
> mientras tanto le pueden llegar avisos tuyos). Para desarrollar, deja
> `AVISOS_URL` vacío o usa un segundo servicio.

### 6. Configurar Jarvis para hablar con el servicio

En la raíz del repo:

```bash
cp .env.example .env
```

y completa `.env`:

```
AVISOS_URL=https://<tu-dominio>.up.railway.app
AVISOS_CLAVE=<la misma CLAVE_JARVIS del paso 4>
```

`.env` está en `.gitignore`: nunca se sube. Estos valores quedan dentro del
proceso main de la app al compilar; el token del bot **no** va acá.

Prueba en desarrollo: `npm run dev` → Planificación → Telegram debe decir
**Conectado a @tu_bot** → **Mandar prueba** → llega el mensaje al celular.

### 7. Empaquetar para macOS (desde Linux)

```bash
npm run build:mac
```

Deja dos archivos en `release/`:

- `Jarvis-1.0.0-arm64-mac.zip` — Macs con chip M1/M2/M3/M4
- `Jarvis-1.0.0-mac.zip` — Macs con Intel

Repite este paso cada vez que cambie el código **o el `.env`**: la URL y la clave
se leen al compilar, no al abrir la app.

> El `.zip` lleva adentro `AVISOS_CLAVE`. Mándaselo sólo a ella. Si se filtra:
> cambia `CLAVE_JARVIS` en Railway, el `.env`, y vuelve a compilar.

### 8. Instalar en el Mac de ella

1. Descomprimir el `.zip` y arrastrar `Jarvis.app` a Aplicaciones.
2. La app **no está firmada con Apple**, así que la primera vez macOS la bloquea:
   **clic derecho → Abrir → Abrir**. Una sola vez; después abre con doble clic.
3. Planificación → Telegram → **Mandar prueba**.

Al abrirla, Jarvis le manda al servicio todos los eventos que vienen. Desde ahí
los recordatorios llegan aunque el Mac esté apagado.

### Si algo no funciona

| Síntoma | Causa probable |
|---|---|
| El deploy en Railway falla al arrancar | Falta `TELEGRAM_TOKEN` o `CLAVE_JARVIS`, o la clave tiene menos de 24 caracteres. Mira los logs. |
| `/salud` no responde | No generaste el dominio, o el deploy falló. |
| El bot no contesta `/start` | El servicio arrancó sin dominio: genera uno y redespliega. Busca `Webhook en …` en los logs. |
| Jarvis dice "no están configurados" | `.env` vacío o compilaste antes de llenarlo. Recompila. |
| Jarvis dice "no se pudo hablar con el servicio" | Sin internet, URL mal escrita en `.env`, o `AVISOS_CLAVE` distinta de `CLAVE_JARVIS`. |
| Dice "Falta un paso: abre t.me/…" | Nadie ha hecho `/start` todavía (paso 5). |
| No llegan recordatorios | El evento no tiene aviso (selector en Planificación), o es antes de `HORA_AVISO` / después de las 23:00. |

---

## Qué avisa por Telegram

- **Pomodoro**: al terminar un bloque de estudio, *"Terminaste … Ahora toca
  descansar N minutos"*. Sólo con Jarvis abierto (es cuando se estudia).
- **Eventos**: cada evento de Planificación puede tener aviso — el día antes,
  cada día la última semana, cada 2 días las últimas 2 semanas, o cada semana el
  último mes (siempre también la víspera y el mismo día). Los manda el servicio,
  entre las 9:00 y las 23:00 hora de Chile, aunque el Mac esté apagado.
- **`/proximos`** en el bot lista lo que viene; **`/desvincular`** suelta el chat.

El servicio guarda sólo los eventos futuros (título, fecha, tipo, ramo). Los
apuntes y todo lo demás no salen del Mac.

## Dónde quedan los datos

En el Mac de ella, en texto plano, sin cuentas:

```
~/Library/Application Support/Jarvis/datos/
  ramos.json  notas.json  citas.json  flashcards.json  eventos.json  ajustes.json  malla.json
```

El botón **Exportar** de la barra guarda una copia de todo en un solo `.json`.

## Qué hace cada sección

**Apuntes** — Tres pestañas.
- *Apuntes*: editor con negrita, títulos, listas, citas y cuatro subrayadores.
  Se agrupan por ramo y se buscan por texto o etiqueta. Guarda solo.
- *Código*: buscador de los nueve códigos chilenos, por número de artículo o por
  palabras. Funciona sin internet.
- *Repaso*: tarjetas por ramo. *¡Comenzar!* las baraja y las muestra una por una.
  Marcar texto en un apunte y apretar *Hacer tarjeta* convierte la selección en
  pregunta. Atajos: `espacio` descubre, `enter` pasa a la siguiente.

**Calendario** — Mes completo, con las pruebas y entregas marcadas con el color
de su ramo. El 9 de noviembre está marcado aparte.

**Descanso** — Pomodoro con duraciones configurables y un título para saber en
qué estabas cuando suene. Avisa por notificación de macOS y por Telegram. Abajo,
siete monitos que estudian en el foco, juegan en la pausa y se pueden agarrar.

**Planificación** — Donde se crean las pruebas, entregas y clases que aparecen en
el calendario, con cuenta regresiva y su aviso por Telegram. También se editan los
ramos y sus colores, y se ve el estado del bot.

**Malla** — Los ramos de la carrera por semestre: aprobados, en curso y pendientes.

`Cmd+1` … `Cmd+5` saltan entre secciones.
