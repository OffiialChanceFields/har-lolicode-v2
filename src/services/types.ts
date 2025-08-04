import { MatchedPattern } from '../flow-analysis/types';
import { AnalysisMode } from './AnalysisMode';

// Basic HAR Interfaces
export interface HarHeader {
  name: string;
  value: string;
}

export interface HarCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface HarPostData {
  mimeType: string;
  text?: string;
  params?: { name: string; value: string }[];
}

export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  headers: HarHeader[];
  queryString: { name: string; value: string }[];
  cookies: HarCookie[];
  headersSize: number;
  bodySize: number;
  postData?: HarPostData;
}

export interface HarContent {
  size: number;
  mimeType: string;
  text?: string;
  encoding?: string;
}

export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: HarHeader[];
  cookies: HarCookie[];
  content: HarContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
}

export interface RequestParameter {
  name: string;
  value: string;
  location: 'query' | 'body' | 'header';
  isCredential?: boolean;
}

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    queryString: { name: string; value: string }[];
    cookies: { name: string; value: string; path?: string; domain?: string; expires?: string; httpOnly?: boolean; secure?: boolean; sameSite?: string }[];
    headersSize: number;
    bodySize: number;
    postData?: {
      mimeType: string;
      text?: string;
      params?: { name: string; value: string }[];
    };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    cookies: { name: string; value: string; path?: string; domain?: string; expires?: string; httpOnly?: boolean; secure?: boolean; sameSite?: string }[];
    content: {
      size: number;
      compression?: number;
      mimeType: string;
      text?: string;
      encoding?: string;
    };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache?: Record<string, unknown>;
  timings?: Record<string, unknown>;
  serverIPAddress?: string;
  connection?: string;
  comment?: string;
  parameters?: RequestParameter[];
}

// OB2 LoliCode Generation Types
export interface OB2BlockDefinition {
  blockType: string;
  parameters: Map<string, string>;
}

export interface OB2ConfigurationResult {
  loliCode: string;
  blocks: OB2BlockDefinition[];
  variables: Map<string, string>;
}

// Analysis Result Types
export interface ProcessingMetrics {
  totalRequests?: number;
  significantRequests?: number;
  processingTime?: number;
  filteringTime?: number;
  scoringTime?: number;
  tokenDetectionTime?: number;
  codeGenerationTime?: number;
  correlationAnalysisTime?: number;
  averageScore?: number;
  resourceTypeDistribution?: Map<AnalysisMode.ResourceType, number>;
  detectedPatterns?: string[];
}

export interface HarAnalysisResult {
  requests: HarEntry[];
  metrics: ProcessingMetrics;
  loliCode: string;
  detectedTokens?: Map<string, DetectedToken[]>;
  behavioralFlows?: MatchedPattern[];
  warnings?: string[];
  // Allow backward compatibility with possible extra fields
  [key: string]: any;
}
