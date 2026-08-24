import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  const faqs = [
    {
      question: "O que é o TATUAME?",
      answer: "O TATUAME é a primeira plataforma brasileira que conecta amantes de tatuagem a artistas premium através de campanhas exclusivas. Você participa das campanhas e pode ser contemplado com a experiência de uma tatuagem completa sem custos adicionais."
    },
    {
      question: "Como funcionam as campanhas?",
      answer: "Cada campanha tem um objetivo de participantes. Ao atingir a meta, um dos participantes é selecionado para realizar a tatuagem com o artista responsável. Todos os participantes também acumulam benefícios ou créditos dependendo do tipo da campanha."
    },
    {
      question: "O crédito que ganho tem validade?",
      answer: "Os créditos acumulados em campanhas Premium não expiram e podem ser utilizados para abater o valor de tatuagens futuras com qualquer artista parceiro da plataforma."
    },
    {
      question: "O TATUAME é seguro?",
      answer: "Sim! Somos uma empresa registrada, com termos de uso claros e parcerias com os melhores estúdios do Brasil. Todos os pagamentos são processados por gateways seguros (Mercado Pago) e a entrega das tatuagens é garantida pelo nosso ecossistema."
    },
    {
      question: "Qual a diferença entre Plano Free e Premium para tatuadores?",
      answer: "O Plano Free permite que o tatuador esteja na plataforma e seja descoberto por clientes. O Plano Premium oferece participação no rateio das campanhas, maior visibilidade e acesso a ferramentas exclusivas de gestão e marketing."
    }
  ];

  return (
    <section id="faq" className="py-24 border-t border-border bg-card/10">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">Dúvidas comuns</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold">Perguntas Frequentes</h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem 
                key={i} 
                value={`item-${i}`} 
                className="border border-border bg-background/50 rounded-xl px-6 transition-[var(--transition-smooth)] hover:border-primary/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
