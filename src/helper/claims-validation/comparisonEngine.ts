import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import XLSX from "xlsx";
import { compareExcelFiles } from "../util/excelCompare";
import { ComparisonError, UnsupportedFileTypeError } from "./errors";
import type { ComparisonCellResult, ComparisonDifference, FileComparisonResult } from "./types";

interface FileComparator {
  supports(extension: string): boolean;
  compare(expectedPath: string, actualPath: string): Promise<FileComparisonResult>;
}

class ExcelComparator implements FileComparator {
  supports(extension: string): boolean {
    return extension === ".xlsx" || extension === ".xls";
  }

  async compare(expectedPath: string, actualPath: string): Promise<FileComparisonResult> {
    try {
      const configuredSheetName = process.env.DEFAULT_EXCEL_COMPARE_SHEET_NAME?.trim();
      const preferredSheetName = configuredSheetName || this.resolvePreferredSheetName(expectedPath, actualPath);
      const comparison = compareExcelFiles(expectedPath, actualPath, preferredSheetName);
      return {
        expectedPath,
        actualPath,
        fileName: path.basename(actualPath),
        isEqual: comparison.isEqual,
        summary: comparison.textSummary,
        detail: comparison.reason,
        htmlReport: comparison.htmlReport,
      };
    } catch (error) {
      throw new ComparisonError(
        `Failed to compare Excel files. Expected: ${expectedPath}, Actual: ${actualPath}, Error: ${(error as Error).message}`
      );
    }
  }

  private resolvePreferredSheetName(expectedPath: string, actualPath: string): string | undefined {
    const expectedWorkbook = XLSX.readFile(expectedPath);
    const actualWorkbook = XLSX.readFile(actualPath);

    // Preserve backward compatibility for RH files that keep data in RH_Data while Sheet1 is empty.
    if (expectedWorkbook.SheetNames.includes("RH_Data") && actualWorkbook.SheetNames.includes("RH_Data")) {
      return "RH_Data";
    }

    return undefined;
  }
}

class CsvComparator implements FileComparator {
  supports(extension: string): boolean {
    return extension === ".csv";
  }

  async compare(expectedPath: string, actualPath: string): Promise<FileComparisonResult> {
    const startedAt = Date.now();

    try {
      const [expected, actual] = await Promise.all([
        fs.readFile(expectedPath, "utf8"),
        fs.readFile(actualPath, "utf8"),
      ]);

      const expectedTable = CsvTable.fromContent(expected);
      const actualTable = CsvTable.fromContent(actual);
      const comparison = CsvComparisonEngine.compare(expectedTable, actualTable);
      const durationMs = Date.now() - startedAt;
      const fileName = path.basename(actualPath);

      return {
        expectedPath,
        actualPath,
        fileName,
        isEqual: comparison.differences.length === 0,
        summary: this.buildSummary(fileName, comparison, durationMs),
        detail: comparison.differences.length ? this.buildDetail(comparison.differences) : undefined,
        htmlReport: this.buildHtmlReport(fileName, comparison, durationMs),
        rowsCompared: comparison.rowsCompared,
        matchedRows: comparison.matchedRows,
        mismatchedRows: comparison.mismatchedRows,
        durationMs,
        differences: comparison.differences,
        cellResults: comparison.cellResults,
      };
    } catch (error) {
      if (error instanceof ComparisonError) {
        throw error;
      }

      throw new ComparisonError(
        `Failed to compare CSV files. Expected: ${expectedPath}, Actual: ${actualPath}, Error: ${(error as Error).message}`
      );
    }
  }

  private buildSummary(fileName: string, comparison: CsvComparisonResult, durationMs: number): string {
    return [
      `Config CSV validation summary for ${fileName}`,
      `Status: ${comparison.differences.length === 0 ? "PASSED" : "FAILED"}`,
      `Rows compared: ${comparison.rowsCompared}`,
      `Matched rows: ${comparison.matchedRows}`,
      `Mismatched rows: ${comparison.mismatchedRows}`,
      `Duration: ${durationMs}ms`,
    ].join("\n");
  }

  private buildDetail(differences: ComparisonDifference[]): string {
    return differences
      .slice(0, 10)
      .map((difference) => `Row ${difference.rowNumber}, Column ${difference.columnName}: ${difference.status}. Expected '${difference.expectedValue}', Actual '${difference.actualValue}'`)
      .join("\n");
  }

  private buildHtmlReport(fileName: string, comparison: CsvComparisonResult, durationMs: number): string {
    const rows = comparison.cellResults.length
      ? comparison.cellResults
          .map((cellResult) => {
            const isMatched = cellResult.status === "MATCHED";
            const rowClass = isMatched ? "matched" : "mismatched";
            const statusColor = isMatched ? "#166534" : "#991b1b";
            const rowBackground = isMatched ? "#ecfdf3" : "#fef3f2";

            return `<tr class="${rowClass}" style="background:${rowBackground};"><td>${escapeHtml(String(cellResult.rowNumber))}</td><td>${escapeHtml(cellResult.columnName)}</td><td>${escapeHtml(cellResult.expectedValue)}</td><td>${escapeHtml(cellResult.actualValue)}</td><td><strong style="color:${statusColor};">${escapeHtml(cellResult.status)}</strong></td></tr>`;
          })
          .join("")
      : '<tr><td colspan="5">No CSV rows were available for comparison.</td></tr>';

    return `
      <div class="config-compare-wrap">
        <h3>Config CSV Comparison - ${escapeHtml(fileName)}</h3>
        <p>Status: <strong style="color:${comparison.differences.length === 0 ? "#166534" : "#991b1b"};">${comparison.differences.length === 0 ? "PASSED" : "FAILED"}</strong></p>
        <p>Rows Compared: <strong>${comparison.rowsCompared}</strong> | Matched Rows: <strong>${comparison.matchedRows}</strong> | Mismatched Rows: <strong>${comparison.mismatchedRows}</strong> | Duration: <strong>${durationMs}ms</strong></p>
        <table class="config-compare-table" border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px;">
          <thead>
            <tr style="background:#f3f4f6;"><th>Row Number</th><th>Column Name</th><th>Expected Value</th><th>Actual Value</th><th>Status</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }
}

interface CsvComparisonResult {
  rowsCompared: number;
  matchedRows: number;
  mismatchedRows: number;
  differences: ComparisonDifference[];
  cellResults: ComparisonCellResult[];
}

class CsvTable {
  private constructor(
    readonly headers: string[],
    readonly rows: string[][]
  ) {}

  static fromContent(content: string): CsvTable {
    const records = parseCsv(content.replace(/^\uFEFF/, ""));
    if (!records.length) {
      return new CsvTable([], []);
    }

    const headers = records[0].map((header, index) => normalizeCsvValue(header) || `Column_${index + 1}`);
    return new CsvTable(headers, records.slice(1));
  }
}

class CsvComparisonEngine {
  static compare(expected: CsvTable, actual: CsvTable): CsvComparisonResult {
    const differences: ComparisonDifference[] = [];
    const cellResults: ComparisonCellResult[] = [];
    const expectedHeaderSet = new Set(expected.headers);
    const actualHeaderSet = new Set(actual.headers);
    const comparableHeaders = expected.headers.filter((header) => actualHeaderSet.has(header));

    for (const header of expected.headers) {
      if (!actualHeaderSet.has(header)) {
        const difference = this.difference(1, header, "PRESENT", "MISSING", "MISSING_COLUMN");
        differences.push(difference);
        cellResults.push(difference);
      }
    }

    for (const header of actual.headers) {
      if (!expectedHeaderSet.has(header)) {
        const difference = this.difference(1, header, "MISSING", "PRESENT", "UNEXPECTED_COLUMN");
        differences.push(difference);
        cellResults.push(difference);
      }
    }

    const maxRows = Math.max(expected.rows.length, actual.rows.length);
    let matchedRows = 0;
    let mismatchedRows = 0;

    for (let index = 0; index < maxRows; index += 1) {
      const rowNumber = index + 2;
      const expectedRow = expected.rows[index];
      const actualRow = actual.rows[index];
      const rowDifferenceCount = differences.length;

      if (!expectedRow && actualRow) {
        const difference = this.difference(rowNumber, "<ROW>", "MISSING", serializeRow(actual.headers, actualRow), "UNEXPECTED_ROW");
        differences.push(difference);
        cellResults.push(difference);
        mismatchedRows += 1;
        continue;
      }

      if (expectedRow && !actualRow) {
        const difference = this.difference(rowNumber, "<ROW>", serializeRow(expected.headers, expectedRow), "MISSING", "MISSING_ROW");
        differences.push(difference);
        cellResults.push(difference);
        mismatchedRows += 1;
        continue;
      }

      for (const header of comparableHeaders) {
        const expectedValue = normalizeCsvValue(expectedRow[expected.headers.indexOf(header)]);
        const actualValue = normalizeCsvValue(actualRow[actual.headers.indexOf(header)]);

        if (!valuesEqual(expectedValue, actualValue)) {
          const difference = this.difference(rowNumber, header, expectedValue, actualValue, "MISMATCH");
          differences.push(difference);
          cellResults.push(difference);
        } else {
          cellResults.push(this.cellResult(rowNumber, header, expectedValue, actualValue, "MATCHED"));
        }
      }

      if (differences.length === rowDifferenceCount) {
        matchedRows += 1;
      } else {
        mismatchedRows += 1;
      }
    }

    return {
      rowsCompared: maxRows,
      matchedRows,
      mismatchedRows,
      differences,
      cellResults,
    };
  }

  private static difference(
    rowNumber: number,
    columnName: string,
    expectedValue: string,
    actualValue: string,
    status: ComparisonDifference["status"]
  ): ComparisonDifference {
    return { rowNumber, columnName, expectedValue, actualValue, status };
  }

  private static cellResult(
    rowNumber: number,
    columnName: string,
    expectedValue: string,
    actualValue: string,
    status: ComparisonCellResult["status"]
  ): ComparisonCellResult {
    return { rowNumber, columnName, expectedValue, actualValue, status };
  }
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function normalizeCsvValue(value: string | undefined): string {
  const normalized = String(value ?? "").trim();
  return /^(null|undefined)$/i.test(normalized) ? "" : normalized;
}

function valuesEqual(expected: string, actual: string): boolean {
  if (expected === actual) {
    return true;
  }

  const expectedNumber = Number(expected);
  const actualNumber = Number(actual);
  return expected !== "" && actual !== "" && Number.isFinite(expectedNumber) && Number.isFinite(actualNumber) && expectedNumber === actualNumber;
}

function serializeRow(headers: string[], row: string[]): string {
  return headers.map((header, index) => `${header}=${normalizeCsvValue(row[index])}`).join(" | ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

class JsonComparator implements FileComparator {
  supports(extension: string): boolean {
    return extension === ".json";
  }

  async compare(expectedPath: string, actualPath: string): Promise<FileComparisonResult> {
    const [expected, actual] = await Promise.all([
      fs.readJSON(expectedPath),
      fs.readJSON(actualPath),
    ]);

    const normalizedExpected = JSON.stringify(expected);
    const normalizedActual = JSON.stringify(actual);
    const isEqual = normalizedExpected === normalizedActual;

    return {
      expectedPath,
      actualPath,
      fileName: path.basename(actualPath),
      isEqual,
      summary: isEqual
        ? `JSON comparison passed for ${path.basename(actualPath)}`
        : `JSON comparison failed for ${path.basename(actualPath)}. JSON structures are different.`,
      detail: isEqual ? undefined : "JSON payload mismatch detected.",
    };
  }
}

class BinaryHashComparator implements FileComparator {
  supports(_extension: string): boolean {
    return true;
  }

  async compare(expectedPath: string, actualPath: string): Promise<FileComparisonResult> {
    const [expectedHash, actualHash] = await Promise.all([
      this.sha256(expectedPath),
      this.sha256(actualPath),
    ]);

    const isEqual = expectedHash === actualHash;

    return {
      expectedPath,
      actualPath,
      fileName: path.basename(actualPath),
      isEqual,
      summary: isEqual
        ? `Binary comparison passed for ${path.basename(actualPath)}`
        : `Binary comparison failed for ${path.basename(actualPath)}. Hash mismatch detected.`,
      detail: isEqual ? undefined : `Expected hash: ${expectedHash}, Actual hash: ${actualHash}`,
    };
  }

  private async sha256(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  }
}

export class ComparatorFactory {
  private readonly comparators: FileComparator[] = [
    new ExcelComparator(),
    new CsvComparator(),
    new JsonComparator(),
    new BinaryHashComparator(),
  ];

  getComparator(filePathValue: string): FileComparator {
    const extension = path.extname(filePathValue).toLowerCase();
    const comparator = this.comparators.find((candidate) => candidate.supports(extension));

    if (!comparator) {
      throw new UnsupportedFileTypeError(
        `No comparator registered for file extension '${extension}' from file '${filePathValue}'`
      );
    }

    return comparator;
  }
}
