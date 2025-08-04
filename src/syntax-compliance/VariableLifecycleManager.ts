// src/syntax-compliance/VariableLifecycleManager.ts
import { OB2BlockDefinition } from '../types';

export class VariableLifecycleManager {
  createVariableLifecycleMap(blocks: OB2BlockDefinition[]): Map<string, string> {
    const variableMap = new Map<string, string>();
    const usageCount = new Map<string, number>();
    
    // First pass: identify all variables
    blocks.forEach(block => {
      if (block.blockType === 'Parse') {
        const variable = block.parameters.get('variable') || '';
        if (variable) {
          usageCount.set(variable, (usageCount.get(variable) || 0) + 1);
        }
      }
    });
    
    // Second pass: determine variable types
    blocks.forEach(block => {
      if (block.blockType === 'Parse') {
        const variable = block.parameters.get('variable') || '';
        if (variable && !variableMap.has(variable)) {
          // Determine variable type based on context
          const variableType = this.determineVariableType(block);
          variableMap.set(variable, variableType);
        }
      }
    });
    
    return variableMap;
  }
  
  private determineVariableType(block: OB2BlockDefinition): string {
    const selector = block.parameters.get('selector') || '';
    const attribute = block.parameters.get('attribute') || '';
    
    // Check for common token types
    if (/name=['"]?_token['"]?/.test(selector)) {
      return 'CSRF_TOKEN';
    }
    
    if (/name=['"]?sessionid['"]?/i.test(selector)) {
      return 'SESSION_ID';
    }
    
    if (/name=['"]?access_token['"]?/i.test(selector)) {
      return 'ACCESS_TOKEN';
    }
    
    if (/name=['"]?refresh_token['"]?/i.test(selector)) {
      return 'REFRESH_TOKEN';
    }
    
    if (/name=['"]?state['"]?/i.test(selector)) {
      return 'OAUTH_STATE';
    }
    
    if (/name=['"]?code['"]?/i.test(selector)) {
      return 'AUTHORIZATION_CODE';
    }
    
    // Check attribute
    if (attribute === 'value') {
      return 'FORM_FIELD';
    }
    
    if (attribute === 'src' || attribute === 'href') {
      return 'URL';
    }
    
    return 'STRING';
  }
}