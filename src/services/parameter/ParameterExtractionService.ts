import { HarEntry, RequestParameter } from '../types';

const CREDENTIAL_PARAM_NAMES = /^(user(name)?|email|pass(word)?|pwd)$/i;

export class ParameterExtractionService {
  /**
   * Extracts all request parameters (query, body, important headers) from a HAR entry.
   * @param entry HarEntry
   * @returns RequestParameter[]
   */
  static extract(entry: HarEntry): RequestParameter[] {
    const params: RequestParameter[] = [];
    // 1. Query string
    if (entry.request.queryString && entry.request.queryString.length > 0) {
      for (const { name, value } of entry.request.queryString) {
        params.push({
          name,
          value,
          location: 'query',
          isCredential: this.classifyCredential(name)
        });
      }
    }
    // 2. POST body params (form fields or JSON)
    if (
      entry.request.postData &&
      Array.isArray(entry.request.postData.params) &&
      entry.request.postData.params.length > 0
    ) {
      for (const { name, value } of entry.request.postData.params) {
        params.push({
          name,
          value,
          location: 'body',
          isCredential: this.classifyCredential(name)
        });
      }
    } else if (
      entry.request.postData &&
      entry.request.postData.mimeType &&
      entry.request.postData.mimeType.includes('application/json') &&
      entry.request.postData.text
    ) {
      // Already flattened at parser, but let's check and flatten if needed
      try {
        const parsed = JSON.parse(entry.request.postData.text);
        const flat: Record<string, string> = {};
        // Flatten 1-level deep, stringify non-primitives
        for (const [k, v] of Object.entries(parsed)) {
          flat[k] = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
        }
        for (const [name, value] of Object.entries(flat)) {
          params.push({
            name,
            value,
            location: 'body',
            isCredential: this.classifyCredential(name)
          });
        }
      } catch {
        // ignore
      }
    }
    // 3. Important headers (Authorization, X-Requested-With, custom headers with tokens)
    if (entry.request.headers && entry.request.headers.length > 0) {
      for (const { name, value } of entry.request.headers) {
        const lower = name.toLowerCase();
        if (
          lower === 'authorization' ||
          lower === 'x-requested-with' ||
          /token|auth|session|jwt/i.test(lower)
        ) {
          params.push({
            name,
            value,
            location: 'header',
            isCredential: this.classifyCredential(name)
          });
        }
      }
    }
    // deduplicate by name/location
    const seen = new Set<string>();
    const deduped = params.filter((p) => {
      const k = `${p.location}:${p.name}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return deduped;
  }

  /**
   * Heuristically classify if a parameter is a credential (username, password, email)
   */
  static classifyCredential(name: string): boolean {
    return CREDENTIAL_PARAM_NAMES.test(name);
  }
}