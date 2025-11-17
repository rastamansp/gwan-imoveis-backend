# language: pt

Funcionalidade: Integracao de Propriedades com Chat
  Como um usuario do chatbot
  Eu quero buscar propriedades atraves de conversacao natural
  Para que eu possa encontrar imoveis de forma intuitiva

  Contexto:
    Dado que o chatbot esta disponivel

  @integration @chat @properties
  Cenário: Buscar propriedades atraves do chat
    Quando envio a mensagem "Quais imoveis estao disponiveis em Sao Sebastiao?"
    Então devo receber uma resposta
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "Sao Sebastiao"

  @integration @chat @properties
  Cenário: Buscar propriedades por tipo atraves do chat
    Quando envio a mensagem "Mostre-me casas a venda"
    Então devo receber uma resposta
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "CASA"

  @integration @chat @properties
  Cenário: Obter detalhes de propriedade atraves do chat
    Dado que existe uma propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    Quando envio a mensagem "Me mostre detalhes do imovel f0b68272-f81e-4fb1-a668-7af07925673c"
    Então devo receber uma resposta
    E a resposta deve usar a ferramenta "get_property_by_id"

  @integration @chat @properties @filters
  Cenário: Buscar propriedades com filtros combinados atraves do chat
    Quando envio a mensagem "Quero ver apartamentos para alugar em Sao Sebastiao com preco ate 600000"
    Então devo receber uma resposta
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "APARTAMENTO"
    E a resposta deve conter "Sao Sebastiao"

