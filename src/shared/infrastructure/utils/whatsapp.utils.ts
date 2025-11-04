/**
 * Utilitários para processamento de dados do WhatsApp
 */

/**
 * Extrai o número de telefone do formato remoteJid do WhatsApp
 * Formato: 5511999999999@s.whatsapp.net
 * Retorna: 5511999999999
 */
export function extractPhoneNumberFromRemoteJid(remoteJid: string): string {
  if (!remoteJid) {
    return '';
  }

  // Remover @s.whatsapp.net ou qualquer sufixo após @
  const phoneNumber = remoteJid.split('@')[0];
  return phoneNumber.trim();
}

/**
 * Normaliza número de telefone removendo caracteres especiais
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) {
    return '';
  }

  // Remover todos os caracteres não numéricos
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Normaliza e valida o número/JID para envio via Evolution SDK
 * O SDK aceita: número de telefone válido OU JID completo (@s.whatsapp.net ou @g.us)
 * @param remoteJid O JID ou número recebido
 * @param remoteJidAlt JID alternativo caso o principal seja inválido
 * @returns JID completo (@s.whatsapp.net) ou número limpo para envio ao SDK
 */
export function normalizeNumberForEvolutionSDK(remoteJid: string, remoteJidAlt?: string): string {
  if (!remoteJid) {
    // Tentar usar o alternativo
    if (remoteJidAlt) {
      return normalizeNumberForEvolutionSDK(remoteJidAlt);
    }
    throw new Error('Número de telefone não fornecido');
  }

  // Verificar se já é um JID válido - manter completo
  if (remoteJid.endsWith('@s.whatsapp.net')) {
    // Manter o JID completo para o SDK
    return remoteJid;
  }

  if (remoteJid.endsWith('@g.us')) {
    // Para grupos, retornar o JID completo
    return remoteJid;
  }

  // Se não termina com sufixo válido, tentar usar remoteJidAlt se disponível
  if (remoteJidAlt) {
    if (remoteJidAlt.endsWith('@s.whatsapp.net')) {
      return remoteJidAlt;
    }
    if (remoteJidAlt.endsWith('@g.us')) {
      return remoteJidAlt;
    }
  }

  // Se é apenas números, construir o JID completo
  const normalized = normalizePhoneNumber(remoteJid);
  if (normalized.length >= 10 && normalized.length <= 15) {
    // Construir JID completo com @s.whatsapp.net
    return `${normalized}@s.whatsapp.net`;
  }

  // Se chegou aqui, o formato é inválido
  throw new Error(`Formato de número inválido: ${remoteJid}. Esperado: número (10-15 dígitos) ou JID válido (@s.whatsapp.net ou @g.us)`);
}

