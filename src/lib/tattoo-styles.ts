export const TATTOO_STYLES = [
  "Old School",
  "New School",
  "Neo Traditional",
  "Realismo",
  "Realismo Colorido",
  "Fineline",
  "Micro Realismo",
  "Minimalista",
  "Geométrica",
  "Blackwork",
  "Blackout",
  "Oriental",
  "Sketch",
  "Trash",
  "Tribal",
  "Ornamental",
  "Māori",
  "Preto e Cinza",
] as const;

export type TattooStyle = (typeof TATTOO_STYLES)[number];