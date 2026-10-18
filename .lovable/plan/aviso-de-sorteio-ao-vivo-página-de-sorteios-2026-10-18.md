# Aviso de sorteio ao vivo + página de sorteios

## O que muda para você
1. **Como funciona (passo 3):** novo texto: "No final de cada campanha, o sorteio acontece ao vivo no Instagram do TATUAME. Todas as lives ficam salvas no perfil para quem quiser conferir."
2. **Dúvidas frequentes:** nova pergunta "Como é feito o sorteio?" com a mesma explicação.
3. **Página de cada campanha:** aviso curto perto do botão de compra: "Sorteio ao vivo no Instagram do TATUAME ao final da campanha. Todas as lives ficam salvas."
4. **Nova página "Sorteios"** (no menu do topo): lista os sorteios já feitos — campanha, data, número sorteado, nome do vencedor (só primeiro nome) e botão "Ver live" que abre a gravação no Instagram.
5. **ADM → Sorteios:** você cadastra, edita e exclui cada sorteio (campanha, data, número sorteado, nome do vencedor, link da live).
6. **ADM → Site:** campo para o link do Instagram do TATUAME; todos os textos novos ficam editáveis lá.

## Detalhes técnicos
- Nova tabela `draws` (campaign_id, drawn_at, winning_number, winner_name, live_url); leitura pública, escrita só admin via has_role.
- Novas rotas `/sorteios` e `/_authenticated/admin/sorteios`, link no Navbar e no menu do ADM.
- Novos TEXT_FIELDS (how3_d atualizado, aviso da campanha, título da página) e `instagram` em site_settings; FAQ salvo em site_settings recebe a nova pergunta.
