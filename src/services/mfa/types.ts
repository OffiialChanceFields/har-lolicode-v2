export enum MFAType {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
  PUSH_NOTIFICATION = 'push',
  HARDWARE_TOKEN = 'hardware',
  BIOMETRIC = 'biometric'
}

export interface MFAPattern {
  type: MFAType;
  requestPattern: RegExp;
  verificationPattern: RegExp;
}

export interface MFAAnalysisResult {
  mfaType: MFAType;
  generatedCode: string;
}
