# Audit report — Prompt 4/4 (Todos view, stage board and period selector)

Status: PARTIAL (v1.10.0). Code meets the plan except the Entregado search rule, the column/chip consistency (C3) and the 4-column loading skeleton; nothing was verified on screen yet (smoke tests 1 to 15 open).

## Pending items

Run smoke test 13 (writes data, authorized by Axel) in [3210] and tell Claude so the created task can be deleted.
It is the only test that shows one order with two elements in two columns.
recY1WRFAEYXZhe50; tareas_produccion has 14 records now.

Send the correction prompt only after smoke tests 5 to 15 are done (Axel's rule).
It already includes the decisions below, so it is sent once.
Open tests: 1 (redesign), 5 to 15 in smoke-tests.md.

## Decisions by Axel (this round)

- Searched Entregado orders appear on the board even when the status filter is "Pendiente".
- Board column comes from the same function as the chip (stage after the last completed one).
- Test 13 authorized on [3210]; reports stay in pedidos/dev/sessions/ (repo convention).
- Period selector: go back to the previous switch, showing only the selected option in one container; on hover the container expands to show the full switch (Día, Semana, Mes, Todos). The dropdown is replaced. Mobile: tap expands.

## What we did

- Baseline: pedidos/source (v1.9.2, 65 files, final Prompt 3 version). It was in the repo as pedidos/source, not 7_canvas/canvas-sandbox/ (that path does not exist). The contracts file and the learnings file were in the repo (pedidos/dev).
- Transcript: compared against pedidos/transcript.md; only the new messages (lines 6045-6181) were read: the Prompt 4 text, "Build it" and the final report.
- Export: unzipped to a temp folder and ran diff -rq against the baseline. Changed: README.md, MANIFEST.json, index.tsx, lib/changelog.ts, produccion/semaforo.ts. New: components/PeriodSelect.tsx, components/TableroEtapas.tsx. Unchanged: lib/airtable-hooks.tsx (30 s refresh), package.json, components/Calendar.tsx, PedidoDetailModal.tsx, ElementoDetalle.tsx, PedidoTareasSection.tsx, StageTracker.tsx, Produccion pages, finanzas. The ZIP README equals the attached readme_4.md (full README, not the "minimal" one Canvas mentions in chat).
- Count: MANIFEST.json lists 67 files and the ZIP has 67 (set difference empty). Canvas wrote 106 in chat; the ZIP number (67) is the correct one.
- Part A: item 1 PASS, item 2 PARTIAL, item 3 PASS, item 4 PASS. Acceptance criteria: 4 PASS, 1 PARTIAL (Entregado search).
- Contracts: C1 OK, C2 OK, C3 PARTIAL, C4 OK, C5 OK, C6 OK.
- Read-only Airtable check: 11 tables and 2 automations, same as the Prompt 3 report; no new fields, formulas or rollups.
- On-screen results so far (Axel): test 1 works but needs the redesign above; tests 2, 3 and 4 OK from screenshots (4 partly: counts and the 3 cards of [3413] not yet seen).
- Tests 5 and part of 6 OK from screenshots: Entregado orders are absent from the board without search; with search "elizabe" (7 cards) and "alice" (1 card) they show in Empacado, green, chip "Entregado". Still open in 6: clearing the text and the "Pendiente"-only case (fixed by decision 1).
- Not run: tsc (no dependencies installed in this environment) and any on-screen test.

## Part A detail

1. Period selector. PASS. PeriodSelect.tsx:5-6 (4 options), :27-37 (only chosen option + caret, h-10), :26 hover on desktop only (matchMedia hover), :28 click, :29-33 keyboard, :17-19 outside tap closes; index.tsx:105-109 and :154 persist the choice (default "dia"); index.tsx:348-377 hides arrows, date picker and "Hoy" in Todos; search and filter untouched.
2. Todos view. PARTIAL.
   - PASS: 4 columns and names (semaforo.ts:91), one card per element (semaforo.ts:136-141), Entregado column Empacado (semaforo.ts:98), sort by production date with undated last (TableroEtapas.tsx:15-16; FECHA_ENTREGA = fldc9PHWWrc4ThY6x), card content (TableroEtapas.tsx:39-42), counts (:28), mobile snap (:23, :25), elements without stages omitted (semaforo.ts:70, :140), live update (semaforo.ts:152 dependencies), search and status filter (index.tsx:193-200), read-only.
   - PARTIAL: Entregado matches do not show with the default status filter (index.tsx:193 before :196); the column is computed apart from the chip (semaforo.ts:97-104); the first load shows the Día table skeleton, not 4 column skeletons (index.tsx:401 renders PedidosContentSkeleton; TableroEtapas.tsx:31-32 only shows its skeleton after data arrives).
3. Día Lista / Tablero. PASS. index.tsx:110-116 (default "lista", persisted), :384-390 (toggle), :411 (board), :194 (same date criterion as the list, index.tsx:170), :415 (list kept).
4. Semana and Mes. PASS. Calendar.tsx identical to v1.9.2; index.tsx:497-511 unchanged apart from view type.

Acceptance criteria: selector PASS; Todos 4 columns sorted PASS; two elements in two columns PASS (code; smoke test 13); Día toggle limited to the day PASS; Entregado absent except on search PARTIAL.

## Contracts

- C1 OK: stages come from Elemento.etapas (semaforo.ts:70, :97); no new product rule.
- C2 OK: names in semaforo.ts:91-92 match Airtable.
- C3 PARTIAL: card color and chip use calcSemaforoElemento (semaforo.ts:139), but the column uses a second completion loop (semaforo.ts:97-104).
- C4 OK: Terminado only (semaforo.ts:75, :101).
- C5 OK: card style from semaforoStyle (TableroEtapas.tsx:37) and EtapaChip (:42). Neutral chrome classes (:25, :32) are not stage colors.
- C6 OK: no Airtable fields; last value kept (semaforo.ts:134, :142; TableroEtapas.tsx:31). Note below on stale cache.

## Regression (No tocar)

OK by diff: tables, fields, select options, automations (11 tables, 2 automations); saved values; field IDs (utils.ts unchanged); Finanzas, cake toppers, receipts; Producción page; Semana, Mes, order detail, element detail; existing search and filters (only the Entregado board rule is new); UI texts (only new texts: "Lista", "Tablero", "Todos", "Sin elementos."). Dark mode and mobile: classes include dark variants, not tested (decision: theme tests left for the final app).

## Non-blocking observations

- Desktop click: hover already opens the list, so a click closes it (PeriodSelect.tsx:26, :28). Tab away does not close the list (no blur handler).
- The Día toggle shows the current form ("Lista"/"Tablero"), not the action; the title says the action.
- semaforo.ts:134: if the last element of an order is deleted, the cached cards stay (same pattern as pedido(), semaforo.ts:126).
- ultimoTablero is written during render (same as the existing cache).
- The search text clears when clicking outside the search box (existing mousedown handler, index.tsx:140-143), so the Entregado cards vanish as soon as you click the board.
- Board search does not match typed dates (Canvas disclosed it); the search dropdown does.
- Board skeleton uses gray classes (TableroEtapas.tsx:32) outside the color map; neutral placeholder.
- Canvas could not view the new screens (403 in its preview): nothing was seen rendered.
- pedidos.estatus description (fldxy88bESBs57F9r) still says its color is used on cards (carried over).

## Version history

- v1.10.0 (2026-10-05): period selector, Todos board, Día Lista/Tablero. Audited by code; on-screen tests open. Replaced pedidos/source (67 files), README and transcript in the repo.

## Schema and automation changes

None created or changed. Read-only check: 11 tables, 2 automations (autoincrement of note number; weekly projected payroll), unchanged.

## Learnings

- Compute every derived value (stage, color, column) in one function; a second loop for the column already diverges from the chip.
- A filter that runs before a search can silently defeat a rule that says "search overrides". Check the order of filters in specs with exceptions.
- Loading states must reuse the shape of the final view (4 column skeleton), not a generic one.
- Canvas file counts in chat are unreliable; use the ZIP and MANIFEST.json.

## Data created or changed

None so far. tareas_produccion has 14 records (verified read-only). If smoke test 13 is confirmed, one task will be created in [3210] and deleted; its ID will be recorded here.
