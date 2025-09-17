export class DebugLogger {
  private static isDevelopment = import.meta.env.DEV;
  
  static log(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.log(`[Forg3t] ${message}`, ...args);
    }
  }
  
  static error(message: string, error?: any) {
    if (this.isDevelopment) {
      console.error(`[Forg3t ERROR] ${message}`, error);
    } else {
      console.error(`[Forg3t] ${message}`);
    }
  }
  
  static warn(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.warn(`[Forg3t WARN] ${message}`, ...args);
    }
  }
  
  static maskSensitive(value: string): string {
    if (!value) return 'empty';
    
    if (value.startsWith('sk-')) {
      return `sk-***${value.slice(-4)}`;
    }
    
    if (value.startsWith('asst_')) {
      return `asst_***${value.slice(-4)}`;
    }
    
    if (value.startsWith('0x')) {
      return `0x***${value.slice(-6)}`;
    }
    
    if (value.length > 10) {
      return `***${value.slice(-4)}`;
    }
    
    return '***';
  }
  
  static logApiKeyValidation(isValid: boolean, keyLength: number) {
    if (this.isDevelopment) {
      this.log(`API key validation: ${isValid ? 'valid' : 'invalid'}, length: ${keyLength}`);
    }
  }
  
  static logProgress(step: string, progress: number) {
    if (this.isDevelopment) {
      this.log(`${step}: ${progress}%`);
    }
  }
}