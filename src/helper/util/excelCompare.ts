import XLSX from "xlsx";

interface CellComparison {
  row: number;
  column: number;
  fieldName: string;
  expected: string;
  actual: string;
  isMatch: boolean;
}

export interface ExcelComparisonResult {
  isEqual: boolean;
  reason?: string;
  comparedSheetName: string;
  totalRows: number;
  totalColumns: number;
  totalCells: number;
  matchedCells: number;
  mismatchedCells: number;
  mismatches: CellComparison[];
  textSummary: string;
  htmlReport: string;
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function getSheetData(filePath: string, sheetName?: string): string[][] {
  const workbook = XLSX.readFile(filePath);

  if (!workbook.SheetNames.length) {
    throw new Error(`No worksheet found in file: ${filePath}`);
  }

  const targetSheetName = sheetName?.trim() || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];

  if (!worksheet) {
    throw new Error(
      `Sheet \"${targetSheetName}\" not found in file: ${filePath}. Available sheets: ${workbook.SheetNames.join(", ")}`
    );
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  }) as unknown[][];

  return rows.map((row) => row.map((cell) => normalizeCellValue(cell)));
}

function resolveSheetName(filePath: string, preferredSheetName?: string): string {
  const workbook = XLSX.readFile(filePath);

  if (!workbook.SheetNames.length) {
    throw new Error(`No worksheet found in file: ${filePath}`);
  }

  if (preferredSheetName?.trim()) {
    const requestedName = preferredSheetName.trim();
    if (!workbook.Sheets[requestedName]) {
      throw new Error(
        `Sheet "${requestedName}" not found in file: ${filePath}. Available sheets: ${workbook.SheetNames.join(", ")}`
      );
    }
    return requestedName;
  }

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    }) as unknown[][];

    if (rows.length > 0) {
      return sheetName;
    }
  }

  return workbook.SheetNames[0];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getColumnLabel(columnIndex: number): string {
  let current = columnIndex + 1;
  let label = "";

  while (current > 0) {
    const remainder = (current - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    current = Math.floor((current - 1) / 26);
  }

  return label;
}

function buildHtmlReport(
  sheetName: string,
  totalCells: number,
  matchedCells: number,
  mismatchedCells: number,
  allCells: CellComparison[]
): string {
  const rowsHtml = allCells
    .map((cell) => {
      const statusClass = cell.isMatch ? "match" : "mismatch";
      const statusText = cell.isMatch ? "MATCH" : "MISMATCH";

      return `<tr class="${statusClass}">
        <td>${cell.row}</td>
        <td>${escapeHtml(cell.fieldName)}</td>
        <td>${escapeHtml(getColumnLabel(cell.column - 1))}</td>
        <td>${escapeHtml(cell.expected)}</td>
        <td>${escapeHtml(cell.actual)}</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
      </tr>`;
    })
    .join("\n");

  return `
  <div class="rh-compare-wrap">
    <h3>RH Sheet Comparison - ${escapeHtml(sheetName)}</h3>
    <p>Total cells: <strong>${totalCells}</strong> | Matched: <strong style="color:#166534;">${matchedCells}</strong> | Mismatched: <strong style="color:#991b1b;">${mismatchedCells}</strong></p>
    <table class="rh-compare-table" border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th>Row</th>
          <th>Field</th>
          <th>Column</th>
          <th>Expected</th>
          <th>Actual</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <style>
      .rh-compare-table tr.match { background: #dcfce7; }
      .rh-compare-table tr.mismatch { background: #fee2e2; }
      .rh-compare-table .status { padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 11px; }
      .rh-compare-table .status.match { background: #bbf7d0; color: #166534; }
      .rh-compare-table .status.mismatch { background: #fecaca; color: #991b1b; }
    </style>
  </div>
  `;
}

export function compareExcelFiles(
  expectedFilePath: string,
  actualFilePath: string,
  sheetName?: string
): ExcelComparisonResult {
  const comparedSheetName = resolveSheetName(expectedFilePath, sheetName);
  const expectedRows = getSheetData(expectedFilePath, comparedSheetName);
  const actualRows = getSheetData(actualFilePath, comparedSheetName);

  const totalRows = Math.max(expectedRows.length, actualRows.length);
  const totalColumns = Math.max(
    ...expectedRows.map((row) => row.length),
    ...actualRows.map((row) => row.length),
    0
  );

  const headerRow = expectedRows[0] || actualRows[0] || [];
  const allCells: CellComparison[] = [];

  for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
    const expectedRow = expectedRows[rowIndex] || [];
    const actualRow = actualRows[rowIndex] || [];

    for (let colIndex = 0; colIndex < totalColumns; colIndex += 1) {
      const expectedValue = normalizeCellValue(expectedRow[colIndex]);
      const actualValue = normalizeCellValue(actualRow[colIndex]);
      const headerValue = normalizeCellValue(headerRow[colIndex]);

      allCells.push({
        row: rowIndex + 1,
        column: colIndex + 1,
        fieldName: headerValue || `Column ${colIndex + 1}`,
        expected: expectedValue,
        actual: actualValue,
        isMatch: expectedValue === actualValue,
      });
    }
  }

  const mismatches = allCells.filter((cell) => !cell.isMatch);
  if (allCells.length === 0) {
    throw new Error(
      `No comparable cells found in sheet ${comparedSheetName}. Ensure the expected and downloaded workbook contain data rows.`
    );
  }
  const matchedCells = allCells.length - mismatches.length;
  const reason = mismatches.length
    ? `Found ${mismatches.length} mismatched cells in sheet ${comparedSheetName}. First mismatch at row ${mismatches[0].row}, column ${mismatches[0].column} (field ${mismatches[0].fieldName}). Expected "${mismatches[0].expected}", actual "${mismatches[0].actual}".`
    : undefined;

  const textSummary = [
    `RH comparison result for sheet ${comparedSheetName}`,
    `Rows compared: ${totalRows}`,
    `Columns compared: ${totalColumns}`,
    `Total cells compared: ${allCells.length}`,
    `Matched cells: ${matchedCells}`,
    `Mismatched cells: ${mismatches.length}`,
    reason || "All cells matched.",
  ].join("\n");

  return {
    isEqual: mismatches.length === 0,
    reason,
    comparedSheetName,
    totalRows,
    totalColumns,
    totalCells: allCells.length,
    matchedCells,
    mismatchedCells: mismatches.length,
    mismatches,
    textSummary,
    htmlReport: buildHtmlReport(
      comparedSheetName,
      allCells.length,
      matchedCells,
      mismatches.length,
      allCells
    ),
  };
}
