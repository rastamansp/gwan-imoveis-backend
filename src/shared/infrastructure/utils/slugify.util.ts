/**
 * Slugify simples para gerar nomes de instância Evolution a partir de nomes de
 * usuário. Regras:
 *  - minúsculas
 *  - acentos removidos (NFD + filtro de combining marks)
 *  - tudo que não é [a-z0-9] vira `_`
 *  - underscores múltiplos colapsados em um só
 *  - sem underscore inicial/final
 */
export function slugify(input: string): string {
  if (!input) return '';

  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/**
 * Extrai o prefixo do email (parte antes do `@`) já slugificado.
 * Ex.: `joao.santos@gmail.com` → `joao_santos`.
 */
export function emailPrefixSlug(email: string): string {
  if (!email) return '';
  const at = email.indexOf('@');
  const prefix = at > 0 ? email.substring(0, at) : email;
  return slugify(prefix);
}
