@chat-health @health @integration
Feature: Chatbot de Saúde - Fluxos de Integração

  O chatbot de saúde deve ser capaz de manter contexto entre múltiplas consultas
  e fornecer informações completas sobre doenças em uma conversa.

  @integration
  Scenario: Fluxo completo - Consultar doença, causas, tratamento e plantas
    Given que o chatbot de saúde está disponível
    When envio a consulta "FEBRE"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter informações sobre "FEBRE"
    
    When envio a consulta "quais são as causas?" com a mesma sessão
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter "Causas:"
    
    When envio a consulta "e o tratamento?" com a mesma sessão
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter "Tratamento:"

  @integration
  Scenario: Múltiplas consultas sobre doenças diferentes
    Given que o chatbot de saúde está disponível
    When envio a consulta "dor de cabeça"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter informações sobre doença
    
    When envio a consulta "gripe"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter informações sobre "gripe"
    
    When envio a consulta "dor de estômago"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve conter informações sobre doença
    And a resposta deve conter "estômago" ou "estomago"

  @integration
  Scenario: Busca semântica combinada com busca exata
    Given que o chatbot de saúde está disponível
    When envio a consulta "sintomas de gripe"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And o método de busca deve ser "semantic"
    
    When envio a consulta "GRIPE"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And o método de busca deve ser "exact" ou "partial"

