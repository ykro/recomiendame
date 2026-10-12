# Recomiéndame

El código de Recomiéndame tal como queda al final de la práctica de la Unidad 2 del curso **Idea to App: crea tu idea con IA sin saber programar**.

Mariana quiere guardar los lugares que le recomiendan sus amigos y armar listas para decidir a dónde ir. En el video la construimos con AI Studio Build y Firebase: inicio de sesión con Google, lugares con reseñas, Quiero ir, listas compartidas por enlace con votos y una administradora que modera.

## Qué hay aquí

- Este repositorio se creó desde la pestaña GitHub de AI Studio durante la grabación. Cada commit es un envío que se ve en el video.
- `firestore.rules` son las reglas de seguridad que revisamos punto por punto en el video.
- `firebase-blueprint.json` es el mapa de los datos que AI Studio armó al activar Firebase.

## Verlo en vivo

https://recomiendame.ai.studio es la versión de demostración del curso. Se construyó con los mismos prompts, así que puede verse un poco distinta de la del video.

## Si quieres usarlo con tu propio Firebase

`firebase-applet-config.json` apunta al proyecto que se usó para grabar, que ya no está activo. Para probar el código:

1. Importa el repositorio a AI Studio (o ábrelo con tu agente de código) y activa Firebase en tu propio proyecto: eso reemplaza `firebase-applet-config.json`.
2. Cambia `tu-correo@gmail.com` por tu correo en `firestore.rules` (línea 28) y en `src/context/AuthContext.tsx` (línea 52). Esa es la cuenta administradora. En el video ahí iba el correo del instructor.
3. Despliega las reglas y abre la app.

## Lo que encontramos después de grabar

En el paso 36 AI Studio dijo que las reglas de las listas ya estaban cubiertas. No del todo: la regla para que la dueña actualice su lista no limita `memberIds`, así que la dueña sí puede agregar a otra persona a la lista. El punto 6 pedía que cada persona solo pudiera agregarse a sí misma. Lo dejamos como quedó en el video, a propósito: es el mejor ejemplo de por qué siempre pides la regla exacta y la pruebas tú.
