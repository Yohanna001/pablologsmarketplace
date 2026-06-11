import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface Admin {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'moderator';
  profileImage: string;
  lastLogin: string;
  lastLoginIP: string;
  createdAt: string;
  isActive: boolean;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const LOGS_FILE = path.join(DATA_DIR, 'admin-logs.json');

// In-Memory Rate Limiting & Lockout State
const loginAttempts: Record<string, { count: number; expiresAt: number }> = {};

// In-Memory Fallback Caches for Read-Only Environments (e.g. Vercel)
let adminsCache: Admin[] | null = null;
let logsCache: AdminLog[] | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create data directory (probably read-only filesystem):', err);
  }
}

export const adminDb = {
  getAdmins(): Admin[] {
    if (adminsCache) {
      return adminsCache;
    }

    ensureDataDir();
    let admins: Admin[] = [];
    let isNew = false;

    let fileExists = false;
    try {
      fileExists = fs.existsSync(ADMINS_FILE);
    } catch (_) {
      fileExists = false;
    }

    if (!fileExists) {
      // Seed default admin
      const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@pablologsmarketplace.com';
      const passwordHash = bcrypt.hashSync(defaultPassword, 10);
      
      admins = [
        {
          id: 'admin_1',
          email: defaultEmail,
          passwordHash: passwordHash,
          fullName: 'Super Admin',
          role: 'super_admin',
          profileImage: '/uploads/admin-avatar.png',
          lastLogin: new Date().toISOString(),
          lastLoginIP: '127.0.0.1',
          createdAt: new Date().toISOString(),
          isActive: true,
          passwordResetToken: null,
          passwordResetExpires: null,
        }
      ];
      isNew = true;
    } else {
      try {
        const content = fs.readFileSync(ADMINS_FILE, 'utf-8');
        admins = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse admins.json, returning empty list', e);
        admins = [];
      }
    }

    // Dynamic synchronization of environment variables only on first run or explicit env changes
    const currentEnvEmail = process.env.ADMIN_EMAIL;
    const currentEnvPassword = process.env.ADMIN_PASSWORD;
    let didChange = isNew;

    if (admins.length > 0) {
      const mainAdmin = admins.find(a => a.id === 'admin_1');
      if (mainAdmin) {
        // If they explicitly configured a custom env email different from stored email
        if (currentEnvEmail && currentEnvEmail !== 'admin@purelogsmartketaplace.com' && mainAdmin.email.toLowerCase() !== currentEnvEmail.toLowerCase()) {
          mainAdmin.email = currentEnvEmail;
          didChange = true;
        }
        // Avoid auto-reverting a custom password reset unless specifically instructed by custom env (not matching the default)
        if (currentEnvPassword && currentEnvPassword !== 'Admin@123' && currentEnvPassword !== '') {
          const matches = bcrypt.compareSync(currentEnvPassword, mainAdmin.passwordHash);
          if (!matches) {
            mainAdmin.passwordHash = bcrypt.hashSync(currentEnvPassword, 10);
            didChange = true;
          }
        }
      }
    }

    adminsCache = admins;

    if (didChange && admins.length > 0) {
      this.saveAdmins(admins);
    }

    return admins;
  },

  saveAdmins(admins: Admin[]) {
    adminsCache = admins;
    ensureDataDir();
    try {
      fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write admins file (read-only filesystem):', err);
    }
  },

  getLogs(): AdminLog[] {
    if (logsCache) {
      return logsCache;
    }

    ensureDataDir();
    let fileExists = false;
    try {
      fileExists = fs.existsSync(LOGS_FILE);
    } catch (_) {
      fileExists = false;
    }

    if (!fileExists) {
      this.saveLogs([]);
      logsCache = [];
      return [];
    }
    try {
      const content = fs.readFileSync(LOGS_FILE, 'utf-8');
      const parsedLogs = JSON.parse(content);
      logsCache = parsedLogs;
      return parsedLogs;
    } catch (e) {
      console.error('Failed to parse admin-logs.json, returning empty list', e);
      logsCache = [];
      return [];
    }
  },

  saveLogs(logs: AdminLog[]) {
    logsCache = logs;
    ensureDataDir();
    try {
      fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write logs file (read-only filesystem):', err);
    }
  },

  addLog(adminId: string, email: string, action: string, details: string, ip: string, userAgent: string): AdminLog {
    const logs = this.getLogs();
    const newLog: AdminLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      adminId,
      adminEmail: email,
      action,
      details,
      ipAddress: ip || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog); // Newest first
    // Keep logs size reasonable, e.g., max 1000 items
    if (logs.length > 1000) {
      logs.length = 1000;
    }
    this.saveLogs(logs);
    return newLog;
  },

  findAdminByEmail(email: string): Admin | undefined {
    const list = this.getAdmins();
    const cleanEmail = email.trim().toLowerCase();
    
    // First, find exact match in stored list
    let admin = list.find(a => a.email.toLowerCase() === cleanEmail);
    
    // Fallback: If not found, check if searching for the main admin with other known email forms/typos
    if (!admin) {
      const knownEmails = [
        'admin@pablologsmarketplace.com',
        'admin@purelogsmartketaplace.com',
        'admin@purelogsmarketplace.com'
      ];
      const envEmail = process.env.ADMIN_EMAIL;
      if (envEmail) {
        knownEmails.push(envEmail.toLowerCase());
      }
      
      if (knownEmails.includes(cleanEmail)) {
        admin = list.find(a => a.id === 'admin_1');
      }
    }
    return admin;
  },

  updateAdmin(updated: Admin) {
    const list = this.getAdmins().map(a => a.id === updated.id ? updated : a);
    this.saveAdmins(list);
  },

  // Check rate limits & lockouts on login
  checkRateLimit(ip: string): { allowed: boolean; waitTimeMinutes: number } {
    const record = loginAttempts[ip];
    if (!record) return { allowed: true, waitTimeMinutes: 0 };

    const now = Date.now();
    if (now < record.expiresAt) {
      const remainingTime = Math.ceil((record.expiresAt - now) / 60000);
      return { allowed: false, waitTimeMinutes: remainingTime };
    }

    // Lockout expired, reset attempts
    if (now >= record.expiresAt && record.count >= 5) {
      delete loginAttempts[ip];
    }

    return { allowed: true, waitTimeMinutes: 0 };
  },

  recordFailedAttempt(ip: string): { attempts: number; lockoutMinutes: number } {
    const now = Date.now();
    if (!loginAttempts[ip]) {
      loginAttempts[ip] = { count: 1, expiresAt: 0 };
    } else {
      loginAttempts[ip].count += 1;
    }

    const { count } = loginAttempts[ip];
    let lockoutMinutes = 0;

    if (count >= 10) {
      // Major lockouts: 15 minutes after 10 failures
      lockoutMinutes = 15;
      loginAttempts[ip].expiresAt = now + 15 * 60 * 1000;
    } else if (count >= 5) {
      // Minor lockouts: 5 minutes after 5 failures
      lockoutMinutes = 5;
      loginAttempts[ip].expiresAt = now + 5 * 60 * 1000;
    }

    return { attempts: count, lockoutMinutes };
  },

  resetFailedAttempts(ip: string) {
    delete loginAttempts[ip];
  }
};
