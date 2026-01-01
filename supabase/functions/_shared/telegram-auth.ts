// Telegram initData validation utilities

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface ParsedInitData {
  user: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
}

/**
 * Validate Telegram WebApp initData using Web Crypto API
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export async function validateInitData(initData: string, botToken: string): Promise<ParsedInitData | null> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      console.error('No hash in initData');
      return null;
    }

    // Remove hash from params for validation
    params.delete('hash');
    
    // Sort params alphabetically and join
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const encoder = new TextEncoder();
    
    // Create secret key from bot token using WebAppData
    const webAppDataKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const secretKeyBuffer = await crypto.subtle.sign(
      'HMAC',
      webAppDataKey,
      encoder.encode(botToken)
    );

    // Calculate HMAC-SHA256
    const secretKey = await crypto.subtle.importKey(
      'raw',
      secretKeyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(sortedParams)
    );
    
    const calculatedHash = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (calculatedHash !== hash) {
      console.error('Hash mismatch - invalid initData');
      return null;
    }

    // Check auth_date is not too old (max 1 hour)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (now - authDate > 3600) {
      console.error('initData expired (older than 1 hour)');
      return null;
    }

    // Parse user data
    const userStr = params.get('user');
    if (!userStr) {
      console.error('No user in initData');
      return null;
    }

    const user = JSON.parse(userStr) as TelegramUser;

    return {
      user,
      auth_date: authDate,
      hash,
      query_id: params.get('query_id') || undefined,
    };
  } catch (error) {
    console.error('Error validating initData:', error);
    return null;
  }
}

/**
 * Extract user from request with optional validation
 * Falls back to trusting the body if no bot token is configured (dev mode)
 */
export async function extractTelegramUser(
  req: Request, 
  requireValidation = false
): Promise<{ user: TelegramUser | null; validated: boolean; error?: string }> {
  try {
    const body = await req.clone().json();
    const initData = req.headers.get('x-telegram-init-data');
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    // If we have initData and bot token, validate
    if (initData && botToken) {
      const parsed = await validateInitData(initData, botToken);
      if (parsed) {
        return { user: parsed.user, validated: true };
      }
      if (requireValidation) {
        return { user: null, validated: false, error: 'Invalid initData' };
      }
    }

    // Fall back to body data (for development/backwards compatibility)
    if (body.telegramUser) {
      console.warn('Using unvalidated telegram user data - set TELEGRAM_BOT_TOKEN for production');
      return { user: body.telegramUser, validated: false };
    }

    return { user: null, validated: false, error: 'No user data provided' };
  } catch (error) {
    console.error('Error extracting telegram user:', error);
    return { user: null, validated: false, error: 'Failed to parse request' };
  }
}

/**
 * Rate limiting helper using in-memory store
 * For production, use Redis or database-backed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 60, 
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowSeconds };
  }

  if (entry.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: Math.ceil((entry.resetTime - now) / 1000) 
    };
  }

  entry.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - entry.count, 
    resetIn: Math.ceil((entry.resetTime - now) / 1000) 
  };
}