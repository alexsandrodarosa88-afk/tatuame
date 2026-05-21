
# Área do Tatuador — Mensalidade, Dados Bancários e Saques

## 1. Banco de dados (migration)

**Nova tabela `artist_bank_details`** (1 por tatuador, bloqueada após preenchimento)
- artist_id (uuid, unique), full_name, address, phone, email, cpf, rg, birth_date
- bank_name, bank_agency, bank_account, pix_key
- is_locked (boolean, default true depois do primeiro insert via trigger)
- RLS: tatuador vê/insere o seu; update só admin (para liberar via chamado)

**Nova tabela `withdrawal_requests`**
- artist_id, amount, status (pending/approved/paid/rejected), notes, requested_at, processed_at
- RLS: tatuador vê/cria os seus; admin gerencia tudo

**Nova tabela `admin_notifications`**
- type (withdrawal_request / artist_application / support_ticket), title, message, link, is_read, related_id
- RLS: só admin

**Tabela `artist_subscriptions` já existe** — usar para mensalidade. Adicionar coluna `due_date` e `stripe_payment_intent_id` se faltar.

**Triggers**
- `lock_bank_details`: ao UPDATE em artist_bank_details, se is_locked=true e quem edita não é admin → bloquear
- `notify_admin_on_withdrawal`: AFTER INSERT em withdrawal_requests → insert em admin_notifications
- `notify_admin_on_application`: AFTER INSERT em artist_applications → insert em admin_notifications

## 2. Área do Tatuador (frontend)

**Sidebar** ganha 2 abas novas:
- **Meus dados** (`/tatuador/dados`) — formulário completo (pessoal + bancário + PIX). Após salvar, campos ficam read-only com aviso "Para alterar, abra um chamado".
- **Mensalidade** (`/tatuador/mensalidade`) — mostra valor, vencimento, status, botão "Pagar mensalidade" (Stripe checkout).

**Meus rateios** (`/tatuador/rateio`) — adicionar:
- Aviso azul: "Após solicitar seu saque, ele será pago em até 48h. Pagamentos apenas em dias úteis."
- Aviso vermelho se dados bancários incompletos: "Complete seus dados em **Meus dados** para poder solicitar saque."
- Botão **Solicitar saque** (habilitado só se: dados completos E saldo a receber > 0)
- Lista de solicitações de saque com status

## 3. Área do Admin

- Sino de notificações no header do admin layout com badge de não-lidas, abre dropdown com últimas notificações e link para a página relacionada
- Nova rota `/admin/saques` para aprovar/marcar como pago os pedidos de saque
- Notificações são marcadas como lidas ao clicar

## 4. Detalhes técnicos

- Stripe: usar `createCheckoutSession` existente adaptado para "subscription_payment" (one-shot da mensalidade) — ou marcar manualmente como pago no admin por enquanto se Stripe não estiver pronto. **Vou usar: registrar pagamento manual + botão "marcar como pago" no admin** para evitar reescrever Stripe agora. (Confirmar com usuário se quer Stripe já.)
- Avisos: usar `Card` com cores `border-amber-500/30 bg-amber-500/10` etc.

## Arquivos

**Novos**
- `supabase/migrations/<ts>_artist_finance.sql`
- `src/routes/_authenticated/tatuador.dados.tsx`
- `src/routes/_authenticated/tatuador.mensalidade.tsx`
- `src/routes/_authenticated/admin.saques.tsx`
- `src/components/admin/NotificationsBell.tsx`
- `src/hooks/use-admin-notifications.ts`

**Editados**
- `src/routes/_authenticated/tatuador.tsx` (sidebar + 2 itens)
- `src/routes/_authenticated/tatuador.rateio.tsx` (avisos + botão saque + lista)
- `src/routes/_authenticated/admin.tsx` (sino no header + link "Saques")
