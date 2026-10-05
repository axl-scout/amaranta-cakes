# Smoke tests — Prompt 2/4 (element detail and tasks)

Export under test: v1.5.0 (2026-10-05). Base: Production (`appSQk87nF0WpH2gi`).
Status: tests 10-28 pending. Closed sets go at the end of the file (tests 1-9 done).

Rules
- Tests 1-23 only open screens. Close pop-ups by clicking the dark area, without pressing "No" or "Sí".
- Tests 24-28 write to Production and run only on [3413] Rosaura Avila (`rec3OES0NemnxyyzY`).
- "Vista" selector in Producción: Día, Todos (week layout), Grandes, Regulares.

## [4160] Alice (`rec2FnINtW50a2LFW`) — open 30 Sep 2026 (search "4160" if hidden)

| # | Test | Expected | Status |
|---|---|---|---|
| 10 | Element "Galletas" detail | 4 checks, no clickable stage, progress 50/50 | Pending |
| 11 | Order detail | No "Etapa actual…" line | Pending |
| 12 | Producción > "Todos" > week 28 Sep-4 Oct > search "Fátima" | One chip, Glas. 50/50 on Fri 2 Oct | Pending |

## [4074] Gaby (`recE62HJlH9SaIUoE`) — open 1 Oct 2026

| # | Test | Expected | Status |
|---|---|---|---|
| 13 | Order detail, section Producción | 3 tasks with "—" in "Elemento" | Pending |

## [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`) — search "4148"

| # | Test | Expected | Status |
|---|---|---|---|
| 14 | Open element "Galletas" | Today: Horneado current, Empacado pending. After correction: 4 stages shown complete (display only, no records created) | Pending |

## [3413] Rosaura Avila (`rec3OES0NemnxyyzY`) — open 15 Oct 2026, read-only

| # | Test | Expected | Status |
|---|---|---|---|
| 15 | Element Pastel 50 pax | 4 stages with Embetunado, "Sin tareas." | Pending |
| 16 | Element Cupcakes | Same 4 stages | Pending |
| 17 | Element Galletas | Stages with Glaseado, Cantidad "—" | Pending |
| 18 | Order detail | Line "Horneado · (element)" | Pending |
| 19 | "+" new element, no save | No task section for Calendario / Caja de repostería; 4 rows for Pastel, Cupcakes, Galletas | Pending |
| 20 | Cantidad 25 | Rows with Cant. 25, Pendiente, title "[3413] Rosaura Avila · Etapa · 25" | Pending |
| 21 | Date pickers in the form | Enabled only 5-15 Oct; last picked date wins | Pending |
| 22 | Type "fa" in Empleado | Only "Fátima" | Pending |
| 23 | Change product to "Pastel 5 pax" | Keeps employee and dates of matching stages | Pending |

## [3413] Rosaura Avila (`rec3OES0NemnxyyzY`) — WRITES to Production

| # | Test | Expected | Status |
|---|---|---|---|
| 24 | Pastel 50 pax, "Decorado", "No" | 1 Pendiente task, no employee; no duplicate on repeat | Pending |
| 25 | Same element, "Decorado", "Sí" | Horneado, Embetunado, Decorado Terminado; order detail updates without reopening (known failure today) | Pending |
| 26 | Cupcakes, "Empacado", "Sí" | 4 tasks Terminado | Pending |
| 27 | New element Galletas x2, click "Crear" twice | 1 element, 4 tasks, no duplicates | Pending |
| 28 | Change Inicio of the test 27 Horneado task to 9 Oct | "Cambios guardados" | Pending |

Cleanup after 24-28: delete the created tasks, then the element from test 27. Final state: 0 tasks and 3 elements in [3413].

# Closed sets

## [4128] Sara (`recZCPIvYm7J76UX1`) — open 1 Oct 2026 in Pedidos

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | Pedidos > open order > click row "Galletas" | Element detail opens: Cantidad 10, button "Editar" | OK |
| 2 | Tracker in the element detail | Horneado current, the rest gray | OK |
| 3 | Task table in the element detail | 4 rows, no "Elemento" column, Empacado "Sin asignar" | OK |
| 4 | Order detail, section Producción | Line "Horneado · Galletas" and table with "Elemento" column | OK |
| 5 | Click the Empacado row | Task form with "Sin asignar" | OK |
| 6 | Open start and end date pickers | All days disabled (delivery 1 Oct, task created 2 Oct) | OK |
| 7 | Click Glaseado circle, close the mini pop-up "¿Completar tarea?" by clicking outside | Nothing changes | OK |
| 8 | Producción > vista "Todos" > week 5-11 Oct > search "Lalo" | Only Lalo's 2 tasks on Mon 5; text cleared, all return | OK |
| 9 | Producción > vista "Día" > Fri 2 Oct > search "Ale" | Ale with 2 tasks (1 done: [4160] Alice Horneado); no load % and no "Capacidades" | OK |
