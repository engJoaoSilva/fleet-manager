export type VehicleStatus = 'available' | 'in_use' | 'maintenance';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: VehicleStatus;
  mileage: number;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  date: string; // formato ISO
}