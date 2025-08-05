// src/syntax-compliance/types.ts
export enum OB2BlockType {
  HTTP_REQUEST = 'HttpRequest',
  PARSE_RESPONSE = 'Parse',
  SET_VARIABLE = 'SetVariable',
  IF_CONDITION = 'If',
  WHILE_LOOP = 'While',
  TRY_CATCH = 'Try',
  DELAY = 'Delay',
  LOG_MESSAGE = 'Log',
  MARK_STATUS = 'Mark'
}

export interface OB2BlockDefinition {
  blockType: OB2BlockType;
  blockId: string;
  parameters: Map<string, unknown>;
  outputCaptures: unknown[];
  errorHandling: unknown;
  conditionalLogic: unknown[];
}

export interface OB2ConfigurationResult {
  loliCode: string;
  blocks: OB2BlockDefinition[];
  variables: Map<string, string>;
}
