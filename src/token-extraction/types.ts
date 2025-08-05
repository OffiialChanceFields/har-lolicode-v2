// src/token-extraction/types.ts
import { HarEntry } from '../services/types';
import { TokenClassification } from './TokenDetectionService';

export enum TokenLocation {
  HEADER = 'header',
  BODY = 'body',
  COOKIE = 'cookie',
  URL = 'url',
  RESPONSE = 'response',
  ANY = 'any'
}

export interface DetectedToken {
  name: string;
  value: string;
  type: TokenClassification;
  location: TokenLocation;
  confidence: number;
  meta: {
    extractionLayer: string;
    [key: string]: unknown;
  };
}

export interface TokenExtractionResult {
  tokens: DetectedToken[];
  confidence: number;
  meta: {
    extractionLayers: string[];
    validationResults: Record<string, boolean>;
    crossReferences: Record<string, string[]>;
  };
}
