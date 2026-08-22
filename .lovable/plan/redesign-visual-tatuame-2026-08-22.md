# Redesign Visual TATUAME

Transformação radical da interface para uma estética "Fintech Premium + Marketplace Moderno", focada em tecnologia, confiança e exclusividade.

## Mudanças Visuais
- **Paleta**: Preto profundo, grafite, cinza escuro, branco e Vermelho TATUAME estratégico.
- **Efeitos**: Glassmorphism, transparências, blur, sombras profundas e micro-interações suaves.
- **Tipografia**: Hierarquia clara com títulos impactantes e fontes modernas.
- **Mobile First**: Experiência fluida tipo app com CTAs fixos e cards otimizados.

## Ações por Página

### 1. Global & Core
- Atualizar `src/styles.css` com novos tokens de design e variáveis de tema.
- Ajustar `src/routes/__root.tsx` para garantir fontes e metadados consistentes.
- Criar componentes utilitários de UI conforme necessário.

### 2. Home Page (`src/routes/index.tsx`)
- **Hero**: Seção tela cheia, headline gigante, imagem integrada com profundidade.
- **Tatuadores**: Grid moderno valorizando a fotografia dos artistas.
- **Campanhas**: Cards premium com progresso visual, valores destacados e hover effects.
- **Como Funciona**: Redesenho para 3 etapas simples e visuais.
- **Crédito**: Seção de destaque para o ecossistema de benefícios.

### 3. Tatuadores (`src/routes/tatuadores.tsx`)
- Visual de marketplace de talentos, busca aprimorada e filtros discretos.

### 4. Checkout & Campanha (`src/routes/checkout.$orderId.tsx`)
- Fluxo simplificado (Escolher -> Participar -> Confirmar).
- Mobile: Botão "Quero Participar" fixo no rodapé.

### 5. Dashboards (`src/routes/_authenticated/conta.tsx`, etc.)
- Aparência de aplicativo SaaS, cards de resumo e histórico limpo.

## Detalhes Técnicos
- Utilização de Tailwind v4 com `@theme inline`.
- Preservação total de lógica de banco (Supabase), autenticação e integrações (Asaas/Mercado Pago).
- Otimização de performance com lazy loading e imagens eficientes.
