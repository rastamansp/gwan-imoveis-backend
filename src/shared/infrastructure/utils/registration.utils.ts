/**
 * Utilitários para processamento de dados de cadastro via WhatsApp
 */

/**
 * Extrai nome completo de uma mensagem
 * Suporta múltiplos formatos:
 * - "Nome: João Silva"
 * - "Meu nome é João Silva"
 * - "João Silva"
 */
export function extractNameFromMessage(message: string): string | null {
  if (!message) return null;

  const normalized = message.trim();

  // Padrão: "Nome: João Silva" ou "nome: João Silva"
  const namePattern1 = /(?:nome|name)[:\s]+([^,\n]+)/i;
  const match1 = normalized.match(namePattern1);
  if (match1) {
    return match1[1].trim();
  }

  // Padrão: "Meu nome é João Silva" ou "me chamo João Silva"
  const namePattern2 = /(?:meu nome é|me chamo|sou|chamo-me)[:\s]+([^,\n]+)/i;
  const match2 = normalized.match(namePattern2);
  if (match2) {
    return match2[1].trim();
  }

  // Se não tem email na mensagem, pode ser só o nome
  if (!extractEmailFromMessage(message)) {
    // Se tem apenas uma palavra ou duas palavras (nome completo), assumir que é nome
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 1 && words.length <= 3) {
      // Verificar se não começa com padrões de email
      if (!normalized.includes('@') && !normalized.match(/^\d+$/)) {
        return normalized;
      }
    }
  }

  return null;
}

/**
 * Extrai email de uma mensagem
 * Suporta múltiplos formatos:
 * - "Email: joao@email.com"
 * - "joao@email.com"
 * - "Meu email é joao@email.com"
 */
export function extractEmailFromMessage(message: string): string | null {
  if (!message) return null;

  const normalized = message.trim();

  // Regex para validar email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = normalized.match(emailRegex);

  if (emails && emails.length > 0) {
    // Retornar o primeiro email encontrado
    return emails[0].trim();
  }

  return null;
}

/**
 * Extrai nome e email de uma mensagem simultaneamente
 * Retorna objeto com name e email (podem ser null)
 */
export function extractRegistrationData(message: string): { name: string | null; email: string | null } {
  return {
    name: extractNameFromMessage(message),
    email: extractEmailFromMessage(message),
  };
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Gera senha aleatória segura
 * @param length Tamanho da senha (padrão: 12)
 */
export function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Garantir que tenha pelo menos um caractere de cada tipo
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

  // Preencher o resto
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Embaralhar caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Verifica se mensagem é um comando de cancelamento
 */
export function isCancelCommand(message: string): boolean {
  if (!message) return false;
  const normalized = message.trim().toLowerCase();
  return normalized === '/cancelar' || normalized === '/cancel' || normalized === 'cancelar' || normalized === 'cancel';
}

/**
 * Verifica se mensagem é um comando de reiniciar
 */
export function isRestartCommand(message: string): boolean {
  if (!message) return false;
  const normalized = message.trim().toLowerCase();
  return normalized === '/reiniciar' || normalized === '/restart' || normalized === 'reiniciar' || normalized === 'restart';
}

