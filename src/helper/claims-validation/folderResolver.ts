import fs from "fs-extra";
import path from "path";
import { FolderResolutionError } from "./errors";
import { normalizeToken, scoreNameMatch } from "./normalizer";
import type { ClaimsFilterContext } from "./filterContext";
import type { ResolvedFolderResult } from "./types";

const LEAF_SCHEME_TYPES = new Set(["BUY_SIDE", "PDC", "ONE_OFF"]);

export class DynamicTestDataFolderResolver {
  constructor(private readonly testDataRootPath: string) {}

  getRootPath(): string {
    return this.testDataRootPath;
  }

  async resolveFromFilters(
    filterContext: ClaimsFilterContext,
    dimensions: string[]
  ): Promise<ResolvedFolderResult> {
    if (!(await fs.pathExists(this.testDataRootPath))) {
      throw new FolderResolutionError(
        `Test data root folder was not found: ${this.testDataRootPath}`
      );
    }

    const segments: Array<{ dimension: string; requested: string; resolved: string }> = [];
    let currentPath = this.testDataRootPath;

    for (let index = 0; index < dimensions.length; index += 1) {
      const dimension = dimensions[index];
      const requestedSegment = this.getFilterValue(filterContext, dimension);
      const isLastDimension = index === dimensions.length - 1;
      const resolvedDirectoryName = await this.resolveChildDirectoryName(
        currentPath,
        requestedSegment,
        isLastDimension && this.canOmitLeafFolder(filterContext, dimension)
      );

      if (!resolvedDirectoryName) {
        segments.push({
          dimension,
          requested: requestedSegment,
          resolved: ".",
        });
        continue;
      }

      segments.push({
        dimension,
        requested: requestedSegment,
        resolved: resolvedDirectoryName,
      });

      currentPath = path.join(currentPath, resolvedDirectoryName);
    }

    return {
      rootPath: this.testDataRootPath,
      resolvedPath: currentPath,
      segments,
    };
  }

  private async resolveChildDirectoryName(parentPath: string, requestedName: string, allowLeafFolderOmission = false): Promise<string | undefined> {
    const entries = await fs.readdir(parentPath, { withFileTypes: true });
    const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    if (!directories.length) {
      if (allowLeafFolderOmission && entries.some((entry) => entry.isFile())) {
        return undefined;
      }

      throw new FolderResolutionError(`No child directories found under ${parentPath}`);
    }

    const scoredMatches = directories
      .map((directoryName) => ({
        directoryName,
        score: scoreNameMatch(requestedName, directoryName),
        normalized: normalizeToken(directoryName),
      }))
      .sort((left, right) => right.score - left.score);

    const bestMatch = scoredMatches[0];

    if (!bestMatch || bestMatch.score <= 0) {
      if (allowLeafFolderOmission && entries.some((entry) => entry.isFile())) {
        return undefined;
      }

      throw new FolderResolutionError(
        `Could not resolve '${requestedName}' under ${parentPath}. Available folders: ${directories.join(", ")}`
      );
    }

    const ambiguousMatches = scoredMatches.filter(
      (candidate) => candidate.score === bestMatch.score && candidate.normalized !== bestMatch.normalized
    );

    if (ambiguousMatches.length > 0 && bestMatch.score < 1000) {
      const options = [bestMatch.directoryName, ...ambiguousMatches.map((candidate) => candidate.directoryName)].join(", "
      );
      throw new FolderResolutionError(
        `Ambiguous folder resolution for '${requestedName}' under ${parentPath}. Candidate folders: ${options}`
      );
    }

    return bestMatch.directoryName;
  }

  private getFilterValue(filterContext: ClaimsFilterContext, dimension: string): string {
    const normalizedDimension = normalizeToken(dimension);

    if (normalizedDimension === "B_U") {
      return filterContext.get("Category") || filterContext.getRequired(dimension);
    }

    return filterContext.getRequired(dimension);
  }

  private canOmitLeafFolder(filterContext: ClaimsFilterContext, dimension: string): boolean {
    if (normalizeToken(dimension) !== "SUB_SCHEME_TYPE") {
      return false;
    }

    const schemeType = filterContext.get("Scheme Type");
    return Boolean(schemeType && LEAF_SCHEME_TYPES.has(normalizeToken(schemeType)));
  }
}
