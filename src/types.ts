// src/types.ts

export interface HarCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface HarRequest {
  method: string;
  url: string;
  headers: { name: string; value: string }[];
  postData?: {
    mimeType: string;
    text?: string;
    params?: { name: string; value: string }[];
  };
  cookies?: HarCookie[];
  queryString?: { name: string; value: string }[];
}

export interface HarResponse {
  status: number;
  content?: {
    mimeType?: string;
    text?: string;
  };
  headers: { name: string; value: string }[];
  cookies?: HarCookie[];
  redirectURL?: string;
  headersSize?: number;
  bodySize?: number;
}

export interface HarEntry {
  request: HarRequest;
  response: HarResponse;
  startedDateTime: string;
  time: number;
  detectedTokens?: any[]; // Add this property to satisfy the compiler
}

export interface BehavioralFlow {
  steps: HarEntry[];
  extractedData?: Record<string, unknown>;
  confidence?: number;
}