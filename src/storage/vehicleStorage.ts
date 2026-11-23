import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle } from '../types';
import { deleteMaintenancesByVehicle } from './maintenanceStorage';
import { deleteFuelingsByVehicle } from './fuelStorage';

const KEY = '@fleetmanager:vehicles';

export async function getVehicles(): Promise<Vehicle[]> {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  const vehicles = await getVehicles();
  const index = vehicles.findIndex((v) => v.id === vehicle.id);
  if (index >= 0) {
    vehicles[index] = vehicle;
  } else {
    vehicles.push(vehicle);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(vehicles));
}

export async function deleteVehicle(id: string): Promise<void> {
  const vehicles = await getVehicles();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(vehicles.filter((v) => v.id !== id))
  );
  await deleteMaintenancesByVehicle(id);
  await deleteFuelingsByVehicle(id);
}
