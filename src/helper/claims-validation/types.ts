export type ArtifactKind = "RH" | "CONFIG";

export interface FilterSelection {
  label: string;
  value: string;
}

export interface ResolvedFolderResult {
  rootPath: string;
  resolvedPath: string;
  segments: Array<{ dimension: string; requested: string; resolved: string }>;
}

export interface DownloadedFileInfo {
  fileName: string;
  filePath: string;
}

export interface ComparisonDifference {
  rowNumber: number;
  columnName: string;
  expectedValue: string;
  actualValue: string;
  status: "MISMATCH" | "MISSING_ROW" | "UNEXPECTED_ROW" | "MISSING_COLUMN" | "UNEXPECTED_COLUMN";
}

export interface ComparisonCellResult {
  rowNumber: number;
  columnName: string;
  expectedValue: string;
  actualValue: string;
  status: "MATCHED" | "MISMATCH" | "MISSING_ROW" | "UNEXPECTED_ROW" | "MISSING_COLUMN" | "UNEXPECTED_COLUMN";
}

export interface FileComparisonResult {
  expectedPath: string;
  actualPath: string;
  fileName: string;
  isEqual: boolean;
  summary: string;
  detail?: string;
  htmlReport?: string;
  rowsCompared?: number;
  matchedRows?: number;
  mismatchedRows?: number;
  durationMs?: number;
  differences?: ComparisonDifference[];
  cellResults?: ComparisonCellResult[];
}

export interface ValidationRunResult {
  artifactKind: ArtifactKind;
  resolvedFolder: ResolvedFolderResult;
  comparedFiles: FileComparisonResult[];
  totalFiles: number;
  matchedFiles: number;
  mismatchedFiles: number;
}
