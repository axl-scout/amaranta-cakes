# Registros estándar para Smoke Tests

Reutilizar estos pedidos en todos los Prompts (3 y 4 en adelante) en lugar de buscar clientes nuevos. Probar por vista (Día, Semana, Mes) y no por cliente: una pasada por vista cubre varios escenarios a la vez. Base: Producción (`appSQk87nF0WpH2gi`). Tareas de arranque creadas por Claude el 2026-10-05 (Origen Manual, Terminado, sin empleado ni fechas). Axel decidió que este es el set estándar y que pueden agregarse más registros, optimizando al máximo (menos pruebas, más cobertura por vista). Las tareas de [4159] y [4084] se borraron el 2026-10-05; se recrean cuando un Prompt necesite ver amarillo o verde lima fuera de la vista Mes.

## Registros

| Escenario | Pedido (record) | Fecha | Estado esperado del semáforo |
|---|---|---|---|
| No iniciado, con tareas Pendiente | [4128] Sara (`recZCPIvYm7J76UX1`) | 1 oct | Morado "No iniciado" |
| Horneado listo | [4152] Luisa Fernanda (`recQn00xkwSusqXk1`) | 27 oct | Rojo (tarea Horneado Terminado) |
| Embetunado listo | [4120] Yami aguillon (`recvBRPY8mGxx4Jwu`) | 23 oct | Naranja (Horneado y Embetunado Terminado) |
| Glaseado listo (galletas) | [4162] Silvia LC (`rec6CfqDdQE6OsZHI`) | 1 nov | Naranja (Horneado y Glaseado Terminado) |
| Decorado listo | [4159] MARIA TERESA MERLOZ (`recfrBAAB0z7jRot4`) | 12 oct | Amarillo |
| Empacado listo | [4084] Xitlali de la rosa (`recZrcshhUS9QhoV6`) | 21 oct | Verde lima |
| Varios elementos (el más atrasado manda) | [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`) | 8 oct | Pastel en Decorado listo, Cupcakes sin iniciar: pedido morado |
| Tres elementos sin tareas | [3413] Rosaura Avila (`rec3OES0NemnxyyzY`) | 15 oct | Morado |
| Entregado con tareas parciales | [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`) | 29 sep | Verde (Entregado manda) |
| Entregado con todas las tareas | [4160] Alice (`rec2FnINtW50a2LFW`) | 30 sep | Verde |
| Entregado sin tareas | [4180] Elizabeth martinez (`recDcAiYcYQINykVw`) | 4 oct | Verde |
| Entregado sin elementos | [3838] Jarumi (`recNX2aMYAzAYGygg`) | 1 nov | Sin semáforo |
| Elemento sin producto | [4014] Gisela torres (`recL9IQjl1g5PGmRo`) | 3 oct | Sin semáforo |
| Escritura (un solo elemento, sin tareas) | [4161] Efrain Dl Angel (`recpD5i15hQsj0PSl`) | 14 oct | Parte morado; cambia con cada "Sí" |

## Cómo probar (por vista)
- Vista Mes, octubre, filtro "Pendiente": en una sola captura se ven los colores de [4152], [4120], [4159], [4084], [3210], [3413], [4128] y [4161].
- Vista Mes, filtro "Entregado": [4180], [4160], [4148], [4014] y (noviembre) [3838].
- Vista Día: una fecha por escenario solo para lista, tarjeta y pop-up de un pedido por tipo de superficie.
- Pruebas que escriben: solo en [4161] y con limpieza al final.


# Cerradas

~~Pending item: decidir si estos registros son el set fijo de pruebas. Axel: sí; pueden ser más, optimizando lo más posible.~~
