# Bookinfy — instruções para agentes

A documentação oficial está no [vault unificado da IWETI](https://github.com/iweti/iweti-obsidian), na pasta `bookinfy/`. O índice do projeto é `bookinfy/bookinfy.md`. Mantenha o README curto e coloque as especificações e registros de entrega no vault.

Antes de alterar o projeto, abra o índice do Bookinfy, as orientações do vault e as notas ligadas ao módulo afetado. Se as notas estiverem indisponíveis, procure o repositório `iweti/iweti-obsidian` e peça acesso se necessário. Alinhe decisões de produto que estiverem em aberto.

Ao concluir uma mudança, execute as verificações relevantes e atualize as notas afetadas, a data de revisão e o registro de validação no vault. Descreva o que foi executado e as pendências concretas. Leia os guias locais do Next.js para as APIs tocadas.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
