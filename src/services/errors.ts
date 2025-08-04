export class HarProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HarProcessingError';
  }
}

export class HarParsingError extends HarProcessingError {
  constructor(message: string) {
    super(message);
    this.name = 'HarParsingError';
  }
}

export class EmptyHarError extends HarParsingError {
  constructor() {
    super('The HAR file is empty. Please upload a valid HAR file.');
    this.name = 'EmptyHarError';
  }
}

export class InvalidHarFormatError extends HarParsingError {
  constructor() {
    super(
      "Invalid HAR file format. The file must contain a 'log' object with an 'entries' array."
    );
    this.name = 'InvalidHarFormatError';
  }
}

export class NoRequestsFoundError extends HarProcessingError {
  constructor() {
    super('The HAR file is valid, but it contains no network requests.');
    this.name = 'NoRequestsFoundError';
  }
}

export class NoRelevantRequestsError extends HarProcessingError {
  constructor() {
    super(
      'No relevant requests were found in the HAR file after filtering. Please check the analysis mode configuration or try a different HAR file.'
    );
    this.name = 'NoRelevantRequestsError';
  }
}
