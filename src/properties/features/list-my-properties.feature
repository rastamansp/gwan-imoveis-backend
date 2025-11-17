# language: pt

Funcionalidade: Listar Minhas Propriedades (GET /api/properties/me)
  Como um corretor ou administrador
  Eu quero listar apenas minhas propriedades
  Para que eu possa gerenciar meus proprios imoveis

  Contexto:
    Dado que a API de propriedades esta disponivel

  @properties @auth @list
  Cenário: Listar minhas propriedades (requer autenticacao)
    Dado que estou autenticado como "joao.santos@email.com" com senha "senha123"
    Quando listo minhas propriedades
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades

