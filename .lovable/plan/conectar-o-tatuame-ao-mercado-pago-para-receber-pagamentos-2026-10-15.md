# Conectar o TATUAME ao Mercado Pago para receber pagamentos

## O que já está pronto (verificado agora)
- As chaves do Mercado Pago já estão salvas com segurança no projeto: token da conta, chave pública e segredo das notificações.
- O site já tem todo o fluxo de compra: pedido criado com preço da campanha, checkout aberto no Mercado Pago, confirmação assinada e um número da sorte exclusivo por cota paga.
- O endereço que o Mercado Pago deve avisar sobre os pagamentos já existe no site: `/api/public/mercadopago/webhook`.

## O que falta (3 passos)

1. **Publicar o site**
   O endereço de notificação só funciona no site publicado (hoje o endereço publicado ainda não responde). Publicar deixa o link do pagamento e as notificações no ar.

2. **Configurar a notificação no painel do Mercado Pago**
   Em Seus aplicativos → o app do TATUAME → Webhooks/Notificações, cadastrar:
   `https://tatuame.lovable.app/api/public/mercadopago/webhook`
   e ativar o evento **Pagamentos**. O usuário faz isso no painel do Mercado Pago (a Lovable não acessa esse painel).

3. **Testar uma compra de verdade**
   Comprar uma cota em uma campanha ativa, confirmar que o Mercado Pago avisa o site automaticamente e que o pedido muda para "Pago" com o número da sorte gerado em Minha conta.

## Detalhe técnico
- A notificação é validada por assinatura HMAC (`x-signature`), o valor conferido é o da order (`external_reference`) e o RPC `apply_mercadopago_payment` confirma o pedido, gera os números e desfaz em caso de estorno.
- Nenhum código novo é necessário; nada no banco muda.
