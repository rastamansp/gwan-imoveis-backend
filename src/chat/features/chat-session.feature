# language: pt

Funcionalidade: Sessão e Contexto do Chat (POST /api/chat)
  Como um usuario do sistema
  Eu quero manter contexto entre mensagens
  Para que o chatbot possa entender melhor minhas necessidades

  Contexto:
    Dado que o chatbot esta disponivel

  @chat @session
  Cenário: Criar sessao ao enviar primeira mensagem
    Quando envio a mensagem "Liste imoveis em Sao Sebastiao"
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    # Nota: sessionId é opcional e só é retornado quando phoneNumber é fornecido

  @chat @session
  Cenário: Manter contexto entre mensagens na mesma sessao
    Quando envio a mensagem "Liste imoveis em Sao Sebastiao"
    Então devo receber uma resposta
    # Nota: sessionId será criado automaticamente pelo step "com a mesma sessao" se necessário
    Quando envio a mensagem "Mostre apenas casas" com a mesma sessao
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "CASA"

  @chat @session @context
  Cenário: Usar contexto do usuario na busca
    Quando envio a mensagem "Liste imoveis disponiveis" com contexto do usuario:
      """
      {
        "city": "Sao Sebastiao",
        "preferences": {
          "type": "CASA",
          "maxPrice": 1000000
        }
      }
      """
    Então devo receber uma resposta
    E o status da resposta deve ser 200
    E a resposta deve usar a ferramenta "list_properties"
    E a resposta deve conter "Sao Sebastiao"

