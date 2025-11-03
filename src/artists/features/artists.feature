@chat @artists
Feature: Chatbot - Buscar Artistas

  O chatbot deve ser capaz de buscar e fornecer informações sobre artistas
  usando diferentes métodos de busca (listagem, busca por ID, busca por query, RAG).

  @smoke
  Scenario: Listar todos os artistas
    Given que o chatbot está disponível
    When envio a mensagem "Liste todos os artistas"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve ser uma string não vazia
    And a resposta deve usar a ferramenta "list_artists"
    And a resposta deve listar artistas

  @smoke
  Scenario: Buscar artista por ID válido
    Given que o chatbot está disponível
    When envio a mensagem "Mostre os detalhes do artista com ID 123e4567-e89b-12d3-a456-426614174000"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "get_artist_by_id"
    And a resposta deve mencionar detalhes do artista

  Scenario: Buscar artista por nome artístico
    Given que o chatbot está disponível
    When envio a mensagem "Busque o artista João Silva"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_artists_by_query"
    And deve conter o artista "João Silva"

  Scenario: Buscar artista por nome real
    Given que o chatbot está disponível
    When envio a mensagem "Encontre o artista com o nome Maria Santos"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_artists_by_query"
    And a resposta deve mencionar detalhes do artista

  Scenario: Buscar artistas usando busca semântica (RAG)
    Given que o chatbot está disponível
    When envio a mensagem "Quero encontrar artistas de música gospel"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_artists_rag"
    And a resposta deve listar artistas

  Scenario: Obter eventos vinculados a um artista
    Given que o chatbot está disponível
    When envio a mensagem "Quais eventos estão vinculados ao artista 123e4567-e89b-12d3-a456-426614174000?"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "get_artist_by_id"
    And a resposta deve mencionar eventos vinculados ao artista

  Scenario: Buscar artista por rede social
    Given que o chatbot está disponível
    When envio a mensagem "Busque artistas no Instagram com username @joaosilva"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "search_artists_by_query"
    And deve conter o artista "joaosilva"

  @negative
  Scenario: Validar UUID inválido ao buscar artista
    Given que o chatbot está disponível
    When envio a mensagem "Mostre o artista invalido-id"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And devo receber uma mensagem de erro sobre "ID inválido"

  @negative
  Scenario: Buscar artista inexistente
    Given que o chatbot está disponível
    When envio a mensagem "Mostre os detalhes do artista com ID 00000000-0000-0000-0000-000000000000"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And devo receber uma resposta contendo "não encontrado"

  Scenario: Buscar artista com informações de redes sociais
    Given que o chatbot está disponível
    When envio a mensagem "Mostre os detalhes do artista com ID 123e4567-e89b-12d3-a456-426614174000"
    Then devo receber uma resposta
    And o status da resposta deve ser 200
    And a resposta deve usar a ferramenta "get_artist_by_id"
    And a resposta deve mencionar redes sociais do artista

