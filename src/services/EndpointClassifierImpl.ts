// src/services/EndpointClassifierImpl.ts

import { HarRequest } from './types';
import { AnalysisMode } from './AnalysisMode';

export class EndpointClassifierImpl {
  // Heuristic classification based on URL, method, and file extension
  classifyEndpoint(request: HarRequest): AnalysisMode.ResourceType[] {
    const url = request.url.toLowerCase();
    const method = request.method.toUpperCase();
    const types: AnalysisMode.ResourceType[] = [];

    if (url.includes('login') || url.includes('auth') || url.includes('token')) {
      types.push(AnalysisMode.ResourceType.AUTHENTICATION);
    }
    if (url.includes('/api/') || url.includes('/v1/') || url.includes('/graphql')) {
      types.push(AnalysisMode.ResourceType.API_ENDPOINT);
      if (url.includes('/graphql')) types.push(AnalysisMode.ResourceType.GRAPHQL);
      else types.push(AnalysisMode.ResourceType.REST_API);
    }
    if (method === 'POST' && (url.includes('submit') || url.includes('form'))) {
      types.push(AnalysisMode.ResourceType.FORM_SUBMISSION);
    }
    if (
      url.endsWith('.html') || url.endsWith('.htm') ||
      url.endsWith('.asp') || url.endsWith('.php')
    ) {
      types.push(AnalysisMode.ResourceType.HTML_DOCUMENT);
    }
    if (
      url.endsWith('.zip') || url.endsWith('.tar') ||
      url.endsWith('.gz') || url.endsWith('.pdf') ||
      url.endsWith('.csv') || url.endsWith('.xlsx')
    ) {
      types.push(AnalysisMode.ResourceType.FILE_UPLOAD);
    }
    if (url.startsWith('ws') || url.includes('websocket')) {
      types.push(AnalysisMode.ResourceType.WEBSOCKET);
    }
    if (
      url.includes('google-analytics') || url.includes('tracker') || url.includes('tracking')
    ) {
      types.push(AnalysisMode.ResourceType.TRACKING);
      types.push(AnalysisMode.ResourceType.THIRD_PARTY);
    }
    if (
      url.endsWith('.js') || url.endsWith('.css') ||
      url.endsWith('.png') || url.endsWith('.jpg') ||
      url.endsWith('.jpeg') || url.endsWith('.gif') ||
      url.endsWith('.svg') || url.endsWith('.ico') ||
      url.endsWith('.woff') || url.endsWith('.ttf')
    ) {
      types.push(AnalysisMode.ResourceType.STATIC_ASSET);
    }
    if (url.includes('session')) {
      types.push(AnalysisMode.ResourceType.SESSION_MANAGEMENT);
    }
    // Default fallback
    if (types.length === 0) {
      types.push(AnalysisMode.ResourceType.API_ENDPOINT);
    }
    return Array.from(new Set(types));
  }

  getEndpointCharacteristics(url: string): AnalysisMode.EndpointCharacteristics {
    // Simple heuristics
    const u = url.toLowerCase();
    const hasAuthentication = u.includes('auth') || u.includes('login') || u.includes('token');
    const hasStateChange = /\/(submit|update|create|delete|reset|set)/.test(u);
    const hasDataSubmission = /\/(submit|upload|post|form|add|set)/.test(u);
    const hasSensitiveData = u.includes('password') || u.includes('token') || u.includes('secret');
    const isIdempotent = !hasStateChange && !hasDataSubmission;
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const parameterTypes: AnalysisMode.ParameterType[] = [];

    if (u.includes('jwt')) parameterTypes.push(AnalysisMode.ParameterType.JWT);
    if (u.includes('api_key')) parameterTypes.push(AnalysisMode.ParameterType.API_KEY);
    if (u.includes('oauth')) parameterTypes.push(AnalysisMode.ParameterType.OAUTH_STATE);

    return {
      hasAuthentication,
      hasStateChange,
      hasDataSubmission,
      hasSensitiveData,
      isIdempotent,
      httpMethods,
      parameterTypes
    };
  }
}