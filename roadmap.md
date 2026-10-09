# TATUAME — cadastro simplificado
- [x] Substituir cadastro/login e área de tatuadores pelo questionário público obrigatório.
- [x] Receber, notificar e aprovar questionários no admin, sem criar conta de tatuador.
- [x] Remover controles antigos de planos, mensalidades e contas de tatuadores; preservar cadastros e histórico existentes.
- [x] Verificar formulário, navegação, permissões e atualização obrigatória dos pacotes.

## Migração para hospedagem externa e projeto próprio
- [x] Confirmar criação do projeto de destino e conexão do código ao GitHub.
- [x] Receber e inspecionar o backup do banco; inclui seções de cadastros, autenticação e dados financeiros.
- [x] Excluir fotos e documentos antigos do escopo, por solicitação do usuário.
- [x] Orientar o usuário a localizar a conexão do banco novo e preencher o formulário seguro.
- [x] Validar conexão com o destino e confirmar que está vazio (sem tabelas da aplicação e sem contas).
- [ ] Preparar restauração segura no destino — restauração de contas e dados ainda não executada.
- [ ] Configurar hospedagem externa — aguarda escolha e acesso à hospedagem; preservar integração de pagamentos e acesso dos usuários.
- [ ] Restaurar e conferir cadastros, compras, pagamentos, créditos e números da sorte, preservando vínculos e valores.
- [ ] Testar acesso de clientes/admin, novas compras, confirmação de pagamentos, atualização instantânea e callbacks no destino.
- [ ] Alterar o domínio somente após validação; manter o Cloud ativo até a migração ser verificada.
- [ ] Desconectar o Cloud somente após todos os testes e a troca verificada; exclusão é irreversível e realizada pelo administrador do workspace.