import XLSX from "xlsx";

export interface ExcelComparisonResult {
  isEqual: boolean;
  reason?: string;
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

export function compareExcelFiles(
  expectedFilePath: string,
  actualFilePath: string,
  sheetName?: string
): ExcelComparisonResult {
  const expectedRows = getSheetData(expectedFilePath, sheetName);
  const actualRows = getSheetData(actualFilePath, sheetName);
  const comparedSheetName = sheetName?.trim() || "first sheet";

  if (expectedRows.length !== actualRows.length) {
    return {
      isEqual: false,
      reason: `Row count mismatch in sheet ${comparedSheetName}. Expected ${expectedRows.length}, actual ${actualRows.length}.`,
    };
  }

  for (let rowIndex = 0; rowIndex < expectedRows.length; rowIndex += 1) {
    const expectedRow = expectedRows[rowIndex] || [];
    const actualRow = actualRows[rowIndex] || [];

    if (expectedRow.length !== actualRow.length) {
      return {
        isEqual: false,
        reason: `Column count mismatch in sheet ${comparedSheetName} at row ${rowIndex + 1}. Expected ${expectedRow.length}, actual ${actualRow.length}.`,
      };
    }

    for (let colIndex = 0; colIndex < expectedRow.length; colIndex += 1) {
      if (expectedRow[colIndex] !== actualRow[colIndex]) {
        return {
          isEqual: false,
          reason: `Cell mismatch in sheet ${comparedSheetName} at row ${rowIndex + 1}, column ${colIndex + 1}. Expected "${expectedRow[colIndex]}", actual "${actualRow[colIndex]}".`,
        };
      }
    }
  }

  return { isEqual: true };
}
