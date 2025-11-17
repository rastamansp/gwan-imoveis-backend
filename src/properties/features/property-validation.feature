# language: pt

Funcionalidade: Validacao de Propriedades
  Como um desenvolvedor ou QA
  Eu quero validar que os campos estao em ingles e a estrutura esta correta
  Para que eu possa garantir a consistencia da API

  Contexto:
    Dado que a API de propriedades esta disponivel

  @properties @validation @english-fields
  Cenário: Verificar que campos estao em ingles
    Quando listo todas as propriedades
    Então o status da resposta deve ser 200
    E devo receber uma lista de propriedades
    Quando obtenho a primeira propriedade da lista
    Então a propriedade deve ter o campo "hasPool" em ingles
    E a propriedade deve ter o campo "hasJacuzzi" em ingles
    E a propriedade deve ter o campo "oceanFront" em ingles
    E a propriedade deve ter o campo "hasGarden" em ingles
    E a propriedade deve ter o campo "hasGourmetArea" em ingles
    E a propriedade deve ter o campo "furnished" em ingles
    E a propriedade deve ter o campo "realtorId" em ingles
    E a propriedade nao deve ter campos em portugues como "piscina", "hidromassagem", "frenteMar", "jardim", "areaGourmet", "mobiliado" ou "corretorId"

