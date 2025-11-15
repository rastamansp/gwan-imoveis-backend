@chat-health @health
Feature: Chatbot de Saúde - Consulta sobre Doenças

  O chatbot de saúde deve ser capaz de consultar a base de conhecimento
  sobre doenças, causas, tratamentos e plantas medicinais indicadas usando
  busca semântica com embeddings.

  @smoke
  Scenario: Consulta simples sobre sintomas
    Given que o chatbot de saúde está disponível
    When envio a consulta "dor de cabeça e febre"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter informações sobre doença
    And a resposta deve conter "Doença:"
    And a resposta deve conter "Descrição:"

  @smoke
  Scenario: Consulta por nome de doença (busca exata)
    Given que o chatbot de saúde está disponível
    When envio a consulta "FEBRE"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And o método de busca deve ser "exact" ou "partial"
    And a resposta deve conter informações sobre "FEBRE"
    And a resposta deve conter "Doença:"

  Scenario: Consulta sobre sintomas (busca semântica)
    Given que o chatbot de saúde está disponível
    When envio a consulta "tenho dor no estômago e náusea"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And o método de busca deve ser "semantic"
    And a resposta deve conter informações sobre doença
    And a similaridade deve ser maior que 0

  Scenario: Consulta sobre plantas medicinais
    Given que o chatbot de saúde está disponível
    When envio a consulta "quais plantas são indicadas para gripe?"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter "Plantas Indicadas:"
    And a resposta deve mencionar plantas medicinais

  Scenario: Consulta sobre tratamento
    Given que o chatbot de saúde está disponível
    When envio a consulta "como tratar dor de cabeça?"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter "Tratamento:"
    And a resposta deve mencionar recomendações de tratamento

  Scenario: Consulta sobre causas de doença
    Given que o chatbot de saúde está disponível
    When envio a consulta "quais são as causas da febre?"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter "Causas:"
    And a resposta deve mencionar causas da doença

  Scenario: Consulta com sessão existente
    Given que o chatbot de saúde está disponível
    When envio a consulta "dor de cabeça" com sessão
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter um sessionId
    When envio a consulta "quais plantas são indicadas?" com a mesma sessão
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a mesma sessão

  Scenario: Consulta genérica (busca semântica)
    Given que o chatbot de saúde está disponível
    When envio a consulta "mal estar e cansaço"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And o método de busca deve ser "semantic"
    And a resposta deve conter informações sobre doença

  @negative
  Scenario: Consulta que não encontra resultado
    Given que o chatbot de saúde está disponível
    When envio a consulta "doença inexistente xyz123"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve indicar que nenhuma doença foi encontrada

  @negative
  Scenario: Consulta vazia
    Given que o chatbot de saúde está disponível
    When envio a consulta ""
    Then devo receber um erro
    And o status da resposta deve ser 400

  Scenario: Consulta com alternativas relacionadas
    Given que o chatbot de saúde está disponível
    When envio a consulta "dor de cabeça"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter informações sobre doença
    And a resposta pode conter doenças alternativas relacionadas

