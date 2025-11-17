# language: pt

Funcionalidade: Buscar Imóveis com Filtros via Chat (POST /api/chat)
  Como um usuario do sistema
  Eu quero buscar imoveis com filtros especificos atraves de conversacao natural
  Para que eu possa encontrar imoveis que atendam minhas necessidades

  Contexto:
    Dado que o chatbot esta disponivel

  @chat @search @amenities
  Cenário: Buscar imoveis com piscina via chat
    Quando envio a mensagem "Busque casas com piscina"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve ser uma string não vazia

  @chat @search @amenities
  Cenário: Buscar imoveis com frente mar via chat
    Quando envio a mensagem "Quero ver imoveis com frente para o mar"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve ser uma string não vazia

  @chat @search @amenities
  Cenário: Buscar imoveis mobiliados via chat
    Quando envio a mensagem "Mostre apartamentos mobiliados em Sao Sebastiao"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "mobiliado" ou "furnished"

  @chat @search @combined
  Cenário: Buscar imoveis com multiplos filtros via chat
    Quando envio a mensagem "Busque casas em Maresias com piscina e area gourmet"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "Maresias"
    E a resposta deve conter "CASA"

  @chat @search @combined
  Cenário: Buscar imoveis com filtros combinados - cidade, tipo e finalidade
    Quando envio a mensagem "Mostre casas a venda em Sao Sebastiao"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "Sao Sebastiao"
    E a resposta deve conter "CASA"
    E a resposta deve conter "venda" ou "SALE"

  @chat @search @combined
  Cenário: Buscar imoveis com filtros combinados - tipo, finalidade e preco
    Quando envio a mensagem "Quero ver apartamentos para alugar em Sao Sebastiao com preco ate 600000"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "APARTAMENTO"
    E a resposta deve conter "Sao Sebastiao"
    E a resposta deve conter "alugar" ou "RENT"

