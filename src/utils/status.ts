import { VehicleStatus } from '../types';

export const STATUS_LABEL: Record<VehicleStatus, string> = {
  available: 'Disponível',
  in_use: 'Em uso',
  maintenance: 'Em manutenção',
};

export const STATUS_COLOR: Record<VehicleStatus, string> = {
  available: '#2e7d32',
  in_use: '#1565c0',
  maintenance: '#ef6c00',
};
