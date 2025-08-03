interface HarEntry {
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

interface HarPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: {
    onContentLoad: number;
    onLoad: number;
  };
}

interface HarLog {
  log: {
    entries: HarEntry[];
    pages: HarPage[];
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

  static async processHarFile(harContent: string, targetUrl: string): Promise<ProcessingResult> {
    const harData: HarLog = JSON.parse(harContent);
    
    let targetHost: string;
    try {
      targetHost = new URL(targetUrl).hostname;
    } catch (error) {
      throw new Error('Invalid Target URL provided. Please enter a valid URL to proceed.');
    }

    // Pre-filter by targetUrl
    const entries = harData.log.entries.filter(entry => {
      try {
        const entryHost = new URL(entry.request.url).hostname;
        return entryHost.endsWith(targetHost);
      } catch {
        return false;
      }
    });

    if (entries.length === 0) {
      throw new Error(`No requests found for the target "${targetHost}". Check the HAR file or Target URL.`);
    }

    // Stage 1: Filter static resources
    const filteredEntries = this.filterStaticResources(entries);

    // Stage 2: Score and identify critical path
    const scoredEntries = this.scoreEntries(filteredEntries, targetUrl);
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
      try {
        const url = new URL(entry.request.url.toLowerCase());
        const mimeType = entry.response.content.mimeType.toLowerCase();
        
        const hasStaticExtension = this.STATIC_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
        const isStaticMimeType = mimeType.includes('image/') || 
                                mimeType.includes('font/') ||
                                mimeType.includes('text/css') ||
                                mimeType.includes('application/javascript');

        return !hasStaticExtension && !isStaticMimeType;
      } catch {
        return false;
      }
    });
  }

  private static scoreEntries(entries: HarEntry[], targetUrl: string): Array<HarEntry & { score: number }> {
    const targetHost = new URL(targetUrl).hostname;
    
    return entries.map(entry => {
      let score = 0;
      const entryUrl = new URL(entry.request.url);

      if (entry.request.method === 'POST') score += 10;
      else if (entry.request.method === 'GET') score += 3;

      const urlText = entry.request.url.toLowerCase();
      this.LOGIN_KEYWORDS.forEach(keyword => {
        if (urlText.includes(keyword)) score += 8;
      });

      if (entryUrl.hostname.endsWith(targetHost)) {
        score += 5;
      }

      const mimeType = entry.response.content.mimeType;
      if (mimeType.includes('text/html')) score += 3;
      if (mimeType.includes('application/json')) score += 5;

      if (entry.request.postData) {
        const postData = entry.request.postData.text?.toLowerCase() || '';
        this.CREDENTIAL_FIELDS.forEach(field => {
          if (postData.includes(`"${field}"`)) score += 15;
        });
      }

      if (entry._resourceType === 'xhr' || entry._resourceType === 'fetch') {
        score += 5;
      }
      
      if (entry.response.status >= 300 && entry.response.status < 400) {
        score += 4;
      }

      return { ...entry, score };
    });
  }

  private static identifyCriticalPath(scoredEntries: Array<HarEntry & { score: number }>): HarEntry[] {
    if (scoredEntries.length === 0) return [];

    const chronologicalEntries = [...scoredEntries].sort((a, b) => 
      new Date(a.request.headers.find(h => h.name.toLowerCase() === 'date')?.value || 0).getTime() - 
      new Date(b.request.headers.find(h => h.name.toLowerCase() === 'date')?.value || 0).getTime()
    );

    const loginSubmission = [...chronologicalEntries]
      .sort((a, b) => b.score - a.score)
      .find(entry => entry.request.method === 'POST' && entry.score > 10);

    if (!loginSubmission) {
      return [...scoredEntries]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .sort((a, b) => new Date(a.request.headers.find(h => h.name.toLowerCase() === 'date')?.value || 0).getTime() - new Date(b.request.headers.find(h => h.name.toLowerCase() === 'date')?.value || 0).getTime());
    }

    const criticalPath: HarEntry[] = [];
    const loginSubmissionIndex = chronologicalEntries.indexOf(loginSubmission);

    let loginPage: HarEntry | null = null;
    for (let i = loginSubmissionIndex - 1; i >= 0; i--) {
      const entry = chronologicalEntries[i];
      if (entry.request.method === 'GET' && entry.score > 2) {
        loginPage = entry;
        break;
      }
    }
    if (loginPage) criticalPath.push(loginPage);

    criticalPath.push(loginSubmission);

    for (let i = loginSubmissionIndex + 1; i < chronologicalEntries.length; i++) {
      const entry = chronologicalEntries[i];
      if (entry.score > 5) {
        criticalPath.push(entry);
      }
    }

    return criticalPath.length > 0 
      ? criticalPath 
      : scoredEntries.sort((a,b) => b.score - a.score).slice(0, 3);
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

    if (!loginSubmission.request.postData?.text) return tokens;

    const postData = loginSubmission.request.postData.text;
    const responseContent = loginPage.response.content.text;

    const tokenPatterns = [
      { name: 'csrf_token', regex: /name="[_]?csrf_token"[^>]*value="([^"]+)"/ },
      { name: '__RequestVerificationToken', regex: /name="__RequestVerificationToken"[^>]*value="([^"]+)"/ },
      { name: 'authenticity_token', regex: /name="authenticity_token"[^>]*value="([^"]+)"/ },
      { name: 'nonce', regex: /name="nonce"[^>]*value="([^"]+)"/ },
      { name: 'state', regex: /name="state"[^>]*value="([^"]+)"/ },
      { name: '_token', regex: /name="_token"[^>]*value="([^"]+)"/ }
    ];

    let postParams;
    try {
      postParams = JSON.parse(postData);
    } catch {
      postParams = Object.fromEntries(new URLSearchParams(postData));
    }
    
    for (const [paramName, paramValue] of Object.entries(postParams)) {
      if (typeof paramValue !== 'string') continue;
      
      if (this.CREDENTIAL_FIELDS.some(field => 
        paramName.toLowerCase().includes(field.toLowerCase())
      )) {
        continue;
      }

      if (responseContent.includes(paramValue)) {
        for (const pattern of tokenPatterns) {
          const match = responseContent.match(pattern.regex);
          if (match && match[1] === paramValue) {
            tokens.push({
              name: paramName,
              value: paramValue,
              sourceResponse: responseContent,
              regex: pattern.regex.source.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
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
    const sanitizedTokens = new Set<string>();

    blocks.push('// Generated by HAR2LoliCode Automator');
    blocks.push('// Review and adapt the configuration before use.');
    blocks.push('');

    criticalPath.forEach((entry, index) => {
      const isFirstRequest = index === 0;

      blocks.push(`BLOCK:Request "${entry.request.method} ${new URL(entry.request.url).pathname}"`);
      blocks.push(`  method = ${entry.request.method}`);
      blocks.push(`  url = "${entry.request.url}"`);
      
      const importantHeaders = entry.request.headers.filter(h => 
        ['user-agent', 'referer', 'origin', 'content-type', 'accept', 'accept-language'].includes(h.name.toLowerCase()) ||
        h.name.toLowerCase().startsWith('x-')
      );

      if (importantHeaders.length > 0) {
        blocks.push(`  customHeaders = {`);
        importantHeaders.forEach(header => {
          blocks.push(`    ("${header.name}", "${header.value}")`);
        });
        blocks.push(`  }`);
      }

      if (entry.request.postData?.text) {
        blocks.push(`  contentType = "${entry.request.postData.mimeType}"`);
        
        let content = entry.request.postData.text;
        
        try {
            const postParams = JSON.parse(content);
            this.CREDENTIAL_FIELDS.forEach(cred => {
                if (postParams[cred]) postParams[cred] = `<${cred.toUpperCase()}>`;
            });
            tokens.forEach(token => {
                if (postParams[token.name]) postParams[token.name] = `<@${token.name}>`;
            });
            content = JSON.stringify(postParams);
        } catch {
            content = content.replace(/([&?](?:username|user|email)=)[^&]+/gi, '$1<USER>');
            content = content.replace(/([&?](?:password|pass|pwd)=)[^&]+/gi, '$1<PASS>');
            tokens.forEach(token => {
              content = content.replace(token.value, `<@${token.name}>`);
            });
        }
        
        blocks.push(`  content = "${content}"`);
      }

      blocks.push(`ENDBLOCK`);
      blocks.push('');

      if (isFirstRequest && tokens.length > 0) {
        tokens.forEach(token => {
          if (sanitizedTokens.has(token.name)) return;
          
          blocks.push(`BLOCK:Parse "Extract ${token.name}"`);
          blocks.push(`  inputString = data.SOURCE`);
          blocks.push(`  parseType = RegEx`);
          blocks.push(`  regexMatch = "${token.regex}"`);
          blocks.push(`  outputVariable = "@${token.name}"`);
          blocks.push(`ENDBLOCK`);
          blocks.push('');
          sanitizedTokens.add(token.name);
        });
      }
    });

    if (criticalPath.length > 0) {
      const finalEntry = criticalPath[criticalPath.length - 1];
      
      blocks.push(`BLOCK:KeyCheck`);
      
      const successKeywords = ['welcome', 'dashboard', 'logout', 'profile', 'account', 'home'];
      const failureKeywords = ['invalid', 'incorrect', 'error', 'failed', 'denied', 'wrong'];
      
      const successKey = successKeywords.find(k => finalEntry.response.content.text.toLowerCase().includes(k));
      const failureKey = failureKeywords.find(k => finalEntry.response.content.text.toLowerCase().includes(k));

      blocks.push(`  keyChains = {`);
      if (successKey) {
        blocks.push(`    SUCCESS = (STRINGKEY, "${successKey}")`);
      }
      if (failureKey) {
        blocks.push(`    FAILURE = (STRINGKEY, "${failureKey}")`);
      }
      if (finalEntry.response.status === 429) {
        blocks.push(`    BAN = (INTKEY, "429")`);
      }
      blocks.push(`  }`);
      blocks.push(`ENDBLOCK`);
    }

    return blocks.join('\n');
  }
}
