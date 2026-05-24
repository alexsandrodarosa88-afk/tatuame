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

export function policiesAsText(): string {
  return POLICY_SECTIONS.map((s) => `${s.title}\n${s.body}`).join("\n\n");
}