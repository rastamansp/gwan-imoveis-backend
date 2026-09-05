import * as fs from 'fs';
import * as path from 'path';

/**
 * Cabeçalhos de segurança (change OpenSpec `add-security-headers`).
 *
 * Estes testes são de **configuração**, não de runtime, e é de propósito: o
 * defeito que motivou a change não estava no código — estava numa configuração
 * que parecia certa em revisão e não produzia efeito nenhum.
 *
 * No nginx, `add_header` de um nível só é herdado pelo nível de baixo **se o de
 * baixo não declarar nenhum `add_header`**. Uma linha de `add_header
 * Cache-Control` dentro de um `location` descartava, em silêncio, os cinco
 * cabeçalhos de segurança declarados no bloco `http`. Medido em produção antes
 * da correção — `curl -sI https://imoveis.gwan.cloud/` devolvia só
 * `Cache-Control: max-age=3600`.
 *
 * Um teste de runtime não pegaria isso: o servidor responde 200 e a página
 * funciona. O que falha é invisível.
 */

const FRONTEND_NGINX = path.resolve(
  __dirname,
  '../../../../../gwan-imoveis/nginx',
);

const readIfExists = (file: string): string | null => {
  const full = path.join(FRONTEND_NGINX, file);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf-8') : null;
};

const conf = readIfExists('nginx.production.conf');
const snippet = readIfExists('security-headers.conf');

// O frontend é um repositório clonado e pode não estar presente (CI do backend,
// por exemplo). Pular é honesto; falhar seria ruído.
const describeIfPresent = conf && snippet ? describe : describe.skip;

describeIfPresent('nginx do frontend — entrega dos cabeçalhos de segurança', () => {
  const locations = (): string[] =>
    (conf as string)
      .split('\n')
      .filter((l) => l.trim().startsWith('location ') && l.trim().endsWith('{'));

  /**
   * A invariante que impede o defeito de voltar: todo `location` inclui o
   * snippet. Basta um esquecer para os cabeçalhos sumirem naquela rota.
   */
  it('todo location inclui o snippet de cabeçalhos', () => {
    const blocos = (conf as string).split(/location .*\{/).slice(1);
    const semInclude = blocos.filter((b) => !b.includes('security-headers.conf'));
    expect(semInclude).toHaveLength(0);
  });

  it('há pelo menos um location no arquivo (o teste acima não passa por vazio)', () => {
    expect(locations().length).toBeGreaterThan(0);
  });

  /**
   * Declarar no `http` é o que dá falsa sensação de segurança: parece
   * configurado e não chega a ninguém.
   */
  it('não declara cabeçalho de segurança fora de um location', () => {
    const antesDoServer = (conf as string).split('server {')[0];
    expect(antesDoServer).not.toMatch(/add_header\s+X-Frame-Options/i);
    expect(antesDoServer).not.toMatch(/add_header\s+Content-Security-Policy/i);
    expect(antesDoServer).not.toMatch(/add_header\s+Referrer-Policy/i);
  });

  it('o snippet traz os cabeçalhos esperados', () => {
    expect(snippet).toMatch(/add_header\s+X-Frame-Options/);
    expect(snippet).toMatch(/add_header\s+X-Content-Type-Options\s+"nosniff"/);
    expect(snippet).toMatch(/add_header\s+Referrer-Policy/);
    expect(snippet).toMatch(/add_header\s+Permissions-Policy/);
  });

  it('a CSP entra em modo de relatório antes de bloquear', () => {
    expect(snippet).toMatch(/Content-Security-Policy-Report-Only/);
    // Sem o `-Report-Only`, seria bloqueio direto de uma política que nunca
    // chegou a ser exercitada.
    expect(snippet).not.toMatch(/add_header\s+Content-Security-Policy\s+"/);
  });

  it('a CSP permite as origens que o app realmente usa', () => {
    expect(snippet).toContain('https://imoveis-api.gwan.cloud');
    // Imagens, PDF do anúncio e panorâmicas do tour 360° vêm do MinIO.
    expect(snippet).toContain('https://minio.gwan.cloud');
    // `blob:` é o que o visualizador 360° e o áudio precisam.
    expect(snippet).toMatch(/img-src[^;]*blob:/);
  });

  /**
   * Obsoleto e desaconselhado: navegadores modernos ignoram ou tratam como vetor
   * próprio. Mantê-lo dava impressão de proteção que não existe.
   */
  it('não usa X-XSS-Protection', () => {
    expect(snippet).not.toMatch(/X-XSS-Protection/);
    expect(conf).not.toMatch(/X-XSS-Protection/);
  });

  it('o Dockerfile copia o snippet — sem ele o nginx nem sobe', () => {
    const dockerfile = path.resolve(__dirname, '../../../../../gwan-imoveis/Dockerfile');
    if (!fs.existsSync(dockerfile)) return;
    expect(fs.readFileSync(dockerfile, 'utf-8')).toContain('security-headers.conf');
  });
});

describe('helmet na API', () => {
  const main = fs.readFileSync(
    path.resolve(__dirname, '../../../main.ts'),
    'utf-8',
  );

  it('helmet é aplicado no bootstrap', () => {
    expect(main).toMatch(/app\.use\(\s*helmet\(/);
  });

  /**
   * O Swagger em `/api` carrega assets próprios e quebra com CSP restritiva.
   * Quem precisa de CSP é o frontend, e lá ela existe.
   */
  it('CSP fica desligada na API, de propósito', () => {
    expect(main).toMatch(/contentSecurityPolicy:\s*false/);
  });

  /**
   * Quem termina o TLS é o Traefik. HSTS emitido pela API seria o serviço errado
   * decidindo por todos os domínios atrás do mesmo proxy.
   */
  it('HSTS não é emitido pela API', () => {
    expect(main).toMatch(/strictTransportSecurity:\s*false/);
  });
});
