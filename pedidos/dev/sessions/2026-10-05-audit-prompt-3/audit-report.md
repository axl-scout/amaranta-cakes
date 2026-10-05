# Audit report — Prompt 3/4 (traffic light and stage labels)

Status: PASS (v1.9.2). All correction items are done and verified on screen; the findings of v1.9.0 (C3, C4, loose colors, blank traffic light) are fixed. Open notes below are non-blocking.

## Pending items

1. Key message: Send the next prompt (Prompt 4) using pedidos/dev/test-records.md as the fixed test set.
   Argument: The set covers each color, multi-element, Entregado and no-traffic-light cases and avoids testing with 20 different clients.
   Supporting data: 14 standard records in pedidos/dev/test-records.md; contracts C1 to C5 in contracts-and-no-tocar.md.

2. Key message: Ask Canvas for a real MANIFEST.json (done in v1.9.1) and keep the file count equal to the ZIP.
   Argument: Canvas reported 103 files in chat but the ZIP and MANIFEST.json have 65.
   Supporting data: MANIFEST.json (65 entries) and diff -rq.

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

## v1.9.2 audit (chip correction)

- Export: diff -rq against v1.9.1 shows 7 changed files plus MANIFEST.json (README.md, components/PedidoDetailModal.tsx, index.tsx, lib/changelog.ts, produccion/ElementoDetalle.tsx, produccion/PedidoTareasSection.tsx, produccion/semaforo.ts). Calendar.tsx unchanged (cards stay plain text). MANIFEST.json lists 65 files and the ZIP has 65. Canvas wrote 103 in chat; the ZIP has 65. tsc: only the 2 pre-existing errors.
- Chip correction PASS: one shared EtapaChip (semaforo.ts:59-66, strong tone of the single map) used by the Día list (index.tsx:440), Elementos column (PedidoDetailModal.tsx:351), element header (ElementoDetalle.tsx:73) and the "Etapa actual…" line (PedidoTareasSection.tsx:218). Verified on screen in smoke test 21 (screenshots 29 and 30).
- Open: screen tests 22, 23, 25, 26 in smoke-tests.md.

## Version history

- v1.9.0 (2026-10-05): traffic light in Pedidos (audited here). Replaced pedidos/source, README and transcript in the repo; old exports removed.
- v1.9.1 (2026-10-05): correction audited by code and partly on screen (tests 21 and 24 OK).
- v1.9.2 (2026-10-05): stage chip everywhere; audited by code and on screen, all smoke tests OK. Final version for Prompt 3.

## Schema and automation changes

None created or changed by Canvas. Verified read-only: 11 tables and 2 automations ("Pedidos — Autoincremento de Número de Nota", weekly payroll) unchanged. Note: the description of pedidos.estatus (fldxy88bESBs57F9r) still says its color is used on cards.

## Learnings

- Test by view, not by client: one pass over Mes covers all colors at once. Use the fixed set in pedidos/dev/test-records.md.
- Check loading states: a derived value (traffic light) must keep its last value while data refetches and must not render empty.
- Closed items go to the end of each file, struck through.
- A shared component (EtapaChip) keeps the same display across views and makes later visual changes one-file edits.
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
Created for the v1.9.2 round (authorized by Axel, Terminado, Origen Manual) and deleted on 2026-10-05: [4120] rec4rZeA3OFQmZ51J, recB2gJt3uj5nqQ22; [3210] recxRDFxqxjHS0RUP, recIQLk3tgh0m7gY2, reczj7tInX1TvB0wc; [4162] recTogDsMTHjPXeS2 (Horneado 30 of 60); and by Axel in [4161] recGY71JMDn7TGzlC.
Final state verified: tareas_produccion has 14 records, as before the audit.
