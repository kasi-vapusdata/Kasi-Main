import XLSX from "xlsx";

interface NormalizedSheet {
  sheetName: string;
  rows: string[][];
  columnCount: number;
  rowCount: number;
  mergeStartByCell: Map<string, { rowspan: number; colspan: number }>;
  mergeCoveredCells: Set<string>;
}

export interface RhBusinessReportResult {
  htmlReport: string;
  totalRowsCompared: number;
  matchedRows: number;
  mismatchedRows: number;
  comparedSheetName: string;
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveSheetName(
  workbook: XLSX.WorkBook,
  requestedSheetName?: string
): string {
  if (!workbook.SheetNames.length) {
    throw new Error("Workbook has no sheets.");
  }

  if (!requestedSheetName?.trim()) {
    return workbook.SheetNames[0];
  }

  const matchedName = workbook.SheetNames.find(
    (name) => name.trim().toLowerCase() === requestedSheetName.trim().toLowerCase()
  );

  if (!matchedName) {
    throw new Error(
      `Sheet "${requestedSheetName}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`
    );
  }

  return matchedName;
}

function getSheetWithLayout(filePath: string, requestedSheetName?: string): NormalizedSheet {
  const workbook = XLSX.readFile(filePath);
  const sheetName = resolveSheetName(workbook, requestedSheetName);
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet || !worksheet["!ref"]) {
    return {
      sheetName,
      rows: [],
      columnCount: 0,
      rowCount: 0,
      mergeStartByCell: new Map<string, { rowspan: number; colspan: number }>(),
      mergeCoveredCells: new Set<string>(),
    };
  }

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  const rowCount = range.e.r - range.s.r + 1;
  const columnCount = range.e.c - range.s.c + 1;

  const rows: string[][] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row: string[] = [];
    for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
      const cellAddress = XLSX.utils.encode_cell({
        r: range.s.r + rowIndex,
        c: range.s.c + colIndex,
      });
      const cell = worksheet[cellAddress];
      row.push(normalizeCellValue(cell?.v));
    }
    rows.push(row);
  }

  const mergeStartByCell = new Map<string, { rowspan: number; colspan: number }>();
  const mergeCoveredCells = new Set<string>();
  const merges = (worksheet["!merges"] || []) as XLSX.Range[];

  for (const merge of merges) {
    const startRow = merge.s.r - range.s.r;
    const startCol = merge.s.c - range.s.c;
    const endRow = merge.e.r - range.s.r;
    const endCol = merge.e.c - range.s.c;

    if (startRow < 0 || startCol < 0 || endRow >= rowCount || endCol >= columnCount) {
      continue;
    }

    const startKey = `${startRow}:${startCol}`;
    mergeStartByCell.set(startKey, {
      rowspan: endRow - startRow + 1,
      colspan: endCol - startCol + 1,
    });

    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        if (row === startRow && col === startCol) {
          continue;
        }
        mergeCoveredCells.add(`${row}:${col}`);
      }
    }
  }

  return {
    sheetName,
    rows,
    columnCount,
    rowCount,
    mergeStartByCell,
    mergeCoveredCells,
  };
}

function getCellValue(rows: string[][], rowIndex: number, colIndex: number): string {
  if (rowIndex < 0 || rowIndex >= rows.length) {
    return "";
  }

  const row = rows[rowIndex];
  if (!row || colIndex < 0 || colIndex >= row.length) {
    return "";
  }

  return normalizeCellValue(row[colIndex]);
}

function buildBusinessHtml(
  comparedSheetName: string,
  layoutSheet: NormalizedSheet,
  actualRows: string[][],
  rowStatus: Array<"MATCHED" | "MISMATCHED">,
  matchedRows: number,
  mismatchedRows: number
): string {
  const headerRow = layoutSheet.rows[0] || [];
  const headerHtml = headerRow
    .slice(0, layoutSheet.columnCount)
    .map((name) => `<th>${escapeHtml(name || "")}</th>`)
    .join("");

  const bodyHtml: string[] = [];

  for (let rowIndex = 1; rowIndex < layoutSheet.rowCount; rowIndex += 1) {
    const status = rowStatus[rowIndex] || "MATCHED";
    const rowClass = status === "MATCHED" ? "row-matched" : "row-mismatched";
    const cellsHtml: string[] = [];

    for (let colIndex = 0; colIndex < layoutSheet.columnCount; colIndex += 1) {
      const cellKey = `${rowIndex}:${colIndex}`;

      if (layoutSheet.mergeCoveredCells.has(cellKey)) {
        continue;
      }

      const mergeSpec = layoutSheet.mergeStartByCell.get(cellKey);
      const rowspan = mergeSpec?.rowspan;
      const colspan = mergeSpec?.colspan;

      const expectedValue = getCellValue(layoutSheet.rows, rowIndex, colIndex);
      const actualValue = getCellValue(actualRows, rowIndex, colIndex);
      const displayValue = expectedValue || actualValue;

      const rowSpanAttr = rowspan && rowspan > 1 ? ` rowspan="${rowspan}"` : "";
      const colSpanAttr = colspan && colspan > 1 ? ` colspan="${colspan}"` : "";
      cellsHtml.push(`<td${rowSpanAttr}${colSpanAttr}>${escapeHtml(displayValue)}</td>`);
    }

    cellsHtml.push(`<td class="status-cell">${status}</td>`);
    bodyHtml.push(`<tr class="${rowClass}">${cellsHtml.join("")}</tr>`);
  }

  return `
  <div class="rh-business-report">
    <h3>RH Business Comparison Report - ${escapeHtml(comparedSheetName)}</h3>
    <p>Total rows: <strong>${layoutSheet.rowCount > 0 ? layoutSheet.rowCount - 1 : 0}</strong> | Matched rows: <strong style="color:#166534;">${matchedRows}</strong> | Mismatched rows: <strong style="color:#991b1b;">${mismatchedRows}</strong></p>
    <table class="rh-business-table" border="1" cellspacing="0" cellpadding="8" style="border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 13px;">
      <thead>
        <tr class="header-row">${headerHtml}<th>Status</th></tr>
      </thead>
      <tbody>
        ${bodyHtml.join("\n")}
      </tbody>
    </table>
    <style>
      .rh-business-table .header-row th { background: #e5e7eb; color: #111827; text-align: left; }
      .rh-business-table tr.row-matched td { background: #dcfce7; }
      .rh-business-table tr.row-mismatched td { background: #fee2e2; }
      .rh-business-table .status-cell { font-weight: 700; }
    </style>
  </div>
  `;
}

export function generateRhBusinessComparisonReport(
  expectedFilePath: string,
  actualFilePath: string,
  sheetName?: string
): RhBusinessReportResult {
  const expectedSheet = getSheetWithLayout(expectedFilePath, sheetName);
  const actualSheet = getSheetWithLayout(actualFilePath, expectedSheet.sheetName);

  const layoutSheet = expectedSheet.rowCount ? expectedSheet : actualSheet;
  const rowStatus: Array<"MATCHED" | "MISMATCHED"> = [];

  let matchedRows = 0;
  let mismatchedRows = 0;

  for (let rowIndex = 1; rowIndex < layoutSheet.rowCount; rowIndex += 1) {
    let hasMismatch = false;

    for (let colIndex = 0; colIndex < layoutSheet.columnCount; colIndex += 1) {
      const expectedValue = getCellValue(expectedSheet.rows, rowIndex, colIndex);
      const actualValue = getCellValue(actualSheet.rows, rowIndex, colIndex);

      if (expectedValue !== actualValue) {
        hasMismatch = true;
        break;
      }
    }

    const status: "MATCHED" | "MISMATCHED" = hasMismatch ? "MISMATCHED" : "MATCHED";
    rowStatus[rowIndex] = status;

    if (status === "MATCHED") {
      matchedRows += 1;
    } else {
      mismatchedRows += 1;
    }
  }

  return {
    comparedSheetName: layoutSheet.sheetName,
    totalRowsCompared: layoutSheet.rowCount > 0 ? layoutSheet.rowCount - 1 : 0,
    matchedRows,
    mismatchedRows,
    htmlReport: buildBusinessHtml(
      layoutSheet.sheetName,
      layoutSheet,
      actualSheet.rows,
      rowStatus,
      matchedRows,
      mismatchedRows
    ),
  };
}