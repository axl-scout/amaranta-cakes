# Smoke tests — Prompt 4/4 (vista Todos, tablero y selector de periodo)

Export a probar: v1.11.0 (2026-10-05). Las pruebas cerradas abajo son de v1.10.0. Base: Producción (`appSQk87nF0WpH2gi`). Hoy: lunes 5 oct 2026. Set de records: `pedidos/dev/test-records.md` (no se crean datos extra, salvo la prueba 13 con autorización).

Pendientes
1. Confirmar la prueba 20 (escribe datos) en [3210] Alondra S Dávila: completar Horneado y luego Embetunado del Pastel 20 pax; Claude borra las tareas creadas. Se dejó fuera la prueba de eliminar el último elemento (verificada por código) para reducir pruebas y escrituras.
2. El selector en celular pasa a dropdown (decisión de Axel); su prueba (21) se corre cuando llegue la corrección.

Reglas
- Filtro de estatus (junto al buscador): viene en "Pendiente". Para las pruebas de Entregado, ábrelo y marca "Entregado".
- "Selector de periodo" = botón con flecha a la derecha de la barra (muestra Día / Semana / Mes / Todos). "Tablero" = 4 columnas Horneado, Embetunado / Glaseado, Decorado, Empacado.
- Cada tarjeta es un elemento; el color es el del semáforo del elemento y lleva el chip de etapa.
- Sin tareas, todos los elementos con etapas caen en Horneado (las tareas de arranque se borraron).
- No se ejecutan pruebas de tema claro/oscuro (decisión vigente).

## Pruebas por vista

### Escritorio: vista Todos (Pedidos)
Records de la prueba 17: este record es el que vas a utilizar para esta prueba: [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`, 8 oct) para el buscador y [4180] Elizabeth martinez (`recDcAiYcYQINykVw`), [4160] Alice (`rec2FnINtW50a2LFW`) y [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`) para Entregados.

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 17 | Todos: esqueleto, buscador y Entregados | Selector > "Todos" y recarga la página (mira la carga). Filtro de estatus: "Pendiente" + "Entregado". Con Ctrl+F busca 4180, 4160 y 4148 en el tablero. Escribe "3210" y luego "alice" en el buscador. | Al cargar se ven las 4 columnas con barras de carga, no la tabla de Día. Ninguno de los 3 Entregados está en el tablero. Con "3210" solo se abre la lista con [3210] y con "alice" la lista con [4160]; el tablero no cambia (sigue en 51 tarjetas de Horneado, sin tarjetas nuevas). | |

### Escritorio: vistas Día, Semana y Mes (Pedidos)
Record: este record es el que vas a utilizar para esta prueba: [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`), abre el 8 oct 2026.

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 18 | Buscador solo lista y esqueleto en Día | En "Día" (8 oct), "Semana" (5-11 oct) y "Mes" (octubre) escribe "3210". Luego "Día" > "Tablero" y recarga la página. | En las tres vistas solo se abre la lista con [3210]; la página no cambia (Semana y Mes siguen mostrando todos los pedidos). Al recargar Día > Tablero se ven las 4 columnas de carga. | |

### Menú lateral (Pedidos, Producción y Finanzas)
| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 19 | Hamburguesa en celular y menú en escritorio | Celular > Pedidos, Producción y Finanzas: toca la hamburguesa, elige otra sección; ábrela y toca fuera; ábrela y pulsa Escape. Luego escritorio: chevron (colapsa y expande) y recarga. | Celular: sin columna lateral, botón de 40 px; el panel muestra Inicio/Pedidos/Producción/Finanzas, sección activa marcada, tema y descarga, y se cierra al elegir, tocar fuera o Escape. Escritorio: sin hamburguesa, menú de antes y recuerda si estaba expandido. | |

### Escritura (corre solo tras tu confirmación, pendiente 1)
Record de la prueba 20: este record es el que vas a utilizar para esta prueba: [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`), abre el 8 oct 2026. Escribe datos: crea tareas Terminado (Horneado y luego Embetunado) y Claude las borra al final.

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 20 | Tablero se actualiza al completar etapa | "Todos" visible. Abre [3210] > fila Pastel 20 pax (detalle del elemento) > seguimiento de etapas > "Horneado" > "¿Completar tarea?" > "Sí"; cierra los pop-ups sin recargar y mira el tablero; espera 30 s. Repite con "Embetunado". | Tras el primer "Sí" Pastel 20 pax pasa de inmediato a Embetunado / Glaseado con chip rojo "Horneado listo" y Cupcakes sigue en Horneado "No iniciado"; sigue ahí a los 30 s. Tras el segundo pasa a Decorado con chip naranja "Embetunado listo". Ninguna tarjeta queda vacía. | |

### Celular (cuando llegue la corrección)
| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 21 | Selector en celular | Celular > Pedidos > vista "Día" > toca el selector > elige "Mes"; ábrelo y toca fuera. | Dropdown que muestra solo la opción elegida con flecha, cabe en la pantalla; al elegir o tocar fuera se cierra. En escritorio sigue el interruptor expandible. | |

Al cerrar el set Claude verifica `tareas_produccion` (14 registros) y el esquema (11 tablas, 2 automatizaciones).

## Observaciones de Axel (ronda 5)
- En celular el interruptor expandido no cabe (se corta "Mes"): en celular debe ser dropdown; en escritorio se queda el interruptor expandible.

# Cerradas

~~Pending item: Entregados al buscar con el filtro en "Pendiente". Axel: sí, que aparezcan. Va al prompt de corrección.~~

~~Pending item: regla de la columna del tablero. Axel: de acuerdo con la recomendación (misma función que el chip). Va al prompt de corrección.~~

~~Pending item: autorizar la prueba 13 en [3210] Alondra S Dávila. Axel: confirmo (la corre Axel y Claude borra la tarea).~~

~~Pending item: ubicación del reporte. Axel: confirmo, se queda en pedidos/dev/sessions/.~~

| # | Record | Prueba | Expected | Estado |
|---|---|---|---|---|
| ~~16~~ | ~~Sin record (interruptor, celular)~~ | ~~Celular > Pedidos > vista "Día" (con el botón "Lista") > toca el interruptor > toca "Mes"; ábrelo y toca fuera.~~ | ~~Con un toque se expande y cabe en la pantalla sin recortarse a la derecha; al elegir o tocar fuera se contrae.~~ | ~~FALLA en v1.11.0 (captura 20: en el celular la fila con "Lista" y el interruptor se recorta ("Me") y no cabe; Axel decide que en celular sea dropdown; va al prompt de corrección). La captura 20 también muestra la hamburguesa a la izquierda de la barra y sin columna lateral~~ |
| ~~1~~ | ~~Sin record (interruptor, escritorio)~~ | ~~Página Pedidos > interruptor de periodo (arriba a la derecha). Pasa el cursor; elige "Semana"; quita el cursor; clic en el interruptor; con Tab enfócalo, usa ← → (o ↑ ↓), Enter y Escape.~~ | ~~Contraído muestra solo la opción elegida dentro de un contenedor de 40 px de alto. Al pasar el cursor o hacer clic se expande con las 4 opciones (Día, Semana, Mes, Todos) y la elegida resaltada en rosa; al elegir una se contrae. Con teclado: flechas mueven, Enter elige, Escape cierra.~~ | ~~OK en v1.11.0 (Axel: todo funciona bien con el selector; capturas 18 y 19: expandido en Todos con las 4 opciones y la elegida en rosa, contraído en Semana mostrando solo "Semana")~~ |
| ~~15~~ | ~~Claude, al final de v1.10.0~~ | ~~Listar `tareas_produccion` y esquema.~~ | ~~14 tareas, esquema sin cambios.~~ | ~~OK (2026-10-05: 14 tareas tras borrar `rechbrn8oPFAgZV9d`, 11 tablas y 2 automatizaciones sin cambios)~~ |
| ~~13~~ | ~~[3210] Alondra S Dávila~~ | ~~[3210] (8 oct). **ESCRIBE.** Con "Todos" visible, abre [3210] > Pastel 20 pax > "Horneado" > "Sí" y regresa al tablero sin recargar.~~ | ~~[3210] aparece 2 veces: Pastel 20 pax en Embetunado / Glaseado ("Horneado listo") y Cupcakes en Horneado ("No iniciado"), sin recargar y sin vacíos.~~ | ~~FALLA en v1.10.0 (captura 17 y una segunda captura minutos después: las 2 tarjetas siguen en Horneado con "No iniciado"; Airtable sí tenía la tarea `rechbrn8oPFAgZV9d` ligada a Pastel 20 pax y a [3210], así que el tablero no refleja el cambio ni con el tiempo; va al prompt de corrección). Airtable: tarea `rechbrn8oPFAgZV9d` creada por Axel y borrada por Claude el 2026-10-05~~ |
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
