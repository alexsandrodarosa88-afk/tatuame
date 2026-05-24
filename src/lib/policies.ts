export const POLICY_VERSION = "1.1.0";
export const ARTIST_POLICY_VERSION = "1.0.0";

export const POLICY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Sobre o TATUAME",
    body: "O TATUAME é uma plataforma que organiza campanhas (sorteios premiados) cujo prêmio é uma tatuagem feita por um tatuador participante da plataforma. Ao comprar uma cota, você concorre ao prêmio descrito na campanha e contribui para a rede de tatuadores parceiros.",
  },
  {
    title: "2. Compra de cotas",
    body: "Cada cota dá direito a 1 (um) número da sorte na campanha escolhida. Os números são gerados automaticamente após a confirmação do pagamento. A compra é pessoal e intransferível.",
  },
  {
    title: "3. Sorteio",
    body: "O número sorteado tem como base o resultado da Loteria Federal da data prevista da campanha (ou da próxima extração caso a campanha encerre antes). O resultado é divulgado no site e nos canais oficiais do TATUAME.",
  },
  {
    title: "4. Prêmio (tatuagem)",
    body: "O ganhador escolhe um dos tatuadores que fazem parte da plataforma TATUAME para realizar a tatuagem prêmio. O TATUAME paga o tatuador escolhido pelo valor da tatuagem definido na campanha. O prêmio é a tatuagem em si: não pode ser convertido em dinheiro, transferido para outra pessoa, trocado por outro produto ou utilizado fora da rede de tatuadores TATUAME.",
  },
  {
    title: "5. Crédito por participação (cashback de campanha)",
    body: "Toda compra de cotas gera um crédito equivalente ao valor pago, que fica disponível na sua conta caso você NÃO seja sorteado. Regras do crédito:\n• Validade: 12 (doze) meses contados a partir da data da compra.\n• Intransferível e irrevogável: o crédito é vinculado ao seu CPF/conta e não pode ser passado para terceiros.\n• NÃO é resgatável em dinheiro: o crédito não pode ser convertido em saldo, PIX, transferência bancária ou qualquer outra forma de devolução em moeda.\n• Uso exclusivo: pode ser usado para abater até 50% (cinquenta por cento) do valor de uma tatuagem agendada com um tatuador que faz parte do TATUAME. Os outros 50% ficam por conta do cliente, pagos diretamente conforme regra da plataforma.\n• O crédito não usado dentro de 12 meses expira automaticamente e não gera direito a qualquer reembolso.",
  },
  {
    title: "6. Agendamento da tatuagem",
    body: "O agendamento (tanto do prêmio quanto do uso de crédito) é feito diretamente com o tatuador parceiro escolhido, respeitando a agenda, o estilo e as condições técnicas do profissional. O tatuador pode recusar projetos por questões de saúde, segurança, técnica ou conteúdo inadequado.",
  },
  {
    title: "7. Cancelamento e reembolso",
    body: "Após a confirmação do pagamento e a geração dos números da sorte, a compra não é reembolsável em dinheiro. Em caso de cancelamento da campanha por parte do TATUAME, o valor pago será integralmente convertido em crédito (regra do item 5) ou, a critério exclusivo do TATUAME, devolvido pelo mesmo meio de pagamento.",
  },
  {
    title: "8. Uso de dados",
    body: "Você autoriza o TATUAME a usar seus dados de cadastro (nome, CPF, contato) para fins de identificação do participante, contato sobre a campanha, comprovação de aceite destes termos e cumprimento de obrigações legais, em conformidade com a LGPD.",
  },
  {
    title: "9. Idade mínima e responsabilidade",
    body: "É necessário ter no mínimo 18 anos para participar das campanhas e agendar a tatuagem. O participante é responsável pela veracidade dos dados informados.",
  },
  {
    title: "10. Alterações destes termos",
    body: "O TATUAME pode atualizar estes termos. Quando houver alteração relevante, você será solicitado a aceitar a nova versão antes de continuar comprando novas cotas ou utilizando créditos.",
  },
];

// === Regras adicionais para o cliente ===
POLICY_SECTIONS.push(
  {
    title: "11. Ganhou o prêmio? Crédito zera",
    body: "Caso você seja sorteado em uma campanha, todos os créditos acumulados de campanhas anteriores em que você não foi sorteado serão automaticamente zerados na data da apuração do prêmio. O crédito de participação NÃO é cumulativo com o prêmio: ao ganhar, você recebe a tatuagem premiada e perde qualquer saldo de crédito anterior. Compras futuras voltam a gerar crédito normalmente.",
  },
  {
    title: "12. Prêmio é exclusivo para tatuagem na rede TATUAME",
    body: "O prêmio da campanha (tatuagem) é único, pessoal e exclusivo. Ele NÃO pode ser trocado por dinheiro, PIX, transferência, vale, presente ou qualquer outro bem. O prêmio só pode ser utilizado em forma de tatuagem realizada por um tatuador cadastrado e ativo na plataforma TATUAME.",
  },
);

export const ARTIST_POLICY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Sobre o TATUAME",
    body: "O TATUAME é uma plataforma que organiza campanhas/sorteios em que o prêmio é uma tatuagem realizada por um tatuador cadastrado. Ao ser aprovado, você se torna um tatuador parceiro e passa a ter direito de receber rateios mensais das campanhas, além de poder ser escolhido pelos ganhadores e clientes para realizar tatuagens pagas pela plataforma (prêmio ou voucher de crédito).",
  },
  {
    title: "2. Mensalidade",
    body: "Para se manter como tatuador parceiro você deve pagar a mensalidade da plataforma na data informada. O valor promocional de lançamento é de R$ 39,90 nos 6 primeiros meses e R$ 59,90/mês após esse período (salvo isenção concedida pelo TATUAME).",
  },
  {
    title: "3. Atraso de mensalidade — bloqueio automático",
    body: "O atraso superior a 5 (cinco) dias do vencimento da mensalidade BLOQUEIA AUTOMATICAMENTE o seu acesso ao site/sistema do TATUAME. Durante o bloqueio você PERDE O DIREITO AOS RATEIOS das campanhas encerradas no período em que esteve inadimplente — esses valores não são pagos retroativamente após a regularização.",
  },
  {
    title: "4. Retorno após bloqueio e regra dos 3 atrasos",
    body: "Para voltar a fazer parte do TATUAME após um bloqueio por inadimplência, é necessária NOVA APROVAÇÃO pelo administrador da plataforma — o cadastro não é reativado automaticamente. Em caso de 3 (três) atrasos no histórico do tatuador, ele poderá ser BANIDO definitivamente ou, a critério exclusivo do TATUAME, poderá retornar apenas mediante pagamento de TAXA DE MULTA de R$ 1.500,00 (mil e quinhentos reais), além de regularizar as mensalidades em aberto.",
  },
  {
    title: "5. Recebimento pelo prêmio (tatuagem do ganhador)",
    body: "O pagamento ao tatuador pela tatuagem realizada para um GANHADOR de campanha será efetuado APENAS após:\n• envio do termo padrão da plataforma devidamente assinado pelo TATUADOR e pelo CLIENTE/ganhador;\n• envio de foto(s) da tatuagem finalizada.\nO tatuador deve anexar esses documentos na aba “Solicitar pagamento” da sua área. O TATUAME efetua o pagamento em até 48 (quarenta e oito) horas úteis após a aprovação da solicitação.",
  },
  {
    title: "6. Tatuagens grandes em mais de uma sessão",
    body: "Quando a tatuagem premiada não puder ser entregue em sessão única, o tatuador deve enviar o termo informando previamente quantas sessões serão realizadas, com a ASSINATURA DO CLIENTE concordando. O tatuador está ciente e concorda que receberá o valor FRACIONADO conforme a entrega de cada sessão (proporcional ao total acordado), mediante envio do termo correspondente a cada sessão e foto do progresso.",
  },
  {
    title: "7. Atendimento de clientes com voucher/crédito",
    body: "O tatuador concorda em atender clientes que possuam VOUCHER DE CRÉDITO (crédito gerado por compras de cotas em campanhas em que o cliente NÃO foi sorteado). Regras:\n• O voucher pode abater no máximo 50% (cinquenta por cento) do valor da tatuagem; os outros 50% são pagos diretamente pelo cliente ao tatuador, conforme regra da plataforma.\n• O tatuador NÃO recebe esse valor de voucher em dinheiro diretamente: esse valor compõe os rateios mensais distribuídos a todos os tatuadores ativos.\n• Ao aceitar estes termos, o tatuador declara estar ciente de que o crédito do cliente não gera repasse direto.",
  },
  {
    title: "8. Responsabilidade pela execução da tatuagem",
    body: "A plataforma TATUAME NÃO se responsabiliza pela execução técnica, qualidade artística, cicatrização ou eventuais danos relacionados à tatuagem. A responsabilidade pela prestação do serviço é EXCLUSIVA do tatuador. O papel da TATUAME se limita ao repasse do valor do prêmio/crédito conforme estas políticas.",
  },
  {
    title: "9. Dados bancários e saques",
    body: "Para receber, o tatuador deve manter dados bancários e dados pessoais corretos e atualizados. Alterações nesses dados podem ser bloqueadas para alteração via admin, por segurança.",
  },
  {
    title: "10. Alterações destes termos",
    body: "O TATUAME pode atualizar estes termos a qualquer momento. Quando houver alteração relevante, o tatuador será solicitado a aceitar a nova versão para continuar utilizando a plataforma.",
  },
];

export function artistPoliciesAsText(): string {
  return ARTIST_POLICY_SECTIONS.map((s) => `${s.title}\n${s.body}`).join("\n\n");
}

export function policiesAsText(): string {
  return POLICY_SECTIONS.map((s) => `${s.title}\n${s.body}`).join("\n\n");
}