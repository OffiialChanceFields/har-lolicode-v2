// src/services/errorMapping.ts
import {
  HarProcessingError,
  HarParsingError,
  EmptyHarError,
  InvalidHarFormatError,
  NoRequestsFoundError,
  NoRelevantRequestsError
} from './errors';

export interface ErrorDisplay {
  title: string;
  description: string;
}

const errorMap: Map<new (...args: unknown[]) => Error, ErrorDisplay> = new Map([
  [
    EmptyHarError,
    {
      title: 'Empty HAR File',
      description: 'The provided HAR file is empty. Please upload a valid file.'
    }
  ],
  [
    InvalidHarFormatError,
    {
      title: 'Invalid HAR Format',
      description:
        "The file is not a valid HAR file. Please check the format and try again."
    }
  ],
  [
    NoRequestsFoundError,
    {
      title: 'No Requests Found',
      description:
        'The HAR file is valid, but it contains no network requests to analyze.'
    }
  ],
  [
    NoRelevantRequestsError,
    {
      title: 'No Relevant Requests',
      description:
        'No relevant requests were found after filtering. Try adjusting the analysis mode.'
    }
  ],
  [
    HarParsingError,
    {
      title: 'HAR Parsing Error',
      description:
        'An unexpected error occurred while parsing the HAR file. It may be corrupted.'
    }
  ],
  [
    HarProcessingError,
    {
      title: 'Analysis Failed',
      description: 'An unexpected error occurred during the analysis.'
    }
  ]
]);

export { errorMap as errorMapping };

export function getErrorDisplay(
  error: Error
): ErrorDisplay {
  for (const [errorClass, display] of errorMap.entries()) {
    if (error instanceof errorClass) {
      return display;
    }
  }

  return {
    title: 'An Unknown Error Occurred',
    description: 'Please try again or check the console for more details.'
  };
}
