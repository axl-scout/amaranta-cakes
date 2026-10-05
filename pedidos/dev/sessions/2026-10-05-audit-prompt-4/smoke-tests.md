# Smoke tests — Prompt 4/4 (vista Todos, tablero y selector de periodo)

Export a probar: v1.10.0 (2026-10-05). Base: Producción (`appSQk87nF0WpH2gi`). Hoy: lunes 5 oct 2026. Set de records: `pedidos/dev/test-records.md` (no se crean datos extra, salvo la prueba 13 con autorización).

Pendientes
1. Prueba 13: manda una captura del tablero después del "Sí" (con "3210" en el buscador) para cerrarla; la tarea `rechbrn8oPFAgZV9d` se borra después.
2. Decidir dos solicitudes nuevas (ver Observaciones de Axel y reporte): búsqueda que filtre Día, Semana y Mes, y menú lateral con hamburguesa en celular.

Reglas
- Filtro de estatus (junto al buscador): viene en "Pendiente". Para las pruebas de Entregado, ábrelo y marca "Entregado".
- "Selector de periodo" = botón con flecha a la derecha de la barra (muestra Día / Semana / Mes / Todos). "Tablero" = 4 columnas Horneado, Embetunado / Glaseado, Decorado, Empacado.
- Cada tarjeta es un elemento; el color es el del semáforo del elemento y lleva el chip de etapa.
- Sin tareas, todos los elementos con etapas caen en Horneado (las tareas de arranque se borraron).
- No se ejecutan pruebas de tema claro/oscuro (decisión vigente).

## Pruebas por vista

### Selector (sin record)
| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 1 | Selector, escritorio | Página Pedidos > selector de periodo. Pasa el cursor; elige "Semana"; vuelve a pasar el cursor; clic en el selector; con Tab enfoca el selector, ↓ ↑ Enter y Escape. | Muestra solo la opción elegida con flecha, misma altura que el buscador (40 px). Al pasar el cursor despliega Día, Semana, Mes, Todos y se cierra al elegir. Con teclado: ↓/↑ mueven, Enter elige, Escape cierra. Nota: si ya está abierto por el hover, el clic lo cierra. | FUNCIONA, pero Axel pide cambiar el diseño (ver Observaciones). |

### Escritura (corre solo tras tu confirmación, pendiente 1)
Record: este record es el que vas a utilizar para esta prueba: [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`), abre el 8 oct 2026. Escribe datos: crea 1 tarea (Horneado, Terminado) y Claude la borra al final.

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 13 | Dos elementos en etapas distintas; actualización sin recargar | Abre "Todos" en una pestaña y deja visible. En Pedidos abre [3210] > fila Pastel 20 pax (detalle del elemento) > seguimiento de etapas > "Horneado" > "¿Completar tarea?" > "Sí". Regresa al tablero sin recargar. | [3210] aparece 2 veces: Pastel 20 pax en Embetunado / Glaseado (chip "Horneado listo", rojo) y Cupcakes en Horneado ("No iniciado", morado). El cambio ocurre sin recargar y ninguna tarjeta ni chip queda vacío. | EN CURSO: captura 17 (antes de la escritura) muestra las 2 tarjetas de [3210] en Horneado con "No iniciado". Tarea creada en Airtable `rechbrn8oPFAgZV9d` (Horneado, Terminado, 10:22 UTC). Falta ver el tablero después del "Sí". |

### Transversales
| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 15 | Sin escrituras | Claude, al terminar: lista `tareas_produccion` y esquema. | 14 tareas (o las mismas que antes de la prueba 13), esquema sin cambios. | EN CURSO: 10:24 UTC, automatizaciones sin cambios (2); `tareas_produccion` tiene la tarea de la prueba 13 (15 registros); se verifica de nuevo al borrarla. |

## Observaciones de Axel (ronda 3)
- El buscador no filtra la página (Día, Semana, Mes): solo muestra opciones en su desplegable. En Todos sí filtra el tablero.
- En celular, el menú lateral no debería ir al costado; debería usarse la hamburguesa.

# Cerradas

~~Pending item: Entregados al buscar con el filtro en "Pendiente". Axel: sí, que aparezcan. Va al prompt de corrección.~~

~~Pending item: regla de la columna del tablero. Axel: de acuerdo con la recomendación (misma función que el chip). Va al prompt de corrección.~~

~~Pending item: autorizar la prueba 13 en [3210] Alondra S Dávila. Axel: confirmo (la corre Axel y Claude borra la tarea).~~

~~Pending item: ubicación del reporte. Axel: confirmo, se queda en pedidos/dev/sessions/.~~

| # | Record | Prueba | Expected | Estado |
|---|---|---|---|---|
| ~~14~~ | ~~Sin record (refresco)~~ | ~~En "Todos" con tarjetas visibles, cambia de pestaña y regresa, y espera 30 s.~~ | ~~Las tarjetas y conteos no desaparecen ni parpadean a vacío.~~ | ~~OK (Axel: ok)~~ |
| ~~12~~ | ~~[3210] Alondra S Dávila y [3413] Rosaura Avila~~ | ~~Selector > "Semana" (semana del 5 oct) y "Mes" (octubre), filtro Pendiente.~~ | ~~Tarjetas con nombre de etapa y fondo suave, igual que en v1.9.2; flechas y selector de fecha funcionan.~~ | ~~OK (capturas 14 y 15: Semana 5-11 oct y Mes octubre, filtro Pendiente, tarjetas con "No iniciado" como en v1.9.2; flechas y selector de fecha funcionan)~~ |
| ~~11~~ | ~~Sin record (persistencia)~~ | ~~Deja Día + Tablero, recarga. Cambia a Todos, recarga.~~ | ~~Tras recargar abre en Día + Tablero; con Todos abre en Todos.~~ | ~~OK (Axel: funciona)~~ |
| ~~10~~ | ~~[4128] Sara y [4161] Efrain Dl Angel~~ | ~~Selector > "Día" > fecha 1 oct 2026 > botón "Lista"/"Tablero" (junto al selector). Cambia a Tablero. Cambia la fecha al 14 oct. Vuelve a Lista.~~ | ~~Por defecto "Lista". En Tablero solo hay tarjetas de pedidos de ese día: el 1 oct incluye [4128] en Horneado; el 14 oct, [4161] en Horneado; ninguna de otros días. El criterio de fecha es el mismo de la lista.~~ | ~~OK (Axel: funciona)~~ |
| ~~9~~ | ~~Sin record (celular)~~ | ~~Celular > "Todos" > desliza a los lados.~~ | ~~Una columna casi a todo el ancho con ajuste por columna.~~ | ~~OK (captura 13: en celular las columnas se deslizan y la siguiente asoma; Axel: funciona)~~ |
| ~~8~~ | ~~Sin record (carga)~~ | ~~Selector > "Todos" y recarga la página (idealmente con la red lenta).~~ | ~~Mientras carga se ven esqueletos de las 4 columnas. Hallazgo: primero se ve el esqueleto de la tabla de Día (PARTIAL).~~ | ~~OK (Axel: funciona; por código la primera carga muestra antes el esqueleto de la tabla de Día, index.tsx:401, observación que no entra a la corrección)~~ |
| ~~7~~ | ~~[4014] Gisela torres y [3838] Jarumi~~ | ~~Filtro Pendiente + Entregado. Busca "Gisela" y luego "Jarumi". Records: [4014] Gisela torres (`recL9IQjl1g5PGmRo`, elemento sin producto) y [3838] Jarumi (`recNX2aMYAzAYGygg`, sin elementos).~~ | ~~Ambos salen en la lista del buscador, pero el tablero no muestra tarjetas para ellos.~~ | ~~OK (capturas 11 y 12: "gisela" y "jarumi" salen en el buscador; [4014] y [3838] no tienen tarjeta en el tablero; [3850] Jarumi, otro pedido, sí tiene su tarjeta en Horneado)~~ |
| ~~6~~ | ~~[4180] Elizabeth martinez y [4160] Alice~~ | ~~Mismo filtro (Pendiente + Entregado). Escribe "Elizabeth", luego "Alice"; borra el texto. Repite con solo "Pendiente" y "Elizabeth". Records: [4180] (Pastel 20 pax) y [4160] (Galletas).~~ | ~~Con la búsqueda aparece la tarjeta en Empacado, verde, chip "Entregado"; al borrar desaparece. Con solo "Pendiente": el prompt pide que también aparezca; hoy no aparece (hallazgo FAIL, pendiente 1 del reporte).~~ | ~~OK en lo visto (capturas 9 y 10, filtro "2 seleccionados": "elizabe" muestra 7 tarjetas en Empacado, verdes, con chip "Entregado", e incluye [3746], [3720] x2 y [4178]; "alice" muestra [4160] Alice, Galletas x 50, 30 sep; Axel confirma que funciona al borrar el texto). El caso con solo "Pendiente" queda cubierto por la decisión 1 del prompt de corrección~~ |
| ~~5~~ | ~~[4180] Elizabeth martinez, [4160] Alice, [4148] Blanca Valdes~~ | ~~Filtro de estatus: marca "Pendiente" y "Entregado". Sin escribir en el buscador, revisa las 4 columnas. Records: [4180] Elizabeth martinez (`recDcAiYcYQINykVw`), [4160] Alice (`rec2FnINtW50a2LFW`), [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`).~~ | ~~Ninguno de los tres aparece en el tablero.~~ | ~~OK (capturas 6 a 8: Ctrl+F de 4180, 4160 y 4148 en el tablero da 0/0 con el filtro Pendiente + Entregado)~~ |
| ~~4~~ | ~~[4128] Sara, [3210] Alondra S Dávila, [4161] Efrain Dl Angel, [3413] Rosaura Avila~~ | ~~Selector > "Todos", filtro "Pendiente". Cuenta las tarjetas de cada columna y compara con el número del encabezado. Ubica las de los 4 records.~~ | ~~4 columnas con ese orden de encabezados. Una tarjeta por elemento: [4128] 1, [3210] 2 (Pastel 20 pax y Cupcakes), [4161] 1, [3413] 3 (Pastel 50 pax, Cupcakes, Galletas), todas en Horneado y con chip "No iniciado" (morado). Orden en la columna: [4128], [3210], [4161], [3413]. Cada tarjeta muestra ID, elemento × cantidad, fecha de producción y chip. Cada encabezado muestra el conteo real. Clic en una tarjeta abre el pop-up del pedido.~~ | ~~OK (capturas 2, 4 y 5: Horneado 51 y las otras 3 columnas en 0 con "Sin elementos."; orden ascendente por fecha: [3931] 25 ago, [4128] 1 oct, [4132] y [3436] 8 oct, [3210] 2 tarjetas 8 oct 5:00 p.m., [4106] y [4159] 12 oct, [4161] 14 oct, [4143] y [3413] 15 oct; todas "No iniciado" morado)~~ |
| ~~3~~ | ~~Sin record (controles de fecha)~~ | ~~Selector > "Todos". Luego "Día".~~ | ~~En "Todos" no hay flechas, selector de fecha ni "Hoy"; el buscador y el filtro de estatus siguen. En "Día" reaparecen.~~ | ~~OK (capturas 2 y 3: en Todos no hay flechas, fecha ni "Hoy" y el buscador y el filtro siguen; en Día reaparecen, más el botón "Lista")~~ |
| ~~2~~ | ~~Sin record (celular)~~ | ~~Página Pedidos en celular (o emulación táctil) > toca el selector > toca "Todos"; vuelve a abrir y toca fuera.~~ | ~~Abre con un toque (sin hover), cierra al elegir o al tocar fuera.~~ | ~~OK (captura 1: en celular el selector de 40 px muestra solo la opción elegida)~~ |
