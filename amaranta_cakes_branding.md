# Amaranta Cakes — Interface Design System

Este documento es **prescriptivo, no descriptivo**. Pégalo al inicio de cualquier conversación antes de construir o editar una Interface Extension de Airtable para Amaranta Cakes. Cuando el código y este documento difieran, este documento manda.

Amaranta Cakes es un cliente **multi-base** con dos paletas distintas, una por base de datos:

| Paleta | Nombre | Base | Interfaces |
|--------|--------|------|-----------|
| **Rosewood** | Rosa palo / vino suave | Pedidos, Control Horario / Nómina | Pedidos, Importador Checador |
| **Miel** | Dorado suave / miel | RH & Nómina | A definir |

Ambas paletas comparten stack, tipografía, radios, sombras, componentes y reglas de comportamiento. Solo cambian los tokens de color de marca.

---

## Stack

- React + TypeScript, Tailwind CSS utility classes (sin CSS modules, sin `styled-components`).
- `font-sans antialiased` en el wrapper raíz — nunca confiar en el default del navegador.
- Sin `<select>` nativo — todos los dropdowns son componentes propios.
- Sin librería externa de date-picker — `CalendarPopup` propio en cada proyecto.
- Un solo paquete de íconos: `@phosphor-icons/react`. Sin SVGs inline manuales, sin mezclar paquetes.
- Sin breakpoints responsivos — estas interfaces son para escritorio fijo. No agregar complejidad mobile que nadie pidió.

---

## 1. Sistema de Color

Los tokens se implementan como objeto `LIGHT`/`DARK` en cada archivo — nunca hexadecimales ad hoc dispersos en los componentes. Soportar light y dark siempre. Detectar tema vía `prefers-color-scheme` con listener de cambio reactivo.

### Paleta 1 — Rosewood
*Usada en las bases de Pedidos y Nómina/Control Horario.*

| Token | Light | Dark |
|-------|-------|------|
| `app_bg` | `#F8F2F2` | `#1B1517` |
| `surface` | `#FFFFFF` | `#251D1F` |
| `surface_subtle` | `#F9FAFB` (gray-50) | `rgba(255,255,255,0.05)` |
| `surface_deep` | — | `#1B1517` (input search dentro de modal) |
| `border_brand` | `#E9D9D9` | `#382C2E` |
| `border_default` | `#E5E7EB` (gray-200) | `rgba(255,255,255,0.10)` |
| `text_primary` | `#111827` (gray-900) | `#F5F3EF` |
| `text_secondary` | `#6B7280` (gray-500) | `#9CA3AF` (gray-400) |
| `text_label` | `#9CA3AF` (gray-400) | `#6B7280` (gray-500) |
| `accent` | `#E11D48` (rose-600) | `#F43F5E` (rose-500) |
| `accent_soft` | `#FFF1F2` (rose-50) | `rgba(244,63,94,0.15)` |
| `accent_hover_border` | `#FDA4AF` (rose-300) | `rgba(244,63,94,0.50)` |
| `accent_focus_border` | `#FB7185` (rose-400) | `#FB7185` (rose-400) |
| `accent_focus_ring` | `#FDA4AF` (rose-300) | `#FDA4AF` (rose-300) |
| `accent_selected_text` | `#9F1239` (rose-700, light) / `#FECDD3` (rose-300, dark) | — |

**Colores semánticos compartidos por ambas paletas:**

| Estado | Bg light | Text light | Border light | Dark (bg/text/border) |
|--------|----------|------------|--------------|----------------------|
| Pendiente / Danger | rose-50 | rose-600 | rose-200 | rose-500/15 · rose-300 · rose-500/30 |
| Entregado / Success | green-50 | green-700 | green-200 | green-500/15 · green-300 · green-500/30 |
| Advertencia | yellow-50 | yellow-700 | yellow-200 | yellow-500/10 · yellow-200 · yellow-500/30 |
| WhatsApp | green-50 | green-700 | green-200 | (igual que success) |
| Facebook | blue-50 | blue-700 | blue-200 | blue-500/15 · blue-300 · blue-500/30 |
| Instagram | pink-50 | pink-700 | pink-200 | pink-500/15 · pink-300 · pink-500/30 |
| Impreso | indigo-50 | indigo-700 | indigo-200 | indigo-500/15 · indigo-300 · indigo-500/30 |
| Neutral / Sin valor | gray-100 | gray-400 | gray-200 | white/10 · gray-500 · white/10 |

---

### Paleta 2 — Miel
*Usada en las bases de gastos u otras bases secundarias.*
*Color ancla del cliente: `#FFBA05` (dorado/miel). El resto de la paleta es complementario suave para no competir con ese amarillo.*

| Token | Light | Dark |
|-------|-------|------|
| `app_bg` | `#FAF9F4` | `#1A1810` |
| `surface` | `#FFFFFF` | `#231F13` |
| `surface_subtle` | `#F5F1E4` | `rgba(255,255,255,0.05)` |
| `surface_deep` | — | `#1A1810` |
| `border_brand` | `#E8DFC2` | `#37301B` |
| `border_default` | `#EDE8D8` | `rgba(255,255,255,0.10)` |
| `text_primary` | `#111827` (gray-900) | `#F5F1E4` |
| `text_secondary` | `#6B7280` (gray-500) | `#9CA3AF` (gray-400) |
| `text_label` | `#9CA3AF` (gray-400) | `#6B7280` (gray-500) |
| `accent` | `#FFBA05` | `#FFBA05` |
| `accent_hover` | `#E6A800` | `#E6A800` |
| `accent_soft` | `#FFF3CC` | `rgba(255,186,5,0.15)` |
| `accent_hover_border` | `#FFD566` | `rgba(255,186,5,0.50)` |
| `accent_focus_border` | `#FFBA05` | `#FFBA05` |
| `accent_focus_ring` | `#FFD566` | `#FFD566` |
| `accent_on_accent_text` | `#422D00` | `#422D00` |
| `accent_selected_text` | `#7A5200` (light) / `#FFD566` (dark) | — |

> **Nota sobre botones en Miel:** El botón primario usa el mismo patrón que Rosewood — fondo oscuro (`gray-900`/`white` en dark), no el dorado. El dorado se reserva para focus rings, borders de hover, y el estado seleccionado en calendarios/dropdowns. Esto evita que el CTA principal parezca una advertencia y mantiene jerarquía clara.

Los colores semánticos de Miel son los mismos que los de Rosewood (tabla de arriba) — son colores de sistema, no de marca.

---

## 2. Tipografía

Font stack: `font-sans antialiased` (system-ui, -apple-system, Segoe UI, etc.). Sin Google Fonts, sin fuentes externas. Escala de tamaños usada en producción:

| Nivel | Clases Tailwind | Uso |
|-------|----------------|-----|
| Page title / Detail heading | `text-2xl font-bold` | Títulos principales, encabezados de panel de detalle |
| Section heading | `text-lg font-bold` o `text-lg font-medium` | Encabezados de sección dentro de modal/panel |
| Body / Input / Table cell | `text-base` | Todo texto de contenido, inputs, celdas |
| Label / Meta | `text-sm` | Labels de campo, texto de soporte, botones |
| Micro | `text-xs font-bold` | Números de día en calendario, chips pequeños |

**Regla general de casing: todos los field titles y headers usan `capitalize`, nunca `uppercase`.** Esto aplica sin excepción a labels de campo, headers de tabla y títulos de sección.

**Convención de casing para labels de campo (formularios):** `text-sm text-gray-400 capitalize mb-2 block dark:text-gray-500`. Esta es la convención activa en el código; aplica a labels de campo dentro de modales/formularios, headers de tabla y títulos de sección por igual.

**Convención de casing para headers de tabla:** `capitalize` con `text-base font-semibold text-gray-500`.

**Títulos y headers de sección:** `capitalize` (primera letra de cada palabra), nunca `uppercase`.

---

## 3. Espaciado, Tamaño y Radios

### Padding de controles

| Control | Padding |
|---------|---------|
| Input / Dropdown trigger | `px-3 py-2` |
| Dropdown option | `px-3 py-1.5` o `px-4 py-2` (linked-record) |
| Botón primario | `px-4 py-2` |
| Botón secundario | `px-3 py-1.5` |
| Badge / Pill estándar | `px-2.5 py-0.5` |
| Badge / Pill grande | `px-4 py-1.5` |
| Modal padding interior | `p-5` |
| Card padding | `p-4` |
| Filter bar | `px-7 pt-5 pb-3` |

### Radios por nivel

| Elemento | Radio |
|----------|-------|
| Input, Dropdown trigger, Card, Dropdown panel | `rounded-lg` (8px) |
| Botón estándar | `rounded-md` (6px) |
| Botón pequeño / toggle | `rounded` (4px) |
| Modal / panel flotante grande | `rounded-2xl` (16px) |
| Badge / Pill | `rounded-full` |
| Celda de día en calendario | `rounded` (4px) |
| Indicador de hoy (círculo) | `rounded-full` |

### Ancho de modales

| Tipo | Ancho |
|------|-------|
| Confirmación / simple | `max-w-[440px]` |
| Formulario estándar | `max-w-[500px]` a `max-w-[580px]` |
| Vista de detalle amplia | `w-[60vw] min-w-[560px] max-w-[60vw]` |

Todos los modales tienen `max-h-[90vh] overflow-hidden flex flex-col` para contenido scrolleable.

---

## 4. Sombras

| Estado / Nivel | Valor |
|----------------|-------|
| Botón resting | `shadow-xs` |
| Botón hover | `shadow-sm` |
| Dropdown panel | `shadow-lg` |
| Time picker / panel secundario | `shadow-md` |
| Modal | `shadow-2xl` |
| Overlay de modal | `rgba(0,0,0,0.45)` |

---

## 5. Dropdowns / Selects

Un solo componente `Dropdown` para todos los casos (filtros, edición de campo, selectores de layout). La lógica de interacción es idéntica independientemente del caso de uso.

**Trigger:**
- Estado vacío → muestra el **nombre del campo/filtro** como placeholder (p. ej. "Estatus", "Empleado"). Nunca un texto genérico como "Todos" — el nombre del filtro ya comunica qué se está mostrando (sin filtro aplicado).
- Con valor seleccionado → muestra el valor; el ícono `CaretDown` se **reemplaza** por `X` para limpiar. Nunca ambos íconos a la vez.
- El limpiado vive **dentro del trigger** (el ícono `X`) — nunca un link de texto "Limpiar" aparte, al lado o debajo del control.
- Esta misma convención (ícono que se reemplaza por `X` dentro del control, sin link de texto separado) aplica a **cualquier trigger de filtro**, sea o no un Dropdown — p. ej. un selector de fecha standalone también reemplaza su ícono por `X` cuando hay una fecha seleccionada.
- El caret rota 180° cuando el panel está abierto.
- Hover: `border-accent_hover_border`, focus: `border-accent_focus_border` + `ring-1 ring-accent_focus_ring`.

**Panel:**
- `absolute top-full left-0 mt-1 z-50`
- `rounded-lg shadow-lg border border_brand`
- `max-h-[260px] overflow-y-auto`
- Opción seleccionada: `bg-accent_soft text-accent_selected_text font-medium` — nunca checkbox, ni en single-select ni en multi-select. La fila resaltada es el único indicador de selección; no agregar `<input type="checkbox">` a las opciones aunque el dropdown acepte múltiples valores.
- Hover de opción: `hover:bg-gray-50 dark:hover:bg-white/5`.
- Nunca agregar opción "Todos" — sin selección ya significa sin filtro aplicado.
- Linked-record dropdowns incluyen campo de búsqueda interno; el panel usa `z-[70]` (para estar sobre modales).

**Multi-select:** Acepta múltiples valores; cada uno se muestra en el trigger separado por coma. El X limpia toda la selección.

---

## 6. Filtros (Layout)

- Los filtros viven en una sola fila horizontal (`px-7`), cada uno como dropdown trigger sin label externo.
- Sin "Limpiar todo" global por defecto; cada filtro se limpia con su propio `X` inline.
- El placeholder del buscador siempre lista los campos que indexa: `"Buscar por nombre, teléfono..."` — nunca `"Buscar..."` seco.
- Los nombres de campo se escriben completos en el trigger, sin abreviaturas.

---

## 7. Date Pickers

Componente `CalendarPopup` propio — sin librería externa.

**Rosewood / Pedidos:**
- Panel: `w-64` (256px), `rounded-lg border border_brand shadow-lg p-3`
- Week-start: domingo (para vista calendario de entregas).
- Hoy: `bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300`.
- Seleccionado: `bg-rose-600 text-white dark:bg-rose-500`.
- Hover: `hover:bg-rose-50 dark:hover:bg-white/5`.
- Botón "Hoy": `text-sm text-rose-600 hover:underline dark:text-rose-400`.
- Headers de día de semana: `text-sm text-gray-500`.
- Mes label: `text-base font-medium text-gray-800 capitalize`.
- z-index del panel: `z-50` (standalone), `z-[70]` (dentro de modal).

**Miel:**
- Mismo componente, misma estructura.
- Hoy: `bg-[#FFF3CC] text-[#7A5200] dark:bg-[rgba(255,186,5,0.15)] dark:text-[#FFD566]`.
- Seleccionado: `bg-[#FFBA05] text-[#422D00] dark:bg-[#FFBA05] dark:text-[#422D00]`.
- Hover: `hover:bg-[#FFF3CC] dark:hover:bg-white/5`.
- Botón "Hoy": color accent correspondiente.
- Borders del panel: `border_brand` de la paleta Miel.

---

## 8. Botones

**Botón primario (CTA):**
- Light: `bg-gray-900 text-white hover:bg-gray-700`
- Dark: `bg-white text-gray-900 hover:bg-gray-200`
- Ambas paletas usan este mismo patrón — el accent NO se usa en el botón primario.
- `rounded-md shadow-xs hover:shadow-sm transition-colors`
- Deshabilitado: `opacity-50 cursor-not-allowed`

**Botón secundario / outline:**
- `bg-white border border_brand hover:bg-black/5 rounded-md shadow-xs hover:shadow-sm`
- Dark: `bg-surface dark:border-border_brand dark:hover:bg-white/5`

**Botón icon-only (acción inline, p.ej. eliminar fila):**
- `p-0.5 rounded text-gray-400 hover:text-accent hover:bg-accent_soft transition-colors`

**Toggle de vista (Día / Semana / Mes):**
- Wrapper: `flex overflow-hidden rounded-lg border border-gray-300 dark:border-[#2E352C]`
- Activo: `bg-accent text-white` (aquí sí se usa el accent de la paleta correspondiente)
- Inactivo: `bg-white text-gray-600 hover:bg-gray-50`

---

## 9. Badges / Status Pills

```tsx
// Estructura universal
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border whitespace-nowrap {clases_de_estado}">
  {valor}
</span>

// Large variant (dentro de detail panel)
<span className="inline-flex items-center px-4 py-1.5 rounded-full text-base font-semibold border {clases}">
```

Colores por estado: ver tabla de colores semánticos en §1. Nunca inventar colores ad hoc para un estado nuevo sin agregarlos primero a la tabla de §1.

---

## 10. Layout Patterns

**Shell raíz:**
```tsx
<div className="h-screen flex flex-col overflow-hidden font-sans antialiased bg-[app_bg] dark:bg-[app_bg_dark]">
```
`overflow-hidden` en el root es obligatorio — sin él, la página hace scroll en lugar de usar el layout fijo interno.

**Estructura estándar de página:**
1. Header bar (filters + primary action) — `flex-shrink-0`
2. Contenido scrolleable — `flex-1 min-h-0 overflow-auto`
3. Footer / summary bar (opcional) — `flex-shrink-0`

**Modales:**
- Overlay: `fixed inset-0 z-[60] flex items-center justify-center p-5` con `background: rgba(0,0,0,0.45)`
- Panel: `bg-white rounded-2xl shadow-2xl dark:bg-surface_dark` con `onClick={e => e.stopPropagation()}`
- Estructura interna: header (título + X) / body scrolleable / footer (acciones right-aligned, botón primario a la derecha)

### 10b. Escala de z-index (canónica)

| Nivel | Valor | Qué va aquí |
|-------|-------|-------------|
| Dropdowns / calendarios standalone | `z-50` | Panels de filtros, date pickers fuera de modal |
| Overlay de modal | `z-[60]` | `fixed inset-0` backdrop |
| Dropdowns dentro de modales | `z-[70]` | Linked-record panels, time picker panels |

No usar otros valores — si surge un nuevo caso de layering, extender esta tabla antes de inventar un número.

---

## 11. Íconos

Paquete: `@phosphor-icons/react` exclusivamente.

| Tier | Tamaño | Uso |
|------|--------|-----|
| Inline / label | `14px` | Dentro de inputs, search prefix |
| Toolbar / filtro | `16px` | Botones del header, acciones en fila |
| Acción destacada / header | `18–20px` | CTAs principales, íconos de estado grandes |

Regla de color: los íconos heredan color del texto padre (`currentColor`) salvo que tengan un rol semántico específico (error = rose, success = green). Sin colores hardcoded en íconos decorativos.

---

## 12. Animación

- `transition-colors` duración default de Tailwind (~150ms) en hover de botones, opciones de dropdown, filas de tabla.
- Chevron/caret que rota: `transition-transform` (no `transition-all`).
- Sin animación de apertura/cierre de modales — mount/unmount instantáneo.
- Nunca `transition-all` — nombrar siempre la propiedad específica.

---

## 13. Colores de Evento en Calendario (Rosewood / Pedidos)

Los colores de evento en la vista de calendario se derivan del campo `estatus` de Airtable dinámicamente, pero se mapean a valores fijos por nombre de opción:

```ts
const EVENT_COLORS = {
  Entregado: '#16A34A', // green-600
  Pendiente:  '#DC2626', // red-600
  default:   '#9CA3AF', // gray-400
};
```

Siempre resolver dinámicamente desde el valor del campo — nunca hardcodear un mapa que pueda desincronizarse con el schema.

---

## 14. Checklist de Componentes para Interfaces Nuevas

Antes de entregar cualquier interface nueva, verificar:

- [ ] Usa el objeto de tokens LIGHT/DARK de la paleta correcta (Rosewood o Miel según la base)
- [ ] Light y dark mode completamente implementados
- [ ] `font-sans antialiased` en el wrapper raíz
- [ ] `h-screen flex flex-col overflow-hidden` en el root shell
- [ ] Un solo `Dropdown` y `CalendarPopup` compartido — sin reimplementaciones por archivo
- [ ] Botones primarios usan el patrón `gray-900/white`, no el accent
- [ ] El accent se usa en: hover borders, focus rings, selected states, toggle activo
- [ ] z-index solo de la escala de §10b
- [ ] Íconos solo de `@phosphor-icons/react`, en los tamaños de §11
- [ ] Anchos de modal solo de la escala de §3
- [ ] Colores semánticos (danger/success/warning) de la tabla de §1 — sin reinventar
- [ ] Ningún `<select>` nativo
- [ ] Ningunos breakpoints responsivos
- [ ] `transition-colors` o propiedad específica — nunca `transition-all`
