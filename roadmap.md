# TATUAME — cadastro simplificado
- [x] Substituir cadastro/login e área de tatuadores pelo questionário público obrigatório.
- [x] Receber, notificar e aprovar questionários no admin, sem criar conta de tatuador.
- [x] Remover controles antigos de planos, mensalidades e contas de tatuadores; preservar cadastros e histórico existentes.
- [x] Verificar formulário, navegação, permissões e atualização obrigatória dos pacotes.

## Migração somente do banco para projeto próprio
- [x] Confirmar criação do projeto de destino e conexão do código ao GitHub.
- [x] Receber e inspecionar o backup do banco; inclui seções de cadastros, autenticação e dados financeiros.
- [x] Excluir fotos e documentos antigos do escopo, por solicitação do usuário.
- [x] Orientar o usuário a localizar a conexão do banco novo e preencher o formulário seguro.
- [x] Validar conexão com o destino e confirmar que está vazio (sem tabelas da aplicação e sem contas).
- [x] Confirmar escopo atual: somente copiar o banco; não alterar site, hospedagem, domínio ou conexão atual.
- [ ] Preparar restauração segura no destino — restauração de contas e dados ainda não executada; ferramentas de migração disponíveis aplicam somente ao Cloud, sem destino externo configurável.
- [ ] Restaurar e conferir cadastros, compras, pagamentos, créditos e números da sorte, preservando vínculos e valores.
- [ ] Conferir estrutura, permissões, contagens, vínculos e totais financeiros no banco de destino, sem conectar o site nesta etapa.

Site, hospedagem, domínio e testes de compras/acesso no novo banco ficam fora desta etapa, por decisão do usuário. O Cloud permanece ativo.