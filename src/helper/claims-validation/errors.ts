export class FrameworkError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class FilterContextError extends FrameworkError {
  constructor(message: string) {
    super(message, "FILTER_CONTEXT_ERROR");
  }
}

export class FolderResolutionError extends FrameworkError {
  constructor(message: string) {
    super(message, "FOLDER_RESOLUTION_ERROR");
  }
}

export class FileDiscoveryError extends FrameworkError {
  constructor(message: string) {
    super(message, "FILE_DISCOVERY_ERROR");
  }
}

export class DownloadError extends FrameworkError {
  constructor(message: string) {
    super(message, "DOWNLOAD_ERROR");
  }
}

export class UnsupportedFileTypeError extends FrameworkError {
  constructor(message: string) {
    super(message, "UNSUPPORTED_FILE_TYPE");
  }
}

export class ComparisonError extends FrameworkError {
  constructor(message: string) {
    super(message, "COMPARISON_ERROR");
  }
}
