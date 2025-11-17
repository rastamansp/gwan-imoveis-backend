# language: pt

Funcionalidade: Listar Propriedades (GET /api/properties)
  Como um usuario do sistema
  Eu quero listar propriedades imobiliarias
  Para que eu possa visualizar os imoveis disponiveis

  Contexto:
    Dado que a API de propriedades esta disponivel

  @smoke @properties @list
  Cenário: Listar todas as propriedades (publico)
    Quando listo todas as propriedades
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades

  @properties @filters @city
  Cenário: Filtrar propriedades por cidade
    Quando listo propriedades na cidade "Sao Sebastiao"
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades
    E todas as propriedades devem estar na cidade "Sao Sebastiao"

  @properties @filters @type
  Cenário: Filtrar propriedades por tipo
    Quando listo propriedades do tipo "CASA"
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades
    E todas as propriedades devem ser do tipo "CASA"

  @properties @filters @price
  Cenário: Filtrar propriedades por faixa de preco
    Quando listo propriedades com preco entre 300000 e 1000000
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades
    E a lista deve conter pelo menos 1 propriedades

  @properties @filters @purpose
  Cenário: Filtrar propriedades por finalidade (aluguel)
    Quando listo propriedades com finalidade "RENT"
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades
    E todas as propriedades devem ter finalidade "RENT"

  @properties @filters @purpose
  Cenário: Filtrar propriedades por finalidade (venda)
    Quando listo propriedades com finalidade "SALE"
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades
    E todas as propriedades devem ter finalidade "SALE"

  @properties @filters @purpose
  Cenário: Filtrar propriedades por finalidade (investimento)
    Quando listo propriedades com finalidade "INVESTMENT"
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades
    E todas as propriedades devem ter finalidade "INVESTMENT"

  @properties @filters @realtor
  Cenário: Filtrar propriedades por realtor
    Dado que existe uma propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    Quando obtenho a propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    E listo propriedades do realtor com ID da propriedade obtida
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades
    E todas as propriedades devem pertencer ao mesmo realtor

  @properties @filters @combined
  Cenário: Filtrar propriedades com multiplos filtros
    Quando listo propriedades na cidade "Sao Sebastiao" do tipo "CASA" com finalidade "SALE" e preco entre 500000 e 2000000
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades
    E todas as propriedades devem estar na cidade "Sao Sebastiao"
    E todas as propriedades devem ser do tipo "CASA"
    E todas as propriedades devem ter finalidade "SALE"

