# Smoke tests — Prompt 3/4 (semáforo y etiquetas de etapa)

Export probado: v1.9.0 (2026-10-05). Base: Producción (`appSQk87nF0WpH2gi`).
Estado: pruebas 1, 2, 3 y 6 cerradas (capturas de Axel en tema oscuro); las pruebas 4 y 5 quedan abiertas por el cambio a chip; pruebas 7 a 13 con confirmación parcial; el resto pendiente. Fecha de hoy en las pruebas: lunes 5 oct 2026.

Pending items
1. Key message: En la columna "Etapa" de la tabla Elementos y en el encabezado del detalle del elemento, la etapa debe ser una etiqueta (chip) con el color del semáforo, no punto con texto.
   Argument: Axel lo pidió al probar 4, 5 y 7 y es consistente con la etiqueta de la lista del Día.
   Supporting data: `PedidoDetailModal.tsx:349-352`, `ElementoDetalle.tsx:71-78`; va al Prompt de corrección.
2. Key message: Corre las pruebas 1 a 20 y marca el Estado; solo las pruebas 19 y 20 escriben datos, y solo en [4161] Efrain Dl Angel.
   Argument: Los colores rojo, naranja, amarillo y verde lima solo se ven con tareas Terminado. Claude ya las creó en 5 pedidos, así que solo falta verlos en pantalla.
   Supporting data: 15 tareas creadas (ver "Datos de arranque") y [4161] (`recpD5i15hQsj0PSl`) sin tareas para el recálculo en vivo.
3. Key message: Avisa a Claude al terminar para borrar las 15 tareas de arranque (y las de las pruebas 19 y 20 si no las borras tú).
   Argument: Dejan los pedidos con tareas que no existían y la tabla pasó de 14 a 29 registros.
   Supporting data: estado final esperado: 14 tareas en `tareas_produccion` (`tblESlAFi4WqHlJtk`).
4. Key message: Las pruebas de tema claro y oscuro quedan para la aplicación final (decisión de Axel); el mapa de colores se verificó por código.
   Argument: Los colores salen de un solo mapa con valores claro y oscuro.
   Supporting data: `produccion/semaforo.ts:27-34`, `components/airtableColors.ts`.

Reglas
- Cada prueba nombra el pedido y la fecha de calendario donde abrirlo; el pedido es el de la sección.
- Las pruebas 1 a 18 solo abren pantallas. Cierra los pop-ups con clic en el área oscura, sin pulsar "No" ni "Sí".
- Las pruebas 19 y 20 escriben en Producción y corren solo en [4161] Efrain Dl Angel (`recpD5i15hQsj0PSl`), que tiene un solo elemento (así el color del pedido sí cambia).
- Selector de vista en Pedidos (arriba): Día, Semana, Mes. "Lista del Día" = tabla de la vista Día (columnas Pedido, Estatus, Etapa…). "Tarjeta del Día" = tarjetas sobre esa tabla.
- El filtro de estatus (junto a las flechas de fecha) viene en "Pendiente". Para las pruebas 14 a 17 elige también "Entregado".
- "Pop-up del pedido" = ventana que se abre al hacer clic en un pedido en Pedidos. "Detalle del elemento" = segundo pop-up que se abre al hacer clic en una fila de la tabla Elementos.
- Colores del semáforo (un solo mapa, paleta de Airtable): No iniciado `purple`, Horneado listo `red`, Embetunado o Glaseado listo `orange`, Decorado listo `yellow`, Empacado listo `greenLight1`, Entregado `green`.
- Ya verificado por Claude, sin prueba manual: no existe ningún campo de fórmula, rollup ni calculado nuevo para el semáforo (11 tablas, sin cambios) y el cálculo vive en una sola función (`semaforo.ts:62-80`). Tema claro y oscuro: omitido, se deja para la aplicación final.

Datos de arranque creados por Claude en Airtable (autorizado por Axel): 15 tareas en `tareas_produccion`, todas Terminado, cantidad completada = asignada, Origen Manual, sin empleado ni fechas (no salen en el tablero de Producción).
- [4152] Luisa Fernanda (`recQn00xkwSusqXk1`), Pastel 10 pax (`rec8lGkJ7fe5O27j0`): Horneado `recrEBnNocx5zit9G`.
- [4120] Yami aguillon (`recvBRPY8mGxx4Jwu`), Pastel 10 pax (`recWkvFQys1wObKSD`): Horneado `rec0RJ2n5FnVQNcZb`, Embetunado `reczJNoa7pvG1ya2t`.
- [4162] Silvia LC (`rec6CfqDdQE6OsZHI`), Galletas 60 (`recnVJ37t1pJ50jeS`): Horneado `recnrUUUThKIlVEu2`, Glaseado `rec2Mzcbd2HCmwy9O`.
- [4159] MARIA TERESA MERLOZ (`recfrBAAB0z7jRot4`), Pastel 20 pax (`recuMgPqdBJnNemg2`): Horneado `rec4cTgdQJ8IDWjZU`, Embetunado `recx58rzi3Wbvef7v`, Decorado `recL8bxqUf8PsEaT4`.
- [4084] Xitlali de la rosa (`recZrcshhUS9QhoV6`), Pastel 5 pax (`rec4RvL8VNoH3bQ0Z`): Horneado `recEE9Rhox60kNs0B`, Embetunado `rec5eTOqdCZgJTCjk`, Decorado `recUpym5rsNWwSa0i`, Empacado `recWQHkxh5CEAXiKK`.
- [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`), Pastel 20 pax (`recscT1PSK1PEkfU1`): Horneado `rec9hTvx9o6h1G2TO`, Embetunado `recKFgMGso71HrKvp`, Decorado `recGGBUcZSsJ4wnPG`. Sus Cupcakes (`recdPnErWZjQiJTmP`) siguen sin tareas.

## [4128] Sara (`recZCPIvYm7J76UX1`) — abrir el 1 oct 2026 en Pedidos

Pendiente; elemento Galletas x10 con 4 tareas, todas Pendiente.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 4 | Vista "Día", 1 oct: haz clic en [4128] Sara para abrir su pop-up y revisa la tabla Elementos y la sección "Producción". | La fila Galletas tiene la columna "Etapa" con una etiqueta (chip) morada "No iniciado", igual que la de la lista del Día (no punto con texto). La línea "Etapa actual del elemento más atrasado: Horneado · Galletas" lleva un punto morado antes del texto. | OK (hoy; el expected final llega con la corrección). Captura 6: la columna "Etapa" muestra punto morado + texto y la línea muestra punto morado con "Horneado" en naranja de Producción (C4); Axel pide chip en la columna |
| 5 | En el pop-up de [4128] Sara haz clic en la fila "Galletas" y mira el encabezado del detalle del elemento. | Junto al título "Galletas" aparece una etiqueta (chip) morada "No iniciado" (no punto con texto). | OK (hoy; el expected final llega con la corrección). Captura 7: punto morado + texto; Axel pide chip |

## [4152] Luisa Fernanda (`recQn00xkwSusqXk1`) — abrir el 27 oct 2026 en Pedidos

Pastel 10 pax con Horneado Terminado.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 7 | En Pedidos, vista "Día", ve al 27 oct y revisa la fila y la tarjeta de [4152] Luisa Fernanda. Abre su pop-up, revisa la tabla Elementos y abre la fila "Pastel 10 pax". | "Horneado listo" en rojo: etiqueta en la lista, texto en la tarjeta con fondo rojo suave, y en la tabla Elementos y en el encabezado del elemento una etiqueta (chip) roja (no punto con texto). La línea "Etapa actual…" dirá Embetunado con un punto rojo (la etiqueta sale de otra lógica; es el hallazgo C4 del Audit report). | Parcial. Captura 9: lista con etiqueta roja "Horneado listo" OK y tarjeta con texto y fondo rojo suave OK. Captura 10: encabezado del elemento con punto rojo + texto (Axel pide chip) y tracker coherente (Horneado completo, Embetunado actual). Faltan tabla Elementos y línea "Etapa actual…" del pop-up del pedido |

## [4120] Yami aguillon (`recvBRPY8mGxx4Jwu`) — abrir el 23 oct 2026 en Pedidos

Pastel 10 pax con Horneado y Embetunado Terminado.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 8 | Vista "Día", 23 oct: fila y tarjeta de [4120] Yami aguillon. Abre su pop-up (tabla Elementos y encabezado de la fila "Pastel 10 pax"). | "Embetunado listo" en naranja en todos los lugares. | Parcial (captura 3: en Mes naranja con "Embetun…" truncado); faltan lista, tarjeta del Día y pop-up |

## [4162] Silvia LC (`rec6CfqDdQE6OsZHI`) — abrir el 1 nov 2026 en Pedidos

Galletas x60 con Horneado y Glaseado Terminado.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 9 | Vista "Día", 1 nov: fila y tarjeta de [4162] Silvia LC. Abre su pop-up (tabla Elementos y encabezado de la fila "Galletas"). | "Glaseado listo" en el mismo naranja que Embetunado, con el nombre de la etapa de galletas. | Parcial (captura 3: en Mes naranja con "Glaseado…" truncado, día 1 nov atenuado); faltan lista, tarjeta del Día y pop-up |

## [4159] MARIA TERESA MERLOZ (`recfrBAAB0z7jRot4`) — abrir el 12 oct 2026 en Pedidos

Pastel 20 pax con Horneado, Embetunado y Decorado Terminado.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 10 | Vista "Día", 12 oct: fila y tarjeta de [4159] MARIA TERESA MERLOZ. Abre su pop-up (tabla Elementos y encabezado de la fila "Pastel 20 pax"). | "Decorado listo" en amarillo en todos los lugares. | Parcial (captura 3: en Mes amarillo con "Decor…" truncado); faltan lista, tarjeta del Día y pop-up |

## [4084] Xitlali de la rosa (`recZrcshhUS9QhoV6`) — abrir el 21 oct 2026 en Pedidos

Pastel 5 pax con las 4 etapas Terminado.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 11 | Vista "Día", 21 oct: fila y tarjeta de [4084] Xitlali de la rosa. Abre su pop-up (tabla Elementos y encabezado de la fila "Pastel 5 pax"). | "Empacado listo" en verde lima. El pedido sigue Pendiente (no es Entregado), así que no aparece en verde de Entregado. | Parcial (captura 3: en Mes verde lima con "Empac…" truncado); faltan lista, tarjeta del Día y pop-up |

## [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`) — abrir el 8 oct 2026 en Pedidos

Pedido con 2 elementos: Pastel 20 pax (Decorado terminado) y Cupcakes x50 (sin tareas).

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 12 | Vista "Día", 8 oct: fila y tarjeta de [3210] Alondra S Dávila. Abre su pop-up y revisa la tabla Elementos (filas "Pastel 20 pax" y "Cupcakes") y la línea "Etapa actual…". | El pedido se ve morado "No iniciado" (el elemento más atrasado son los Cupcakes). En la tabla Elementos, Pastel 20 pax lleva chip amarillo "Decorado listo" y Cupcakes chip morado "No iniciado". La línea "Etapa actual…" dirá Horneado · Cupcakes. | Parcial (captura 3: en Mes morado "No in…"); faltan lista, tarjeta del Día y pop-up |

## [3413] Rosaura Avila (`rec3OES0NemnxyyzY`) — abrir el 15 oct 2026 en Pedidos, solo lectura

Tres elementos sin tareas: Pastel 50 pax, Cupcakes y Galletas.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 13 | Vista "Día", 15 oct: fila y tarjeta de [3413] Rosaura Avila. Abre su pop-up y revisa la tabla Elementos. | Pedido morado "No iniciado". Las 3 filas de Elementos muestran chip morado y "No iniciado". Sin colores por Estatus. | Parcial (captura 3: en Mes morado "No ini…"); faltan lista, tarjeta del Día y pop-up |

## [4160] Alice (`rec2FnINtW50a2LFW`) — abrir el 30 sep 2026 en Pedidos (si no aparece, buscar "4160")

Entregado; Galletas x50 con las 4 tareas Terminado.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 14 | En el filtro de estatus elige "Entregado". Vista "Día", 30 sep: fila y tarjeta de [4160] Alice. Abre su pop-up (tabla Elementos y encabezado de la fila "Galletas"). | Verde "Entregado" en todos los lugares. No aparece la línea "Etapa actual…" porque todo está completo. |  |

## [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`) — buscar "4148" en Pedidos

Entregado; Galletas con solo la tarea Empacado Terminado.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 15 | Con el filtro en "Entregado", vista "Día", 29 sep: fila y tarjeta de [4148] Blanca Valdes. Abre su pop-up. | Verde "Entregado" aunque falten las etapas previas: el Estatus Entregado manda sobre las tareas. |  |

## [3838] Jarumi (`recNX2aMYAzAYGygg`) — abrir el 1 nov 2026 en Pedidos

Entregado, sin elementos.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 16 | Con el filtro en "Entregado", vista "Día", 1 nov: fila y tarjeta de [3838] Jarumi. | Sin semáforo aunque esté Entregado: "—" en la columna "Etapa" y sin texto de etapa en la tarjeta. La tarjeta tiene fondo neutro. |  |

## [4014] Gisela torres (`recL9IQjl1g5PGmRo`) — abrir el 3 oct 2026 en Pedidos

Entregado, con un elemento sin producto.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 17 | Con el filtro en "Entregado", vista "Día", 3 oct: fila y tarjeta de [4014] Gisela torres. | Sin semáforo (el elemento no tiene producto, así que no cuenta). "—" en "Etapa" y tarjeta neutra. |  |

## [4128] Sara (`recZCPIvYm7J76UX1`) — texto de la interfaz

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 18 | Vista "Día", 1 oct: abre el pop-up de [4128] Sara y compara títulos, botones y pastilla de Estatus con lo que ya conocías. | Los textos son los mismos que antes salvo la columna "Etapa" y los puntos de color. El Estatus sigue editable como dato. |  |

## [4161] Efrain Dl Angel (`recpD5i15hQsj0PSl`) — ESCRIBEN datos en Producción (abrir el 14 oct 2026)

Pastel 10 pax (`rec1exvwATKbn7zup`), sin tareas, un solo elemento. Parte en "No iniciado" morado.

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 19 | En Pedidos, vista "Día", ve al 14 oct y deja visible la lista. Abre el pop-up de [4161] Efrain Dl Angel > fila "Pastel 10 pax" > clic en el círculo "Horneado" y pulsa "Sí" en el globo. Cierra el detalle y el pop-up sin recargar la página. | Al pulsar "Sí" el encabezado del elemento pasa a "Horneado listo" con punto rojo. Al cerrar, la lista (etiqueta) y la tarjeta del 14 oct quedan rojas sin recargar. |  |
| 20 | Con [4161] Efrain Dl Angel (14 oct) repite el flujo y pulsa "Sí" en "Embetunado", luego en "Decorado" y luego en "Empacado". Tras cada paso cierra los pop-ups y mira su fila y su tarjeta. | Naranja "Embetunado listo", amarillo "Decorado listo" y verde lima "Empacado listo", en ese orden, sin recargar, en lista, tarjeta y pop-up. |  |

Limpieza después de las pruebas 19 y 20: borra las tareas creadas en [4161] (icono de basura en el formulario de cada tarea). Estado final esperado: 0 tareas para [4161]. Cuando termines, avisa para que Claude borre las 15 tareas de arranque; estado final esperado: 14 tareas en la tabla.

# Cerradas

| # | Record | Prueba | Expected | Estado |
|---|---|---|---|---|
| ~~1~~ | ~~[4128] Sara~~ | ~~En Pedidos, vista "Día", ve al 1 oct 2026 y revisa la fila de [4128] Sara en la lista del Día.~~ | ~~La columna "Etapa" muestra una etiqueta (badge) redondeada "No iniciado" en morado. La columna "Estatus" sigue mostrando su pastilla como dato.~~ | ~~OK (captura 1: "No iniciado" en etiqueta morada; la pastilla "Pendiente" sigue en "Estatus")~~ |
| ~~2~~ | ~~[4128] Sara~~ | ~~En esa misma vista revisa la tarjeta de [4128] Sara sobre la tabla.~~ | ~~Muestra solo el texto "No iniciado" bajo el nombre, sin etiqueta. Fondo y borde morado suave, no el naranja que daba el Estatus Pendiente.~~ | ~~OK (captura 1: solo el texto "No iniciado" bajo el nombre, sin etiqueta, fondo morado suave)~~ |
| ~~3~~ | ~~[4128] Sara~~ | ~~Vista "Semana" (28 sep-4 oct): tarjeta de [4128] Sara del jueves 1. Luego vista "Mes" (octubre): tarjeta de [4128] Sara del día 1.~~ | ~~En Semana la tarjeta muestra nombre, elemento y la línea "No iniciado", con fondo morado suave. En Mes la tarjeta es morada suave y muestra "· No iniciado" junto al nombre (en pantalla ancha).~~ | ~~OK (capturas 2 y 3: Semana con "Galletas" y "No iniciado"; Mes con "· No iniciado")~~ |
| ~~6~~ | ~~[4128] Sara~~ | ~~En Producción, vista "Todos", semana 5-11 oct, busca [4128] Sara. Luego vuelve a Pedidos, vista "Día", 1 oct, y revisa la fila y la tarjeta de [4128] Sara.~~ | ~~En Producción el indicador de riesgo (A tiempo, En riesgo, Retrasado) sigue como antes. En Pedidos no aparece ningún indicador de riesgo.~~ | ~~OK (captura 8: en Producción, "Todos", 5-11 oct, siguen los indicadores Retrasado, En riesgo y A tiempo y los chips por etapa de [4128] Sara el lun 5; en Pedidos no hay indicador de riesgo, capturas 1 a 3)~~ |
