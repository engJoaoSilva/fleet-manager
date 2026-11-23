import { Fueling } from '../types';

// Consumo médio pelo método do tanque cheio:
// distância percorrida / litros abastecidos (exceto o primeiro registro).
export function averageConsumption(fuelings: Fueling[]): number | null {
  if (fuelings.length < 2) return null;
  const sorted = [...fuelings].sort((a, b) => a.mileage - b.mileage);
  const distance = sorted[sorted.length - 1].mileage - sorted[0].mileage;
  const liters = sorted.slice(1).reduce((sum, f) => sum + f.liters, 0);
  if (distance <= 0 || liters <= 0) return null;
  return distance / liters;
}
