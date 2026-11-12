# Bookinfy — instruções para agentes

A documentação oficial existe **somente no repositório irmão `../bookinfy-obsidian`**. Não crie `docs/`, cópias de especificações ou outros documentos de projeto neste repositório. Mantenha o `README.md` curto.

Antes de alterar o projeto:

1. Leia `../bookinfy-obsidian/Bookinfy/brain/bookinfy-brain.md` e `../bookinfy-obsidian/Bookinfy/Operacoes/Fluxo do agente.md`.
2. Leia as notas de arquitetura, regras, decisões e módulo afetado indicadas no contexto.
3. Se o vault não estiver disponível, procure o repositório `bookinfy-obsidian` entre as pastas irmãs e pergunte pelo caminho se não o encontrar. Não invente requisitos.
4. Pergunte ao usuário sobre decisões de produto ausentes. Distinga dados fictícios de regras aprovadas. Go, autenticação e automações reais pertencem a etapas futuras.

Ao concluir cada alteração:

1. Atualize as notas afetadas no vault e a data `atualizado`.
2. Registre a mudança brevemente em `Bookinfy/brain/sessions` e atualize o contexto e as notas afetadas. Explique escolhas relevantes na própria nota do assunto, sem exigir ADR para cada ajuste.
3. Execute as verificações do frontend adequadas à mudança. Confira links e caminhos citados nas notas e registre resultados reais em `Bookinfy/Technical Design/Validacao e evidencias.md`. O vault não exige scripts ou testes documentais.
4. Confira que nenhuma documentação completa foi adicionada ao site. O código e o vault devem descrever a mesma versão.

Leia os guias locais do Next.js para APIs tocadas, conforme a instrução mantida abaixo. As regras detalhadas do projeto e o histórico ficam no vault.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
