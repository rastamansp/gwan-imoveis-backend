# language: pt

Funcionalidade: Tour virtual 360 (F16)
  Como um corretor
  Eu quero montar um tour navegavel entre ambientes do imovel
  Para que o visitante ande pela casa clicando nos portais

  Contexto:
    Dado que a API de propriedades esta disponivel
    E que estou autenticado no tour como "corretor@imoveis.gwan.cloud" com senha "corretor123"
    E que criei um imovel para o tour

  @tour @auth
  Cenário: Corretor monta o tour e o visitante navega pelos portais
    Quando envio a panoramica "Sala" com 4096x2048
    E envio a panoramica "Varanda" com 4096x2048
    Então o tour deve ter 2 ambientes
    E o ambiente de entrada do tour deve ser "Sala"

    Quando crio um portal de "Sala" para "Varanda"
    Então o ambiente "Sala" deve ter 1 portal
    E o portal de "Sala" deve levar para "Varanda"

    Quando um visitante nao autenticado consulta o tour
    Então o status da resposta do tour deve ser 200
    E o tour deve ter 2 ambientes
    E o portal de "Sala" deve levar para "Varanda"

  @tour @auth @validacao
  Cenário: Foto comum e recusada por nao ser equirretangular
    Quando envio a panoramica "Cozinha" com 1920x1080
    Então o status da resposta do tour deve ser 400
    E a mensagem de erro do tour deve citar a proporcao

  @tour @auth @validacao
  Cenário: Portal para o proprio ambiente e recusado
    Quando envio a panoramica "Suite" com 4096x2048
    E tento criar um portal de "Suite" para "Suite"
    Então o status da resposta do tour deve ser 400

  @tour @auth
  Cenário: Remover ambiente limpa os portais que apontavam para ele
    Quando envio a panoramica "Sala" com 4096x2048
    E envio a panoramica "Varanda" com 4096x2048
    E crio um portal de "Sala" para "Varanda"
    E removo o ambiente "Varanda"
    Então o tour deve ter 1 ambiente
    E o ambiente "Sala" deve ter 0 portais
