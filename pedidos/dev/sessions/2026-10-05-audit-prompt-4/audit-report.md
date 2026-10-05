# Audit report — Prompt 4/4 (Todos view, stage board and period selector)

Status: PASS (v1.11.2). Final version for Prompt 4. All items and contracts pass; screen tests 23, 24 and 25 (element detail, navigation and update after "Sí") are closed. Only the cleanup of the test tasks of test 25 is pending (Airtable rate limit).

Previous status: PASS (v1.11.1).

Previous status: PARTIAL (v1.11.0; v1.10.0 audited first below). All correction items pass by code and the selector passes on screen; the board update after "Sí" (item 4) still needs test 22, and the Canvas reply with its cause is missing.

Previous status: PARTIAL (v1.10.0). Code meets the plan except the Entregado search rule, the column/chip consistency (C3) and the 4-column loading skeleton; nothing was verified on screen yet (smoke tests 1 to 15 open).

## Pending items

Claude deletes the two test tasks that smoke test 25 left in [3210] and confirms tareas_produccion is back to 14 records.
The Airtable API returned rate-limit errors (429) on every attempt after the test, so the cleanup is still pending; the tasks are Terminado, Manual, linked to Pastel 20 pax recscT1PSK1PEkfU1.
Order recY1WRFAEYXZhe50; tareas_produccion should have 14 records after the cleanup.

## Decisions by Axel (this round)

- (Replaced) Searched Entregado orders no longer appear on the board: the search bar only opens its match list in every view (Todos included) and never filters the page. Entregado orders are never on the board.
- Board column comes from the same function as the chip (stage after the last completed one).
- Test 13 authorized on [3210]; reports stay in pedidos/dev/sessions/ (repo convention).
- Test 13 failed: the board must move a card right after "Sí" on a stage, and Canvas must diagnose why it did not.
- First-load skeleton with 4 columns goes into the correction (Axel: ask for it).
- Mobile side menu becomes a burger menu, in a separate prompt (Axel: do it now).
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
- Tests 6 (rest), 7, 8, 9, 10, 11 and 12 OK (Axel; screenshots 11 to 15). Test 8 passes on screen although the code shows the Día table skeleton at first load (index.tsx:401); kept as an observation, not in the correction. Axel also reported that the search bar does not filter Día, Semana and Mes, and that the mobile menu should use the burger (pending items above).
- Test 13 FAIL on screen (confirmed by a second screenshot minutes later) (screenshot 17 taken after "Sí"): the board did not move Pastel 20 pax to Embetunado / Glaseado. Data is correct in Airtable; by code the overlay (useProduccionData.ts:202-207, PedidoTareasSection.tsx:285) and the refetch broadcast (useProduccionData.ts:263-267) should update every mounted instance, so the cause is not clear from code (possible stale ultimoTablero cache, semaforo.ts:134, or a refetch that does not reach the board). Goes to the correction prompt as a Canvas diagnosis. Test 14 OK (Axel).
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

## v1.11.0 audit (correction round)

- Export: diff -rq against v1.10.0 shows 7 changed files plus MANIFEST.json (README.md, components/PeriodSelect.tsx, components/SideMenu.tsx, index.tsx, lib/changelog.ts, produccion/semaforo.ts, produccion/useProduccionData.ts). No new files. lib/airtable-hooks.tsx, package.json, Calendar.tsx, TableroEtapas.tsx, PedidoDetailModal.tsx, ElementoDetalle.tsx, Producción and Finanzas pages are identical. MANIFEST.json lists 67 files and the ZIP has 67 (match). README of the ZIP equals the attached readme_5.md.
- Correction items: 1 selector PASS (code; Axel confirmed on screen: works), 2 column from the same function PASS (semaforo.ts:77-87 returns columna from calcSemaforoElemento; columnaElemento removed; consistent with chip), 3 search only opens the list PASS (index.tsx:184-198 no text filter, Entregado always skipped at :191), 4 board update after "Sí" PARTIAL (no root cause reported; code removes the freeze caused by any element with productoPendiente, semaforo.ts:129-145, but the real cause is unconfirmed; needs test 22), 5 4-column skeleton PASS (index.tsx:395 skips the table skeleton in Todos and Día > Tablero; TableroEtapas shows its skeleton while loading), 6 last element deleted PASS (semaforo.ts:131-132, 145 and elementoOculto in useProduccionData.ts:45).
- Mobile menu prompt: PASS by code. SideRail is hidden below sm (SideMenu.tsx:39); MobileMenu (SideMenu.tsx:77-125) renders a 40 px hamburger inside PageToolbar (SideMenu.tsx:133), so it shows on Pedidos, Producción and Finanzas; panel closes on choosing, outside tap and Escape; theme and download inside. Desktop unchanged.
- Contracts: C1 OK, C2 OK, C3 OK (column, color and stage from calcSemaforoElemento), C4 OK, C5 OK, C6 OK (last value kept per element only while its product is pending, semaforo.ts:136-143).
- Schema: read-only check 11 tables, 2 automations, tareas_produccion 14 records.
- Observations: the expanded switch is 20 rem wide and anchors to the left below lg (PeriodSelect.tsx:41), so on a phone it may overflow the right edge (test 16); Producción and Finanzas toolbars also gained the hamburger on mobile (intended by the menu prompt); Canvas reply missing from the transcript; tsc not run.
- Test 20 (board update): first step OK on screen (Pastel 20 pax moved to Embetunado / Glaseado instantly, Horneado 51 to 50); second step FAIL: the element detail showed "Pedido —" and an endless loading bar for minutes, later loaded but "Pedido" stayed "—". Test 17 OK (Alice shows when the filter includes Entregado). Test 19 OK. Axel decides the search list must find all orders regardless of the status filter. Correction prompt not sent yet. Test task recFGj4VR1d7JqW9J deleted (tareas_produccion verified at 14 records afterwards).
- Test 16 (mobile selector) FAIL on screen (screenshot 20): the expanded switch does not fit on a phone; Axel decides: dropdown on mobile, expanding switch on desktop. Goes to the correction prompt.
- Smoke tests consolidated from 9 open to 5 (17 to 21): Todos pass (skeleton, search, Entregados), Día/Semana/Mes search, menu (mobile and desktop), the one write test (20, [3210]) and the mobile selector retest (21). The last-element deletion test was dropped (covered by code).

## v1.11.1 audit (second correction round)

- Export: diff -rq against v1.11.0 shows 6 changed files plus MANIFEST.json (README.md, components/PeriodSelect.tsx, index.tsx, lib/changelog.ts, produccion/ElementoDetalle.tsx, produccion/useProduccionData.ts). lib/airtable-hooks.tsx, package.json, semaforo.ts, TableroEtapas.tsx, SideMenu.tsx, Calendar.tsx and the Producción and Finanzas pages are identical. MANIFEST.json lists 67 files and the ZIP has 67 (match). Canvas wrote 106 in chat; the ZIP has 67. The README of the ZIP equals the attached readme_6.md. tsc not run.
- Correction items: 1 mobile selector PASS (PeriodSelect.tsx: PeriodDropdown below sm, PeriodSwitch from sm; desktop code unchanged; seen on screen, captures 40 and 41), 2 element detail PASS (ElementoDetalle.tsx takes "Pedido" from the element's own link; useProduccionData.ts keeps a shared cache of the last good elements, tasks and order info, and coalesces PROD_EVENT reloads in 300 ms; seen on screen, test 20 with Horneado and Embetunado), 3 search finds all orders regardless of status PASS by code (index.tsx removes the status check from the search list; screen test 22 pending).
- Contracts: C1 to C6 OK (semaforo.ts unchanged; the cache only keeps the last good values, C6).
- Schema: read-only check 11 tables, 2 automations (autoincrement and weekly payroll), tareas_produccion 14 records; field names, types and counts match the Prompt 3 report.
- Observations: Canvas reported that the preview went blank and the published app failed with "Failed to load the compiled bundle" during this round (compiled files missing; it rebuilt them); the bundle weighs about 15.5 MB, about 11 MB of it a debug map; the published app worked; the cache in useProduccionData.ts is module-level and never cleared (stale data only until the first load finishes); the element detail preload was not part of the sent prompt.

## v1.11.2 audit (preload round)

- Export: diff -rq against v1.11.1 shows 1 code file changed (produccion/useProduccionData.ts) plus README.md, lib/changelog.ts and MANIFEST.json. Everything else is identical, including lib/airtable-hooks.tsx, package.json, ElementoDetalle.tsx, semaforo.ts and the pages. MANIFEST.json lists 67 files and the ZIP has 67 (match); Canvas wrote 110 in chat, the ZIP has 67. README of the ZIP equals the attached readme_7.md. The transcript includes Canvas's reply. tsc not run.
- Item 1 (element detail preload) PASS (code and screen: tests 23, 24 and 25 OK, Axel): instead of preloading when an order opens, Canvas shares one download between all instances: the first mounted instance becomes the "leader" and downloads the seven tables (useProduccionData.ts:63-136); the others read the leader's records through a module-level store and a window event, and reload requests are forwarded to the leader (:338-350). A new instance starts with the shared data, so the element detail and the order should open complete. Risks to verify: leader hand-off when the leader unmounts (cleanup dispatches an event and another instance claims), leader chosen during render (useState initializer), first-load bar if an element opens before the first download ends (Canvas disclosed it), and the instant update after "Sí".
- Contracts: C1 to C6 OK (semaforo.ts and the display components unchanged; shared data keeps the last good values, C6). No Airtable writes.
- Schema: read-only check on 2026-10-05: 2 automations unchanged, tareas_produccion 14 records; tables not listed again this round because the prompt was read-only and only a hook changed.
- Screen tests: 23 (element detail opens complete and instantly), 24 (Pedidos, Producción and Finanzas load without hanging) and 25 (Horneado and Embetunado "Sí" update the detail and move the card) all OK. Nothing open except the test-task cleanup.

## Version history

- v1.11.2 (2026-10-05): shared one-time data download so the element detail opens complete; audited by code (1 code file changed, 67 files); screen tests open. Replaced pedidos/source, README and transcript in the repo.
- v1.11.1 (2026-10-05): mobile dropdown selector, element detail loads complete, search finds all orders; audited by code (6 files changed, 67 files) and on screen. Replaced pedidos/source, README and transcript in the repo. Final version for Prompt 4.
- v1.11.0 (2026-10-05): correction round plus mobile burger menu; audited by code (7 files changed, 67 files); selector confirmed on screen. Replaced pedidos/source, README and transcript in the repo.
- v1.10.0 (2026-10-05): period selector, Todos board, Día Lista/Tablero. Audited by code; on-screen tests open. Replaced pedidos/source (67 files), README and transcript in the repo.

## Schema and automation changes

None created or changed. Read-only check: 11 tables, 2 automations (autoincrement of note number; weekly projected payroll), unchanged.

## Learnings

- Compute every derived value (stage, color, column) in one function; a second loop for the column already diverges from the chip.
- A filter that runs before a search can silently defeat a rule that says "search overrides". Check the order of filters in specs with exceptions.
- Loading states must reuse the shape of the final view (4 column skeleton), not a generic one.
- Canvas file counts in chat are unreliable; use the ZIP and MANIFEST.json.

## Data created or changed

Test 13 (authorized by Axel): task rechbrn8oPFAgZV9d created by Axel in tareas_produccion (Horneado, Terminado, Manual, element recscT1PSK1PEkfU1, order recY1WRFAEYXZhe50) and deleted by Claude on 2026-10-05 (action actGTSnkgDp3fe5F1).
Test 20 repeated after the correction prompt (authorized by Axel): tasks reclUhME2lqff6KmH (Horneado) and recHgU2TypJNh2Zu6 (Embetunado), both Terminado and Manual, created by Axel for Pastel 20 pax (recscT1PSK1PEkfU1) of [3210]; deleted by Claude on 2026-10-05 (action actOTC9PrPphZDwVZ). Verified read-only afterwards: tareas_produccion has 14 records.
None other so far. tareas_produccion has 14 records (verified read-only). If smoke test 13 is confirmed, one task will be created in [3210] and deleted; its ID will be recorded here.
