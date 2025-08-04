import { DependencyAnalysisResult } from './dependency/types';
import { MatchedPattern } from '../flow-analysis/BehavioralPatternMatcher';
import { OptimizedRequestFlow } from './optimization/types';
import { MFAAnalysisResult } from './mfa/types';
import { FlowContextResult } from '../flow-analysis/types';
import { TokenExtractionResult } from '../token-extraction/types';

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
  url:string;
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

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache?: any;
  timings?: any;
  serverIPAddress?: string;
  connection?: string;
  comment?: string;
}

export interface HarAnalysisResult {
  requests: any[]; // Scored entries, consider a more specific type
  metrics: {
    totalRequests: number;
    significantRequests: number;
    processingTime: number;
  };
  loliCode: string;
  tokenExtractionResults: TokenExtractionResult[];
  matchedPatterns: MatchedPattern[];
  dependencyAnalysis?: DependencyAnalysisResult;
  optimizedFlow?: OptimizedRequestFlow;
  mfaAnalysis?: MFAAnalysisResult[];
  flowContext?: FlowContextResult;
}
