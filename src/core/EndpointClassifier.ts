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
    const method = entry.request.method;

    // Enhanced authentication detection
    if (/(login|signin|auth|authenticate|token|session|account)/i.test(url) ||
        /password|credential/i.test(url) ||
        (method === 'POST' && /submit|login|auth/i.test(url))) {
      return EndpointType.AUTHENTICATION;
    }
    
    // Add detection based on request content
    if (method === 'POST' && entry.request.postData?.text) {
      const postData = entry.request.postData.text.toLowerCase();
      if (/username|email|password|credential|login/i.test(postData)) {
        return EndpointType.AUTHENTICATION;
      }
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
