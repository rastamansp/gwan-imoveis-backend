@chat @events @integration
Feature: Chatbot - Fluxos de Integração de Eventos

  O chatbot deve ser capaz de combinar múltiplas ferramentas em uma conversa
  para fornecer informações completas sobre eventos.

  @smoke @integration
  Scenario: Fluxo completo - Listar eventos, buscar detalhes e preços
    Given que o chatbot está disponível
    When envio a mensagem "Liste os eventos disponíveis"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "list_events"
    
    When envio a mensagem "Mostre os detalhes do primeiro evento da lista"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar pelo menos uma ferramenta
    
    When envio a mensagem "Quais os preços dos ingressos desse evento?"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve mencionar preços de ingressos

  @integration
  Scenario: Buscar eventos e artistas relacionados
    Given que o chatbot está disponível
    When envio a mensagem "Mostre eventos de música e seus artistas"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar pelo menos uma ferramenta
    And devo receber uma resposta contendo "evento"

  @integration
  Scenario: Busca semântica combinada com busca por query
    Given que o chatbot está disponível
    When envio a mensagem "Quero encontrar shows de música gospel"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_events_rag"
    
    When envio a mensagem "Agora busque o artista com nome João Silva"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_artists_by_query"
    And deve conter o artista "João Silva"

