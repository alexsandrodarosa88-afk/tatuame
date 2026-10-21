import { useQuery } from "@tanstack/react-query";
import { loadSettings, type SiteSettings } from "@/lib/db";
import logoDefault from "@/assets/tatuame-logo-new.png.asset.json";

export const TATTOO_STYLES = [
  "Old School (Tradicional Americano)", "Neo Tradicional", "New School", "Realismo", "Realismo Preto e Cinza", "Realismo Colorido",
  "Hiper-realismo", "Retrato", "Fineline (Traço Fino)", "Minimalista", "Blackwork", "Blackout", "Dotwork (Pontilhismo)",
  "Pontilhismo Geométrico", "Geométrico", "Mandala", "Ornamental", "Tribal", "Polinésio / Maori", "Japonês Tradicional (Irezumi)",
  "Neo Japonês", "Oriental", "Aquarela", "Trash Polka", "Sketch / Rascunho", "Lettering", "Caligrafia", "Chicano",
  "Biomecânico", "Surrealismo", "Anime / Geek", "Cartoon", "Botânico / Floral", "Ignorant Style", "Handpoke", "Microrrealismo",
  "Single Needle (Agulha Única)", "Gravura / Woodcut", "Ilustrativo", "Abstrato", "Glitch", "Neon / UV", "Black and Grey",
  "Cobertura (Cover-up)", "Tattoo Feminina Delicada", "Religioso / Sacro", "Celta", "Nórdico / Viking", "Sombreamento (Shading)",
  "Tattoo Escrita", "Micropigmentação", "Reconstrução de Mamilo / Cicatriz", "Freehand",
];

export const TEXT_FIELDS: { key: string; label: string; def: string; long?: boolean; group: string }[] = [
  { group: "Topo", key: "nav_campaigns", label: "Menu: Campanhas", def: "Campanhas" },
  { group: "Topo", key: "nav_artists", label: "Menu: Artistas", def: "Artistas" },
  { group: "Topo", key: "nav_how", label: "Menu: Como funciona", def: "Como funciona" },
  { group: "Topo", key: "nav_faq", label: "Menu: Dúvidas", def: "Dúvidas" },
  { group: "Topo", key: "nav_artist_btn", label: "Botão Seja um artista", def: "Seja um artista" },
  { group: "Início", key: "hero_badge", label: "Selo acima do título", def: "Campanhas oficiais" },
  { group: "Início", key: "hero_title", label: "Título principal", def: "Sua próxima tattoo pode sair por uma cota." },
  { group: "Início", key: "hero_subtitle", label: "Subtítulo", def: "Campanhas exclusivas com os melhores artistas do Brasil.", long: true },
  { group: "Início", key: "hero_btn1", label: "Botão 1", def: "Ver campanhas" },
  { group: "Início", key: "hero_btn2", label: "Botão 2", def: "Seja um artista" },
  { group: "Campanhas", key: "campaigns_title", label: "Título da seção", def: "Campanhas" },
  { group: "Campanhas", key: "campaigns_empty", label: "Texto sem campanhas", def: "Novas campanhas em breve." },
  { group: "Campanhas", key: "campaigns_price", label: "Texto do preço", def: "Apenas" },
  { group: "Como funciona", key: "how_title", label: "Título da seção", def: "Como funciona" },
  { group: "Como funciona", key: "how1_t", label: "Passo 1 título", def: "Compre seus números" },
  { group: "Como funciona", key: "how1_d", label: "Passo 1 texto", def: "Compre quantos números quiser para os sorteios. Quanto mais números, mais chances de ganhar.", long: true },
  { group: "Como funciona", key: "how2_t", label: "Passo 2 título", def: "Receba seus números da sorte" },
  { group: "Como funciona", key: "how2_d", label: "Passo 2 texto", def: "Após o pagamento, seus números da sorte aparecem na área do cliente, em Minha conta.", long: true },
  { group: "Como funciona", key: "how3_t", label: "Passo 3 título", def: "Acompanhe o sorteio" },
  { group: "Como funciona", key: "how3_d", label: "Passo 3 texto", def: "Acompanhe o Instagram e o site para verificar seu sorteio. Os sorteios acontecem ao vivo no Instagram do TATUAME no final de cada campanha e ficam salvos.", long: true },
  { group: "Como funciona", key: "how4_t", label: "Passo 4 título", def: "Aviso pelo WhatsApp" },
  { group: "Como funciona", key: "how4_d", label: "Passo 4 texto", def: "Se você ganhar, avisamos pelo WhatsApp. Mas acompanhe as lives no Instagram para ver o resultado na hora.", long: true },
  { group: "Como funciona", key: "how5_t", label: "Passo 5 título", def: "Escolha seu tatuador" },
  { group: "Como funciona", key: "how5_d", label: "Passo 5 texto", def: "Se você for o ganhador, é só escolher o tatuador do Brasil todo que gostaria de fazer sua tattoo — nós pagamos ela.", long: true },
  { group: "Sorteios", key: "nav_draws", label: "Menu: Sorteios", def: "Sorteios" },
  { group: "Sorteios", key: "campaign_live_notice", label: "Aviso na página da campanha", def: "Sorteio ao vivo no Instagram do TATUAME ao final da campanha. Todas as lives ficam salvas.", long: true },
  { group: "Sorteios", key: "draws_title", label: "Título da página Sorteios", def: "Sorteios realizados" },
  { group: "Sorteios", key: "draws_text", label: "Texto da página Sorteios", def: "Todos os sorteios do TATUAME acontecem ao vivo no nosso Instagram, no final de cada campanha. Aqui ficam salvos todos os resultados e as gravações das lives.", long: true },
  { group: "Sorteios", key: "draws_empty", label: "Texto sem sorteios", def: "O primeiro sorteio acontece em breve, ao vivo no Instagram do TATUAME." },
  { group: "Sorteios", key: "draws_home_title", label: "Título dos sorteios na página inicial", def: "Últimos sorteios" },
  { group: "Sorteios", key: "draws_home_btn", label: "Botão dos sorteios na página inicial", def: "Ver todos os sorteios" },
  { group: "Sorteios", key: "draws_home_badge", label: "Selo dos sorteios na página inicial", def: "Sorteio ao vivo no Instagram" },
  { group: "Artistas", key: "artists_title", label: "Título da seção", def: "Artistas TATUAME" },
  { group: "Seja artista", key: "cta_title", label: "Título do convite", def: "Seja um artista TATUAME" },
  { group: "Seja artista", key: "cta_text", label: "Texto do convite", def: "Faça parte da nossa rede de tatuadores. Envie seus dados e nossa equipe entra em contato pelo WhatsApp.", long: true },
  { group: "Seja artista", key: "cta_btn", label: "Botão do convite", def: "Quero participar" },
  { group: "Dúvidas", key: "faq_title", label: "Título da seção", def: "Dúvidas frequentes" },
  { group: "Rodapé", key: "footer_text", label: "Texto do rodapé", def: "TATUAME. Todos os direitos reservados." },
  { group: "Rodapé", key: "footer_link", label: "Link do rodapé", def: "Seja um artista TATUAME" },
];

export const IMAGE_FIELDS = [
  { key: "logo", label: "Logo (topo e rodapé)", def: logoDefault.url },
  { key: "hero", label: "Foto principal da página inicial", def: "" },
];

export const COLOR_FIELDS = [
  { key: "primary", label: "Cor de destaque (botões)", def: "#c0262d" },
  { key: "primary-foreground", label: "Texto dos botões", def: "#ffffff" },
  { key: "background", label: "Fundo do site", def: "#fbf9f6" },
  { key: "foreground", label: "Texto principal", def: "#2a2622" },
  { key: "card", label: "Fundo dos cartões", def: "#ffffff" },
  { key: "muted-foreground", label: "Texto secundário", def: "#73706b" },
  { key: "ink", label: "Fundo escuro (rodapé e convite)", def: "#1f1c19" },
  { key: "ink-foreground", label: "Texto sobre fundo escuro", def: "#f6f4f0" },
];

export function useSite() {
  const q = useQuery({ queryKey: ["settings"], queryFn: loadSettings });
  const s: SiteSettings = q.data ?? {};
  const t = (key: string) => {
    const v = (s as any)[key] ?? s.texts?.[key];
    return v || TEXT_FIELDS.find((f) => f.key === key)?.def || "";
  };
  const img = (key: string) => s.images?.[key] || IMAGE_FIELDS.find((f) => f.key === key)?.def || "";
  const styles: string[] = (s as any).styles?.length ? (s as any).styles : TATTOO_STYLES;
  return { s, t, img, styles, loaded: q.isSuccess };
}

export function ThemeColors() {
  const { s } = useSite();
  const c = s.colors ?? {};
  const css = Object.entries(c).filter(([k, v]) => v && /^#[0-9a-f]{3,8}$/i.test(v) && COLOR_FIELDS.some((f) => f.key === k)).map(([k, v]) => `--${k}:${v};`).join("");
  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: `:root{${css}${c.primary ? `--ring:${c.primary}66;` : ""}}` }} />;
}
