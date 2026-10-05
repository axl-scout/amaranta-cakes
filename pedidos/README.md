# Amaranta Cakes

Versión 1.9.0 — 2026-10-05

Sistema de gestión para la pastelería Amaranta Cakes. Interfaz en React con datos en una base de Airtable.

## Secciones
- **Pedidos:** calendario de pedidos, cake toppers y recibos.
- **Producción:** tareas del día por empleado y avance de las galletas.
- **Finanzas:** cobros, saldos por cobrar y nómina de cada semana.

## Estructura del código
- `index.tsx`: entrada de la app, rutas y página de Pedidos.
- `components/`: componentes compartidos (menú, calendario, modales, tema, descarga).
- `produccion/`: página de Producción.
- `finanzas/`: página de Finanzas.
- `lib/`: acceso a Airtable, changelog, README y utilidades de descarga.
- `scripts/gen-source.mjs`: regenera la copia del código usada por el botón de descarga.

## Descargas
El botón de descarga ofrece: source.pdf, source.zip, readme.pdf y readme.md.

## Mantenimiento
Con cada actualización: agregar una entrada en `lib/changelog.ts` (versión y fecha) y ejecutar `node scripts/gen-source.mjs`.

## Historial de versiones
### v1.9.0 — 2026-10-05
- Semáforo de avance en Pedidos: cada pedido muestra la etapa del elemento más atrasado (No iniciado, Horneado listo, Embetunado/Glaseado listo, Decorado listo, Empacado listo, Entregado) con su color, calculado solo en la app (sin campos nuevos en Airtable).
- Lista del día: etapa como chip de color; tarjetas de Día, Semana y Mes: nombre de la etapa y fondo suave del color. El color de las tarjetas ya no depende del Estatus del pedido.
- Detalle del pedido: nueva columna "Etapa" en Elementos y punto de color en "Etapa actual del elemento más atrasado". Detalle del elemento: punto y etapa en el encabezado.
- Los colores salen de un único mapa basado en la paleta de colores de Airtable; solo cuentan Pastel, Plancha de cupcakes y Galletas. Se recalcula al completar etapas, sin recargar.

### v1.8.4 — 2026-10-05
- Al eliminar un elemento se leen sus tareas directamente de Airtable en ese momento, se eliminan, se verifica que no quede ninguna y solo entonces se elimina el elemento; si queda alguna, el elemento no se elimina y se avisa cuáles tareas se eliminaron y cuáles no.
- Mientras se muestra "Elemento eliminado", sus tareas no aparecen en ningún lado (ni en "Sin elemento" del pedido ni en el tablero de Producción); "Sin elemento" solo muestra tareas que de verdad no tienen elemento.
- La confirmación de eliminar elemento dice "Se eliminarán también sus tareas de producción."

### v1.8.3 — 2026-10-05
- Eliminar un elemento elimina también sus tareas de producción (primero las tareas, después el elemento); solo las ligadas a ese elemento.
- Si falla el borrado de alguna tarea, el elemento no se elimina y se avisa qué tareas se eliminaron y cuáles no.
- La tabla del pedido, el seguimiento de etapas, la línea de etapa actual y el tablero de Producción se actualizan al instante.
- "Deshacer" restaura el elemento junto con sus tareas, con los mismos datos.

### v1.8.2 — 2026-10-05
- Los detalles (pedido, elemento, tarea, pago, empleado del día) ponen su id en la URL (por ejemplo ?task=recXXXX).
- Al abrir esa URL o recargar la página se abre el mismo detalle; al cerrarlo, el parámetro se quita.
- Los desplegables de las tablas y pop-ups (Empleado, Etapa, fechas) se ven completos: abren hacia arriba si no hay espacio abajo, o limitan su altura con scroll.
- El seguimiento de etapas se actualiza al instante junto con la tabla (y la línea de etapa actual del pedido); una etapa se ve completa cuando todas sus tareas están completas.
- Cada página tiene su propio id (pagina-pedidos, pagina-produccion, pagina-finanzas, pagina-inicio).

### v1.8.1 — 2026-10-05
- Se restaura la actualización automática de datos (cada 30 segundos y al volver a la pestaña, en silencio y sin interrumpir formularios).
- Se restauran las dependencias del proyecto (íconos, navegación y descargas).
- Detalle del elemento: sin campo "Nombre" (Pedido y luego Producto) y sin la "X" en el encabezado.
- Tablas de tareas: Empleado, Inicio y Fin se editan en la propia celda con guardado automático.
- Detalle del pedido: las tablas por elemento siguen el orden de la tabla Elementos.

### v1.8.0 — 2026-10-05
- Globo "¿Completar tarea?": solo la pregunta y los botones Sí / No; el seguimiento y la tabla cambian al instante.
- Detalle del elemento: edición en línea con guardado automático (sin botón Editar); icono de basura con confirmación.
- Detalle del pedido: una tabla de tareas por elemento, con su nombre como subtítulo.
- Fechas secuenciales entre etapas de un elemento (en Agregar Elemento y en el formulario de la tarea), con ajuste automático de las etapas siguientes.
- Aviso más corto cuando la entrega de producción ya pasó.

### v1.7.0 — 2026-10-05
- El detalle del pedido se actualiza al instante al completar etapas, crear tareas o agregar elementos desde el detalle del elemento.
- Si falla una etapa a medias, se avisa cuáles se guardaron y el seguimiento muestra el estado real.
- Una etapa con tareas completas se ve completa junto con las anteriores, aunque estas no tengan tareas.
- Escape cierra solo la capa superior (también "¿Completar tarea?"); borrar un elemento cierra su detalle.
- Todos los desplegables: flechas, Enter y Escape, con resaltado que sigue al mouse.
- "¿Completar tarea?" ahora es un pequeño globo junto a la etapa, sin fondo oscuro.
- Detalle del pedido: tareas de cada elemento ordenadas por las etapas de su tipo de producto.
- Nuevo elemento: tabla de tareas con 4 columnas (Etapa, Empleado, Inicio, Fin), sin scroll horizontal.
- Un solo calendario de rango para Inicio y Fin, con botón X para quitar cada fecha.
- Aviso claro cuando la entrega de producción del pedido ya pasó.

### v1.6.0 — 2026-10-05
- Producción: buscador de pedidos igual al de Pedidos (con navegación por flechas).
- Producción: el buscador de empleados se reemplazó por un filtro desplegable de empleados.

### v1.5.1 — 2026-10-05
- Buscador de pedidos: el ancho de los resultados es constante y se puede navegar con flechas, Enter y Escape.

### v1.5.0 — 2026-10-05
- Detalle del elemento: datos, seguimiento de etapas con confirmación "¿Completar tarea?" y tabla de sus tareas.
- Detalle del pedido: tabla de tareas con columna "Elemento" y la etapa actual del elemento más atrasado.
- Formulario de tarea: empleado opcional y fechas limitadas por la creación de la tarea y la entrega a producción.
- Nuevo elemento: tabla "Tareas de producción" por etapa según el tipo de producto.
- Producción: buscador por empleado; se ocultó el cálculo de capacidad y el modal de Capacidades.

### v1.4.0 — 2026-10-04
- Actualización automática de datos cada 30 segundos y al volver a la pestaña; se pausa mientras hay un formulario abierto o un campo en edición.

### v1.3.1 — 2026-10-04
- Finanzas: botón para actualizar los datos (cobros y nómina) en la barra superior.

### v1.3.0 — 2026-10-03
- Etapas por tipo de producto: Pastel y Plancha de cupcakes (Horneado, Embetunado, Decorado, Empacado) y Galletas (Horneado, Glaseado, Decorado, Empacado).
- La etapa "Empaque" ahora se llama "Empacado"; nueva etapa "Embetunado".

### v1.2.0 — 2026-10-03
- El menú de descarga permanece abierto hasta hacer clic afuera.
- El botón de descarga solo se muestra a usuarios autorizados.

### v1.1.0 — 2026-10-03
- Botón de descarga (código en PDF/ZIP y README en PDF/MD) en la página principal y en el menú.
- Se restauraron las dependencias de íconos y navegación tras volver a una versión anterior.

### v1.0.0 — 2026-10-02
- Versión inicial: Pedidos (calendario, cake toppers, recibos), Producción (tareas por empleado, avance de galletas) y Finanzas (cobros, saldos, nómina).
