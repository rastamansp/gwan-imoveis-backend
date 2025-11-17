# language: pt

Funcionalidade: Deletar Propriedade (DELETE /api/properties/:id)
  Como um corretor ou administrador
  Eu quero deletar propriedades
  Para que eu possa remover imoveis do sistema quando necessario

  Contexto:
    Dado que a API de propriedades esta disponivel

  @properties @auth @delete
  Cenário: Deletar propriedade (requer autenticacao e ser dono)
    Dado que estou autenticado como "joao.santos@email.com" com senha "senha123"
    E que existe uma propriedade com ID criada anteriormente
    Quando deleto a propriedade com ID criada anteriormente
    Então o status da resposta deve ser 200
    E a propriedade deve ter sido deletada com sucesso

  @properties @negative @auth
  Cenário: Tentar deletar propriedade sem autenticacao
    Dado que existe uma propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    Quando deleto a propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c" sem autenticacao
    Então devo receber um erro de autenticacao

