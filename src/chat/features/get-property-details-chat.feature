# language: pt

Funcionalidade: Obter Detalhes de Imóvel via Chat (POST /api/chat)
  Como um usuario do sistema
  Eu quero obter detalhes de um imovel especifico atraves de conversacao natural
  Para que eu possa visualizar informacoes completas do imovel

  Contexto:
    Dado que o chatbot esta disponivel

  @smoke @chat @get
  Cenário: Obter detalhes de imovel por ID via chat
    Dado que existe uma propriedade com ID "f0b68272-f81e-4fb1-a668-7af07925673c"
    Quando envio a mensagem "Mostre os detalhes do imovel f0b68272-f81e-4fb1-a668-7af07925673c"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "get_property_by_id"
    E a resposta deve ser uma string não vazia
    E a resposta deve conter "f0b68272-f81e-4fb1-a668-7af07925673c"

  @chat @get @negative
  Cenário: Tentar obter detalhes de imovel com ID invalido via chat
    Quando envio a mensagem "Mostre os detalhes do imovel 123"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve conter "invalido" ou "UUID" ou "ID invalido"

  @chat @get @negative
  Cenário: Tentar obter detalhes de imovel inexistente via chat
    Quando envio a mensagem "Mostre os detalhes do imovel 00000000-0000-0000-0000-000000000000"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve conter "nao encontrado" ou "não encontrado" ou "não existe"

