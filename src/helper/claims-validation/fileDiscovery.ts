import fs from "fs-extra";
import path from "path";
import { FileDiscoveryError } from "./errors";
import { normalizeToken, scoreNameMatch, toTokenSet } from "./normalizer";

export class ExpectedFileDiscoveryService {
  async listFiles(folderPath: string): Promise<string[]> {
    if (!(await fs.pathExists(folderPath))) {
      throw new FileDiscoveryError(`Expected folder does not exist: ${folderPath}`);
    }

    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => path.join(folderPath, entry.name));
  }

  async discoverRhFiles(folderPath: string): Promise<string[]> {
    const files = await this.listFiles(folderPath);
    const rhFiles = files.filter((filePath) => this.isRhFile(filePath));

    if (!rhFiles.length) {
      throw new FileDiscoveryError(
        `No RH files found in expected folder: ${folderPath}. Ensure at least one RH file is present.`
      );
    }

    return rhFiles;
  }

  async resolveExpectedByUiFileName(
    folderPath: string,
    uiFileName: string,
    options?: { excludeRhFiles?: boolean }
  ): Promise<string> {
    const allFiles = await this.listFiles(folderPath);
    const eligibleFiles = options?.excludeRhFiles
      ? allFiles.filter((filePath) => !this.isRhFile(filePath))
      : allFiles;

    if (!eligibleFiles.length) {
      throw new FileDiscoveryError(`No expected files available in ${folderPath}`);
    }

    const scoredMatches = eligibleFiles
      .map((expectedPath) => {
        const fileName = path.basename(expectedPath);
        const exactFileNameScore = normalizeToken(uiFileName) === normalizeToken(fileName) ? 1200 : 0;
        const score = exactFileNameScore || scoreNameMatch(uiFileName, fileName);

        return {
          expectedPath,
          fileName,
          score,
        };
      })
      .sort((left, right) => right.score - left.score);

    const bestMatch = scoredMatches[0];

    if (!bestMatch || bestMatch.score <= 0) {
      throw new FileDiscoveryError(
        `Expected file '${uiFileName}' was not found inside ${folderPath}`
      );
    }

    const secondBest = scoredMatches[1];
    if (secondBest && secondBest.score === bestMatch.score && bestMatch.score < 1200) {
      throw new FileDiscoveryError(
        `Expected file '${uiFileName}' has ambiguous matches in ${folderPath}: ${bestMatch.fileName}, ${secondBest.fileName}`
      );
    }

    return bestMatch.expectedPath;
  }

  async resolveExpectedByExactFileName(folderPath: string, downloadedFileName: string): Promise<string> {
    const allFiles = await this.listFiles(folderPath);
    const expectedPath = allFiles.find(
      (filePath) => path.basename(filePath).toLowerCase() === downloadedFileName.toLowerCase()
    );

    if (!expectedPath) {
      throw new FileDiscoveryError(
        `Expected file '${downloadedFileName}' was not found inside ${folderPath}. Add the matching expected CSV file to the resolved TestData folder.`
      );
    }

    return expectedPath;
  }

  isRhFile(filePath: string): boolean {
    const tokens = toTokenSet(path.basename(filePath));
    return tokens.has("RH");
  }
}
