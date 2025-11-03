<!-- dbafb688-fcef-4f5a-a964-81be62299899 1a4ee81e-3d10-4335-abcd-2a1c57f054e3 -->
# Reorganização de Testes BDD por Módulo (Clean Architecture)

## Objetivo

Reorganizar arquivos `.feature` e step definitions para dentro de cada módulo em `src/` seguindo Clean Architecture, criando estruturas `features/` e `steps/` em cada módulo relevante.

## Estrutura Final

```
src/
├── events/
│   ├── events.controller.ts
│   ├── events.http (permanece junto ao controller)
│   ├── events.module.ts
│   ├── features/
│   │   ├── events.feature
│   │   └── events-integration.feature
│   ├── steps/
│   │   └── events-steps.ts
│   └── README.md
├── artists/
│   ├── artists.controller.ts
│   ├── artists.http (permanece junto ao controller)
│   ├── artists.module.ts
│   ├── features/
│   │

### To-dos

- [ ] Mover events-steps.ts para src/events/steps/ e ajustar imports
- [ ] Mover artists-steps.ts para src/artists/steps/ e ajustar imports
- [ ] Mover chat-steps.ts para src/chat/steps/ e ajustar imports
- [ ] Mover chat-events.feature para src/events/events.feature
- [ ] Mover chat-artists.feature para src/artists/artists.feature
- [ ] Dividir chat-integration.feature entre src/events/events-integration.feature e src/artists/artists-integration.feature
- [ ] Atualizar .cucumberrc.js com novos paths (src/**/*.feature e src/**/steps/*.ts)
- [ ] Criar/atualizar src/events/README.md documentando os testes BDD
- [ ] Criar/atualizar src/artists/README.md documentando os testes BDD
- [ ] Remover arquivos antigos de test/bdd/features/ e test/bdd/steps/ (exceto common-steps.ts)