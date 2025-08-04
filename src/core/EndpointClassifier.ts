// src/core/EndpointClassifier.ts
import { HarEntry } from '../services/types';

export enum EndpointType {
  AUTHENTICATION,
  API_DATA,
  UI_ASSET,
  TRACKING,
  UNKNOWN
}

export class EndpointClassifier {
  classify(entry: HarEntry): EndpointType {
    const url = entry.request.url.toLowerCase();
    if (url.includes('login') || url.includes('auth') || url.includes('token')) {
      return EndpointType.AUTHENTICATION;
    }
    if (url.includes('/api/') || url.includes('/v1/')) {
      return EndpointType.API_DATA;
    }
    if (
      url.endsWith('.css') ||
      url.endsWith('.js') ||
      url.endsWith('.png') ||
      url.endsWith('.jpg')
    ) {
      return EndpointType.UI_ASSET;
    }
    if (url.includes('google-analytics') || url.includes('tracking')) {
      return EndpointType.TRACKING;
    }
    return EndpointType.UNKNOWN;
  }
}
