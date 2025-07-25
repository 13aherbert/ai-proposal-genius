/**
 * Authentication security utilities
 */

import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'lovable-app-security-key-2024';

/**
 * Secure token storage with encryption
 */
export class SecureTokenStorage {
  private static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  }
  
  private static decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  
  static setToken(key: string, token: string): void {
    try {
      const encrypted = this.encrypt(token);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store secure token:', error);
    }
  }
  
  static getToken(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;
      
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve secure token:', error);
      return null;
    }
  }
  
  static removeToken(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }
  
  static clearAllTokens(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * CSRF protection utilities
 */
export class CSRFProtection {
  private static tokenKey = 'csrf_token';
  
  static generateToken(): string {
    const token = CryptoJS.lib.WordArray.random(32).toString();
    SecureTokenStorage.setToken(this.tokenKey, token);
    return token;
  }
  
  static getToken(): string | null {
    return SecureTokenStorage.getToken(this.tokenKey);
  }
  
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token && token.length > 0;
  }
  
  static getHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'X-CSRF-Token': token } : {};
  }
}

/**
 * Session security utilities
 */
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
  private static readonly ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  static updateLastActivity(): void {
    localStorage.setItem('last_activity', Date.now().toString());
  }
  
  static isSessionExpired(): boolean {
    const lastActivity = localStorage.getItem('last_activity');
    if (!lastActivity) return true;
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    return timeSinceLastActivity > this.SESSION_TIMEOUT;
  }
  
  static startActivityMonitoring(onExpired: () => void): () => void {
    const interval = setInterval(() => {
      if (this.isSessionExpired()) {
        onExpired();
      }
    }, this.ACTIVITY_CHECK_INTERVAL);
    
    // Update activity on user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateActivity = () => this.updateLastActivity();
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
    
    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }
}

/**
 * Password security utilities
 */
export class PasswordSecurity {
  static validateStrength(password: string): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');
    
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');
    
    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    else feedback.push('Include special characters');
    
    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i
    ];
    
    const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
    if (hasCommonPattern) {
      score -= 2;
      feedback.push('Avoid common patterns');
    }
    
    return {
      isStrong: score >= 4,
      score: Math.max(0, Math.min(6, score)),
      feedback
    };
  }
  
  static generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
}