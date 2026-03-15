/**
 * Authentication security utilities
 */

import CryptoJS from 'crypto-js';

// Generate a more secure key from multiple sources
const ENCRYPTION_KEY = CryptoJS.SHA256(
  'lovable-app-security-key-2024' + 
  (typeof window !== 'undefined' ? window.location.origin : 'server') +
  'v2'
).toString();

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
 * Session security utilities with enhanced monitoring
 */
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours (reduced)
  private static readonly ACTIVITY_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes (more frequent)
  private static readonly SESSION_WARNING_TIME = 10 * 60 * 1000; // 10 minutes before expiry
  
  static updateLastActivity(): void {
    const now = Date.now().toString();
    localStorage.setItem('last_activity', now);
    SecureTokenStorage.setToken('last_activity_secure', now);
  }
  
  static isSessionExpired(): boolean {
    const lastActivity = localStorage.getItem('last_activity');
    const secureLastActivity = SecureTokenStorage.getToken('last_activity_secure');
    
    // On fresh page load, last_activity won't exist yet — initialize it instead of treating as expired
    if (!lastActivity || !secureLastActivity) {
      this.updateLastActivity();
      return false;
    }
    
    // If timestamps don't match, session may be compromised
    if (lastActivity !== secureLastActivity) {
      return true;
    }
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    return timeSinceLastActivity > this.SESSION_TIMEOUT;
  }
  
  static getTimeUntilExpiry(): number {
    const lastActivity = localStorage.getItem('last_activity');
    if (!lastActivity) return 0;
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    return Math.max(0, this.SESSION_TIMEOUT - timeSinceLastActivity);
  }
  
  static shouldShowWarning(): boolean {
    const timeLeft = this.getTimeUntilExpiry();
    return timeLeft > 0 && timeLeft <= this.SESSION_WARNING_TIME;
  }
  
  static startActivityMonitoring(
    onExpired: () => void, 
    onWarning?: () => void
  ): () => void {
    const interval = setInterval(() => {
      if (this.isSessionExpired()) {
        onExpired();
      } else if (onWarning && this.shouldShowWarning()) {
        onWarning();
      }
    }, this.ACTIVITY_CHECK_INTERVAL);
    
    // Update activity on user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'focus'];
    const updateActivity = () => this.updateLastActivity();
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
    
    // Track tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        this.updateLastActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }
  
  static invalidateSession(): void {
    localStorage.removeItem('last_activity');
    SecureTokenStorage.removeToken('last_activity_secure');
  }
}

/**
 * Enhanced Password security utilities with comprehensive validation
 */
export class PasswordSecurity {
  private static readonly MIN_LENGTH = 12; // Increased from 8
  private static readonly MAX_LENGTH = 128; // Add maximum length to prevent DoS
  private static readonly COMMON_PATTERNS = [
    /^(.)\1+$/,  // All same character
    /^1234/,     // Sequential numbers
    /^abcd/,     // Sequential letters
    /password/i, // Contains "password"
    /^qwerty/i,  // Common keyboard patterns
    /^admin/i,   // Common admin passwords
    /^welcome/i, // Common welcome passwords
    /^123456/,   // Common numeric sequences
    /^password123/i, // Common password variations
    /^letmein/i, // Common access phrases
    /^monkey/i,  // Common animal passwords
    /^dragon/i,  // Common fantasy passwords
  ];

  /**
   * Validates password strength with comprehensive checks
   */
  static validateStrength(password: string): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length checks
    if (password.length < this.MIN_LENGTH) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else {
      score += 25;
    }

    if (password.length > this.MAX_LENGTH) {
      feedback.push(`Password must be no more than ${this.MAX_LENGTH} characters long`);
      return { isStrong: false, score: 0, feedback };
    }

    // Character variety checks
    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 20;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 20;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 15;
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 20;
    }

    // Enhanced pattern checks
    for (const pattern of this.COMMON_PATTERNS) {
      if (pattern.test(password)) {
        feedback.push('Password contains common patterns and is easily guessable');
        score = Math.max(0, score - 40);
        break;
      }
    }

    // Check for repeated sequences
    if (/(.{2,})\1{2,}/.test(password)) {
      feedback.push('Password contains repeated sequences');
      score = Math.max(0, score - 20);
    }

    // Entropy bonus for longer passwords
    if (password.length >= 16) {
      score += 10;
    }
    if (password.length >= 20) {
      score += 10;
    }

    // Character diversity bonus
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
      score += 10;
    }

    return {
      isStrong: score >= 90 && feedback.length === 0,
      score: Math.min(100, score),
      feedback,
    };
  }

  /**
   * Check password against known breach databases (client-side heuristics)
   */
  static async checkBreachHeuristics(password: string): Promise<boolean> {
    // Simple heuristic checks for commonly breached passwords
    const commonBreachedPatterns = [
      'password123',
      'admin123',
      'welcome123',
      'qwerty123',
      'letmein',
      'monkey123',
      'dragon123',
      'sunshine',
      'princess',
      'football',
      'baseball',
      'superman',
      'michael',
      'jennifer',
      'jordan23',
    ];

    const lowerPassword = password.toLowerCase();
    return !commonBreachedPatterns.some(pattern => 
      lowerPassword.includes(pattern) || pattern.includes(lowerPassword)
    );
  }
  
  /**
   * Generate cryptographically secure password
   */
  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Ensure at least one character from each category
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining length with random characters
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  /**
   * Validate password complexity with specific business rules
   */
  static validateBusinessRules(password: string, userInfo?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
  }): string[] {
    const violations: string[] = [];
    
    if (userInfo) {
      const lowerPassword = password.toLowerCase();
      
      // Check against user information
      if (userInfo.email && lowerPassword.includes(userInfo.email.split('@')[0].toLowerCase())) {
        violations.push('Password cannot contain your email username');
      }
      
      if (userInfo.firstName && userInfo.firstName.length > 2 && 
          lowerPassword.includes(userInfo.firstName.toLowerCase())) {
        violations.push('Password cannot contain your first name');
      }
      
      if (userInfo.lastName && userInfo.lastName.length > 2 && 
          lowerPassword.includes(userInfo.lastName.toLowerCase())) {
        violations.push('Password cannot contain your last name');
      }
      
      if (userInfo.businessName && userInfo.businessName.length > 3 && 
          lowerPassword.includes(userInfo.businessName.toLowerCase())) {
        violations.push('Password cannot contain your business name');
      }
    }
    
    return violations;
  }
}