# Números da sorte dentro do total de cotas de cada campanha

## Situação conferida
- O sorteio já escolhe os números aleatoriamente só entre 1 e o "Total de cotas" da campanha, sem repetir. Exemplo: campanha com 300 cotas gera apenas de 1 a 300.
- Problema: na tela os números aparecem sempre com 4 dígitos (ex.: 0007), mesmo quando a campanha tem 300 cotas.
- Hoje o ADM consegue diminuir o "Total de cotas" para um valor menor que números já vendidos, o que deixaria números fora da faixa.

## O que vai mudar
1. Os números passam a aparecer com a quantidade de dígitos do total de cotas: 300 cotas -> 001 a 300; 1000 cotas -> 0001 a 1000; 50 cotas -> 01 a 50. Vale em "Minha conta", ADM -> Vendas e na página Sorteios.
2. O ADM não poderá reduzir o "Total de cotas" para menos que o maior número já vendido nem abaixo da quantidade já vendida; aparece um aviso explicando.
3. Quando faltarem cotas, a compra continua bloqueada (nenhum número repetido ou fora da faixa).

## Detalhe técnico
- Helper `formatLuckyNumber(n, total)` em src/lib/db.ts com padStart(String(total).length); usar em conta.tsx, admin.vendas.tsx (incluir campaigns(total_quotas) no select) e sorteios.tsx.
- Migração: trigger BEFORE UPDATE em campaigns que recusa total_quotas < max(number) de lucky_numbers da campanha.
- Também validar em create_order que a quantidade pedida não ultrapassa as cotas restantes.
