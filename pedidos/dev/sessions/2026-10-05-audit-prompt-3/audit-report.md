# Audit report — Prompt 3/4 (traffic light and stage labels)

Status: PARTIAL (v1.9.1 audited by code; screen tests pending). v1.9.0 meets the plan in code and in screen tests, but contracts C3 and C4 are violated, one color is loose in a component, and the traffic light goes blank and updates late after a write. A correction prompt for v1.9.1 is ready and not yet sent.

## Pending items

1. Key message: Send the correction prompt to Canvas and audit v1.9.1.
   Argument: 2 FAIL (C3, C4), 1 PARTIAL (loose colors) and a loading defect remain.
   Supporting data: StageTracker.tsx:14,18 (C3); PedidoTareasSection.tsx:207-226 (C4); Calendar.tsx:171 and semaforo.ts:21 (C5); useProduccionData.ts:67 and index.tsx (loading).

2. Key message: Ask Canvas for a real MANIFEST.json in the next export.
   Argument: v1.9.0 shipped without one, so the file list cannot be confirmed; the audit used diff -rq instead.
   Supporting data: 64 files in the ZIP (63 in v1.8.4 plus produccion/semaforo.ts); Canvas reported 63.

3. Key message: Decide later whether Mes cards should show the full stage name on small widths.
   Argument: The stage text is truncated in Mes ("Hornea…", "Embetunado…"); Axel chose not to include it in the correction.
   Supporting data: Calendar.tsx:179 (shown only from the sm breakpoint) and screenshot 3 of the smoke tests.

## What we did

- Compared the v1.9.0 export against the v1.8.4 baseline with diff -rq: only README.md, lib/changelog.ts, index.tsx, components/Calendar.tsx, components/PedidoDetailModal.tsx, produccion/ElementoDetalle.tsx and produccion/PedidoTareasSection.tsx changed, plus the new produccion/semaforo.ts. lib/airtable-hooks.tsx (30 s refresh) and package.json are identical to v1.8.4.
- Audited Part A items 1 to 4: 1 PASS, 2 PARTIAL (palette hex values replaced by Airtable colors, accepted by Axel), 3 PARTIAL (order-detail line, Mes mobile text), 4 PASS. All 5 acceptance criteria PASS.
- Audited contracts: C1 and C2 OK; C3 FAIL (StageTracker.tsx:14,18); C4 FAIL (PedidoTareasSection.tsx:207-226); C5 PARTIAL (loose fallback color at Calendar.tsx:171, unused "airtable" field at semaforo.ts:21).
- Read-only schema check: 11 tables, 2 automations, no new fields or formulas for the traffic light.
- Consolidated the smoke tests from 20 to 6 open and finally closed all: tests by view (Día, Semana, Mes) instead of by client. Reusable set in pedidos/dev/test-records.md.
- Smoke test results: all pass except test 19 (partial failure): after pressing "Sí" on a stage the list and card go blank ("—", neutral card) and the new stage appears late, without reload. The same blank state showed on first load of the Día view and in the order pop-up (tests 7 and 8, later fine). Probable cause: when the product name has not arrived, readLinked falls back to the record id (utils.ts:197) and etapasDeProducto returns no stages (semaforo.ts:65); useProduccionData.ts:67 also does not wait for the elements table and index.tsx ignores semaforo.loading.
- Decisions by Axel: stage stays as dot plus text (no chip); theme tests left for the final app; Mes text truncation not included in the correction.

## v1.9.1 audit (correction round)

- Export: diff -rq against v1.9.0 shows 10 changed files plus the new MANIFEST.json (README.md, components/Calendar.tsx, components/airtableColors.ts, index.tsx, lib/changelog.ts, lib/downloads.ts, produccion/PedidoTareasSection.tsx, produccion/StageTracker.tsx, produccion/semaforo.ts, produccion/useProduccionData.ts). lib/airtable-hooks.tsx and package.json identical. MANIFEST.json lists 65 files and the ZIP has 65 (match). Canvas wrote 103 files in its chat message; the delivered ZIP has 65.
- Type check (tsc --noEmit): only the 2 errors that already exist in v1.9.0 (missing generated sourceBundle).
- Correction items: 1 line "Etapa actual" PASS (same semáforo function, PedidoTareasSection.tsx:206-208, 218-220); 2 Tracker C3 PASS (StageTracker.tsx:13-17); 3 loose colors PASS (SEMAFORO_NEUTRO, semaforo.ts:34-40; "airtable" field removed); 4 blank/late traffic light PARTIAL: Día list and cards show a loading bar and keep the last value (semaforo.ts:81-106, index.tsx:399,440, Calendar.tsx:179,199) but the order pop-up Elementos "Etapa" column still shows "—" while loading (PedidoDetailModal.tsx:350-351 unchanged).
- Contracts: C1 OK, C2 OK, C3 OK, C4 OK, C5 OK (the neutral card class in index.tsx:396 remains outside the map; resolveAirtableColor in airtableColors.ts:56 is unused).
- Observations: the line now also shows for Entregado and "No iniciado" orders; elementIds filter dropped from that line; useProduccionData now also loads the Catálogo table (extra fetch per instance, shared with Producción); the "ultimo" cache is written during render (semaforo.ts:81-103).
- Repo: pedidos/source, README and transcript replaced with v1.9.1 (65 files).
- Open: screen tests 21 to 26 in smoke-tests.md.

## Version history

- v1.9.0 (2026-10-05): traffic light in Pedidos (audited here). Replaced pedidos/source, README and transcript in the repo; old exports removed.
- v1.9.1 (2026-10-05): correction audited by code, screen tests pending.

## Schema and automation changes

None created or changed by Canvas. Verified read-only: 11 tables and 2 automations ("Pedidos — Autoincremento de Número de Nota", weekly payroll) unchanged. Note: the description of pedidos.estatus (fldxy88bESBs57F9r) still says its color is used on cards.

## Learnings

- Test by view, not by client: one pass over Mes covers all colors at once. Use the fixed set in pedidos/dev/test-records.md.
- Check loading states: a derived value (traffic light) must keep its last value while data refetches and must not render empty.
- Closed items go to the end of each file, struck through.
- Baseline comparison needs the previous version in the repo; keep only the latest version afterwards.

## Data created or changed

Created by Claude in tareas_produccion (tblESlAFi4WqHlJtk), all Terminado, Origen Manual, authorized by Axel, all deleted on 2026-10-05:
- [4152] recQn00xkwSusqXk1: recrEBnNocx5zit9G.
- [4120] recvBRPY8mGxx4Jwu: rec0RJ2n5FnVQNcZb, reczJNoa7pvG1ya2t.
- [4162] rec6CfqDdQE6OsZHI: recnrUUUThKIlVEu2, rec2Mzcbd2HCmwy9O.
- [4159] recfrBAAB0z7jRot4: rec4cTgdQJ8IDWjZU, recx58rzi3Wbvef7v, recL8bxqUf8PsEaT4.
- [4084] recZrcshhUS9QhoV6: recEE9Rhox60kNs0B, rec5eTOqdCZgJTCjk, recUpym5rsNWwSa0i, recWQHkxh5CEAXiKK.
- [3210] recY1WRFAEYXZhe50: rec9hTvx9o6h1G2TO, recKFgMGso71HrKvp, recGGBUcZSsJ4wnPG.
Created by Axel during test 19 in [4161] recpD5i15hQsj0PSl (deleted by Claude): recHaXSVtgH5dpMfl (Horneado), recOhChQZh9O0Z34L (Embetunado).
Final state verified: tareas_produccion has 14 records, as before the audit.
