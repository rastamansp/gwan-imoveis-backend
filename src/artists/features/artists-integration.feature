@chat @artists @integration
Feature: Chatbot - Fluxos de Integração de Artistas

  O chatbot deve ser capaz de combinar múltiplas ferramentas em uma conversa
  para fornecer informações completas sobre artistas.

  @integration
  Scenario: Fluxo - Buscar artista e ver eventos vinculados
    Given que o chatbot está disponível
    When envio a mensagem "Busque o artista João Silva"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_artists_by_query"
    
    When envio a mensagem "Quais eventos esse artista está vinculado?"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve mencionar eventos vinculados ao artista

  @integration
  Scenario: Múltiplas ferramentas em uma única conversa
    Given que o chatbot está disponível
    When envio a mensagem "Liste os eventos e também os artistas disponíveis"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar pelo menos uma ferramenta
    And a resposta deve usar exatamente 2 ferramentas

