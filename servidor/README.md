# Servicio de avisos de Jarvis

Un programa pequeño que corre siempre en Railway. Guarda los eventos que le manda
Jarvis y los recuerda por Telegram, aunque el Mac esté apagado. También reenvía
el aviso del pomodoro y contesta `/start` y `/proximos` en el bot.

Node puro, sin dependencias ni base de datos: el estado es un `estado.json` en un
volumen de Railway.

## Deploy en Railway

1. **Crear el servicio.** New Project → Deploy from GitHub repo → este repo.
   En *Settings → Source*, **Root Directory = `servidor`**. (O, sin GitHub:
   `cd servidor && railway up`.)
2. **Volumen.** Click derecho en el servicio → *Attach volume*, montado en
   `/datos`. Sin volumen, cada deploy olvida a quién avisar y qué ya avisó.
3. **Dominio público.** *Settings → Networking → Generate Domain*. El servicio
   lo usa para registrar el webhook de Telegram al arrancar.
4. **Variables** (*Variables*):

   | Variable          | Qué es                                                                 |
   |-------------------|------------------------------------------------------------------------|
   | `TELEGRAM_TOKEN`  | El token que da @BotFather. Vive sólo acá.                             |
   | `CLAVE_JARVIS`    | Clave larga al azar (mín. 24 caracteres). La misma va en el `.env` de Jarvis como `AVISOS_CLAVE`. Generar con `openssl rand -hex 32`. |
   | `TELEGRAM_CHAT_ID`| Opcional. Fija el chat; si no, el primer `/start` lo vincula.          |
   | `HORA_AVISO`      | Opcional. Hora de Chile desde la que salen los recordatorios (def. 9). |

5. **Jarvis.** En el `.env` de la raíz del repo:

   ```
   AVISOS_URL=https://<el-dominio-de-railway>
   AVISOS_CLAVE=<la misma CLAVE_JARVIS>
   ```

   y `npm run build:mac`.
6. **Vincular.** Javiera abre el bot en Telegram y toca *Iniciar*. En Jarvis,
   Planificación → Telegram pasa a "Conectado".

Para comprobar que está vivo: `https://<dominio>/salud` responde `{"ok":true}`.

## Cómo decide

- Revisa cada 10 minutos, entre `HORA_AVISO` y las 23:00 **hora de Chile**
  (nunca la del servidor, que corre en UTC).
- Un evento con aviso tiene días de aviso (p. ej. "cada semana, el último mes"
  → 28, 21, 14, 7, 1 y 0 días antes). Si uno ya llegó y no se mandó, sale; si el
  servicio estuvo caído, el perdido sale una vez, no uno por día.
- Todo lo que toca el mismo día va en un solo mensaje.
- Cambiar la fecha o la frecuencia de un evento reinicia su cuenta.
- La tabla de frecuencias está repetida en `src/lib/avisos.ts` (`AVISOS`):
  cambiar las dos.

## Seguridad

- Todo endpoint salvo `/salud` y `/telegram` pide `Authorization: Bearer <CLAVE_JARVIS>`.
- `/telegram` sólo acepta lo que traiga el `secret_token` que se registró con el
  webhook (derivado de la clave).
- El bot sólo le contesta al chat vinculado.
- Si se filtra el `.app`: cambiar `CLAVE_JARVIS` en Railway y recompilar Jarvis.
  El token del bot no está en la app.
