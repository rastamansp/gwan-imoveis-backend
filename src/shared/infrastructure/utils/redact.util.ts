/**
 * Lista de chaves cujo valor deve ser redatado nos logs.
 * Comparação é case-insensitive e contém-substring (ex: "apikey" pega "apiKey", "x-api-key").
 */
const SENSITIVE_KEY_PATTERNS = [
  'apikey',
  'api_key',
  'authorization',
  'auth-token',
  'authtoken',
  'password',
  'senha',
  'secret',
  'token',
  'x-evolution-token',
];

const REDACTED = '[REDACTED]';

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Replacer para JSON.stringify que redata chaves sensíveis.
 * Use: JSON.stringify(obj, redactReplacer)
 */
export function redactReplacer(this: unknown, key: string, value: unknown): unknown {
  if (key && isSensitiveKey(key) && value !== undefined && value !== null && value !== '') {
    return REDACTED;
  }
  return value;
}
