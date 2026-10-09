import { z } from "zod";
import { TATTOO_STYLES } from "@/lib/tattoo-styles";

export const BRAZIL_STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;
export const artistQuestionnaireSchema = z.object({
  full_name: z.string().trim().min(3, "Preencha o nome completo.").max(120),
  email: z.string().trim().email("Preencha um email válido.").max(255).transform(value => value.toLowerCase()),
  whatsapp: z.string().trim().regex(/^(\d{10,11}|55\d{10,11})$/, "Preencha o WhatsApp com DDD."),
  instagram: z.string().trim().transform(value => value.replace(/^@/, "")).pipe(z.string().regex(/^[A-Za-z0-9_.]{1,30}$/, "Preencha um usuário válido do Instagram.")),
  address: z.string().trim().min(8, "Preencha o endereço completo.").max(300),
  postal_code: z.string().regex(/^\d{8}$/, "O CEP deve ter 8 dígitos."),
  city: z.string().trim().min(2, "Preencha a cidade.").max(80),
  state: z.enum(BRAZIL_STATES, { errorMap: () => ({ message: "Selecione o estado." }) }),
  styles: z.array(z.enum(TATTOO_STYLES)).min(1, "Selecione pelo menos um estilo de tattoo.").max(TATTOO_STYLES.length).transform(values => [...new Set(values)]),
}).strict();