# Recriar o TATUAME no banco novo

## O que você vai ter
1. **Painel ADM completo** (só você entra)
   - Criar, editar e excluir campanhas (simples e Premium): título, descrição, prêmio, valor da cota, total de cotas, fotos, datas, status.
   - Ver vendas, clientes e números da sorte; editar e excluir clientes.
   - Ver os cadastros de "Seja um Artista TATUAME", aprovar ou recusar, e publicar o artista no site.
   - Editar textos e configurações do site (título, chamadas, WhatsApp, FAQ).
2. **Conta de administrador** com o email alexsandrodarosa88@gmail.com.
   - A senha não ficará gravada no código. Recomendo trocá-la no primeiro acesso, porque ela foi enviada no chat.
3. **Visual novo, mais claro e premium**
   - Fundo claro (off-white e cinza suave), textos em grafite, vermelho TATUAME apenas nos destaques e botões.
   - Tipografia elegante, mais espaço entre as seções, cartões limpos e organização simples no celular.
4. **Fim do acesso de tatuadores**
   - Remover login, painel, planos e mensalidades de tatuador.
5. **Seção "SEJA UM ARTISTA TATUAME"**
   - Botão no topo do site e uma seção na página inicial.
   - Formulário com todos os campos obrigatórios: Nome completo, Instagram, WhatsApp, Email, Cidade, Estado e Endereço completo do estúdio.
   - Depois de enviar, aparece: "Cadastro em análise, você vai receber uma mensagem no seu WhatsApp."
6. **Clientes** continuam podendo se cadastrar, entrar, comprar cotas e ver os números da sorte.

## Ordem
1. Criar a estrutura no banco novo (campanhas, pedidos, números da sorte, clientes, cadastros de artistas, permissões e configurações do site).
2. Criar a conta de administrador.
3. Refazer o visual e as páginas públicas.
4. Refazer o painel ADM.
5. Remover tudo que é de tatuador e criar o formulário novo.
6. Testar: entrar como ADM, criar e excluir uma campanha, enviar um cadastro de artista e ver ele chegar no painel.

## Observações
- Os dados antigos (cadastros e compras) não entram nesta etapa. Podemos copiar depois, se você quiser.
- Os pagamentos online precisam das chaves de pagamento no projeto novo. Vou conferir isso no teste.

## Technical details
- Supabase migrations: campaigns, campaign_images, orders, lucky_numbers, profiles, user_roles + has_role, artist_applications (public insert, admin-only read), site_settings. Every table gets GRANTs and RLS.
- The admin user is created by a one-time server-side step through the admin API using the email above. The admin role goes in user_roles.
- Admin area lives under `_authenticated/admin`, guarded by has_role. Writes go through RLS-checked queries or server functions with requireSupabaseAuth.
- Remove tatuador routes and screens: tatuador*, plans, payouts, mensalidades. Keep the payment webhook routes.
- New light theme tokens in src/styles.css.
