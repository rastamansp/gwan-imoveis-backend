# language: pt

Funcionalidade: Obter Propriedade por ID (GET /api/properties/:id)
  Como um usuario do sistema
  Eu quero obter detalhes de uma propriedade especifica
  Para que eu possa visualizar informacoes completas do imovel

  Contexto:
    Dado que a API de propriedades esta disponivel

  @smoke @properties @get
  Cenário: Obter propriedade por ID (publico)
    Dado que existe uma propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    Quando obtenho a propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    Então o status da resposta deve ser 200
    E devo receber os detalhes da propriedade

  @properties @validation @realtor
  Cenário: Verificar que propriedade retorna informacoes do realtor
    Dado que existe uma propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    Quando obtenho a propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    Então o status da resposta deve ser 200
    E a propriedade deve ter o campo "realtorId" em ingles
    E a propriedade deve conter informacoes do realtor se disponivel

  @properties @negative @notfound
  Cenário: Obter propriedade inexistente
    Quando obtenho a propriedade com ID "00000000-0000-0000-0000-000000000000"
    Então o status da resposta deve ser 404

