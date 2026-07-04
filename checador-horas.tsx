import './style.css';
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
} from '@phosphor-icons/react';

const FIELD_IDS = {
  EMPLEADOS_NUMERO_DE_EMPLEADO: 'fldtsIcGB618YwyOq',
  EMPLEADOS_NOMBRE_PREFERIDO: 'fldGfJeg01obJiDtE',
  EMPLEADOS_ESTATUS: 'fldkwxY2gWZBKSdId',
  CH_EMPLEADO: 'fldrMMPnZCpIk9ugJ',
  CH_ENTRADA: 'fld0kpZvjnYuc7xQG',
  CH_SALIDA: 'fldPsPujWCDvZDLfH',
  CH_SALARIO_POR_HORA: 'fldZiyFvrxp9w9jB3',
  NOMINA_CONTROL_HORARIO: 'fldRpnEkaWG7nPlei',
  NOMINA_SALARIO_POR_HORA_LOOKUP: 'fldAOqUq8L6YFOk6N',
  NOMINA_SALARIO_POR_HORA: 'fldcIgwyl0dfYGS1P',
  NOMINA_PAGO_DE_NOMINA: 'fld5cla35OoJhK1xC',
} as const;

const EMPLOYEE_NUMBERS_EXCLUDED = [5, 6, 7];

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

interface ImportResultEmployee {
  employeeName: string;
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

  const [viewState, setViewState] = useState<ViewState>({ stage: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const parseChecadorFile = useCallback(async (file: File) => {
    setViewState({ stage: 'parsing' });

    try {
      const text = await file.text();
      const rawRows = parseCSV(text);

      if (rawRows.length < 5) {
        setViewState({ stage: 'error', message: "El archivo no parece tener el formato esperado del reporte de Excepcionales." });
        return;
      }

      // Validación ligera: la fila de encabezados (índice 2) debe empezar con "No."
      const headerFirstCell = (rawRows[2]?.[0] ?? '').trim();
      if (headerFirstCell !== 'No.') {
        setViewState({ stage: 'error', message: "El archivo no parece ser el reporte de la hoja 'Excepcional'. Verifica que hayas exportado esa hoja como CSV." });
        return;
      }

      const dataRows = rawRows.slice(4);

      const parsedRows: ParsedRow[] = [];
      let rowIndex = 0;

      for (const row of dataRows) {
        if (!row || row.every(cell => !cell || cell.trim() === '')) continue;

        const col0 = row[0];
        const col1 = row[1];
        const col3 = row[3];
        const col4 = row[4];
        const col7 = row[7];

        if (!col0) continue;

        const employeeNumber = parseInt(col0, 10);
        if (isNaN(employeeNumber)) continue;
        if (EMPLOYEE_NUMBERS_EXCLUDED.includes(employeeNumber)) continue;

        const employeeName = col1?.trim() ?? '';
        const fecha = col3?.trim() ?? '';
        const entradaRaw = col4?.trim() || null;
        const salidaRaw = col7?.trim() || null;

        if (!entradaRaw && !salidaRaw) continue;

        const employee = activeEmployeesMap.get(employeeNumber);
        const employeeRecordId = employee?.id ?? null;
        const employeePreferredName = employee?.preferredName ?? null;

        let status: RowStatus;
        let statusMessage: string;

        if (!employeeRecordId) {
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
        if (employeeRecordId && existingControlHorarioKeys.has(`${employeeRecordId}|${normalizedFecha}`)) {
          status = 'duplicate';
          statusMessage = 'Ya existe un registro para esta fecha';
        }

        const entradaISO = entradaRaw && fecha ? buildISODateTime(fecha, entradaRaw) : null;
        const salidaISO = salidaRaw && fecha ? buildISODateTime(fecha, salidaRaw) : null;

        parsedRows.push({
          id: `row-${rowIndex++}`,
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
          included: status !== 'not_found' && status !== 'duplicate',
        });
      }

      setViewState({ stage: 'preview', rows: parsedRows });
    } catch (error) {
      console.error('Error parsing CSV file:', error);
      setViewState({ stage: 'error', message: 'No se pudo leer el archivo. Verifica que sea el CSV exportado de la hoja Excepcional del checador.' });
    }
  }, [activeEmployeesMap, existingControlHorarioKeys]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseChecadorFile(file);
    }
  }, [parseChecadorFile]);

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
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

    const groupedByEmployee = new Map<string, ParsedRow[]>();
    for (const row of rowsToImport) {
      const key = row.employeeRecordId!;
      if (!groupedByEmployee.has(key)) {
        groupedByEmployee.set(key, []);
      }
      groupedByEmployee.get(key)!.push(row);
    }

    const results: ImportResultEmployee[] = [];
    let totalControlHorario = 0;
    let totalNomina = 0;

    for (const [employeeRecordId, rows] of groupedByEmployee) {
      const firstRow = rows[0]!;
      const employeeName = firstRow.employeePreferredName ?? firstRow.employeeName;
      
      const resultEntry: ImportResultEmployee = {
        employeeName,
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

  if (viewState.stage === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="text-center">
          <UploadSimpleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-800 text-lg mb-4">Sube el reporte semanal del checador (.csv)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleSelectFile}
            className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-xs hover:shadow-sm hover:cursor-pointer"
          >
            Seleccionar archivo
          </button>
        </div>
      </div>
    );
  }

  if (viewState.stage === 'parsing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="text-center">
          <SpinnerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Procesando archivo...</p>
        </div>
      </div>
    );
  }

  if (viewState.stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
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
    );
  }

  if (viewState.stage === 'preview' || viewState.stage === 'importing') {
    const rows = viewState.rows;
    const isImporting = viewState.stage === 'importing';

    const groups: EmployeeGroup[] = [];
    const groupMap = new Map<string, EmployeeGroup>();

    for (const row of rows) {
      const key = row.employeeRecordId ?? `notfound-${row.employeeNumber}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          employeeRecordId: row.employeeRecordId,
          employeeNumber: row.employeeNumber,
          employeeName: row.employeePreferredName ?? row.employeeName,
          employeePreferredName: row.employeePreferredName,
          rows: [],
          groupStatus: 'ok',
        });
      }
      groupMap.get(key)!.rows.push(row);
    }

    for (const group of groupMap.values()) {
      if (group.rows.some(r => r.status === 'not_found')) {
        group.groupStatus = 'not_found';
      } else if (group.rows.some(r => r.status === 'duplicate')) {
        group.groupStatus = 'duplicate';
      } else if (group.rows.some(r => r.status === 'partial')) {
        group.groupStatus = 'partial';
      }
      groups.push(group);
    }

    groups.sort((a, b) => a.employeeNumber - b.employeeNumber);

    const totalEmployees = groups.length;
    const validRows = rows.filter(r => r.status === 'ok' || r.status === 'partial').length;
    const warningRows = rows.filter(r => r.status === 'duplicate' || r.status === 'partial').length;
    const errorRows = rows.filter(r => r.status === 'not_found').length;
    const includedRows = rows.filter(r => r.included).length;

    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              {totalEmployees} empleados · {validRows} registros válidos · {warningRows} advertencias · {errorRows} errores
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {groups.map(group => (
              <EmployeeGroupComponent
                key={group.employeeRecordId ?? group.employeeNumber}
                group={group}
                onToggleRow={toggleRowInclusion}
                disabled={isImporting}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
    );
  }

  if (viewState.stage === 'completed') {
    const { result } = viewState;

    return (
      <div className="min-h-screen bg-white p-6">
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
              <h3 className="text-sm font-medium text-gray-700 mb-3">Resumen por empleado</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                {result.employees.map((emp, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-800">{emp.employeeName}</p>
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
                  <td className="py-2 text-gray-800">{row.fecha}</td>
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

initializeBlock({ interface: () => <ImportadorChecadorApp /> });