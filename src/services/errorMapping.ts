
import {
  HarProcessingError,
  HarParsingError,
  EmptyHarError,
  InvalidHarFormatError,
  NoRequestsFoundError,
  NoRelevantRequestsError,
} from './errors';

export interface ErrorInfo {
  title: string;
  description: string;
}

export const errorMapping: Map<new () => Error, ErrorInfo> = new Map([
  [
    EmptyHarError,
    {
      title: 'Empty HAR File',
      description: 'The uploaded HAR file is empty. Please select a valid file.',
    },
  ],
  [
    InvalidHarFormatError,
    {
      title: 'Invalid HAR Format',
      description:
        "The file doesn't appear to be a valid HAR file. Please check the file and try again.",
    },
  ],
  [
    NoRequestsFoundError,
    {
      title: 'No Requests Found',
      description:
        'The HAR file is valid, but it contains no network requests to analyze.',
    },
  ],
  [
    NoRelevantRequestsError,
    {
      title: 'No Relevant Requests',
      description:
        'No relevant requests were found for the selected analysis mode.',
    },
  ],
  [
    HarParsingError,
    {
      title: 'HAR Parsing Error',
      description:
        'An unexpected error occurred while parsing the HAR file. Please ensure it is well-formed.',
    },
  ],
  [
    HarProcessingError,
    {
      title: 'Processing Error',
      description:
        'An unexpected error occurred during analysis. Please try again or check the file.',
    },
  ],
]);
