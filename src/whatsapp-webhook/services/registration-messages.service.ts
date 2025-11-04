/**
 * Templates de mensagens para o fluxo de cadastro via WhatsApp
 */
export class RegistrationMessagesService {
  /**
   * Mensagem de boas-vindas e início do cadastro
   */
  static getWelcomeMessage(): string {
    return `👋 Olá! Bem-vindo ao Gwan Events!

Para começar a usar nossos serviços, preciso de algumas informações suas:

📝 Por favor, me envie seu:
• Nome completo
• Email

Você pode enviar tudo de uma vez, por exemplo:
"João Silva, joao@email.com"

Ou pode enviar separadamente.

💡 Dica: Digite /cancelar a qualquer momento para cancelar o cadastro.`;
  }

  /**
   * Solicita nome do usuário
   */
  static getRequestNameMessage(): string {
    return `📝 Por favor, me informe seu nome completo.`;
  }

  /**
   * Solicita email do usuário
   */
  static getRequestEmailMessage(): string {
    return `📧 Agora preciso do seu email.

Por favor, envie um email válido.`;
  }

  /**
   * Confirma dados coletados
   */
  static getConfirmationMessage(name: string, email: string): string {
    return `✅ Confirme seus dados:

👤 Nome: ${name}
📧 Email: ${email}

Estão corretos? Responda "sim" para confirmar ou "não" para corrigir.`;
  }

  /**
   * Mensagem de cadastro completo
   */
  static getRegistrationCompleteMessage(): string {
    return `🎉 Cadastro realizado com sucesso!

Agora você pode usar nossos serviços. Como posso ajudar você hoje?`;
  }

  /**
   * Mensagem com credenciais
   */
  static getCredentialsMessage(email: string, password: string): string {
    return `🔐 Suas credenciais de acesso:

📧 Email: ${email}
🔑 Senha: ${password}

⚠️ Guarde estas informações em local seguro!
Você pode alterar sua senha depois de fazer login.`;
  }

  /**
   * Mensagem de cancelamento
   */
  static getCancellationMessage(): string {
    return `❌ Cadastro cancelado.

Se mudar de ideia, é só começar a conversar novamente! 😊`;
  }

  /**
   * Mensagem de erro de validação de email
   */
  static getInvalidEmailMessage(): string {
    return `❌ O email informado não é válido.

Por favor, envie um email válido no formato: exemplo@dominio.com`;
  }

  /**
   * Mensagem de email já cadastrado
   */
  static getEmailAlreadyExistsMessage(): string {
    return `❌ Este email já está cadastrado em nossa plataforma.

Por favor, use outro email ou entre em contato com o suporte.`;
  }

  /**
   * Mensagem quando dados incompletos
   */
  static getIncompleteDataMessage(missingFields: string[]): string {
    const fields = missingFields.join(' e ');
    return `📝 Ainda preciso de algumas informações:

Faltam: ${fields}

Por favor, envie essas informações para continuar.`;
  }

  /**
   * Mensagem de reinício do cadastro
   */
  static getRestartMessage(): string {
    return `🔄 Reiniciando cadastro...

${this.getWelcomeMessage()}`;
  }

  /**
   * Mensagem quando nome não encontrado
   */
  static getNameNotFoundMessage(): string {
    return `Não consegui identificar seu nome na mensagem.

Por favor, envie seu nome completo de forma clara, por exemplo:
"João Silva"`;
  }

  /**
   * Mensagem quando email não encontrado
   */
  static getEmailNotFoundMessage(): string {
    return `Não consegui identificar seu email na mensagem.

Por favor, envie um email válido, por exemplo:
"joao@email.com"`;
  }
}

