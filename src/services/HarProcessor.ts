request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    postData?: {
      mimeType: string;
      text: string;
      params?: Array<{ name: string; value: string }>;
    };
  };
  response: {
    status: number;
    content: {
      mimeType: string;
      text: string;
    };
    headers: Array<{ name: string; value: string }>;
  };
  _resourceType?: string;
}

interface HarLog {
  log: {
    entries: HarEntry[];
    pages: any[];
  };
}

interface ProcessingResult {
  loliCode: string;
  analysis: {
    requestsFound: number;
    tokensDetected: number;
    criticalPath: string[];
  };
}

export class HarProcessor {
  private static readonly STATIC_EXTENSIONS = [
    '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
    '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.webm'
  ];

  private static readonly LOGIN_KEYWORDS = [
    'login', 'auth', 'session', 'signin', 'authenticate', 'token', 
    'verify', 'credentials', 'user', 'password'
  ];

  private static readonly CREDENTIAL_FIELDS = [
    'username', 'password', 'email', 'pass', 'user', 'pwd', 
    'login', 'signin', 'credentials'
  ];

  static async processHarFile(harContent: string): Promise<ProcessingResult> {
    const harData: HarLog = JSON.parse(harContent);
    const entries = harData.log.entries;

    // Stage 1: Filter static resources
    const filteredEntries = this.filterStaticResources(entries);

    // Stage 2: Score and identify critical path
    const scoredEntries = this.scoreEntries(filteredEntries);
    const criticalPath = this.identifyCriticalPath(scoredEntries);

    // Stage 3: Detect dynamic tokens
    const tokens = this.detectDynamicTokens(criticalPath);

    // Stage 4: Generate LoliCode
    const loliCode = this.generateLoliCode(criticalPath, tokens);

    return {
      loliCode,
      analysis: {
        requestsFound: filteredEntries.length,
        tokensDetected: tokens.length,
        criticalPath: criticalPath.map(entry => `${entry.request.method} ${new URL(entry.request.url).pathname}`)
      }
    };
  }

  private static filterStaticResources(entries: HarEntry[]): HarEntry[] {
    return entries.filter(entry => {
      const url = entry.request.url.toLowerCase();
      const mimeType = entry.response.content.mimeType.toLowerCase();
      
      // Filter out static file extensions
      const hasStaticExtension = this.STATIC_EXTENSIONS.some(ext => url.includes(ext));
      
      // Filter out common static MIME types
      const isStaticMimeType = mimeType.includes('image/') || 
                              mimeType.includes('font/') ||
                              mimeType.includes('text/css') ||
                              mimeType.includes('application/javascript');

      return !hasStaticExtension && !isStaticMimeType;
    });
  }

  private static scoreEntries(entries: HarEntry[]): Array<HarEntry & { score: number }> {
    return entries.map(entry => {
      let score = 0;

      // HTTP Method scoring
      if (entry.request.method === 'POST') score += 10;
      else if (entry.request.method === 'GET') score += 3;

      // URL keyword scoring
      const url = entry.request.url.toLowerCase();
      this.LOGIN_KEYWORDS.forEach(keyword => {
        if (url.includes(keyword)) score += 8;
      });

      // Response type scoring
      const mimeType = entry.response.content.mimeType;
      if (mimeType.includes('text/html')) score += 3;
      if (mimeType.includes('application/json')) score += 5;

      // Credential data scoring
      if (entry.request.postData) {
        const postData = entry.request.postData.text?.toLowerCase() || '';
        this.CREDENTIAL_FIELDS.forEach(field => {
          if (postData.includes(field)) score += 15;
        });
      }

      // XHR/Fetch scoring
      if (entry._resourceType === 'xhr' || entry._resourceType === 'fetch') {
        score += 5;
      }

      return { ...entry, score };
    });
  }

  private static identifyCriticalPath(scoredEntries: Array<HarEntry & { score: number }>): HarEntry[] {
    // Sort by score descending
    const sortedEntries = [...scoredEntries].sort((a, b) => b.score - a.score);
    
    // Find the highest scoring POST request (likely login submission)
    const loginSubmission = sortedEntries.find(entry => 
      entry.request.method === 'POST' && entry.score > 10
    );

    if (!loginSubmission) {
      // If no clear login POST, return top 3 entries
      return sortedEntries.slice(0, 3);
    }

    const criticalPath: HarEntry[] = [];
    
    // Find the GET request before the login submission (likely login page)
    const loginSubmissionIndex = scoredEntries.indexOf(loginSubmission);
    for (let i = loginSubmissionIndex - 1; i >= 0; i--) {
      const entry = scoredEntries[i];
      if (entry.request.method === 'GET' && 
          entry.response.content.mimeType.includes('text/html')) {
        criticalPath.push(entry);
        break;
      }
    }

    // Add the login submission
    criticalPath.push(loginSubmission);

    // Add any high-scoring requests after login submission
    for (let i = loginSubmissionIndex + 1; i < scoredEntries.length; i++) {
      const entry = scoredEntries[i];
      if (entry.score > 5) {
        criticalPath.push(entry);
      }
    }

    return criticalPath.length > 0 ? criticalPath : sortedEntries.slice(0, 3);
  }

  private static detectDynamicTokens(criticalPath: HarEntry[]): Array<{
    name: string;
    value: string;
    sourceResponse: string;
    regex: string;
  }> {
    const tokens: Array<{
      name: string;
      value: string;
      sourceResponse: string;
      regex: string;
    }> = [];

    if (criticalPath.length < 2) return tokens;

    const loginPage = criticalPath[0];
    const loginSubmission = criticalPath[1];

    if (!loginSubmission.request.postData) return tokens;

    const postData = loginSubmission.request.postData.text || '';
    const responseContent = loginPage.response.content.text;

    // Common token patterns
    const tokenPatterns = [
      { name: 'csrf_token', regex: /name="[_]?csrf_token"[^>]*value="([^"]+)"/ },
      { name: '__RequestVerificationToken', regex: /name="__RequestVerificationToken"[^>]*value="([^"]+)"/ },
      { name: 'authenticity_token', regex: /name="authenticity_token"[^>]*value="([^"]+)"/ },
      { name: '_token', regex: /name="_token"[^>]*value="([^"]+)"/ }
    ];

    // Parse POST data to find parameter values
    const postParams = new URLSearchParams(postData);
    
    for (const [paramName, paramValue] of postParams.entries()) {
      // Skip obvious credential fields
      if (this.CREDENTIAL_FIELDS.some(field => 
        paramName.toLowerCase().includes(field.toLowerCase())
      )) {
        continue;
      }

      // Check if this value exists in the response content
      if (responseContent.includes(paramValue)) {
        // Try to find a matching pattern
        for (const pattern of tokenPatterns) {
          const match = responseContent.match(pattern.regex);
          if (match && match[1] === paramValue) {
            tokens.push({
              name: paramName,
              value: paramValue,
              sourceResponse: responseContent,
              regex: pattern.regex.source
            });
            break;
          }
        }
      }
    }

    return tokens;
  }

  private static generateLoliCode(criticalPath: HarEntry[], tokens: Array<{
    name: string;
    value: string;
    sourceResponse: string;
    regex: string;
  }>): string {
    const blocks: string[] = [];

    // Add config header
    blocks.push('# Generated HAR2LoliCode Configuration');
    blocks.push('# Security Notice: Review and test thoroughly before use');
    blocks.push('');

    criticalPath.forEach((entry, index) => {
      // Generate Request block
      blocks.push(`BLOCK:Request`);
      blocks.push(`  method = ${entry.request.method}`);
      blocks.push(`  url = "${entry.request.url}"`);
      
      // Add important headers
      const importantHeaders = entry.request.headers.filter(h => 
        ['user-agent', 'referer', 'origin', 'content-type'].includes(h.name.toLowerCase()) ||
        h.name.toLowerCase().startsWith('x-')
      );

      if (importantHeaders.length > 0) {
        blocks.push(`  customHeaders = {`);
        importantHeaders.forEach(header => {
          blocks.push(`    ("${header.name}", "${header.value}")`);
        });
        blocks.push(`  }`);
      }

      // Add POST data
      if (entry.request.postData) {
        blocks.push(`  contentType = "${entry.request.postData.mimeType}"`);
        
        let content = entry.request.postData.text || '';
        
        // Replace credentials with variables
        content = content.replace(/([&?](?:username|user|email)=)[^&]+/gi, '$1<USER>');
        content = content.replace(/([&?](?:password|pass|pwd)=)[^&]+/gi, '$1<PASS>');
        
        // Replace dynamic tokens with variables
        tokens.forEach(token => {
          content = content.replace(token.value, `@${token.name}`);
        });
        
        blocks.push(`  content = "${content}"`);
      }

      blocks.push(`ENDBLOCK`);
      blocks.push('');

      // Generate Parse blocks for tokens (after first request)
      if (index === 0 && tokens.length > 0) {
        tokens.forEach(token => {
          blocks.push(`BLOCK:Parse`);
          blocks.push(`  inputString = data.SOURCE`);
          blocks.push(`  parseType = RegEx`);
          blocks.push(`  regexMatch = "${token.regex}"`);
          blocks.push(`  outputVariable = "@${token.name}"`);
          blocks.push(`ENDBLOCK`);
          blocks.push('');
        });
      }
    });

    // Add KeyCheck block for the final request
    if (criticalPath.length > 0) {
      const finalEntry = criticalPath[criticalPath.length - 1];
      const responseText = finalEntry.response.content.text.toLowerCase();

      blocks.push(`BLOCK:KeyCheck`);
      
      // Check for success indicators
      const successKeywords = ['welcome', 'dashboard', 'logout', 'profile', 'account'];
      const foundSuccessKeyword = successKeywords.find(keyword => 
        responseText.includes(keyword)
      );
      
      if (foundSuccessKeyword) {
        blocks.push(`  keyChains = {`);
        blocks.push(`    SUCCESS = (STRINGKEY, "${foundSuccessKeyword}")`);
      }

      // Check for failure indicators
      const failureKeywords = ['invalid', 'incorrect', 'error', 'failed', 'denied'];
      const foundFailureKeyword = failureKeywords.find(keyword => 
        responseText.includes(keyword)
      );

      if (foundFailureKeyword) {
        if (!foundSuccessKeyword) blocks.push(`  keyChains = {`);
        blocks.push(`    FAILURE = (STRINGKEY, "${foundFailureKeyword}")`);
      }

      // Check for ban indicators
      if (finalEntry.response.status === 429) {
        if (!foundSuccessKeyword && !foundFailureKeyword) blocks.push(`  keyChains = {`);
        blocks.push(`    BAN = (INTKEY, "429")`);
      }

      if (foundSuccessKeyword || foundFailureKeyword || finalEntry.response.status === 429) {
        blocks.push(`  }`);
      }

      blocks.push(`ENDBLOCK`);
    }

    return blocks.join('\n');
  }
}