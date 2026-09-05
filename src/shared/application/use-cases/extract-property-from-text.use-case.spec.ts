import { ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { ExtractPropertyFromTextUseCase } from './extract-property-from-text.use-case';
import { PropertyType } from '../../domain/value-objects/property-type.enum';
import { PropertyPurpose } from '../../domain/value-objects/property-purpose.enum';

/**
 * Testes do sanitizador da F17.
 *
 * O prompt PEDE o comportamento correto; quem GARANTE é a sanitização no
 * servidor. Estes testes alimentam o use case com saídas de modelo adversariais
 * — que é o que um LLM pode devolver de verdade — e verificam que nada indevido
 * chega ao formulário do corretor.
 *
 * O roteador de modelo é um fake: nenhum teste aqui faz chamada paga.
 */

const REQUESTER_ID = 'corretor-1';
const TEXTO = 'Vendo casa em Maresias, São Sebastião, com 3 quartos e piscina.';

class FakeChatModelRouter {
  /** Argumentos que o "modelo" devolverá na tool call. */
  args: unknown = {};
  /** Quando definido, a chamada rejeita com este erro. */
  failWith?: Error;
  /** Quando true, o modelo responde em texto em vez de chamar a função. */
  respondWithText = false;
  /** Quando definido, sobrescreve o JSON cru dos arguments. */
  rawArguments?: string;

  calls = 0;

  async complete(): Promise<any> {
    this.calls++;
    if (this.failWith) throw this.failWith;

    if (this.respondWithText) {
      return { choices: [{ message: { content: 'Não identifiquei um imóvel neste texto.' } }] };
    }

    return {
      choices: [
        {
          message: {
            tool_calls: [
              {
                function: {
                  name: 'preencher_cadastro_imovel',
                  arguments: this.rawArguments ?? JSON.stringify(this.args),
                },
              },
            ],
          },
        },
      ],
    };
  }
}

class FakeLogger {
  entries: Array<{ level: string; message: string; context?: any }> = [];
  info(message: string, context?: any) {
    this.entries.push({ level: 'info', message, context });
  }
  warn(message: string, context?: any) {
    this.entries.push({ level: 'warn', message, context });
  }
  error(message: string, context?: any) {
    this.entries.push({ level: 'error', message, context });
  }
  debug(message: string, context?: any) {
    this.entries.push({ level: 'debug', message, context });
  }
}

describe('ExtractPropertyFromTextUseCase', () => {
  let router: FakeChatModelRouter;
  let logger: FakeLogger;
  let useCase: ExtractPropertyFromTextUseCase;

  beforeEach(() => {
    router = new FakeChatModelRouter();
    logger = new FakeLogger();
    useCase = new ExtractPropertyFromTextUseCase(router as any, logger as any);
  });

  /** Roda a extração com a saída de modelo informada. */
  const extract = async (args: unknown, text = TEXTO) => {
    router.args = args;
    return useCase.execute({ text, requesterId: REQUESTER_ID });
  };

  const CAMPOS_OBRIGATORIOS = [
    'title',
    'description',
    'type',
    'price',
    'neighborhood',
    'city',
    'area',
  ];

  const completo = {
    title: 'Casa em Maresias',
    description: 'Casa de 180m² em Maresias',
    type: 'CASA',
    price: 1250000,
    neighborhood: 'Maresias',
    city: 'São Sebastião',
    area: 180,
  };

  // ------------------------------------------------------------- tipos

  describe('sanitização por tipo', () => {
    it('converte número que veio como string', async () => {
      const { fields } = await extract({ price: '1250000' });
      expect(fields.price).toBe(1250000);
    });

    it('descarta string não numérica em campo numérico', async () => {
      const { fields } = await extract({ price: 'abc' });
      expect(fields.price).toBeUndefined();
    });

    it.each([
      ['null', null],
      ['array', [1, 2]],
      ['objeto', { valor: 1 }],
      ['booleano', true],
    ])('descarta %s em campo escalar, sem lançar', async (_label, value) => {
      const { fields } = await extract({ price: value, city: value, type: value });
      expect(fields.price).toBeUndefined();
      expect(fields.city).toBeUndefined();
      expect(fields.type).toBeUndefined();
    });

    it('aceita tipo em minúsculo, normalizando para o enum', async () => {
      const { fields } = await extract({ type: 'casa' });
      expect(fields.type).toBe(PropertyType.CASA);
    });

    it('descarta tipo fora do enum', async () => {
      const { fields } = await extract({ type: 'MANSAO' });
      expect(fields.type).toBeUndefined();
    });

    it.each([
      ['string vazia', ''],
      ['só espaços', '   '],
    ])('trata %s como ausência, não como valor', async (_label, value) => {
      const { fields } = await extract({ city: value, title: value });
      expect(fields.city).toBeUndefined();
      expect(fields.title).toBeUndefined();
    });

    it('remove espaços das bordas dos textos', async () => {
      const { fields } = await extract({ city: '  São Sebastião  ' });
      expect(fields.city).toBe('São Sebastião');
    });
  });

  describe('truncamento de texto', () => {
    it.each([
      ['title', 255],
      ['neighborhood', 255],
      ['city', 255],
      ['description', 5000],
    ])('trunca %s em %i caracteres', async (campo, limite) => {
      const { fields } = await extract({ [campo]: 'x'.repeat(limite + 100) });
      expect((fields as any)[campo]).toHaveLength(limite);
    });
  });

  // ---------------------------------------------------------- finalidade

  describe('finalidade (purpose)', () => {
    it.each([
      ['SALE', PropertyPurpose.SALE],
      ['RENT', PropertyPurpose.RENT],
      ['INVESTMENT', PropertyPurpose.INVESTMENT],
    ])('aceita %s do enum', async (valor, esperado) => {
      const { fields } = await extract({ purpose: valor });
      expect(fields.purpose).toBe(esperado);
    });

    it('normaliza a caixa', async () => {
      const { fields } = await extract({ purpose: 'sale' });
      expect(fields.purpose).toBe(PropertyPurpose.SALE);
    });

    it.each([
      ['valor fora do enum', 'LEILAO'],
      ['string vazia', ''],
      ['número', 123],
      ['null', null],
    ])('descarta %s', async (_label, valor) => {
      const { fields } = await extract({ purpose: valor });
      expect(fields.purpose).toBeUndefined();
    });

    /**
     * A regra que dá razão de ser a este campo: um imóvel de R$ 1.250.000
     * cadastrado como aluguel entra no catálogo público com preço absurdo para a
     * finalidade — pior que campo vazio. O prompt proíbe a inferência; este teste
     * garante que o sanitizador não a reintroduz por conta própria.
     */
    it('não inventa finalidade a partir do preço', async () => {
      const { fields } = await extract({ price: 1250000, city: 'São Sebastião' });
      expect(fields.purpose).toBeUndefined();
    });

    it('preço baixo também não vira aluguel', async () => {
      const { fields } = await extract({ price: 3500 });
      expect(fields.purpose).toBeUndefined();
    });

    /**
     * Alterar a lista de campos obrigatórios do cadastro é decisão de produto,
     * não efeito colateral de uma extração.
     */
    it('não entra em missingRequired quando ausente', async () => {
      const { missingRequired } = await extract({});
      expect(missingRequired).not.toContain('purpose');
    });

    it('texto ambíguo mantém o campo vazio e o aviso', async () => {
      const { fields, warnings } = await extract({
        warnings: ['Anúncio aceita venda ou locação; finalidade não definida.'],
      });
      expect(fields.purpose).toBeUndefined();
      expect(warnings).toHaveLength(1);
    });

    it('o schema da tool declara o enum fechado', async () => {
      await extract({});
      // A prova de que a IA não pode devolver finalidade inventada sem ser barrada
      // já está nos testes de descarte acima; aqui garantimos que o enum do
      // domínio é a fonte, e não uma lista repetida à mão.
      expect(Object.values(PropertyPurpose)).toEqual(['RENT', 'SALE', 'INVESTMENT']);
    });
  });

  // ------------------------------------------------------------- faixas

  describe('tetos de sanidade', () => {
    it('aceita preço no teto', async () => {
      const { fields } = await extract({ price: 1_000_000_000 });
      expect(fields.price).toBe(1_000_000_000);
    });

    // Um CEP lido como preço vira um valor de nove ou onze dígitos; descartar é
    // mais seguro que publicar o anúncio com ele.
    it('descarta preço acima do teto', async () => {
      const { fields } = await extract({ price: 1_000_000_001 });
      expect(fields.price).toBeUndefined();
    });

    it('aceita área no teto e descarta acima', async () => {
      expect((await extract({ area: 1_000_000 })).fields.area).toBe(1_000_000);
      expect((await extract({ area: 1_000_001 })).fields.area).toBeUndefined();
    });

    it.each(['bedrooms', 'bathrooms', 'garageSpaces'])(
      'aceita %s igual a 100 e descarta 101',
      async (campo) => {
        expect((await extract({ [campo]: 100 })).fields[campo]).toBe(100);
        expect((await extract({ [campo]: 101 })).fields[campo]).toBeUndefined();
      },
    );

    it.each([
      ['price', -1],
      ['area', -50],
      ['bedrooms', -2],
    ])('descarta %s negativo', async (campo, valor) => {
      const { fields } = await extract({ [campo]: valor });
      expect((fields as any)[campo]).toBeUndefined();
    });

    it.each(['price', 'area', 'bedrooms'])('descarta %s igual a zero', async (campo) => {
      const { fields } = await extract({ [campo]: 0 });
      expect((fields as any)[campo]).toBeUndefined();
    });

    it('arredonda preço e área para duas casas decimais', async () => {
      const { fields } = await extract({ price: 1250000.555, area: 180.239 });
      expect(fields.price).toBe(1250000.56);
      expect(fields.area).toBe(180.24);
    });

    // Comportamento atual: contagem fracionária é arredondada, não descartada.
    // "2,5 quartos" vira 3 — aceitável porque o corretor revisa antes de salvar.
    it('arredonda contagem fracionária de cômodos', async () => {
      const { fields } = await extract({ bedrooms: 2.5 });
      expect(fields.bedrooms).toBe(3);
    });
  });

  // --------------------------------------------------------- amenidades

  describe('amenidades', () => {
    const AMENIDADES = [
      'hasPool',
      'hasJacuzzi',
      'oceanFront',
      'hasGarden',
      'hasGourmetArea',
      'furnished',
    ];

    it.each(AMENIDADES)('propaga %s quando o modelo afirma true', async (campo) => {
      const { fields } = await extract({ [campo]: true });
      expect((fields as any)[campo]).toBe(true);
    });

    /**
     * RN-17.6: `false` do modelo significa "não mencionado", e o formulário já
     * nasce desmarcado. Propagar `false` faria a IA desmarcar o que o corretor
     * marcou — bug que só apareceria com o cadastro pronto.
     */
    it.each(AMENIDADES)('descarta %s quando o modelo devolve false', async (campo) => {
      const { fields } = await extract({ [campo]: false });
      expect((fields as any)[campo]).toBeUndefined();
    });

    it('descarta amenidade que veio como string "true"', async () => {
      const { fields } = await extract({ hasPool: 'true' });
      expect(fields.hasPool).toBeUndefined();
    });
  });

  // -------------------------------------------------------------- avisos

  describe('avisos', () => {
    it('propaga os avisos do modelo', async () => {
      const { warnings } = await extract({
        warnings: ['Preço interpretado como valor de venda, não de aluguel.'],
      });
      expect(warnings).toEqual(['Preço interpretado como valor de venda, não de aluguel.']);
    });

    it('limita a cinco avisos', async () => {
      const { warnings } = await extract({
        warnings: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      });
      expect(warnings).toHaveLength(5);
    });

    it('ignora item não textual na lista de avisos', async () => {
      const { warnings } = await extract({ warnings: ['válido', 42, null, { a: 1 }] });
      expect(warnings).toEqual(['válido']);
    });

    it('trunca cada aviso em 300 caracteres', async () => {
      const { warnings } = await extract({ warnings: ['x'.repeat(400)] });
      expect(warnings[0]).toHaveLength(300);
    });

    it('devolve lista vazia quando warnings não é array', async () => {
      const { warnings } = await extract({ warnings: 'texto solto' });
      expect(warnings).toEqual([]);
    });
  });

  // ----------------------------------------------------- missingRequired

  describe('missingRequired', () => {
    it('lista os sete obrigatórios quando nada é extraído', async () => {
      const { missingRequired } = await extract({});
      expect(missingRequired.sort()).toEqual([...CAMPOS_OBRIGATORIOS].sort());
    });

    it('fica vazio quando todos os obrigatórios vêm preenchidos', async () => {
      const { missingRequired } = await extract(completo);
      expect(missingRequired).toEqual([]);
    });

    /**
     * O caso que mais importa e o menos óbvio: o campo veio do modelo, foi
     * descartado por inválido, e precisa aparecer como faltante — senão o
     * corretor não sabe que tem de preenchê-lo.
     */
    it('reporta como faltante o campo descartado na sanitização', async () => {
      const { fields, missingRequired } = await extract({
        ...completo,
        city: '   ',
        price: 999_999_999_999,
      });
      expect(fields.city).toBeUndefined();
      expect(fields.price).toBeUndefined();
      expect(missingRequired).toContain('city');
      expect(missingRequired).toContain('price');
    });

    it('não considera amenidade como campo obrigatório', async () => {
      const { missingRequired } = await extract(completo);
      expect(missingRequired).not.toContain('hasPool');
    });
  });

  // --------------------------------------------------------------- erros

  describe('degradação', () => {
    it('devolve 503 quando o provedor de IA falha', async () => {
      router.failWith = new Error('rate limit');
      await expect(useCase.execute({ text: TEXTO, requesterId: REQUESTER_ID })).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('orienta o preenchimento manual na mensagem do 503', async () => {
      router.failWith = new Error('timeout');
      await expect(useCase.execute({ text: TEXTO, requesterId: REQUESTER_ID })).rejects.toThrow(
        /manualmente/i,
      );
    });

    it('devolve 422 quando o modelo responde em texto em vez de chamar a função', async () => {
      router.respondWithText = true;
      await expect(useCase.execute({ text: TEXTO, requesterId: REQUESTER_ID })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('devolve 422 quando os argumentos não são JSON válido', async () => {
      router.rawArguments = '{ isto não é json';
      await expect(useCase.execute({ text: TEXTO, requesterId: REQUESTER_ID })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('trata argumentos vazios como extração sem campos, não como erro', async () => {
      router.rawArguments = '{}';
      const result = await useCase.execute({ text: TEXTO, requesterId: REQUESTER_ID });
      expect(result.fields).toEqual({});
      expect(result.missingRequired.sort()).toEqual([...CAMPOS_OBRIGATORIOS].sort());
    });

    it('trata argumentos ausentes como extração sem campos', async () => {
      router.rawArguments = '';
      const result = await useCase.execute({ text: TEXTO, requesterId: REQUESTER_ID });
      expect(result.fields).toEqual({});
    });
  });

  // ---------------------------------------------------------- privacidade

  describe('privacidade', () => {
    const TEXTO_SENSIVEL =
      'Proprietária Maria Silva, telefone 11 99999-0000, vende casa em Maresias por 1.250.000';

    it('não registra o texto do corretor em nenhuma entrada de log', async () => {
      router.args = completo;
      await useCase.execute({ text: TEXTO_SENSIVEL, requesterId: REQUESTER_ID });

      const serializado = JSON.stringify(logger.entries);
      expect(serializado).not.toContain('Maria Silva');
      expect(serializado).not.toContain('99999-0000');
      expect(serializado).not.toContain(TEXTO_SENSIVEL);
    });

    it('registra apenas metadados: tamanho do texto e nomes dos campos', async () => {
      router.args = completo;
      await useCase.execute({ text: TEXTO_SENSIVEL, requesterId: REQUESTER_ID });

      const contextos = logger.entries.map((e) => e.context ?? {});
      expect(contextos.some((c) => c.textLength === TEXTO_SENSIVEL.length)).toBe(true);
      expect(contextos.some((c) => Array.isArray(c.extractedFields))).toBe(true);
    });
  });

  // ------------------------------------------------------------- contrato

  describe('contrato da resposta', () => {
    it('devolve sempre fields, missingRequired e warnings', async () => {
      const result = await extract({});
      expect(result).toEqual({
        fields: {},
        missingRequired: expect.any(Array),
        warnings: [],
      });
    });

    it('chama o provedor uma única vez por extração', async () => {
      await extract(completo);
      expect(router.calls).toBe(1);
    });
  });
});
