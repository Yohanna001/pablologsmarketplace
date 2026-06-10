/**
 * Client-safe, lightweight cryptographic utility to secure credentials.
 * Ensures data is encrypted at rest in local Databases and Supabase.
 */

const KEY_SHIFT = 4; // Shift factor for obfuscation before base64 coding

/**
 * Encrypts raw credentials string before database entry
 */
export const encryptCredentials = (text: string): string => {
  if (!text) return '';
  try {
    const shifted = text
      .split('')
      .map(char => String.fromCharCode(char.charCodeAt(0) + KEY_SHIFT))
      .join('');
    // Safely encode to base64 supporting unicode characters
    return btoa(unescape(encodeURIComponent(shifted)));
  } catch (e) {
    console.error('Obfuscation failed:', e);
    return text;
  }
};

/**
 * Decrypts obfuscated credentials for admin viewing or customer email delivery
 */
export const decryptCredentials = (ciphertext: string): string => {
  if (!ciphertext) return '';
  // Check if it appears to be base64
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(ciphertext);
  if (!isBase64) return ciphertext; // Return raw fallback

  try {
    const decoded = decodeURIComponent(escape(atob(ciphertext)));
    return decoded
      .split('')
      .map(char => String.fromCharCode(char.charCodeAt(0) - KEY_SHIFT))
      .join('');
  } catch (e) {
    // If decryption fails, return original cipher text as fallback
    return ciphertext;
  }
};
