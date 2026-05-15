## Etapa 2 — Área autenticada, carrinho e checkout PIX

### Pré-requisitos (faço automaticamente)
1. **Ativar Lovable Cloud** — banco Postgres, auth (email+Google), server functions.
2. **Validar e ativar Stripe Payments** — `recommend_payment_provider` → `enable_stripe_payments`. PIX é nativo no Stripe BR.
3. **Configurar Google OAuth** no Cloud (broker da Lovable).

> Você precisará: aprovar a ativação do Cloud, preencher o formulário do Stripe (email/nome do negócio) quando aparecer, e depois validar a conta Stripe para liberar pagamentos reais (modo teste funciona imediatamente).

### Banco de dados (migrations)
- `profiles` — id (FK auth.users), nome_completo, cpf, telefone, cidade, created_at. RLS: dono lê/edita.
- `user_roles` + enum `app_role` (`admin`, `client`) + função `has_role()` SECURITY DEFINER. Trigger cria role `client` no signup.
- `campaigns` — migra os 4 mocks para tabela real (admin gerencia depois). Campos: id, tattoo_value, price_per_quota, total_quotas, sold_quotas, ends_at, status.
- `cart_items` — user_id, campaign_id, quantity. Único por (user, campaign).
- `orders` — id, user_id, status (`pending`/`paid`/`expired`/`canceled`), total_amount, stripe_session_id, stripe_payment_intent, pix_qr_code, pix_copy_paste, expires_at, paid_at.
- `order_items` — order_id, campaign_id, quantity, unit_price.
- `participations` — user_id, campaign_id, order_id, lucky_number (único por campanha), created_at. Geradas no webhook quando pago.
- `credits` — user_id, amount_brl, source_order_id, valid_until (now+12 meses), used_amount.
- Função `generate_lucky_number(campaign_id)` — sorteia número único e incrementa `sold_quotas` atomicamente.

### Auth e perfil
- `/cadastro` — email/senha + Google. Após signup, força preencher: nome completo, CPF (validado), telefone, cidade.
- `/login` — email/senha + Google.
- `/esqueci-senha` + `/reset-password`.
- Email de confirmação ativado (Cloud envia automático).
- Trigger `handle_new_user` cria linha em `profiles` no signup.

### Páginas autenticadas (`_authenticated/`)
- `/conta` — dashboard: créditos disponíveis, validade, participações, números da sorte.
- `/campanhas` — todas as campanhas ativas; botão "+" adiciona ao carrinho (escolhe quantas cotas).
- `/carrinho` — lista itens, ajusta quantidade, total, botão "Finalizar com PIX".

### Checkout PIX (Stripe real)
- Server function `create-pix-checkout`: cria `Order` pending, cria PaymentIntent Stripe com `payment_method_types: ['pix']`, retorna QR + copia-cola.
- `/checkout/pix/$orderId` — exibe QR code, código copia-cola, contador 30 min.
- Webhook `/api/public/stripe-webhook` (verificado) — em `payment_intent.succeeded`:
  1. Marca order `paid`
  2. Para cada item, chama `generate_lucky_number` N vezes → cria `participations`
  3. Cria registro em `credits` (valor total = soma das cotas)
  4. Atualiza `sold_quotas` da campanha

### UI/Fluxo
- Botão "Garantir minha vaga" da landing → se logado vai para `/campanhas`, se não vai para `/cadastro?redirect=/campanhas`.
- Navbar muda quando logado (mostra créditos + menu da conta).
- Toast de sucesso pós-pagamento confirmado (polling do status da order).

### Fora de escopo desta etapa
- Painel admin (gerenciar campanhas, sortear vencedor).
- Marketplace de tatuadores.
- Aplicar crédito em pagamento de tatuagem (até 70%).
- Notificações por email/WhatsApp além das de auth.

### Detalhes técnicos
- TanStack Start: server functions com `requireSupabaseAuth` para tudo do usuário; `supabaseAdmin` só no webhook.
- Validação Zod no server (CPF, telefone, quantity 1-50).
- Geração de número único: função PL/pgSQL com `FOR UPDATE` na linha da campanha para evitar race condition.
- PIX: usar `confirmation_method: 'automatic'` + `payment_method_data.type: 'pix'`. Stripe retorna `next_action.pix_display_qr_code`.
