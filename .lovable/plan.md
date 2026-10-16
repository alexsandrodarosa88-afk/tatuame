# Números da sorte sem repetição por campanha

## Situação conferida agora
- 1 venda paga, 1 número da sorte gerado, nenhum número repetido.
- O banco já tem uma trava que impede dois números iguais na mesma campanha: um número repetido é recusado na hora.
- Compras pagas ao mesmo tempo entram em fila, uma depois da outra, então duas pessoas nunca recebem o mesmo número.
- Quando a campanha esgota, novas confirmações são bloqueadas em vez de repetir números.

## Proposta (opcional, só se você aprovar)
- Mostrar no ADM, em cada campanha, um aviso "Números conferidos: nenhum repetido" com o total de números gerados e quantos ainda restam.

## Detalhe técnico
- Restrição UNIQUE (campaign_id, number) em lucky_numbers + pg_advisory_xact_lock por campanha no trigger generate_lucky_numbers. Nenhuma mudança necessária no banco; a proposta é só de exibição.
