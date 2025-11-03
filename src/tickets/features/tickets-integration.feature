@tickets @integration @smoke
Feature: Fluxo Completo de Compra de Ingressos

  Como um usuário
  Eu quero poder criar um evento, adicionar categorias de ingressos, comprar ingressos com dados de identificação
  E validar todo o processo de ponta a ponta

  Background:
    Given que a API está disponível
    And que tenho um token de autenticação válido

  @smoke
  Scenario: Fluxo completo de compra de ingresso - Criar evento, adicionar categorias e comprar ingressos sem dados de identificação
    Given que crio um evento com os seguintes dados:
      | campo           | valor                        |
      | title           | Festival de Música Teste BDD  |
      | description     | Um festival de música incrível |
      | date            | 2025-12-31T20:00:00Z         |
      | location        | Parque da Cidade              |
      | city            | São Paulo                     |
      | state           | SP                            |
      | category        | Música                        |
    Then o evento deve ser criado com sucesso
    And o evento deve ter um ID
    
    When adiciono as seguintes categorias de ingressos ao evento:
      | name        | price    | quantity |
      | VIP         | 150.00   | 100      |
      | Pista       | 80.00    | 500      |
      | Camarote    | 200.00   | 50       |
    Then as categorias devem ser criadas com sucesso
    
    When compro "2" ingressos da categoria "Pista" para o evento criado
    Then a compra deve ser realizada com sucesso
    And deve retornar "2" tickets
    And os tickets devem ter status "ACTIVE"
    And os tickets devem ter QR code
    
    When consulto o evento criado
    Then o evento deve mostrar que foram vendidos "2" ingressos
    And a categoria "Pista" deve ter "2" ingressos vendidos

  @integration
  Scenario: Fluxo completo de compra de ingresso - Com dados de identificação do titular
    Given que crio um evento com os seguintes dados:
      | campo           | valor                              |
      | title           | Show de Rock - Teste Identificação |
      | description     | Um show de rock inesquecível       |
      | date            | 2025-12-25T22:00:00Z               |
      | location        | Estádio Morumbi                      |
      | city            | São Paulo                          |
      | state           | SP                                 |
      | category        | Música                             |
    Then o evento deve ser criado com sucesso
    
    When adiciono as seguintes categorias de ingressos ao evento:
      | name        | price    | quantity |
      | Premium     | 250.00   | 200      |
      | Pista       | 120.00   | 1000     |
    Then as categorias devem ser criadas com sucesso
    
    When compro "3" ingressos da categoria "Premium" para o evento criado com os seguintes dados do titular:
      | campo          | valor           |
      | firstName      | João            |
      | lastName       | Silva Santos    |
      | documentType   | CPF             |
      | documentNumber | 12345678900     |
    Then a compra deve ser realizada com sucesso
    And deve retornar "3" tickets
    And os tickets devem ter status "ACTIVE"
    And os tickets devem ter QR code
    And os tickets devem ter os dados de identificação:
      | campo          | valor           |
      | holderFirstName | João           |
      | holderLastName  | Silva Santos   |
      | documentType    | CPF            |
      | documentNumber  | 12345678900    |
    
    When consulto os tickets do usuário
    Then deve retornar pelo menos "3" tickets
    And os tickets retornados devem ter os dados de identificação corretos

  @integration
  Scenario: Validar ticket comprado
    Given que crio um evento com os seguintes dados:
      | campo           | valor                      |
      | title           | Evento para Validação      |
      | description     | Evento para testar validação de tickets |
      | date            | 2025-11-15T19:00:00Z       |
      | location        | Teatro Municipal           |
      | city            | Rio de Janeiro             |
      | state           | RJ                         |
      | category        | Teatro                     |
    Then o evento deve ser criado com sucesso
    
    When adiciono as seguintes categorias de ingressos ao evento:
      | name        | price    | quantity |
      | Plateia      | 100.00    | 150      |
    Then as categorias devem ser criadas com sucesso
    
    When compro "1" ingresso da categoria "Plateia" para o evento criado
    Then a compra deve ser realizada com sucesso
    And o primeiro ticket deve ter um QR code válido
    
    When valido o ticket usando o QR code do primeiro ticket
    Then a validação deve ser bem-sucedida
    And o ticket deve ser marcado como usado
    
    When consulto o ticket validado
    Then o status do ticket deve ser "USED"
    And o ticket deve ter uma data de uso registrada

  @integration
  Scenario: Consultar tickets do evento após compra
    Given que crio um evento com os seguintes dados:
      | campo           | valor                            |
      | title           | Evento de Consulta de Tickets   |
      | description     | Evento para consultar tickets    |
      | date            | 2025-11-20T18:00:00Z             |
      | location        | Centro de Convenções              |
      | city            | Belo Horizonte                    |
      | state           | MG                               |
      | category        | Conferência                      |
    Then o evento deve ser criado com sucesso
    
    When adiciono as seguintes categorias de ingressos ao evento:
      | name        | price    | quantity |
      | Estudante   | 50.00     | 300      |
      | Inteira     | 100.00    | 500      |
    Then as categorias devem ser criadas com sucesso
    
    When compro "5" ingressos da categoria "Estudante" para o evento criado
    Then a compra deve ser realizada com sucesso
    
    When consulto os tickets do evento criado
    Then deve retornar pelo menos "5" tickets
    And todos os tickets devem estar vinculados ao evento criado
    And todos os tickets devem ter a categoria "Estudante"

