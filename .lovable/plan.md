## Visão geral

Criar dois planos de assinatura para tatuadores: **Free** (sem rateio) e **Premium** (com rateio condicionado a metas de divulgação). O Premium é vendido em pacotes de 6 ou 12 meses, e o rateio do mês é proporcional às metas semanais cumpridas.

## Regras de negócio

**Plano Free**
- R$ 0/mês, acesso completo à plataforma EXCETO a aba "Rateio"
- Tatuador some da lista de elegíveis quando o admin distribui rateio de uma campanha
- Aba "Rateio" e "Solicitar pagamento" ficam ocultas no menu lateral do tatuador Free

**Plano Premium**
- R$ 49,90/mês, vendido em pacote de **6 meses (R$ 299,40)** ou **12 meses (R$ 598,80)** pago de uma vez
- Tatuador escolhe o pacote no momento da assinatura
- Acesso completo + direito ao rateio (condicionado às metas)

**Metas semanais de divulgação (Premium)**
- 8 stories + 1 reel + 1 post **por semana**
- Cada item é auto-declarado pelo tatuador no painel dele (botão "marquei como feito" + link opcional do Instagram)
- Admin valida/rejeita cada item no painel novo "Metas de Divulgação"
- Cada semana fechada vira um registro com % de metas aprovadas (0–100%)

**Rateio proporcional**
- Quando uma campanha fecha e o rateio é distribuído, para cada tatuador Premium ativo o sistema calcula a média de % de aprovação das semanas do mês de referência
- O valor que ele recebe = `valor_padrão_por_artista × (% médio aprovado / 100)`
- A diferença (o que ele não recebeu) volta para o caixa do sistema (não é redistribuída)
- Tatuadores Free não entram no cálculo nem aparecem na lista

**Migração de tatuadores existentes**
- Mantém todos como Premium ativo até a data atual do `subscription_next_due`
- Quando vencer, eles escolhem renovar em pacote (6 ou 12 meses) ou descer pra Free

## Mudanças no banco

1. **`tattoo_artists`**: adicionar `plan` (`'free' | 'premium'`, default `'free'`), `plan_expires_at` (data fim do pacote Premium), `plan_term_months` (6 ou 12)
2. **`artist_subscriptions`**: adicionar `term_months` (6 ou 12), `amount` passa a guardar o valor total do pacote
3. **Nova tabela `artist_promotion_tasks`**: registra cada item de divulgação
   - `artist_id`, `week_start` (segunda-feira), `task_type` (`story | reel | post`), `task_index` (1..N do tipo na semana), `status` (`pending | submitted | approved | rejected`), `instagram_url`, `submitted_at`, `reviewed_at`, `reviewer_id`, `notes`
   - Único por (artist_id, week_start, task_type, task_index)
4. **Nova view/função `artist_week_completion(artist_id, week_start)`** retorna % aprovado da semana
5. **Função `compute_artist_payout_factor(artist_id, reference_month)`**: média das semanas do mês
6. **Atualizar `distribute_campaign_payouts`**: só considera Premium ativo, aplica fator de divulgação

## Mudanças no frontend

**Tatuador**
- Nova página `/tatuador/plano` para escolher Free vs Premium (6 ou 12 meses) e pagar via PIX
- Página `/tatuador/divulgacao`: lista a semana atual com checkboxes de cada story/reel/post + campo de link e botão "Enviar". Mostra status de cada item e % da semana
- Menu lateral: esconde "Rateio" e "Solicitar pagamento" quando `plan = 'free'`

**Admin**
- Página `/admin/divulgacao`: fila de itens `submitted` para aprovar/rejeitar com link clicável pro Instagram
- `/admin/tatuadores`: badge do plano e botão "Mudar plano" / "Estender Premium"
- `/admin/rateios`: mostra para cada artista Premium o % médio do mês e o valor final calculado

## Pagamento dos pacotes Premium

Usar a integração Asaas existente, gerando uma única cobrança PIX do valor total (R$ 299,40 ou R$ 598,80). Ao confirmar, define `plan='premium'`, `plan_term_months`, `plan_expires_at = now() + N meses`. Webhook já existente trata a confirmação.

## Não muda
- Sistema de campanhas, cotas, números da sorte, vendas para clientes
- Inflação x12 das % visíveis ao cliente nas campanhas
- Cadastro/aprovação de tatuadores (continua, mas o aprovado entra como Free)

Posso seguir com a implementação?