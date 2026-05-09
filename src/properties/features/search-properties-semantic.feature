# language: pt

Funcionalidade: Busca semântica de imóveis (RAG) (GET /api/properties/search)
  Como um usuário do sistema
  Eu quero buscar imóveis por similaridade semântica usando linguagem natural
  Para encontrar imóveis que combinam com minha descrição livre

  Contexto:
    Dado que a API de propriedades esta disponivel

  @smoke @properties @search-semantic
  Cenário: Busca semântica retorna resultados ordenados por score
    Quando faço busca semântica com query "casa de praia com piscina e área gourmet"
    Então o status da resposta deve ser 200
    E devo receber uma lista de resultados de busca semântica
    E os resultados devem estar ordenados por score decrescente

  @properties @search-semantic
  Cenário: Busca semântica com pré-filtro de cidade
    Quando faço busca semântica com query "imóvel mobiliado de luxo" e cidade "Sao Sebastiao"
    Então o status da resposta deve ser 200
    E devo receber uma lista de resultados de busca semântica
    E todos os resultados devem estar na cidade "Sao Sebastiao"

  @properties @search-semantic
  Cenário: Busca semântica com pré-filtro de finalidade e preço
    Quando faço busca semântica com query "apartamento próximo ao centro" finalidade "SALE" e preço máximo 1000000
    Então o status da resposta deve ser 200
    E devo receber uma lista de resultados de busca semântica
    E todos os resultados devem ter finalidade "SALE"

  @properties @search-semantic @validation
  Cenário: Busca semântica sem query retorna 400
    Quando faço busca semântica sem parâmetro q
    Então o status da resposta deve ser 400

  @properties @search-semantic @limit
  Cenário: Busca semântica respeita limite de resultados
    Quando faço busca semântica com query "casa" e limite 5
    Então o status da resposta deve ser 200
    E devo receber no máximo 5 resultados de busca semântica
