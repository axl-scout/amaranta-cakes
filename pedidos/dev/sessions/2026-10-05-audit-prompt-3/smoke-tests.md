# Smoke tests — Prompt 3/4 (semáforo y etiquetas de etapa)

Export probado: v1.9.0 (2026-10-05). Base: Producción (`appSQk87nF0WpH2gi`). Hoy es lunes 2026-10-05.
Estado: ninguna prueba ejecutada. Claude creó la data de arranque (autorizado por Axel, ver "Data creada").

## Pending items

1. Key message: Corre las pruebas S1 a S22 y marca Pass/Fail; solo S20 y S21 escriben datos, sobre [4161].
   Argument: Los colores rojo, naranja, amarillo y lima solo se ven con tareas Terminado; Claude ya las creó en 5 pedidos para que no tengas que crearlas.
   Supporting data: 15 tareas creadas (ver "Data creada") y [4161] Efrain Dl Angel (`recpD5i15hQsj0PSl`) sin tareas para la prueba de recálculo en vivo.

2. Key message: Las pruebas de tema claro y oscuro quedan para la aplicación final (decisión previa de Axel); el mapa único se verificó por código.
   Argument: En el Prompt 2 se decidió no ejecutar pruebas de tema; aquí solo se confirma por código que los colores salen de un mapa con valores claro y oscuro.
   Supporting data: `produccion/semaforo.ts:27-34` (mapa), `components/airtableColors.ts` (pares claro/oscuro).

3. Key message: Al terminar, avisa para borrar las 15 tareas creadas y las de S20/S21.
   Argument: Dejan los pedidos con tareas que no existían antes (la tabla pasó de 14 a 29 registros).
   Supporting data: IDs en "Data creada". Estado final esperado: 14 tareas en la tabla.

## Reglas

- Hoy: lunes 5 oct 2026. Calendario de Pedidos: botones Día / Semana / Mes; la fecha del calendario es la fecha de entrega a producción.
- "Lista del Día" = tabla de la vista Día (columnas Pedido, Estatus, Etapa…). "Tarjeta del Día" = tarjetas sobre la tabla en la vista Día. "Pop-up del pedido" = ventana al hacer clic en un pedido. "Detalle del elemento" = segundo pop-up al hacer clic en una fila de la tabla Elementos.
- Las pruebas S1 a S19 solo leen: cierra los pop-ups con clic en el área oscura, sin pulsar "No" ni "Sí".
- Código ya verificado por Claude (no requiere prueba manual): no existe ningún campo de fórmula, rollup ni calculado nuevo para el semáforo (11 tablas, sin cambios) y el cálculo está en una sola función (`semaforo.ts:62-80`).

## Data creada por Claude (Airtable, tabla tareas_produccion `tblESlAFi4WqHlJtk`)

Todas con Estatus Terminado, cantidad completada = asignada, Origen Manual, sin empleado ni fechas (no aparecen en el tablero de Producción).

| Pedido | Elemento | Tareas creadas (record) |
|---|---|---|
| [4152] Luisa Fernanda (`recQn00xkwSusqXk1`) | `rec8lGkJ7fe5O27j0` Pastel 10 pax | Horneado `recrEBnNocx5zit9G` |
| [4120] Yami aguillon (`recvBRPY8mGxx4Jwu`) | `recWkvFQys1wObKSD` Pastel 10 pax | Horneado `rec0RJ2n5FnVQNcZb`, Embetunado `reczJNoa7pvG1ya2t` |
| [4162] Silvia LC (`rec6CfqDdQE6OsZHI`) | `recnVJ37t1pJ50jeS` Galletas 60 | Horneado `recnrUUUThKIlVEu2`, Glaseado `rec2Mzcbd2HCmwy9O` |
| [4159] MARIA TERESA MERLOZ (`recfrBAAB0z7jRot4`) | `recuMgPqdBJnNemg2` Pastel 20 pax | Horneado `rec4cTgdQJ8IDWjZU`, Embetunado `recx58rzi3Wbvef7v`, Decorado `recL8bxqUf8PsEaT4` |
| [4084] Xitlali de la rosa (`recZrcshhUS9QhoV6`) | `rec4RvL8VNoH3bQ0Z` Pastel 5 pax | Horneado `recEE9Rhox60kNs0B`, Embetunado `rec5eTOqdCZgJTCjk`, Decorado `recUpym5rsNWwSa0i`, Empacado `recWQHkxh5CEAXiKK` |
| [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`) | `recscT1PSK1PEkfU1` Pastel 20 pax | Horneado `rec9hTvx9o6h1G2TO`, Embetunado `recKFgMGso71HrKvp`, Decorado `recGGBUcZSsJ4wnPG` |

## Tests

Colores (valores de la paleta de Airtable, un solo mapa): No iniciado `purple`, Horneado listo `red`, Embetunado/Glaseado listo `orange`, Decorado listo `yellow`, Empacado listo `greenLight1`, Entregado `green`.

| # | Record | Prueba (ruta) | Expected | Pass/Fail |
|---|---|---|---|---|
| | **[4128] Sara** (`recZCPIvYm7J76UX1`), Pendiente, 4 tareas Pendiente. Abrir Pedidos, vista Día, 1 oct 2026 | | | |
| S1 | [4128] | Lista del Día: columna "Etapa" | Etapa como etiqueta (badge) redondeada "No iniciado" en morado; la columna "Estatus" sigue como dato | |
| S2 | [4128] | Tarjeta del Día (sobre la tabla) | Solo el texto "No iniciado" debajo del nombre, sin etiqueta; fondo y borde morado suave, no naranja por Estatus | |
| S3 | [4128] | Vista Semana, semana 28 sep-4 oct, día 1 oct | Tarjeta con nombre, elemento y la línea de texto "No iniciado"; fondo morado suave | |
| S4 | [4128] | Vista Mes, octubre, día 1 | Tarjeta morada suave con "· No iniciado" (en pantalla ancha) | |
| S5 | [4128] | Pop-up del pedido, tabla Elementos | Columna "Etapa" con punto morado y "No iniciado" en la fila Galletas; línea "Etapa actual del elemento más atrasado: Horneado · Galletas" con un punto morado antes | |
| S6 | [4128] | Clic en la fila Galletas, encabezado del detalle del elemento | Junto al título "Galletas": punto morado y "No iniciado" | |
| S7 | [4128] | Producción, semana 5-11 oct (selector "Todos") | El indicador de riesgo (A tiempo, En riesgo, Retrasado) sigue en Producción sin cambios; en Pedidos (S1 a S4) no aparece ningún indicador de riesgo | |
| | **Colores por etapa** (data creada) | | | |
| S8 | [4152] Luisa Fernanda, calendario 27 oct | Lista del Día, tarjeta del Día y pop-up (Pastel 10 pax) | "Horneado listo" en rojo; punto rojo en la tabla Elementos y en el encabezado del elemento. La línea "Etapa actual…" dirá Embetunado con punto rojo (la etiqueta sale de otra lógica; ver C4 del Audit report) | |
| S9 | [4120] Yami aguillon, 23 oct | Lista, tarjeta, pop-up | "Embetunado listo" en naranja | |
| S10 | [4162] Silvia LC, 1 nov | Lista, tarjeta, pop-up (Galletas) | "Glaseado listo" en naranja (mismo color que Embetunado) | |
| S11 | [4159] MARIA TERESA MERLOZ, 12 oct | Lista, tarjeta, pop-up | "Decorado listo" en amarillo | |
| S12 | [4084] Xitlali de la rosa, 21 oct | Lista, tarjeta, pop-up | "Empacado listo" en verde lima (`greenLight1`) | |
| | **Varios elementos** | | | |
| S13 | [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`), 8 oct | Lista, tarjeta y pop-up | El Pastel 20 pax está en "Decorado listo" (amarillo) y los Cupcakes en "No iniciado" (morado). El pedido se ve morado y "No iniciado" (el más atrasado); la tabla Elementos muestra un punto distinto por fila | |
| S14 | [3413] Rosaura Avila (`rec3OES0NemnxyyzY`), 15 oct | Pop-up del pedido | Pastel 50 pax, Cupcakes y Galletas, los tres en "No iniciado" morado; el pedido morado | |
| | **Entregado** | | | |
| S15 | [4160] Alice (`rec2FnINtW50a2LFW`), 30 sep | Lista, tarjeta, pop-up | Verde "Entregado"; en el pop-up desaparece la línea "Etapa actual…" porque todo está completo | |
| S16 | [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`), 29 sep | Lista, tarjeta, pop-up | Verde "Entregado" aunque solo tiene Empacado terminado (el estatus Entregado manda) | |
| | **Sin semáforo** | | | |
| S17 | [3838] Jarumi (`recNX2aMYAzAYGygg`), 1 nov, Entregado, sin elementos | Lista y tarjeta | Sin etapa ("—" en la lista, sin texto en la tarjeta) aunque esté Entregado; tarjeta con el fondo neutro | |
| S18 | [4014] Gisela torres (`recL9IQjl1g5PGmRo`), 3 oct, Entregado, elemento sin producto | Lista y tarjeta | Sin semáforo (producto sin etapas) | |
| | **Estructura y tema** | | | |
| S19 | [4128] | Pop-up del pedido, abrir y cerrar | Texto de la interfaz igual que antes salvo la columna "Etapa" y el punto de color; el pedido conserva su pastilla de Estatus | |
| S20 | [4161] Efrain Dl Angel (`recpD5i15hQsj0PSl`), 14 oct. **ESCRIBE** | Calendario Día 14 oct (morado "No iniciado"). Abrir pedido, clic en la fila Pastel 10 pax, clic en la etapa Horneado y "Sí". Cerrar los pop-ups sin recargar la página | Tras "Sí", el encabezado del elemento pasa a rojo "Horneado listo"; al cerrar, la lista y la tarjeta del 14 oct quedan en rojo sin recargar | |
| S21 | [4161]. **ESCRIBE** | Mismo flujo: "Sí" en Embetunado, luego Decorado, luego Empacado | Naranja, amarillo y verde lima en ese orden, sin recargar, en lista, tarjeta y pop-up | |
| S22 | Todos | Tema claro/oscuro | Omitida: se deja para la aplicación final (decisión de Axel); el mapa de colores claro/oscuro se verificó por código | Omitida |

Limpieza tras S20 y S21: borrar las tareas creadas en [4161] (icono de basura en el formulario de cada tarea); estado final esperado: 0 tareas para [4161]. Después Claude borra las 15 tareas de la tabla "Data creada" cuando des el OK.

## Cobertura del prompt

Color por etapa (S8 a S12 y S1), Entregado verde (S15, S16), varios elementos (S13, S14), etiqueta en lista y texto en tarjetas (S1 a S4), columna "Etapa" (S5, S8), sin color por Estatus (S2, S3), riesgo solo en Producción (S7), recálculo sin recargar (S20, S21).
