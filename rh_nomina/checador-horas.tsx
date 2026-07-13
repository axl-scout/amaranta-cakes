import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  initializeBlock,
  useBase,
  useRecords,
  useCustomProperties,
} from '@airtable/blocks/interface/ui';
import { Table, Record as AirtableRecord } from '@airtable/blocks/interface/models';
import {
  UploadSimpleIcon,
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
  SpinnerIcon,
  XIcon,
} from '@phosphor-icons/react';

const FIELD_IDS = {
  EMPLEADOS_NUMERO_DE_EMPLEADO: 'fldtsIcGB618YwyOq',
  EMPLEADOS_NOMBRE_PREFERIDO: 'fldGfJeg01obJiDtE',
  EMPLEADOS_ESTATUS: 'fldkwxY2gWZBKSdId',
  CH_EMPLEADO: 'fldrMMPnZCpIk9ugJ',
  CH_ENTRADA: 'fld0kpZvjnYuc7xQG',
  CH_SALIDA: 'fldPsPujWCDvZDLfH',
  CH_SALARIO_POR_HORA: 'fldZiyFvrxp9w9jB3',
  CH_HORAS_LABORABLES: 'fldcrVMKD2i0cnRlD',
  CH_HORAS_ORDINARIAS: 'fldueLQHfD1dCEUM9',
  CH_HORAS_EXTRA: 'fldevmTTeZYuI0gLU',
  CH_NOMINA: 'fldynty28KdzwAR1c',
  NOMINA_CONTROL_HORARIO: 'fldRpnEkaWG7nPlei',
  NOMINA_SALARIO_POR_HORA_LOOKUP: 'fldAOqUq8L6YFOk6N',
  NOMINA_SALARIO_POR_HORA: 'fldcIgwyl0dfYGS1P',
  NOMINA_PAGO_DE_NOMINA: 'fld5cla35OoJhK1xC',
  NOMINA_EMPLEADO_LOOKUP: 'fldBa7MqXLRcdjy5w',
  NOMINA_SEMANA_LOOKUP: 'fld4wtM9gjNNvbayk',
  NOMINA_INICIO_SEMANA: 'fldbhJaHQKJI0Rb5J',
  NOMINA_PAGADO: 'fldLYTNNnSlJmye1d',
  NOMINA_FALTANTE: 'flduXrn2ouC5lVmMl',
  NOMINA_STATUS: 'fldtQXgaJaAQ9h7Uu',
} as const;

const EMPLOYEE_NUMBERS_EXCLUDED = [5, 6, 7];

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatFechaLarga(fecha: string): string {
  const [year, month, day] = fecha.replace(/\//g, '-').split('-');
  const mes = MESES_ES[parseInt(month ?? '', 10) - 1];
  if (!year || !day || !mes) return fecha;
  return `${day} de ${mes} de ${year}`;
}

function parseFechaToDate(fecha: string): Date | null {
  const [year, month, day] = fecha.replace(/\//g, '-').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

// El reporte del checador puede exportar la fecha como YYYY-MM-DD o como
// DD/MM/YYYY (formato regional), y a veces con un componente de hora pegado.
// Sin normalizar a YYYY-MM-DD aquí, parseFechaToDate asume el orden equivocado
// y la semana calculada queda mal, mezclando días de semanas distintas en el
// mismo record de Nómina.
function normalizeFecha(raw: string): string | null {
  const trimmed = raw.trim().split(/[ T]/)[0] ?? '';
  const parts = trimmed.split(/[\/\-]/).map(p => p.trim());
  if (parts.length !== 3) return null;

  const [a, b, c] = parts as [string, string, string];
  let year: string, month: string, day: string;
  if (a.length === 4) {
    [year, month, day] = [a, b, c];
  } else if (c.length === 4) {
    [day, month, year] = [a, b, c];
  } else {
    return null;
  }

  if (!/^\d+$/.test(year) || !/^\d+$/.test(month) || !/^\d+$/.test(day)) return null;

  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return null;

  return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Semana laboral de Amaranta Cakes: lunes a sábado (cerrado domingo).
function getWeekRange(fecha: string): { key: string; start: Date; end: Date } {
  const date = parseFechaToDate(fecha) ?? new Date(NaN);
  const mondayOffset = (date.getDay() + 6) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 5);
  const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  return { key, start, end };
}

function formatFechaCorta(date: Date): string {
  const mes = MESES_ES[date.getMonth()];
  return `${String(date.getDate()).padStart(2, '0')} de ${mes}`;
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function formatWeekLabel(weekNumber: number, start: Date, end: Date): string {
  const startLabel = formatFechaCorta(start);
  const endLabel = start.getFullYear() === end.getFullYear()
    ? formatFechaCorta(end)
    : `${formatFechaCorta(end)} de ${end.getFullYear()}`;
  return `Semana ${weekNumber} - ${startLabel} al ${endLabel}`;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find(line => line.trim().length > 0) ?? '';
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  // Excel en español (México) suele exportar CSV con ; como separador,
  // porque la coma se usa como separador decimal regional.
  return semicolonCount > commaCount ? ';' : ',';
}

function parseCSV(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // ignorado, el salto de línea real lo maneja \n
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.map(r => r.map(cell => cell.trim()));
}

type RowStatus = 'ok' | 'partial' | 'duplicate' | 'not_found';

interface ParsedRow {
  id: string;
  employeeNumber: number;
  employeeName: string;
  employeeRecordId: string | null;
  employeePreferredName: string | null;
  fecha: string;
  entradaRaw: string | null;
  salidaRaw: string | null;
  entradaISO: string | null;
  salidaISO: string | null;
  status: RowStatus;
  statusMessage: string;
  included: boolean;
}

interface EmployeeGroup {
  employeeRecordId: string | null;
  employeeNumber: number;
  employeeName: string;
  employeePreferredName: string | null;
  rows: ParsedRow[];
  groupStatus: RowStatus;
}

interface WeekGroup {
  key: string;
  weekNumber: number;
  start: Date;
  end: Date;
  employeeGroups: EmployeeGroup[];
}

interface ImportResultEmployee {
  employeeName: string;
  weekLabel: string;
  controlHorarioCreated: number;
  nominaCreated: boolean;
  nominaId: string | null;
  pagoNomina: number | null;
  salarioPendiente: boolean;
  error: string | null;
}

interface ImportResult {
  totalControlHorario: number;
  totalNomina: number;
  employees: ImportResultEmployee[];
  skippedDuplicates: number;
  notFoundRows: { employeeNumber: number; employeeName: string }[];
}

type ViewState =
  | { stage: 'idle' }
  | { stage: 'parsing' }
  | { stage: 'preview'; rows: ParsedRow[]; error?: string }
  | { stage: 'importing'; rows: ParsedRow[] }
  | { stage: 'completed'; result: ImportResult }
  | { stage: 'error'; message: string };

function getCustomProperties(base: ReturnType<typeof useBase>) {
  return [
    {
      key: 'empleadosTable',
      label: 'Empleados',
      type: 'table' as const,
      defaultValue: base.getTableByIdIfExists('tblzdBu9ftOvcfa9m'),
    },
    {
      key: 'controlHorarioTable',
      label: 'Control Horario',
      type: 'table' as const,
      defaultValue: base.getTableByIdIfExists('tblWvUyLhouwnF2t2'),
    },
    {
      key: 'nominaTable',
      label: 'Nómina',
      type: 'table' as const,
      defaultValue: base.getTableByIdIfExists('tblurZY0bL0yBPjNp'),
    },
  ];
}

function ImportadorChecadorApp(): React.ReactElement {
  const base = useBase();
  const { customPropertyValueByKey, errorState } = useCustomProperties(getCustomProperties);

  const empleadosTable = customPropertyValueByKey.empleadosTable as Table | undefined;
  const controlHorarioTable = customPropertyValueByKey.controlHorarioTable as Table | undefined;
  const nominaTable = customPropertyValueByKey.nominaTable as Table | undefined;

  const empleadosRecords = useRecords(empleadosTable ?? null);
  const controlHorarioRecords = useRecords(controlHorarioTable ?? null);
  const nominaRecords = useRecords(nominaTable ?? null);

  const [activeTab, setActiveTab] = useState<'importar' | 'nomina'>('importar');
  const [viewState, setViewState] = useState<ViewState>({ stage: 'idle' });
  const [isAddingMoreFiles, setIsAddingMoreFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreFileInputRef = useRef<HTMLInputElement>(null);
  const rowIdCounterRef = useRef(0);

  const existingControlHorarioKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!controlHorarioRecords) return keys;
    
    const empleadoField = controlHorarioTable?.getFieldIfExists(FIELD_IDS.CH_EMPLEADO);
    const entradaField = controlHorarioTable?.getFieldIfExists(FIELD_IDS.CH_ENTRADA);
    
    if (!empleadoField || !entradaField) return keys;

    for (const record of controlHorarioRecords) {
      const empleadoLinks = record.getCellValue(empleadoField) as Array<{ id: string }> | null;
      const entrada = record.getCellValue(entradaField) as string | null;
      
      if (empleadoLinks && empleadoLinks.length > 0 && entrada) {
        const empleadoId = empleadoLinks[0]?.id;
        const fechaOnly = entrada.split('T')[0];
        if (empleadoId && fechaOnly) {
          keys.add(`${empleadoId}|${fechaOnly}`);
        }
      }
    }
    return keys;
  }, [controlHorarioRecords, controlHorarioTable]);

  const activeEmployeesMap = useMemo(() => {
    const map = new Map<number, { id: string; preferredName: string }>();
    if (!empleadosRecords || !empleadosTable) return map;

    const numeroField = empleadosTable.getFieldIfExists(FIELD_IDS.EMPLEADOS_NUMERO_DE_EMPLEADO);
    const nombreField = empleadosTable.getFieldIfExists(FIELD_IDS.EMPLEADOS_NOMBRE_PREFERIDO);
    const estatusField = empleadosTable.getFieldIfExists(FIELD_IDS.EMPLEADOS_ESTATUS);

    if (!numeroField || !nombreField || !estatusField) return map;

    for (const record of empleadosRecords) {
      const estatus = record.getCellValue(estatusField) as { name: string } | null;
      if (estatus?.name === 'Activo') {
        const numero = record.getCellValue(numeroField) as number | null;
        const nombre = record.getCellValue(nombreField) as string | null;
        if (numero !== null) {
          map.set(numero, { id: record.id, preferredName: nombre ?? '' });
        }
      }
    }
    return map;
  }, [empleadosRecords, empleadosTable]);

  const buildISODateTime = (fecha: string, hora: string): string => {
    const normalizedFecha = fecha.replace(/\//g, '-');
    return `${normalizedFecha}T${hora}:00-06:00`;
  };

  const parseFileToRows = useCallback((fileName: string, text: string, seenKeys: Set<string>): ParsedRow[] | { error: string } => {
      const rawRows = parseCSV(text);

      if (rawRows.length < 5) {
        return { error: `"${fileName}" no parece tener el formato esperado del reporte de Excepcionales.` };
      }

      // Validación ligera: la fila de encabezados (índice 2) debe empezar con "No."
      const headerFirstCell = (rawRows[2]?.[0] ?? '').trim();
      if (headerFirstCell !== 'No.') {
        return { error: `"${fileName}" no parece ser el reporte de la hoja 'Excepcional'. Verifica que hayas exportado esa hoja como CSV.` };
      }

      const dataRows = rawRows.slice(4);

      const parsedRows: ParsedRow[] = [];

      for (const row of dataRows) {
        if (!row || row.every(cell => !cell || cell.trim() === '')) continue;

        const col0 = row[0];
        const col1 = row[1];
        const col3 = row[3];
        const col4 = row[4]; // AM Entrada
        const col5 = row[5]; // AM Salida
        const col6 = row[6]; // PM Entrada
        const col7 = row[7]; // PM Salida

        if (!col0) continue;

        const employeeNumber = parseInt(col0, 10);
        if (isNaN(employeeNumber)) continue;
        if (EMPLOYEE_NUMBERS_EXCLUDED.includes(employeeNumber)) continue;

        const employeeName = col1?.trim() ?? '';
        const fechaRaw = col3?.trim() ?? '';
        const fecha = normalizeFecha(fechaRaw) ?? fechaRaw;
        const fechaValida = normalizeFecha(fechaRaw) !== null;
        const amEntrada = col4?.trim() || null;
        const amSalida = col5?.trim() || null;
        const pmEntrada = col6?.trim() || null;
        const pmSalida = col7?.trim() || null;

        // Algunos empleados solo checan en PM (AM entrada/salida vacíos).
        // La entrada del empleado es la primera hora registrada (AM u PM)
        // y la salida es la última hora registrada (PM u AM).
        const entradaRaw = amEntrada || pmEntrada;
        const salidaRaw = pmSalida || amSalida;

        if (!entradaRaw && !salidaRaw) continue;

        const employee = activeEmployeesMap.get(employeeNumber);
        const employeeRecordId = employee?.id ?? null;
        const employeePreferredName = employee?.preferredName ?? null;

        let status: RowStatus;
        let statusMessage: string;

        if (!fechaValida) {
          status = 'partial';
          statusMessage = 'Fecha inválida';
        } else if (!employeeRecordId) {
          status = 'not_found';
          statusMessage = 'Empleado no encontrado';
        } else if (!entradaRaw || !salidaRaw) {
          status = 'partial';
          statusMessage = !entradaRaw ? 'Falta hora de entrada' : 'Falta hora de salida';
        } else {
          status = 'ok';
          statusMessage = 'Completo';
        }

        const normalizedFecha = fecha.replace(/\//g, '-');
        const rowKey = employeeRecordId ? `${employeeRecordId}|${normalizedFecha}` : null;
        if (rowKey && seenKeys.has(rowKey)) {
          status = 'duplicate';
          statusMessage = 'Ya existe un registro para esta fecha';
        }

        const entradaISO = entradaRaw && fecha ? buildISODateTime(fecha, entradaRaw) : null;
        const salidaISO = salidaRaw && fecha ? buildISODateTime(fecha, salidaRaw) : null;

        if (rowKey && status !== 'duplicate') {
          seenKeys.add(rowKey);
        }

        parsedRows.push({
          id: `row-${rowIdCounterRef.current++}`,
          employeeNumber,
          employeeName,
          employeeRecordId,
          employeePreferredName,
          fecha,
          entradaRaw,
          salidaRaw,
          entradaISO,
          salidaISO,
          status,
          statusMessage,
          included: status !== 'not_found' && status !== 'duplicate' && fechaValida,
        });
      }

      return parsedRows;
  }, [activeEmployeesMap]);

  const processFiles = useCallback(async (files: File[], mode: 'replace' | 'append') => {
    if (files.length === 0) return;

    if (mode === 'replace') {
      setViewState({ stage: 'parsing' });
    } else {
      setIsAddingMoreFiles(true);
    }

    try {
      const seenKeys = new Set(existingControlHorarioKeys);
      const existingRows = mode === 'append' && viewState.stage === 'preview' ? viewState.rows : [];
      for (const row of existingRows) {
        if (row.employeeRecordId && row.status !== 'duplicate') {
          seenKeys.add(`${row.employeeRecordId}|${row.fecha.replace(/\//g, '-')}`);
        }
      }

      const allNewRows: ParsedRow[] = [];
      for (const file of files) {
        const text = await file.text();
        const result = parseFileToRows(file.name, text, seenKeys);
        if ('error' in result) {
          setViewState({ stage: 'error', message: result.error });
          return;
        }
        allNewRows.push(...result);
      }

      setViewState({ stage: 'preview', rows: [...existingRows, ...allNewRows] });
    } catch (error) {
      console.error('Error parsing CSV file(s):', error);
      setViewState({ stage: 'error', message: 'No se pudo leer alguno de los archivos. Verifica que sean el CSV exportado de la hoja Excepcional del checador.' });
    } finally {
      setIsAddingMoreFiles(false);
    }
  }, [existingControlHorarioKeys, parseFileToRows, viewState]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      processFiles(files, 'replace');
    }
    e.target.value = '';
  }, [processFiles]);

  const handleAddMoreFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      processFiles(files, 'append');
    }
    e.target.value = '';
  }, [processFiles]);

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSelectMoreFiles = useCallback(() => {
    addMoreFileInputRef.current?.click();
  }, []);

  const toggleRowInclusion = useCallback((rowId: string) => {
    setViewState(prev => {
      if (prev.stage !== 'preview') return prev;
      return {
        ...prev,
        rows: prev.rows.map(row =>
          row.id === rowId && row.status !== 'not_found'
            ? { ...row, included: !row.included }
            : row
        ),
      };
    });
  }, []);

  const handleCancel = useCallback(() => {
    setViewState({ stage: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (viewState.stage !== 'preview') return;
    if (!controlHorarioTable || !nominaTable) return;

    const rowsToImport = viewState.rows.filter(r => r.included && r.employeeRecordId);
    if (rowsToImport.length === 0) return;

    if (!controlHorarioTable.hasPermissionToCreateRecords() || !nominaTable.hasPermissionToCreateRecords()) {
      setViewState({ stage: 'error', message: 'No tienes permisos para crear registros en esta base.' });
      return;
    }

    setViewState({ stage: 'importing', rows: viewState.rows });

    // La nómina se paga por semana calendario, así que cada combinación
    // empleado + semana genera su propio record de Nómina.
    const groupedByEmployeeWeek = new Map<string, { employeeRecordId: string; rows: ParsedRow[] }>();
    for (const row of rowsToImport) {
      const { key: weekKey } = getWeekRange(row.fecha);
      const groupKey = `${row.employeeRecordId}|${weekKey}`;
      if (!groupedByEmployeeWeek.has(groupKey)) {
        groupedByEmployeeWeek.set(groupKey, { employeeRecordId: row.employeeRecordId!, rows: [] });
      }
      groupedByEmployeeWeek.get(groupKey)!.rows.push(row);
    }

    const results: ImportResultEmployee[] = [];
    let totalControlHorario = 0;
    let totalNomina = 0;

    for (const { employeeRecordId, rows } of groupedByEmployeeWeek.values()) {
      const firstRow = rows[0]!;
      const employeeName = firstRow.employeePreferredName ?? firstRow.employeeName;
      const { start, end } = getWeekRange(firstRow.fecha);
      const weekLabel = formatWeekLabel(getISOWeekNumber(start), start, end);

      const resultEntry: ImportResultEmployee = {
        employeeName,
        weekLabel,
        controlHorarioCreated: 0,
        nominaCreated: false,
        nominaId: null,
        pagoNomina: null,
        salarioPendiente: false,
        error: null,
      };

      try {
        const controlHorarioPayloads = rows.map(row => {
          const fields: Record<string, unknown> = {
            [FIELD_IDS.CH_EMPLEADO]: [{ id: employeeRecordId }],
          };
          if (row.entradaISO) {
            fields[FIELD_IDS.CH_ENTRADA] = row.entradaISO;
          }
          if (row.salidaISO) {
            fields[FIELD_IDS.CH_SALIDA] = row.salidaISO;
          }
          return { fields };
        });

        const createdControlHorarioIds: string[] = [];
        for (let i = 0; i < controlHorarioPayloads.length; i += 50) {
          const batch = controlHorarioPayloads.slice(i, i + 50);
          const ids = await controlHorarioTable.createRecordsAsync(batch);
          createdControlHorarioIds.push(...ids);
        }

        resultEntry.controlHorarioCreated = createdControlHorarioIds.length;
        totalControlHorario += createdControlHorarioIds.length;

        const nominaPayload = {
          fields: {
            [FIELD_IDS.NOMINA_CONTROL_HORARIO]: createdControlHorarioIds.map(id => ({ id })),
          },
        };

        const nominaIds = await nominaTable.createRecordsAsync([nominaPayload]);
        const nominaId = nominaIds[0];
        
        if (nominaId) {
          resultEntry.nominaCreated = true;
          resultEntry.nominaId = nominaId;
          totalNomina += 1;

          const salarioLookupField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_SALARIO_POR_HORA_LOOKUP);
          const salarioField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_SALARIO_POR_HORA);
          const pagoNominaField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_PAGO_DE_NOMINA);

          if (salarioLookupField && salarioField && nominaTable.hasPermissionToUpdateRecords()) {
            let attempts = 0;
            let salarioValue: number | null = null;

            while (attempts < 5 && salarioValue === null) {
              await new Promise(resolve => setTimeout(resolve, 800));
              attempts++;

              try {
                const queryResult = await nominaTable.selectRecordsAsync({ fields: [salarioLookupField] });
                const refreshedRecord = queryResult.getRecordByIdIfExists(nominaId);
                const lookupRaw = refreshedRecord?.getCellValue(salarioLookupField) as unknown;
                queryResult.unloadData();

                if (Array.isArray(lookupRaw) && lookupRaw.length > 0) {
                  const first = lookupRaw[0];
                  if (typeof first === 'number') {
                    salarioValue = first;
                  } else if (first && typeof first === 'object' && 'value' in (first as Record<string, unknown>)) {
                    const candidate = (first as Record<string, unknown>).value;
                    salarioValue = typeof candidate === 'number' ? candidate : null;
                  }
                }
              } catch (pollError) {
                console.error('Error leyendo Salario_por_Hora_Lookup:', pollError);
              }
            }

            if (salarioValue !== null) {
              try {
                await nominaTable.updateRecordAsync(nominaId, {
                  [FIELD_IDS.NOMINA_SALARIO_POR_HORA]: salarioValue,
                });
              } catch (updateError) {
                console.error('Error updating salario:', updateError);
                resultEntry.salarioPendiente = true;
              }
            } else {
              resultEntry.salarioPendiente = true;
            }
          }
        }
      } catch (error) {
        console.error('Error creating records for employee:', employeeName, error);
        resultEntry.error = error instanceof Error ? error.message : 'Error desconocido';
      }

      results.push(resultEntry);
    }

    const skippedDuplicates = viewState.rows.filter(r => r.status === 'duplicate' && !r.included).length;
    const notFoundRows = viewState.rows
      .filter(r => r.status === 'not_found')
      .map(r => ({ employeeNumber: r.employeeNumber, employeeName: r.employeeName }));

    const uniqueNotFound = Array.from(
      new Map(notFoundRows.map(r => [`${r.employeeNumber}`, r])).values()
    );

    setViewState({
      stage: 'completed',
      result: {
        totalControlHorario,
        totalNomina,
        employees: results,
        skippedDuplicates,
        notFoundRows: uniqueNotFound,
      },
    });
  }, [viewState, controlHorarioTable, nominaTable]);

  const handleReset = useCallback(() => {
    setViewState({ stage: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (errorState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="text-center">
          <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 text-lg">Error de configuración</p>
          <p className="text-gray-500 text-sm mt-2">{errorState.message}</p>
        </div>
      </div>
    );
  }

  if (!empleadosTable || !controlHorarioTable || !nominaTable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="text-center">
          <WarningIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-800 text-lg font-medium">Configuración Requerida</p>
          <p className="text-gray-500 text-sm mt-2">
            Configura las tablas de Empleados, Control Horario y Nómina en el panel de propiedades.
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === 'nomina') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
        <NominaManager
          nominaTable={nominaTable}
          controlHorarioTable={controlHorarioTable}
          nominaRecords={nominaRecords}
          controlHorarioRecords={controlHorarioRecords}
        />
      </div>
    );
  }

  if (viewState.stage === 'idle') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <UploadSimpleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-800 text-lg mb-4">Sube el reporte semanal del checador (.csv)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleSelectFile}
            className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer"
          >
            Seleccionar archivo(s)
          </button>
        </div>
        </div>
      </div>
    );
  }

  if (viewState.stage === 'parsing') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <SpinnerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Procesando archivo...</p>
        </div>
        </div>
      </div>
    );
  }

  if (viewState.stage === 'error') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 text-lg mb-2">Error</p>
          <p className="text-gray-500 text-sm mb-4">{viewState.message}</p>
          <button
            onClick={handleReset}
            className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer"
          >
            Volver a intentar
          </button>
        </div>
        </div>
      </div>
    );
  }

  if (viewState.stage === 'preview' || viewState.stage === 'importing') {
    const rows = viewState.rows;
    const isImporting = viewState.stage === 'importing';

    const weekMap = new Map<string, { start: Date; end: Date; rows: ParsedRow[] }>();
    for (const row of rows) {
      const { key, start, end } = getWeekRange(row.fecha);
      if (!weekMap.has(key)) {
        weekMap.set(key, { start, end, rows: [] });
      }
      weekMap.get(key)!.rows.push(row);
    }

    const weekGroups: WeekGroup[] = Array.from(weekMap.entries())
      .sort((a, b) => a[1].start.getTime() - b[1].start.getTime())
      .map(([key, weekData]) => {
        const groupMap = new Map<string, EmployeeGroup>();

        for (const row of weekData.rows) {
          const groupKey = row.employeeRecordId ?? `notfound-${row.employeeNumber}`;
          if (!groupMap.has(groupKey)) {
            groupMap.set(groupKey, {
              employeeRecordId: row.employeeRecordId,
              employeeNumber: row.employeeNumber,
              employeeName: row.employeePreferredName ?? row.employeeName,
              employeePreferredName: row.employeePreferredName,
              rows: [],
              groupStatus: 'ok',
            });
          }
          groupMap.get(groupKey)!.rows.push(row);
        }

        const employeeGroups = Array.from(groupMap.values());
        for (const group of employeeGroups) {
          group.rows.sort((a, b) => a.fecha.replace(/\//g, '-').localeCompare(b.fecha.replace(/\//g, '-')));
          if (group.rows.some(r => r.status === 'not_found')) {
            group.groupStatus = 'not_found';
          } else if (group.rows.some(r => r.status === 'duplicate')) {
            group.groupStatus = 'duplicate';
          } else if (group.rows.some(r => r.status === 'partial')) {
            group.groupStatus = 'partial';
          }
        }
        employeeGroups.sort((a, b) => a.employeeNumber - b.employeeNumber);

        const weekNumber = getISOWeekNumber(weekData.start);
        return { key, weekNumber, start: weekData.start, end: weekData.end, employeeGroups };
      });

    const totalEmployees = new Set(rows.map(r => r.employeeRecordId ?? `notfound-${r.employeeNumber}`)).size;
    const validRows = rows.filter(r => r.status === 'ok' || r.status === 'partial').length;
    const warningRows = rows.filter(r => r.status === 'duplicate' || r.status === 'partial').length;
    const errorRows = rows.filter(r => r.status === 'not_found').length;
    const includedRows = rows.filter(r => r.included).length;

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
        <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              {totalEmployees} empleados · {validRows} registros válidos · {warningRows} advertencias · {errorRows} errores
            </p>
          </div>

          <div className="space-y-8 mb-6">
            {weekGroups.map(week => (
              <div key={week.key}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {formatWeekLabel(week.weekNumber, week.start, week.end)}
                </h3>
                <div className="space-y-4">
                  {week.employeeGroups.map(group => (
                    <EmployeeGroupComponent
                      key={group.employeeRecordId ?? group.employeeNumber}
                      group={group}
                      onToggleRow={toggleRowInclusion}
                      disabled={isImporting}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <input
              ref={addMoreFileInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={handleAddMoreFilesChange}
              className="hidden"
            />
            <button
              onClick={handleSelectMoreFiles}
              disabled={isImporting || isAddingMoreFiles}
              className="bg-white hover:bg-black/5 px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAddingMoreFiles && <SpinnerIcon className="w-4 h-4 animate-spin" />}
              {isAddingMoreFiles ? 'Cargando...' : 'Seleccionar más archivos'}
            </button>

            <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isImporting}
              className="bg-white hover:bg-black/5 px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || includedRows === 0}
              className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting && <SpinnerIcon className="w-4 h-4 animate-spin" />}
              {isImporting ? 'Creando registros...' : 'Confirmar e Importar'}
            </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (viewState.stage === 'completed') {
    const { result } = viewState;

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
        <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-800 mb-2">Importación Completada</h2>
            <p className="text-gray-600">
              {result.totalControlHorario} registros de Control Horario creados, {result.totalNomina} registros de Nómina creados
            </p>
          </div>

          {result.employees.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Resumen por empleado y semana</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                {result.employees.map((emp, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-800">{emp.employeeName} · {emp.weekLabel}</p>
                      <p className="text-xs text-gray-500">
                        {emp.controlHorarioCreated} Control Horario · {emp.nominaCreated ? 'Nómina creada' : 'Sin nómina'}
                      </p>
                    </div>
                    {emp.error && (
                      <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                        Error: {emp.error}
                      </span>
                    )}
                    {emp.salarioPendiente && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                        Salario pendiente
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.skippedDuplicates > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Advertencias</h3>
              <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                {result.skippedDuplicates} registro(s) duplicado(s) omitido(s)
              </p>
            </div>
          )}

          {result.notFoundRows.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Empleados no encontrados</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                {result.notFoundRows.map((row, idx) => (
                  <p key={idx} className="text-sm text-red-700">
                    #{row.employeeNumber} - {row.employeeName}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={handleReset}
              className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer"
            >
              Importar otro archivo
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return null;
}

interface EmployeeGroupProps {
  group: EmployeeGroup;
  onToggleRow: (rowId: string) => void;
  disabled: boolean;
}

function EmployeeGroupComponent({ group, onToggleRow, disabled }: EmployeeGroupProps): React.ReactElement {
  const [expanded, setExpanded] = useState(true);

  const statusBadge = useMemo(() => {
    switch (group.groupStatus) {
      case 'ok':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
            <CheckCircleIcon className="w-3 h-3" />
            OK
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
            <WarningIcon className="w-3 h-3" />
            Parcial
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
            <WarningIcon className="w-3 h-3" />
            Duplicados
          </span>
        );
      case 'not_found':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
            <XCircleIcon className="w-3 h-3" />
            No encontrado
          </span>
        );
    }
  }, [group.groupStatus]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <CaretDownIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <CaretRightIcon className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-800">
            {group.employeeName}
          </span>
          <span className="text-xs text-gray-500">
            #{group.employeeNumber}
          </span>
        </div>
        {statusBadge}
      </button>

      {expanded && (
        <div className="p-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Entrada</th>
                <th className="pb-2 font-medium">Salida</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium text-center">Incluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {group.rows.map(row => (
                <tr key={row.id} className={row.status === 'not_found' ? 'opacity-50' : ''}>
                  <td className="py-2 text-gray-800">{formatFechaLarga(row.fecha)}</td>
                  <td className="py-2 text-gray-800">{row.entradaRaw ?? '-'}</td>
                  <td className="py-2 text-gray-800">{row.salidaRaw ?? '-'}</td>
                  <td className="py-2">
                    <RowStatusBadge status={row.status} message={row.statusMessage} />
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.included}
                      disabled={disabled || row.status === 'not_found'}
                      onChange={() => onToggleRow(row.id)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface RowStatusBadgeProps {
  status: RowStatus;
  message: string;
}

function RowStatusBadge({ status, message }: RowStatusBadgeProps): React.ReactElement {
  switch (status) {
    case 'ok':
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
          <CheckCircleIcon className="w-3 h-3" />
          {message}
        </span>
      );
    case 'partial':
    case 'duplicate':
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
          <WarningIcon className="w-3 h-3" />
          {message}
        </span>
      );
    case 'not_found':
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
          <XCircleIcon className="w-3 h-3" />
          {message}
        </span>
      );
  }
}

interface TabBarProps {
  activeTab: 'importar' | 'nomina';
  onChange: (tab: 'importar' | 'nomina') => void;
}

function TabBar({ activeTab, onChange }: TabBarProps): React.ReactElement {
  const tabClass = (tab: 'importar' | 'nomina') =>
    `px-4 py-3 text-sm font-medium border-b-2 hover:cursor-pointer ${
      activeTab === tab
        ? 'border-gray-900 text-gray-900'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="border-b border-gray-200 px-6 flex gap-2 shrink-0">
      <button className={tabClass('importar')} onClick={() => onChange('importar')}>
        Importar
      </button>
      <button className={tabClass('nomina')} onClick={() => onChange('nomina')}>
        Nómina
      </button>
    </div>
  );
}

// El cell value de un campo multipleLookupValues siempre viene envuelto como
// { linkedRecordId, value }[] (nunca los valores planos), sin importar el tipo
// del campo original. Renderizar el wrapper directo dispara el error de React
// "Objects are not valid as a React child".
function getLookupFirst<T>(record: AirtableRecord, table: Table | undefined, fieldId: string): T | null {
  const field = table?.getFieldIfExists(fieldId);
  if (!field) return null;
  const value = record.getCellValue(field) as Array<{ linkedRecordId: string; value: T }> | null;
  return value && value.length > 0 ? (value[0]?.value ?? null) : null;
}

// NOMINA_EMPLEADO_LOOKUP hace lookup del campo Empleado (multipleRecordLinks)
// de Control Horario, así que cada entrada trae un value anidado que es a su
// vez un arreglo de {id, name}.
function getEmpleadoName(record: AirtableRecord, nominaTable: Table | undefined): string | undefined {
  const links = getLookupFirst<LinkValue[]>(record, nominaTable, FIELD_IDS.NOMINA_EMPLEADO_LOOKUP);
  return links && links.length > 0 ? links[0]?.name : undefined;
}

// Status es un campo de fórmula (singleSelect) directamente en Nómina, no un
// lookup, así que su valor no viene envuelto en un arreglo como los lookups.
function getStatusName(record: AirtableRecord, table: Table | undefined): string | undefined {
  const field = table?.getFieldIfExists(FIELD_IDS.NOMINA_STATUS);
  if (!field) return undefined;
  const value = record.getCellValue(field) as { name: string } | null;
  return value?.name;
}

interface LinkValue {
  id: string;
  name: string;
}

interface NominaManagerProps {
  nominaTable: Table | undefined;
  controlHorarioTable: Table | undefined;
  nominaRecords: AirtableRecord[] | null;
  controlHorarioRecords: AirtableRecord[] | null;
}

interface NominaWeekGroup {
  label: string;
  sortKey: number;
  records: AirtableRecord[];
}

function NominaManager({
  nominaTable,
  controlHorarioTable,
  nominaRecords,
  controlHorarioRecords,
}: NominaManagerProps): React.ReactElement {
  const [selectedNominaId, setSelectedNominaId] = useState<string | null>(null);
  const [selectedControlHorarioId, setSelectedControlHorarioId] = useState<string | null>(null);

  const weekGroups = useMemo<NominaWeekGroup[]>(() => {
    if (!nominaRecords || !nominaTable) return [];

    const pendientes = nominaRecords.filter(record => {
      const status = getStatusName(record, nominaTable);
      return status !== 'Pagado';
    });

    const groupMap = new Map<string, NominaWeekGroup>();
    for (const record of pendientes) {
      const label = getLookupFirst<string>(record, nominaTable, FIELD_IDS.NOMINA_SEMANA_LOOKUP) ?? 'Semana desconocida';
      const inicio = getLookupFirst<string>(record, nominaTable, FIELD_IDS.NOMINA_INICIO_SEMANA);
      const sortKey = inicio ? new Date(inicio).getTime() : Number.MAX_SAFE_INTEGER;

      if (!groupMap.has(label)) {
        groupMap.set(label, { label, sortKey, records: [] });
      }
      groupMap.get(label)!.records.push(record);
    }

    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => b.sortKey - a.sortKey);
    for (const group of groups) {
      group.records.sort((a, b) => {
        const nameA = getEmpleadoName(a, nominaTable) ?? '';
        const nameB = getEmpleadoName(b, nominaTable) ?? '';
        return nameA.localeCompare(nameB);
      });
    }
    return groups;
  }, [nominaRecords, nominaTable]);

  const selectedNominaRecord = useMemo(
    () => nominaRecords?.find(r => r.id === selectedNominaId) ?? null,
    [nominaRecords, selectedNominaId]
  );

  const selectedControlHorarioRecord = useMemo(
    () => controlHorarioRecords?.find(r => r.id === selectedControlHorarioId) ?? null,
    [controlHorarioRecords, selectedControlHorarioId]
  );

  const closeNominaModal = useCallback(() => {
    setSelectedNominaId(null);
    setSelectedControlHorarioId(null);
  }, []);

  if (!nominaTable || !controlHorarioTable) return <></>;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {weekGroups.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-12">
            No hay registros de Nómina pendientes de pago.
          </p>
        )}

        {weekGroups.map(group => (
          <div key={group.label}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{group.label}</h3>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
              {group.records.map(record => {
                const empleadoName = getEmpleadoName(record, nominaTable);
                const status = getStatusName(record, nominaTable);
                return (
                  <button
                    key={record.id}
                    onClick={() => setSelectedNominaId(record.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left hover:cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{empleadoName ?? 'Sin empleado'}</p>
                      <p className="text-xs text-gray-500">{group.label}</p>
                    </div>
                    <NominaStatusBadge status={status} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedNominaRecord && (
        <NominaDetailModal
          record={selectedNominaRecord}
          nominaTable={nominaTable}
          controlHorarioTable={controlHorarioTable}
          controlHorarioRecords={controlHorarioRecords}
          onClose={closeNominaModal}
          onSelectControlHorario={setSelectedControlHorarioId}
        />
      )}

      {selectedControlHorarioRecord && (
        <ControlHorarioDetailModal
          record={selectedControlHorarioRecord}
          controlHorarioTable={controlHorarioTable}
          onClose={() => setSelectedControlHorarioId(null)}
        />
      )}
    </div>
  );
}

function NominaStatusBadge({ status }: { status: string | undefined }): React.ReactElement {
  switch (status) {
    case 'Pagado':
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
          <CheckCircleIcon className="w-3 h-3" />
          Pagado
        </span>
      );
    case 'Parcial':
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
          <WarningIcon className="w-3 h-3" />
          Parcial
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
          {status ?? 'Pendiente'}
        </span>
      );
  }
}

interface NominaDetailModalProps {
  record: AirtableRecord;
  nominaTable: Table;
  controlHorarioTable: Table;
  controlHorarioRecords: AirtableRecord[] | null;
  onClose: () => void;
  onSelectControlHorario: (id: string) => void;
}

function NominaDetailModal({
  record,
  nominaTable,
  controlHorarioTable,
  controlHorarioRecords,
  onClose,
  onSelectControlHorario,
}: NominaDetailModalProps): React.ReactElement {
  const pagadoField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_PAGADO);
  const canEditPagado = !!pagadoField && nominaTable.hasPermissionToUpdateRecords();

  const currentPagado = (pagadoField ? (record.getCellValue(pagadoField) as number | null) : null) ?? 0;
  const [pagadoValue, setPagadoValue] = useState<string>(String(currentPagado));

  const empleadoName = getEmpleadoName(record, nominaTable);
  const semana = getLookupFirst<string>(record, nominaTable, FIELD_IDS.NOMINA_SEMANA_LOOKUP);
  const status = getStatusName(record, nominaTable);
  const faltanteField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_FALTANTE);
  const faltanteDisplay = faltanteField ? record.getCellValueAsString(faltanteField) : '';

  const controlHorarioField = nominaTable.getFieldIfExists(FIELD_IDS.NOMINA_CONTROL_HORARIO);
  const linkedIds = new Set(
    (controlHorarioField ? (record.getCellValue(controlHorarioField) as LinkValue[] | null) : null)?.map(
      l => l.id
    ) ?? []
  );
  const linkedRecords = (controlHorarioRecords ?? []).filter(r => linkedIds.has(r.id));

  const entradaField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_ENTRADA);
  linkedRecords.sort((a, b) => {
    const da = entradaField ? ((a.getCellValue(entradaField) as string | null) ?? '') : '';
    const db = entradaField ? ((b.getCellValue(entradaField) as string | null) ?? '') : '';
    return da.localeCompare(db);
  });

  const savePagado = useCallback(() => {
    if (!canEditPagado || !pagadoField) return;
    const parsed = parseFloat(pagadoValue);
    const nextValue = isNaN(parsed) ? 0 : parsed;
    if (nextValue === currentPagado) return;
    nominaTable.updateRecordAsync(record.id, { [FIELD_IDS.NOMINA_PAGADO]: nextValue }).catch(error => {
      console.error('Error updating Pagado:', error);
    });
  }, [canEditPagado, pagadoField, pagadoValue, currentPagado, nominaTable, record.id]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Pago de Nómina</h2>
            <p className="text-sm text-gray-500">{empleadoName ?? 'Sin empleado'} · {semana}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:cursor-pointer">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pagado</label>
              <div className="flex items-center border border-gray-300 rounded-md px-2">
                <span className="text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={pagadoValue}
                  disabled={!canEditPagado}
                  onChange={e => setPagadoValue(e.target.value)}
                  onBlur={savePagado}
                  className="w-full py-1.5 px-1 text-sm outline-none disabled:bg-transparent disabled:text-gray-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Faltante</label>
              <p className="text-sm text-gray-800 py-1.5">{faltanteDisplay}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estatus</label>
              <div className="py-1">
                <NominaStatusBadge status={status} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Control Horario</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Horas Ordinarias</th>
                  <th className="pb-2 font-medium">Horas Extra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {linkedRecords.map(chRecord => {
                  const entrada = entradaField ? (chRecord.getCellValue(entradaField) as string | null) : null;
                  const horasOrdField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_ORDINARIAS);
                  const horasExtraField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_EXTRA);
                  return (
                    <tr
                      key={chRecord.id}
                      onClick={() => onSelectControlHorario(chRecord.id)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="py-2 text-gray-800">{entrada ? formatFechaLarga(entrada.split('T')[0] ?? '') : '-'}</td>
                      <td className="py-2 text-gray-800">
                        {horasOrdField ? chRecord.getCellValueAsString(horasOrdField) : '-'}
                      </td>
                      <td className="py-2 text-gray-800">
                        {horasExtraField ? chRecord.getCellValueAsString(horasExtraField) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ControlHorarioDetailModalProps {
  record: AirtableRecord;
  controlHorarioTable: Table;
  onClose: () => void;
}

function ControlHorarioDetailModal({
  record,
  controlHorarioTable,
  onClose,
}: ControlHorarioDetailModalProps): React.ReactElement {
  const empleadoField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_EMPLEADO);
  const entradaField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_ENTRADA);
  const salidaField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_SALIDA);
  const horasLaborablesField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_LABORABLES);
  const horasOrdField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_ORDINARIAS);
  const horasExtraField = controlHorarioTable.getFieldIfExists(FIELD_IDS.CH_HORAS_EXTRA);

  const canEdit = controlHorarioTable.hasPermissionToUpdateRecords();

  const empleado = empleadoField ? (record.getCellValue(empleadoField) as LinkValue[] | null)?.[0] : null;
  const currentEntrada = entradaField ? (record.getCellValue(entradaField) as string | null) : null;
  const currentSalida = salidaField ? (record.getCellValue(salidaField) as string | null) : null;

  const [entradaValue, setEntradaValue] = useState(currentEntrada ? currentEntrada.slice(0, 16) : '');
  const [salidaValue, setSalidaValue] = useState(currentSalida ? currentSalida.slice(0, 16) : '');

  const saveEntrada = useCallback(() => {
    if (!canEdit || !entradaField || !entradaValue) return;
    const iso = `${entradaValue}:00-06:00`;
    if (iso === currentEntrada) return;
    controlHorarioTable.updateRecordAsync(record.id, { [FIELD_IDS.CH_ENTRADA]: iso }).catch(error => {
      console.error('Error updating Entrada:', error);
    });
  }, [canEdit, entradaField, entradaValue, currentEntrada, controlHorarioTable, record.id]);

  const saveSalida = useCallback(() => {
    if (!canEdit || !salidaField || !salidaValue) return;
    const iso = `${salidaValue}:00-06:00`;
    if (iso === currentSalida) return;
    controlHorarioTable.updateRecordAsync(record.id, { [FIELD_IDS.CH_SALIDA]: iso }).catch(error => {
      console.error('Error updating Salida:', error);
    });
  }, [canEdit, salidaField, salidaValue, currentSalida, controlHorarioTable, record.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-800">Detalle de Control Horario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:cursor-pointer">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Empleado</label>
            <p className="text-sm text-gray-800">{empleado?.name ?? 'Sin empleado'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Entrada</label>
              <input
                type="datetime-local"
                value={entradaValue}
                disabled={!canEdit}
                onChange={e => setEntradaValue(e.target.value)}
                onBlur={saveEntrada}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Salida</label>
              <input
                type="datetime-local"
                value={salidaValue}
                disabled={!canEdit}
                onChange={e => setSalidaValue(e.target.value)}
                onBlur={saveSalida}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Horas Laborables</label>
              <p className="text-sm text-gray-800">
                {horasLaborablesField ? record.getCellValueAsString(horasLaborablesField) : '-'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Horas Ordinarias</label>
              <p className="text-sm text-gray-800">
                {horasOrdField ? record.getCellValueAsString(horasOrdField) : '-'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Horas Extra</label>
              <p className="text-sm text-gray-800">
                {horasExtraField ? record.getCellValueAsString(horasExtraField) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

initializeBlock({ interface: () => <ImportadorChecadorApp /> });