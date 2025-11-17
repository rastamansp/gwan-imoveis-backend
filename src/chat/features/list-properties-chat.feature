# language: pt

Funcionalidade: Listar Imóveis via Chat (POST /api/chat)
  Como um usuario do sistema
  Eu quero listar imoveis atraves de conversacao natural
  Para que eu possa encontrar imoveis de forma intuitiva

  Contexto:
    Dado que o chatbot esta disponivel

  @smoke @chat @list
  Cenário: Listar todos os imoveis via chat
    Quando envio a mensagem "Liste todos os imoveis cadastrados"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve ser uma string não vazia

  @chat @list @city
  Cenário: Listar imoveis por cidade via chat
    Quando envio a mensagem "Liste imoveis em Sao Sebastiao"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "Sao Sebastiao"

  @chat @list @type
  Cenário: Listar imoveis por tipo via chat - Casas
    Quando envio a mensagem "Mostre casas a venda"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "CASA"

  @chat @list @type
  Cenário: Listar imoveis por tipo via chat - Apartamentos
    Quando envio a mensagem "Quero ver apartamentos disponiveis"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "APARTAMENTO"

  @chat @list @purpose
  Cenário: Listar imoveis para aluguel via chat
    Quando envio a mensagem "Liste imoveis para aluguel"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "aluguel" ou "RENT"

  @chat @list @purpose
  Cenário: Listar imoveis a venda via chat
    Quando envio a mensagem "Mostre imoveis a venda"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "venda" ou "SALE"

  @chat @list @purpose
  Cenário: Listar imoveis para investimento via chat
    Quando envio a mensagem "Quero ver imoveis para investimento"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "investimento" ou "INVESTMENT"

  @chat @list @price
  Cenário: Listar imoveis por faixa de preco via chat
    Quando envio a mensagem "Busque imoveis entre 300 mil e 500 mil"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve ser uma string não vazia

  @chat @list @neighborhood
  Cenário: Listar imoveis por bairro via chat
    Quando envio a mensagem "Liste imoveis no bairro Maresias"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "Maresias"

