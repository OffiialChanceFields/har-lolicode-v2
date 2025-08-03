// src/services/types.ts

export interface Har {
    log: {
      version: string;
      creator: {
        name: string;
        version: string;
      };
      browser?: {
        name: string;
        version: string;
      };
      pages?: HarPage[];
      entries: HarEntry[];
      comment?: string;
    };
  }
  
  export interface HarPage {
    startedDateTime: string;
    id: string;
    title: string;
    pageTimings: {
      onContentLoad: number;
      onLoad: number;
      comment?: string;
    };
    comment?: string;
  }
  
  export interface HarEntry {
    pageref?: string;
    startedDateTime: string;
    time: number;
    request: HarRequest;
    response: HarResponse;
    cache: HarCache;
    timings: HarTimings;
    serverIPAddress?: string;
    connection?: string;
    comment?: string;
    score?: number;
  }
  
  export interface HarRequest {
    method: string;
    url: string;
    httpVersion: string;
    cookies: HarCookie[];
    headers: HarHeader[];
    queryString: HarQueryString[];
    postData?: HarPostData;
    headersSize: number;
    bodySize: number;
    comment?: string;
  }
  
  export interface HarResponse {
    status: number;
    statusText: string;
    httpVersion: string;
    cookies: HarCookie[];
    headers: HarHeader[];
    content: HarContent;
    redirectURL: string;
    headersSize: number;
    bodySize: number;
    comment?: string;
  }
  
  export interface HarCookie {
    name: string;
    value: string;
    path?: string;
    domain?: string;
    expires?: string;
    httpOnly?: boolean;
    secure?: boolean;
    comment?: string;
    sameSite?: string;
  }
  
  export interface HarHeader {
    name: string;
    value: string;
    comment?: string;
  }
  
  export interface HarQueryString {
    name: string;
    value: string;
    comment?: string;
  }
  
  export interface HarPostData {
    mimeType: string;
    params: HarParam[];
    text: string;
    comment?: string;
  }
  
  export interface HarParam {
    name: string;
    value?: string;
    fileName?: string;
    contentType?: string;
    comment?: string;
  }
  
  export interface HarContent {
    size: number;
    compression?: number;
    mimeType: string;
    text?: string;
    encoding?: string;
    comment?: string;
  }
  
  export interface HarCache {
    beforeRequest?: HarCacheEntry | null;
    afterRequest?: HarCacheEntry | null;
    comment?: string;
  }
  
  export interface HarCacheEntry {
    expires?: string;
    lastAccess: string;
    eTag: string;
    hitCount: number;
    comment?: string;
  }
  
  export interface HarTimings {
    blocked: number;
    dns: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
    ssl: number;
    comment?: string;
  }

  export interface HarAnalysisResult {
    requests: HarEntry[];
    metrics: {
        totalRequests: number;
        significantRequests: number;
        processingTime: number;
    };
    loliCode: string;
    detectedTokens: any;
}
  