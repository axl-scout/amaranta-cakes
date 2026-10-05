# Amaranta Cakes

Versión 1.8.1 — 2026-10-05

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
