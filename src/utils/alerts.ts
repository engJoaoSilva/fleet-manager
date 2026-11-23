import { Vehicle, Maintenance } from '../types';

// Limite de km rodados sem manutenção para gerar alerta
export const MAINTENANCE_KM_LIMIT = 10000;

export interface MaintenanceAlert {
  vehicle: Vehicle;
  kmSince: number;
}

export function getMaintenanceAlerts(
  vehicles: Vehicle[],
  maintenances: Maintenance[]
): MaintenanceAlert[] {
  return vehicles
    .map((vehicle) => {
      const lastKm = maintenances
        .filter((m) => m.vehicleId === vehicle.id && m.mileage !== undefined)
        .reduce((max, m) => Math.max(max, m.mileage as number), 0);
      return { vehicle, kmSince: vehicle.mileage - lastKm };
    })
    .filter((a) => a.kmSince >= MAINTENANCE_KM_LIMIT)
    .sort((a, b) => b.kmSince - a.kmSince);
}
