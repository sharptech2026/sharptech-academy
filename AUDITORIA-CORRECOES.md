# SharpTech Academy — relatório de revisão e correcções

## Correcções aplicadas

- As migrações de autenticação e do sistema social (`0001_auth.sql` e `0003_social.sql`) só são elegíveis quando `VITE_AUTH_ENABLED` está activo. No modo actual (`false`), a migração de progresso continua disponível. Nenhuma tabela ou dado existente é apagado.
- O comando `db:migrate` passa a carregar o mesmo ambiente do projecto que o build, evitando decisões diferentes entre build e migração.
- Os endpoints de autenticação devolvem `404` enquanto a autenticação estiver desactivada.
- O `INSERT ... ON CONFLICT` do progresso deixa de incluir `updated_at` como coluna sem valor correspondente.
- As actualizações de perfil e definições usam mapas explícitos de campos para colunas SQL snake_case.
- A privacidade de perfil e a visibilidade na classificação são consultadas em `user_settings`, onde essas colunas realmente existem.
- As respostas sociais deixam de divulgar o e-mail de terceiros; o e-mail continua disponível no perfil do próprio utilizador.
- Os identificadores de utilizador aceitam IDs opacos do Better Auth, em vez de presumirem UUIDs.
- Pedidos de amizade verificam a existência e a visibilidade da conta de destino.
- Os campos JSONB aceitam tanto objectos já descodificados como texto JSON.
- Os limites de paginação e os valores de XP recebidos foram reforçados com validação inteira e limites.
- O HTML dos certificados escapa o nome e o número do certificado para impedir injecção de HTML/script.
- A consola de código só aceita mensagens provenientes do iframe sandbox que executou o código.
- O `.gitignore` passa a ignorar ficheiros `.env*`, reduzindo o risco de credenciais serem adicionadas ao Git por acidente.

## Verificações executadas

- **198 testes dos scripts:** aprovados, 0 falhados.
- Verificação sintáctica Node/TypeScript dos ficheiros alterados: aprovada.
- Verificações directas do motor de execução e do HTML dos certificados: aprovadas.
- Dimensões dos recursos PWA: `og.jpg` 1200×630, `x-banner.jpg` 1200×264 e ícone 180×180.

## Limitações desta execução

- Não foi possível instalar as dependências: o acesso ao registo npm falhou por erro DNS (`EAI_AGAIN`). Por isso, o build completo, o TypeScript completo e os testes que dependem de `@tanstack/react-start` e `jose` não puderam ser concluídos.
- Não foi ligada nem alterada qualquer base de dados real. As migrações não foram executadas contra produção.
- Não foi feita publicação nem alteração do repositório remoto.
- A aplicação está actualmente configurada para autenticação desactivada e armazenamento local (`localStorage`). Assim, o progresso e os certificados guardados no navegador não constituem registos invioláveis nem sincronização segura entre dispositivos. Para isso será necessário activar e configurar autenticação e persistência no servidor, com validação de progresso do lado do servidor.

## Estado

As correcções de código acima estão incluídas no ZIP. A publicação deve aguardar a execução de `npm ci`, `npm test`, `npm run typecheck`, `npm run lint` e `npm run build` num ambiente com acesso ao registo npm e às variáveis de ambiente correctas.
