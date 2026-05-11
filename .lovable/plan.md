
# Tatua.me — Landing Page (V1)

Scope: a single high-conversion landing page at `/` with mock data. No backend, auth, or dashboards yet — those come in later iterations.

## Design system (src/styles.css)

Set up dark-mode tokens in oklch matching the brief:
- `--background` ≈ #0B0B0B, `--card` ≈ #121212
- `--primary` = tattoo red #E50914, `--primary-foreground` white
- `--foreground` = #F5F5F5, `--muted-foreground` = #A1A1A1
- `--success` = #22C55E
- Gradient token `--gradient-primary` (red → lighter red) for progress bars and CTAs
- Soft shadow + glass blur utility for cards
- Google Fonts: Inter + Poppins (headings)
- Force `.dark` on `<html>` so dark is the only mode

## Sections (single route: src/routes/index.tsx)

Each section as its own component in `src/components/landing/`:

1. **Navbar** — logo "Tatua.me", anchor links (Como funciona, Campanhas, Garantia), CTA "Garantir minha vaga"
2. **Hero** — headline "Sua próxima tatuagem pode custar muito menos.", subheadline, primary CTA "Garantir minha vaga", secondary "Ver campanhas". Background: dark with subtle red glow + tattoo image with high contrast.
3. **Campaign cards grid** — 4 cards from mock data:
   - R$500 / R$5 / 300 quotas
   - R$1000 / R$15,50 / 200 quotas
   - R$2000 / R$20,50 / 300 quotas
   - R$3000 / R$30,50 / 300 quotas
   Each card: tattoo value, price per quota, total quotas, animated gradient progress bar, remaining slots, CTA button, hover elevation.
4. **How it works** — 4 steps with line icons (lucide): Buy credit → Get number → Join campaign → Get upgrade.
5. **Guarantee** — bold statement card: "Você nunca perde. Seu dinheiro vira crédito de tatuagem." with bullet points (12 months validity, up to 70% of any tattoo, redeemable at any partner artist).
6. **Social proof** — 3 testimonial cards with avatar, name, quote + a small grid of tattoo images (black & grey).
7. **Urgency** — countdown timer (next campaign closing) + remaining slots indicator.
8. **Final CTA** — full-width red gradient band with "Entrar agora".
9. **Footer** — minimal: logo, links, copyright.

## SEO / head

- Title: "Tatua.me — Sua próxima tatuagem por muito menos"
- Meta description, og:title, og:description, og:type=website
- Single H1 in Hero, semantic section tags, alt text on images, viewport meta

## Assets

Generate 3–4 images via imagegen (fast tier):
- Hero background (moody black & grey tattoo studio / arm tattoo close-up)
- 2–3 tattoo photos for social proof grid

## Tech notes

- Use existing shadcn `Button`, `Card`, `Progress`, `Badge`
- Countdown: small client-side `useEffect` + `setInterval`
- All copy in Portuguese (BRL pricing implies BR audience)
- No backend calls — mock data lives in a `src/data/campaigns.ts` file so the next iteration can swap it for Lovable Cloud queries

## Out of scope (next iterations)

Auth, client/artist/admin dashboards, Lovable Cloud + Postgres schema, real purchase flow, payments. Kept for follow-ups.
