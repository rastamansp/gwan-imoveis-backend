@chat @events
Feature: Chatbot - Buscar Eventos

  O chatbot deve ser capaz de buscar e fornecer informações sobre eventos
  usando diferentes métodos de busca (listagem, busca por ID, busca por query, RAG).

  @smoke
  Scenario: Listar todos os eventos
    Given que o chatbot está disponível
    When envio a mensagem "Liste todos os eventos"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve ser uma string não vazia
    And a resposta deve usar a ferramenta "list_events"
    And a resposta deve listar eventos

  @smoke
  Scenario: Buscar evento por ID válido
    Given que o chatbot está disponível
    When envio a mensagem "Mostre os detalhes do evento com ID 123e4567-e89b-12d3-a456-426614174000"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "get_event_by_id"
    And a resposta deve mencionar detalhes do evento

  Scenario: Buscar evento por código
    Given que o chatbot está disponível
    When envio a mensagem "Encontre o evento com código EVT-ABC123"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_events_by_query"
    And deve conter o código "EVT-ABC123"

  Scenario: Buscar eventos por nome ou título
    Given que o chatbot está disponível
    When envio a mensagem "Busque eventos com o nome Festival de Música"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_events_by_query"
    And deve conter o evento "Festival de Música"

  Scenario: Buscar eventos usando busca semântica (RAG)
    Given que o chatbot está disponível
    When envio a mensagem "Quero ver shows de música ao vivo"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_events_rag"
    And a resposta deve listar eventos

  Scenario: Obter preços de ingressos de um evento
    Given que o chatbot está disponível
    When envio a mensagem "Quais os preços dos ingressos do evento 123e4567-e89b-12d3-a456-426614174000?"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "get_ticket_prices_by_event"
    And a resposta deve mencionar preços de ingressos

  Scenario: Buscar eventos por categoria
    Given que o chatbot está disponível
    When envio a mensagem "Liste eventos da categoria Música"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "list_events"
    And a resposta deve mencionar eventos da categoria "Música"

  Scenario: Buscar eventos por cidade
    Given que o chatbot está disponível
    When envio a mensagem "Mostre eventos em São Paulo"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "list_events"
    And devo receber uma resposta contendo "São Paulo"

  @negative
  Scenario: Validar UUID inválido ao buscar evento
    Given que o chatbot está disponível
    When envio a mensagem "Mostre o evento invalido-id"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And devo receber uma mensagem de erro sobre "ID inválido"

  @negative
  Scenario: Buscar evento inexistente
    Given que o chatbot está disponível
    When envio a mensagem "Mostre os detalhes do evento com ID 00000000-0000-0000-0000-000000000000"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And devo receber uma resposta contendo "não encontrado"

