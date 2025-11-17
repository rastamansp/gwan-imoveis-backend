# language: pt

Funcionalidade: Criar Propriedade (POST /api/properties)
  Como um corretor ou administrador
  Eu quero criar novas propriedades
  Para que eu possa cadastrar imoveis no sistema

  Contexto:
    Dado que a API de propriedades esta disponivel

  @properties @auth @create
  Cenário: Criar nova propriedade (requer autenticacao)
    Dado que estou autenticado como "joao.santos@email.com" com senha "senha123"
    Quando crio uma propriedade com os seguintes dados:
      | Titulo                    | Descricao                                    | Tipo        | Finalidade | Preco    | Bairro   | Cidade         | Quartos | Banheiros | Area  | Tem Piscina | Frente Mar |
      | Casa de Praia Luxuosa     | Casa espacosa com 3 quartos e vista para o mar | CASA        | SALE       | 850000.00| Maresias | Sao Sebastiao  | 3       | 2         | 150.5 | true        | true       |
    Então o status da resposta deve ser 201
    E a propriedade deve ter sido criada com sucesso
    E a propriedade deve ter o titulo "Casa de Praia Luxuosa"
    E a propriedade deve ter o campo "city" com valor "Sao Sebastiao"
    E a propriedade deve ter "hasPool" como "true"
    E a propriedade deve ter "oceanFront" como "true"

  @properties @auth @create @amenities
  Cenário: Criar propriedade com todas as comodidades
    Dado que estou autenticado como "joao.santos@email.com" com senha "senha123"
    Quando crio uma propriedade com os seguintes dados:
      | Titulo                    | Descricao                                    | Tipo        | Finalidade | Preco    | Bairro   | Cidade         | Quartos | Banheiros | Area  | Tem Piscina | Tem Hidromassagem | Frente Mar | Tem Jardim | Area Gourmet | Mobiliado |
      | Casa Completa com Tudo     | Casa com todas as comodidades                | CASA        | RENT       | 1200000.00| Maresias | Sao Sebastiao  | 4       | 3         | 200.0 | true        | true              | true       | true       | true         | true      |
    Então o status da resposta deve ser 201
    E a propriedade deve ter sido criada com sucesso
    E a propriedade deve ter "hasPool" como "true"
    E a propriedade deve ter "hasJacuzzi" como "true"
    E a propriedade deve ter "oceanFront" como "true"
    E a propriedade deve ter "hasGarden" como "true"
    E a propriedade deve ter "hasGourmetArea" como "true"
    E a propriedade deve ter "furnished" como "true"

  @properties @auth @create @purpose
  Cenário: Criar propriedade para aluguel (default)
    Dado que estou autenticado como "joao.santos@email.com" com senha "senha123"
    Quando crio uma propriedade com os seguintes dados:
      | Titulo                    | Descricao                                    | Tipo        | Preco    | Bairro   | Cidade         | Quartos | Banheiros | Area  |
      | Apartamento para Alugar    | Apartamento bem localizado                  | APARTAMENTO | 350000.00| Centro   | Sao Sebastiao  | 2       | 1         | 65.0  |
    Então o status da resposta deve ser 201
    E a propriedade deve ter sido criada com sucesso
    E a propriedade deve ter finalidade "RENT"

  @properties @negative @auth
  Cenário: Tentar criar propriedade sem autenticacao
    Quando crio uma propriedade com os seguintes dados:
      | Titulo | Descricao | Tipo | Preco | Bairro | Cidade |
      | Teste  | Teste     | CASA | 100000| Centro | Teste  |
    Então devo receber um erro de autenticacao

  @properties @negative @validation
  Cenário: Tentar criar propriedade com dados invalidos
    Dado que estou autenticado como "joao.santos@email.com" com senha "senha123"
    Quando crio uma propriedade com os seguintes dados invalidos:
      | Titulo | Descricao | Tipo | Preco | Bairro | Cidade |
      |        |           |      | -100  |        |        |
    Então devo receber um erro de validacao

