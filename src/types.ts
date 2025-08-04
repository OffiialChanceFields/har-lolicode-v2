// src/types.ts

export interface HarRequest {
  method: string;
  url: string;
  headers: { name: string; value: string }[];
  postData?: {
    mimeType: string;
    text?: string;
    params?: { name: string; value: string }[];
  };
}

export interface HarResponse {
  status: number;
  content?: {
    mimeType?: string;
    text?: string;
  };
  headers: { name: string; value: string }[];
}

export interface HarEntry {
  request: HarRequest;
  response: HarResponse;
  startedDateTime: string;
  time: number;
  detectedTokens?: any[]; // Add this property to satisfy the compiler
}