export type Campaign = {
  id: string;
  tattooValue: number;
  pricePerQuota: number;
  totalQuotas: number;
  soldQuotas: number;
  endsAt: string; // ISO
};

export const campaigns: Campaign[] = [
  {
    id: "c500",
    tattooValue: 500,
    pricePerQuota: 5,
    totalQuotas: 300,
    soldQuotas: 218,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: "c1000",
    tattooValue: 1000,
    pricePerQuota: 15.5,
    totalQuotas: 200,
    soldQuotas: 142,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: "c2000",
    tattooValue: 2000,
    pricePerQuota: 20.5,
    totalQuotas: 300,
    soldQuotas: 187,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    id: "c3000",
    tattooValue: 3000,
    pricePerQuota: 30.5,
    totalQuotas: 300,
    soldQuotas: 95,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 144).toISOString(),
  },
];

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });