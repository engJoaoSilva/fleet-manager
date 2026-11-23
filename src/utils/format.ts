export const formatMoney = (value: number) =>
  `R$ ${value.toFixed(2).replace('.', ',')}`;

export const formatKm = (value: number) =>
  `${value.toLocaleString('pt-BR')} km`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR');
