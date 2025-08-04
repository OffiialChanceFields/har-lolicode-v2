// src/syntax-compliance/OB2SyntaxComplianceEngine.ts
import { HarEntry } from '../services/types';
import { OB2BlockDefinition, OB2ConfigurationResult } from './types';
import { OB2SyntaxValidator, OB2SyntaxValidationError } from './OB2SyntaxValidator';
import { BlockOptimizer } from './BlockOptimizer';
import { VariableLifecycleManager } from './VariableLifecycleManager';
import { ErrorHandlingFramework } from '../error-handling/ErrorHandlingFramework';
import { FlowContextResult } from '../flow-analysis/types';

export class OB2SyntaxComplianceEngine {
  private readonly syntaxValidator: OB2SyntaxValidator;
  private readonly blockOptimizer: BlockOptimizer;
  private readonly variableManager: VariableLifecycleManager;
  private readonly errorHandlingFramework: ErrorHandlingFramework;

  constructor() {
    this.syntaxValidator = new OB2SyntaxValidator();
    this.blockOptimizer = new BlockOptimizer();
    this.variableManager = new VariableLifecycleManager();
    this.errorHandlingFramework = new ErrorHandlingFramework();
  }

  generateCompliantLoliCode(
    analysisResult: FlowContextResult,
    templateType: string = 'MULTI_STEP_FLOW_TEMPLATE'
  ): OB2ConfigurationResult {
    // Validate all syntax elements
    const syntaxValidation = this.syntaxValidator.validateAnalysisResult(analysisResult);
    if (!syntaxValidation.isValid) {
      throw new OB2SyntaxValidationError(syntaxValidation.violations);
    }

    // Generate optimized block structure
    const optimizedBlocks = this.blockOptimizer.optimizeBlockSequence(
      analysisResult.criticalPath,
      analysisResult.matchedPatterns as any, // Cast for now
      templateType
    );

    // Manage variable lifecycle
    const variableMapping =
      this.variableManager.createVariableLifecycleMap(optimizedBlocks);

    // Add error handling
    const enhancedBlocks = this.errorHandlingFramework.enhanceWithErrorHandling(
      optimizedBlocks,
      analysisResult.matchedPatterns as any // Cast for now
    );

    return this.synthesizeOB2Configuration(enhancedBlocks, variableMapping);
  }

  private synthesizeOB2Configuration(
    blocks: OB2BlockDefinition[],
    variableMapping: Map<string, string>
  ): OB2ConfigurationResult {
    const loliCode: string[] = [];

    // Add header comments
    loliCode.push('// Auto-generated LoliCode configuration');
    loliCode.push(`// Generated on: ${new Date().toISOString()}`);
    loliCode.push(
      '// This configuration was automatically generated from HAR file analysis'
    );
    loliCode.push(
      '// Do not modify manually unless you know what you are doing'
    );
    loliCode.push('');

    // Add variable declarations
    loliCode.push('// Variable declarations');
    variableMapping.forEach((variableType, variableName) => {
      loliCode.push(`VAR ${variableName} = ""  // ${variableType}`);
    });
    loliCode.push('');

    // Add main flow
    loliCode.push('// Main authentication flow');
    blocks.forEach((block) => {
      switch (block.blockType) {
        case 'HttpRequest':
          loliCode.push(this.renderHttpRequestBlock(block));
          break;
        case 'Parse':
          loliCode.push(this.renderParseBlock(block));
          break;
        case 'SetVariable':
          loliCode.push(this.renderSetVariableBlock(block));
          break;
        case 'If':
          loliCode.push(this.renderIfBlock(block));
          break;
        case 'While':
          loliCode.push(this.renderWhileBlock(block));
          break;
        case 'Try':
          loliCode.push(this.renderTryBlock(block));
          break;
        case 'Delay':
          loliCode.push(this.renderDelayBlock(block));
          break;
        case 'Log':
          loliCode.push(this.renderLogBlock(block));
          break;
        case 'Mark':
          loliCode.push(this.renderMarkBlock(block));
          break;
      }

      loliCode.push('');
    });

    return {
      loliCode: loliCode.join('\n'),
      blocks,
      variables: variableMapping
    };
  }

  private renderHttpRequestBlock(block: OB2BlockDefinition): string {
    const lines: string[] = [];

    if (block.parameters.get('comment')) {
      lines.push(`// ${block.parameters.get('comment')}`);
    }

    const method = block.parameters.get('method') || 'GET';
    const url = block.parameters.get('url') || '';

    if (method === 'GET') {
      lines.push(`REQUEST GET "${this.escapeValue(url)}"`);
    } else {
      lines.push(`REQUEST ${method} "${this.escapeValue(url)}"`);
    }

    if (block.parameters.has('headers')) {
        try {
            const headers = JSON.parse(block.parameters.get('headers')!);
            if(Array.isArray(headers)) {
                headers.forEach((header: { name: string; value: string }) => {
                    lines.push(`HEADER "${this.escapeValue(header.name)}" "${this.escapeValue(header.value)}"`);
                });
            }
        } catch(e) { console.error("Failed to parse headers", e); }
    }

    if (block.parameters.has('cookies')) {
        try {
            const cookies = JSON.parse(block.parameters.get('cookies')!);
            if(Array.isArray(cookies)) {
                cookies.forEach((cookie: { name: string; value: string; domain: string; path: string }) => {
                    const domainPart = cookie.domain ? `DOMAIN="${this.escapeValue(cookie.domain)}"` : '';
                    const pathPart = cookie.path ? `PATH="${this.escapeValue(cookie.path)}"` : '';
                    lines.push(`COOKIE "${this.escapeValue(cookie.name)}" "${this.escapeValue(cookie.value)}" ${domainPart} ${pathPart}`);
                });
            }
        } catch(e) { console.error("Failed to parse cookies", e); }
    }

    if (block.parameters.has('postData')) {
        try {
            const postData = JSON.parse(block.parameters.get('postData')!);
            lines.push(`CONTENT "${postData.mimeType}"`);
            if (postData.text) {
                lines.push(`DATA "${this.escapeValue(postData.text)}"`);
            } else if (postData.params) {
                const formData = postData.params.map((p: any) => `${p.name}=${encodeURIComponent(p.value || '')}`).join('&');
                lines.push(`DATA "${formData}"`);
            }
        } catch(e) { console.error("Failed to parse postData", e); }
    }

    return lines.join('\n');
  }

  private renderParseBlock(block: OB2BlockDefinition): string {
    const variable = block.parameters.get('variable') || 'token';
    const selector = block.parameters.get('selector') || '';
    const attribute = block.parameters.get('attribute') || '';
    
    if (attribute) {
      return `PARSE "${this.escapeValue(variable)}" CSS "${this.escapeValue(selector)}" ATTRIBUTE "${this.escapeValue(attribute)}"`;
    }
    return `PARSE "${this.escapeValue(variable)}" CSS "${this.escapeValue(selector)}"`;
  }

  private renderSetVariableBlock(block: OB2BlockDefinition): string {
    const variable = block.parameters.get('variable') || 'var';
    const value = block.parameters.get('value') || '';
    return `SET ${this.escapeValue(variable)} = "${this.escapeValue(value)}"`;
  }

  private renderIfBlock(block: OB2BlockDefinition): string {
    const condition = block.parameters.get('condition') || 'true';
    const thenBlocks = JSON.parse(block.parameters.get('thenBlocks') || '[]');
    const elseBlocks = JSON.parse(block.parameters.get('elseBlocks') || '[]');
    
    let template = `IF ${condition}\n`;
    template += thenBlocks.map((b: OB2BlockDefinition) => `  ${this.renderBlockContent(b)}`).join('\n');
    if (elseBlocks.length > 0) {
      template += '\nELSE\n';
      template += elseBlocks.map((b: OB2BlockDefinition) => `  ${this.renderBlockContent(b)}`).join('\n');
    }
    template += '\nEND IF';
    return template;
  }

  private renderWhileBlock(block: OB2BlockDefinition): string {
     const condition = block.parameters.get('condition') || 'true';
     const bodyBlocks = JSON.parse(block.parameters.get('bodyBlocks') || '[]');
     let template = `WHILE ${condition}\n`;
     template += bodyBlocks.map((b: OB2BlockDefinition) => `  ${this.renderBlockContent(b)}`).join('\n');
     template += '\nEND WHILE';
     return template;
  }

  private renderTryBlock(block: OB2BlockDefinition): string {
    const tryBlocks = JSON.parse(block.parameters.get('tryBlocks') || '[]');
    const catchBlocks = JSON.parse(block.parameters.get('catchBlocks') || '[]');
    const finallyBlocks = JSON.parse(block.parameters.get('finallyBlocks') || '[]');

    let template = 'TRY\n';
    template += tryBlocks.map((b: OB2BlockDefinition) => `  ${this.renderBlockContent(b)}`).join('\n');
    catchBlocks.forEach((cb: any) => {
        template += `\nCATCH IF ${cb.condition}\n`;
        template += cb.blocks.map((b: OB2BlockDefinition) => `  ${this.renderBlockContent(b)}`).join('\n');
    });
    if(finallyBlocks.length > 0) {
        template += '\nFINALLY\n';
        template += finallyBlocks.map((b: OB2BlockDefinition) => `  ${this.renderBlockContent(b)}`).join('\n');
    }
    template += '\nEND TRY';
    return template;
  }
  
  private renderDelayBlock(block: OB2BlockDefinition): string {
    return `WAIT ${block.parameters.get('milliseconds') || '1000'}`;
  }

  private renderLogBlock(block: OB2BlockDefinition): string {
    return `LOG "${this.escapeValue(block.parameters.get('message') || '')}"`;
  }

  private renderMarkBlock(block: OB2BlockDefinition): string {
    const status = block.parameters.get('status') || 'SUCCESS';
    const message = block.parameters.get('message') || '';
    return message ? `MARK ${status} "${this.escapeValue(message)}"` : `MARK ${status}`;
  }
  
  private renderBlockContent(block: OB2BlockDefinition): string {
      // Simplified render for nested blocks
      return `// ${block.blockType} Block`;
  }

  private escapeValue(value: string): string {
    if (typeof value !== 'string') return '';
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
}
