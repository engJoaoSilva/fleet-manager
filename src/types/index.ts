export type VehicleStatus = 'available' | 'in_use' | 'maintenance';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: VehicleStatus;
  mileage: number;
  driverId?: string;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  date: string; // formato ISO
  mileage?: number; // km do veículo no momento da manutenção
}

export interface Driver {
  id: string;
  name: string;
  license: string;
  phone: string;
}

export interface Fueling {
  id: string;
  vehicleId: string;
  liters: number;
  totalCost: number;
  mileage: number; // km no momento do abastecimento
  date: string; // formato ISO
}
