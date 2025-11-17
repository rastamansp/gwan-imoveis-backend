# language: pt

Funcionalidade: Atualizar Propriedade (PUT /api/properties/:id)
  Como um corretor ou administrador
  Eu quero atualizar propriedades existentes
  Para que eu possa manter as informacoes dos imoveis atualizadas

  Contexto:
    Dado que a API de propriedades esta disponivel

  @properties @auth @update
  Cenário: Atualizar propriedade (requer autenticacao e ser dono)
    Dado que estou autenticado como "joao.santos@email.com" com senha "senha123"
    E que existe uma propriedade com ID criada anteriormente
    Quando atualizo a propriedade com ID criada anteriormente com os seguintes dados:
      | Preco     | Quartos | Tem Piscina |
      | 900000.00 | 4       | true        |
    Então o status da resposta deve ser 200
    E a propriedade deve ter sido atualizada com sucesso

  @properties @negative @auth
  Cenário: Tentar atualizar propriedade sem autenticacao
    Dado que existe uma propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    Quando atualizo a propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c" sem autenticacao com os seguintes dados:
      | Preco |
      | 900000.00 |
    Então devo receber um erro de autenticacao

