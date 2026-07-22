import path from "path";
import type { Logger } from "winston";
import { DownloadError, FileDiscoveryError } from "./errors";
import type { ClaimsFilterContext } from "./filterContext";
import type { ArtifactKind, DownloadedFileInfo, FileComparisonResult, ValidationRunResult } from "./types";
import { DynamicTestDataFolderResolver } from "./folderResolver";
import { ExpectedFileDiscoveryService } from "./fileDiscovery";
import { ComparatorFactory } from "./comparisonEngine";
import type { ClaimsPage } from "../../test/pages/ClaimsPage.spec";

export class ClaimsFileValidationOrchestrator {
  private readonly dimensions: string[];

  constructor(
    private readonly logger: Logger,
    private readonly claimsPage: ClaimsPage,
    private readonly folderResolver: DynamicTestDataFolderResolver,
    private readonly fileDiscovery: ExpectedFileDiscoveryService,
    private readonly comparatorFactory: ComparatorFactory,
    configuredDimensions?: string
  ) {
    this.dimensions = (configuredDimensions || "B U,Scheme Type,Sub Scheme Type")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async validateRhFiles(filterContext: ClaimsFilterContext): Promise<ValidationRunResult> {
    const startedAt = Date.now();
    const resolvedFolder = await this.folderResolver.resolveFromFilters(filterContext, this.dimensions);

    await this.logger.info(
      `[ClaimsValidation] Applied Filters: ${filterContext.list().map((item) => `${item.label}=${item.value}`).join(" | ")}`
    );
    await this.logger.info(`[ClaimsValidation] Resolved Folder: ${resolvedFolder.resolvedPath}`);

    const expectedRhFiles = await this.fileDiscovery.discoverRhFiles(resolvedFolder.resolvedPath);
    await this.logger.info(`[ClaimsValidation] Expected RH files found: ${expectedRhFiles.map((item) => path.basename(item)).join(", ")}`);

    const uiFileNames = await this.claimsPage.getDownloadableFileNamesFromUi();
    const rhUiFileNames = uiFileNames.filter((fileName) => this.fileDiscovery.isRhFile(fileName));

    const actualDownloadTargets = rhUiFileNames.length
      ? rhUiFileNames
      : expectedRhFiles.length === 1
        ? [path.basename(expectedRhFiles[0])]
        : [];

    if (!actualDownloadTargets.length) {
      throw new FileDiscoveryError(
        `Could not infer RH download targets from UI. RH candidates expected: ${expectedRhFiles
          .map((item) => path.basename(item))
          .join(", ")}`
      );
    }

    const comparedFiles = [];

    for (const rhFileName of actualDownloadTargets) {
      const expectedPath = await this.fileDiscovery.resolveExpectedByUiFileName(
        resolvedFolder.resolvedPath,
        rhFileName
      );

      let actualPath: string;
      try {
        actualPath = rhUiFileNames.length
          ? await this.claimsPage.downloadFileByName(rhFileName)
          : await this.claimsPage.clickOnDownloadRHFile();
      } catch (error) {
        throw new DownloadError(
          `Failed to download RH file '${rhFileName}'. ${(error as Error).message}`
        );
      }

      await this.logger.info(`[ClaimsValidation] Downloaded RH file: ${actualPath}`);

      const comparator = this.comparatorFactory.getComparator(expectedPath);
      await this.logger.info(`[ClaimsValidation] Comparator used: ${comparator.constructor.name}`);
      const comparisonResult = await comparator.compare(expectedPath, actualPath);
      await this.logger.info(
        `[ClaimsValidation] Comparing RH ${path.basename(expectedPath)} vs ${path.basename(actualPath)} => ${comparisonResult.isEqual ? "MATCH" : "MISMATCH"}`
      );

      comparedFiles.push(comparisonResult);
    }

    const result = this.buildResult("RH", resolvedFolder, comparedFiles);
    await this.logger.info(
      `[ClaimsValidation] RH summary: total=${result.totalFiles}, matched=${result.matchedFiles}, mismatched=${result.mismatchedFiles}, durationMs=${Date.now() - startedAt}`
    );
    return result;
  }

  async validateConfigFiles(filterContext: ClaimsFilterContext): Promise<ValidationRunResult> {
    const startedAt = Date.now();
    const resolvedFolder = await this.folderResolver.resolveFromFilters(filterContext, this.dimensions);

    await this.logger.info(
      `[ClaimsValidation] Applied Filters: ${filterContext.list().map((item) => `${item.label}=${item.value}`).join(" | ")}`
    );
    await this.logger.info(`[ClaimsValidation] Resolved Folder: ${resolvedFolder.resolvedPath}`);

    const uiConfigFileNames = await this.claimsPage.getConfigFileNamesFromUi();
    if (!uiConfigFileNames.length) {
      throw new FileDiscoveryError("No config files were discovered from the UI.");
    }

    await this.logger.info(
      `[ClaimsValidation] Config file names from UI: ${uiConfigFileNames.join(", ")}`
    );

    const comparedFiles = [];

    for (const uiConfigFileName of uiConfigFileNames) {
      const expectedPath = await this.fileDiscovery.resolveExpectedByUiFileName(
        resolvedFolder.resolvedPath,
        uiConfigFileName,
        { excludeRhFiles: true }
      );

      let actualPath: string;
      try {
        actualPath = await this.claimsPage.downloadFileByName(uiConfigFileName);
      } catch (error) {
        throw new DownloadError(
          `Failed to download config file '${uiConfigFileName}'. ${(error as Error).message}`
        );
      }
      await this.logger.info(`[ClaimsValidation] Downloaded config file: ${actualPath}`);

      const comparator = this.comparatorFactory.getComparator(expectedPath);
      await this.logger.info(`[ClaimsValidation] Comparator used: ${comparator.constructor.name}`);
      const comparisonResult = await comparator.compare(expectedPath, actualPath);

      await this.logger.info(
        `[ClaimsValidation] Comparing config ${path.basename(expectedPath)} vs ${path.basename(actualPath)} => ${comparisonResult.isEqual ? "MATCH" : "MISMATCH"}`
      );

      comparedFiles.push(comparisonResult);
    }

    const result = this.buildResult("CONFIG", resolvedFolder, comparedFiles);
    await this.logger.info(
      `[ClaimsValidation] CONFIG summary: total=${result.totalFiles}, matched=${result.matchedFiles}, mismatched=${result.mismatchedFiles}, durationMs=${Date.now() - startedAt}`
    );
    return result;
  }

  async validateDownloadedConfigFiles(
    filterContext: ClaimsFilterContext,
    downloadedConfigFiles: DownloadedFileInfo[]
  ): Promise<ValidationRunResult> {
    const startedAt = Date.now();
    const resolvedFolder = await this.folderResolver.resolveFromFilters(filterContext, this.dimensions);

    if (!downloadedConfigFiles.length) {
      throw new DownloadError("No downloaded config files were provided for validation.");
    }

    await this.logger.info(
      `[ClaimsValidation] Applied Filters: ${filterContext.list().map((item) => `${item.label}=${item.value}`).join(" | ")}`
    );
    await this.logger.info(`[ClaimsValidation] Resolved Folder: ${resolvedFolder.resolvedPath}`);
    await this.logger.info(
      `[ClaimsValidation] Downloaded config files: ${downloadedConfigFiles.map((item) => item.fileName).join(", ")}`
    );

    const comparedFiles = [];

    for (const downloadedConfigFile of downloadedConfigFiles) {
      const expectedPath = await this.fileDiscovery.resolveExpectedByExactFileName(
        resolvedFolder.resolvedPath,
        downloadedConfigFile.fileName
      );

      const comparator = this.comparatorFactory.getComparator(expectedPath);
      await this.logger.info(`[ClaimsValidation] Comparator used: ${comparator.constructor.name}`);
      const comparisonResult = await comparator.compare(expectedPath, downloadedConfigFile.filePath);

      await this.logger.info(
        `[ClaimsValidation] Comparing config ${path.basename(expectedPath)} vs ${path.basename(downloadedConfigFile.filePath)} => ${comparisonResult.isEqual ? "MATCH" : "MISMATCH"}`
      );

      comparedFiles.push(comparisonResult);
    }

    const result = this.buildResult("CONFIG", resolvedFolder, comparedFiles);
    await this.logger.info(
      `[ClaimsValidation] CONFIG summary: total=${result.totalFiles}, matched=${result.matchedFiles}, mismatched=${result.mismatchedFiles}, durationMs=${Date.now() - startedAt}`
    );
    return result;
  }

  private buildResult(
    artifactKind: ArtifactKind,
    resolvedFolder: Awaited<ReturnType<DynamicTestDataFolderResolver["resolveFromFilters"]>>,
    comparedFiles: FileComparisonResult[]
  ): ValidationRunResult {
    const matchedFiles = comparedFiles.filter((result) => result.isEqual).length;

    return {
      artifactKind,
      resolvedFolder,
      comparedFiles,
      totalFiles: comparedFiles.length,
      matchedFiles,
      mismatchedFiles: comparedFiles.length - matchedFiles,
    };
  }
}
