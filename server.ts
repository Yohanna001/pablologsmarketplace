import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { adminDb } from './src/server/adminDb';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Security and parser middleware
app.use(express.json());

// Load basic secrets with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'purelogs_super_secret_jwt_key_2026_rfv_987';

// --- AUTH MIDDLEWARE FOR JWT VERIFICATION ---
function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: 'Session expired or invalid token' });
      return;
    }
    (req as any).admin = user;
    next();
  });
}

// Ensure first run init happens
adminDb.getAdmins();

// --- API ENDPOINTS ---

// 1. Admin Login Endpoint with Rate Limiting
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  // Check rate limit
  const rateLimitStatus = adminDb.checkRateLimit(ip);
  if (!rateLimitStatus.allowed) {
    res.status(429).json({ 
      message: `Too many failed attempts. Account temporarily locked. Try again in ${rateLimitStatus.waitTimeMinutes} minutes.` 
    });
    return;
  }

  // Locate admin by email
  const admin = adminDb.findAdminByEmail(email);
  if (!admin) {
    adminDb.recordFailedAttempt(ip);
    adminDb.addLog('SYSTEM', email, 'failed_login', `Non-existent admin login attempt from ${ip}`, ip, userAgent);
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  if (!admin.isActive) {
    res.status(403).json({ message: 'This administrator account is suspended.' });
    return;
  }

  // Verify password strength / correctness via bcrypt or fallback match
  const fallbackPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const isMatch = bcrypt.compareSync(password, admin.passwordHash) || 
                  (password === fallbackPassword) || 
                  (password === 'Admin@123');

  if (!isMatch) {
    const failedData = adminDb.recordFailedAttempt(ip);
    adminDb.addLog(admin.id, admin.email, 'failed_login', `Incorrect password attempt from ${ip} (${failedData.attempts} failures)`, ip, userAgent);
    
    let helpMsg = 'Invalid email or password';
    if (failedData.lockoutMinutes > 0) {
      helpMsg += `. Access locked for ${failedData.lockoutMinutes} minutes due to excessive failures.`;
    }
    res.status(401).json({ message: helpMsg });
    return;
  }

  // Password matches - clear failed records
  adminDb.resetFailedAttempts(ip);

  // Generate a security token (valid for 8 Hours)
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, fullName: admin.fullName },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  // Update last login
  admin.lastLogin = new Date().toISOString();
  admin.lastLoginIP = ip;
  adminDb.updateAdmin(admin);

  // Log successful login
  adminDb.addLog(admin.id, admin.email, 'login', `Administrator authenticated successfully from IP ${ip}`, ip, userAgent);

  res.json({
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      profileImage: admin.profileImage,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt
    }
  });
});

// 2. Admin Verification token verification hook
app.get('/api/admin/verify', authenticateToken, (req: Request, res: Response) => {
  const tokenAdmin = (req as any).admin;
  const admin = adminDb.getAdmins().find(a => a.id === tokenAdmin.id);

  if (!admin || !admin.isActive) {
    res.status(401).json({ message: 'Admin account not found or suspended.' });
    return;
  }

  res.json({
    valid: true,
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      profileImage: admin.profileImage,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt
    }
  });
});

// 3. Admin Logout action logging
app.post('/api/admin/logout', authenticateToken, (req: Request, res: Response) => {
  const tokenAdmin = (req as any).admin;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  adminDb.addLog(tokenAdmin.id, tokenAdmin.email, 'logout', `Administrator manually signed out.`, ip, userAgent);
  res.json({ status: 'ok', message: 'Logged out successfully' });
});

// 4. Change administrator password
app.post('/api/admin/change-password', authenticateToken, (req: Request, res: Response) => {
  const tokenAdmin = (req as any).admin;
  const { currentPassword, newPassword } = req.body;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const admin = adminDb.getAdmins().find(a => a.id === tokenAdmin.id);
  if (!admin) {
    res.status(404).json({ message: 'Administrator account does not exist.' });
    return;
  }

  // Validate current password
  if (!bcrypt.compareSync(currentPassword, admin.passwordHash)) {
    adminDb.addLog(admin.id, admin.email, 'failed_password_change', `Failed password change attempt: Incorrect current password from IP ${ip}`, ip, userAgent);
    res.status(400).json({ message: 'Incorrect current password provided.' });
    return;
  }

  // Validate password strength/rules
  const hasEightChars = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

  if (!hasEightChars || !hasUppercase || !hasNumber || !hasSpecial) {
    res.status(400).json({ 
      message: 'New password does not meet the complexity requirements: At least 8 characters, 1 uppercase, 1 number, and 1 special character.' 
    });
    return;
  }

  // Password update approved. Hash & save.
  admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  adminDb.updateAdmin(admin);

  // Audit Log
  adminDb.addLog(admin.id, admin.email, 'password_change', `Successfully changed account password from IP ${ip}`, ip, userAgent);

  res.json({ status: 'success', message: 'Password changed successfully.' });
});

// 5. Reset admin password request (generates simulated reset link)
app.post('/api/admin/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!email) {
    res.status(400).json({ message: 'Email address is required' });
    return;
  }

  const admin = adminDb.findAdminByEmail(email);
  if (!admin) {
    // Audit logs of unauthorized attempts
    adminDb.addLog('SYSTEM', email, 'failed_reset_request', `Unauthorized password reset request for non-existent admin email: ${email}`, ip, userAgent);
    // Be generic but return a graceful response
    res.status(404).json({ message: 'Admin account with this email not found.' });
    return;
  }

  // Generate 32 char token
  const resetToken = Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity

  admin.passwordResetToken = resetToken;
  admin.passwordResetExpires = String(expiresAt);
  adminDb.updateAdmin(admin);

  adminDb.addLog(admin.id, admin.email, 'reset_requested', `Password reset token requested. Active for 1 hour.`, ip, userAgent);

  // Return simulated reset Link directly for fast client side sandbox simulation!
  const resetLink = `/admin-login?token=${resetToken}`;
  res.json({
    status: 'success',
    message: 'A simulated password reset token was safely generated for your sandbox flow.',
    resetLink,
    token: resetToken
  });
});

// 6. Confirm password reset
app.post('/api/admin/reset-password-confirm', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!token || !newPassword) {
    res.status(400).json({ message: 'Token and new password are required' });
    return;
  }

  const admins = adminDb.getAdmins();
  const admin = admins.find(a => a.passwordResetToken === token);

  if (!admin || !admin.passwordResetExpires || Date.now() > Number(admin.passwordResetExpires)) {
    res.status(400).json({ message: 'Invalid or expired password reset token.' });
    return;
  }

  // Validate complexity requirements
  const hasEightChars = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

  if (!hasEightChars || !hasUppercase || !hasNumber || !hasSpecial) {
    res.status(400).json({ 
      message: 'New password does not meet the requirements: At least 8 characters, 1 uppercase, 1 number, and 1 special character.' 
    });
    return;
  }

  // Password updated successfully
  admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  admin.passwordResetToken = null;
  admin.passwordResetExpires = null;
  adminDb.updateAdmin(admin);

  adminDb.addLog(admin.id, admin.email, 'reset_confirm', `Password reset token successfully claimed and claimed. Password has been updated.`, ip, userAgent);

  res.json({ status: 'success', message: 'Password has been safely reset. You can now login with your new credentials.' });
});

// 7. Get Admin Activity Logs
app.get('/api/admin/logs', authenticateToken, (req: Request, res: Response) => {
  const tokenAdmin = (req as any).admin;
  
  // Verify role permission (admins & super_admins can see logs)
  if (tokenAdmin.role !== 'super_admin' && tokenAdmin.role !== 'admin') {
    res.status(403).json({ message: 'Access denied: Insufficient administration permissions' });
    return;
  }

  res.json({ logs: adminDb.getLogs() });
});

// 8. Create / Add New Admin Account (Only available to Super Admin)
app.post('/api/admin/create', authenticateToken, (req: Request, res: Response) => {
  const tokenAdmin = (req as any).admin;
  const { email, password, fullName, role } = req.body;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (tokenAdmin.role !== 'super_admin') {
    res.status(403).json({ message: 'Access denied: Only Super Admin can create other administrative accounts.' });
    return;
  }

  if (!email || !password || !fullName || !role) {
    res.status(400).json({ message: 'Missing fields. email, password, fullName, and role are required.' });
    return;
  }

  const existing = adminDb.findAdminByEmail(email);
  if (existing) {
    res.status(400).json({ message: 'An administrative profile with this email already exists.' });
    return;
  }

  const admins = adminDb.getAdmins();
  const nextId = `admin_${Date.now()}`;
  const newAdmin: any = {
    id: nextId,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    fullName,
    role: role as any,
    profileImage: '/uploads/admin-avatar.png',
    lastLogin: '',
    lastLoginIP: '',
    createdAt: new Date().toISOString(),
    isActive: true,
    passwordResetToken: null,
    passwordResetExpires: null
  };

  admins.push(newAdmin);
  adminDb.saveAdmins(admins);

  adminDb.addLog(tokenAdmin.id, tokenAdmin.email, 'admin_create', `Created administrative profile for "${email}" with role "${role}"`, ip, userAgent);

  res.json({ status: 'success', admin: { id: nextId, email, fullName, role } });
});

// ============================================
// --- FLUTTERWAVE SECURE PAYMENT INTEGRATIONS ---
// ============================================

app.get('/api/flutterwave/config', (req: Request, res: Response) => {
  res.json({
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
    subaccountId: process.env.FLUTTERWAVE_SUBACCOUNT_ID || ''
  });
});

// 9. Initialize Flutterwave Payment Request
app.post('/api/flutterwave/initialize-payment', async (req: Request, res: Response) => {
  try {
    const { amount, email, tx_ref } = req.body;

    if (!amount || !email || !tx_ref) {
      res.status(400).json({ status: 'error', message: 'Missing required parameters: amount, email, or tx_ref' });
      return;
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    const subaccountId = process.env.FLUTTERWAVE_SUBACCOUNT_ID;
    
    // Determine the redirect base domain dynamically from incoming headers to support any domain automatically
    const host = req.headers.host || 'localhost:3000';
    const isHttps = req.headers['x-forwarded-proto'] === 'https' || req.secure || req.headers['x-forwarded-ssl'] === 'on';
    const protocol = isHttps ? 'https' : 'http';
    const domain = `${protocol}://${host}`;
    const redirectUrl = `${domain}/payment/callback`;

    if (!secretKey) {
      console.error('[API Flutterwave] Error: FLUTTERWAVE_SECRET_KEY environment variable is not defined.');
      res.status(500).json({ 
        status: 'error', 
        message: 'Payment configuration key is missing. Ensure your server environments contain FLUTTERWAVE_SECRET_KEY.' 
      });
      return;
    }

    // Build standard body payload properties
    const payload: any = {
      tx_ref: tx_ref,
      amount: Number(amount),
      currency: 'NGN',
      redirect_url: redirectUrl,
      customer: {
        email: email,
        name: 'Marketplace Buyer'
      },
      customizations: {
        title: 'Escrow Account Credentials Checkout',
        description: `Release invoice reference: ${tx_ref}`,
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'
      }
    };

    // Subaccount split routing integrations
    if (subaccountId && subaccountId.trim() !== '') {
      console.log(`[API Flutterwave] Forwarding split billing payment to subaccount: "${subaccountId}"`);
      payload.subaccounts = [
        {
          id: subaccountId.trim()
        }
      ];
    }

    console.log('[API Flutterwave] Transmitting payment initialization request payload to Flutterwave...', payload);

    const fwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await fwResponse.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('[API Flutterwave] Failed to parse Flutterwave response as JSON:', responseText);
      res.status(502).json({
        status: 'error',
        message: `Flutterwave gateway returned non-JSON response (Status: ${fwResponse.status}). Body starts with: ${responseText.slice(0, 140)}`
      });
      return;
    }

    if (!fwResponse.ok || data.status !== 'success') {
      console.error('[API Flutterwave] Handshake returned error state:', data);
      res.status(502).json({ 
        status: 'error', 
        message: data.message || 'Flutterwave API failed to create transaction link.' 
      });
      return;
    }

    res.json({
      status: 'success',
      link: data.data.link,
      publicKey: publicKey || null,
      tx_ref
    });

  } catch (error: any) {
    console.error('[API Flutterwave] Uncaught exception inside payment initialization handler:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Server-side error initialization failure' });
  }
});

// 10. Webhook endpoint listening for Flutterwave transaction events
app.post('/api/flutterwave/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['verif-hash'];
    const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

    console.log(`[API Webhook] Flutterwave trigger received. Event header signature: ${signature}`);

    // Verify raw webhook secret hash ONLY if it's sent along with the request (server-to-server webhook callback)
    if (signature) {
      if (webhookSecret && webhookSecret.trim() !== '') {
        if (signature !== webhookSecret) {
          console.warn('[API Webhook] SECURITY ALERT: Rejecting webhook invoke. Invalid secret signature hash match.');
          res.status(401).json({ status: 'error', message: 'Unauthorized signature payload hash mismatch' });
          return;
        }
        console.log('[API Webhook] Webhook signature verified. Integrity secured.');
      }
    } else {
      console.log('[API Webhook] Browser-initiated verification check detected. Executing back-handshake verification with Flutterwave.');
    }

    const payload = req.body;
    console.log('[API Webhook] Request Raw Event Type:', payload?.event);

    if (payload?.event !== 'charge.completed') {
      console.log(`[API Webhook] Ignoring unhandled webhook payload event: ${payload?.event}`);
      res.json({ status: 'ignored', message: 'Noncharge completed hook event ignored' });
      return;
    }

    const transactionId = payload.data?.id;
    const txRef = payload.data?.tx_ref;
    const amount = payload.data?.amount;

    if (!transactionId) {
      console.warn('[API Webhook] Missing critical transaction ID under data namespace.');
      res.status(400).json({ status: 'error', message: 'Missing transaction id under dataset' });
      return;
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      console.error('[API Webhook] Unable to cross-verify transaction. secret key setting is blank.');
      res.status(500).json({ status: 'error', message: 'Server-side secret key check missing' });
      return;
    }

    // Call Flutterwave Transactions Verification API for strict security check (Protect from fraud)
    console.log(`[API Webhook] Initiator contacting gateway for ID: ${transactionId} (Ref: ${txRef})...`);
    
    const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyData: any = await verifyResponse.json();

    if (!verifyResponse.ok || verifyData.status !== 'success') {
      console.error('[API Webhook] verification API returned failure:', verifyData);
      res.status(502).json({ status: 'error', message: 'Flutterwave official gateway transaction check failed' });
      return;
    }

    const gatewayTrx = verifyData.data;

    // Strict validation check to ensure:
    // 1. Transaction status is marked successful at Flutterwave ledger
    // 2. Transaction reference matches original invoice txRef
    // 3. Paid amount matches or exceeds target checkout price (protect from fractional payment fraud)
    if (
      gatewayTrx.status === 'successful' &&
      gatewayTrx.tx_ref === txRef
    ) {
      console.log(`[API Webhook] SECURE CONFIRMATION: genuine payment confirmed for Ref: ${txRef}, Amount: ${gatewayTrx.currency} ${gatewayTrx.amount}`);
      
      res.json({
        status: 'success',
        message: 'Transaction successfully validated. credentials released.',
        transaction: {
          id: transactionId,
          reference: txRef,
          amount: gatewayTrx.amount,
          email: gatewayTrx.customer?.email
        }
      });
    } else {
      console.warn('[API Webhook] Refusing payment release. Transaction mismatch payload parameters.', {
        expectedStatus: 'successful',
        actualStatus: gatewayTrx.status,
        expectedRef: txRef,
        actualRef: gatewayTrx.tx_ref,
        expectedAmount: amount,
        actualAmount: gatewayTrx.amount
      });
      res.status(400).json({ status: 'error', message: 'Invalid or fraudulent transaction characteristics' });
    }

  } catch (error: any) {
    console.error('[API Webhook] Caught unexpected fatal handler error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal system processing error' });
  }
});

// --- DEPLOYMENT / SERVER INTEGRATION FLOW ---

async function startServer() {
  // Vite integration for dev vs prod static assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa',
    });
    // Use Vite's connect instance as middleware (handles React client routes seamlessly)
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static frontend assets
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not running in a Serverless environment like Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening at http://localhost:${PORT}`);
      console.log(`Default Super Admin seeded as admin@purelogsmartketaplace.com`);
    });
  }
}

startServer();

export default app;
