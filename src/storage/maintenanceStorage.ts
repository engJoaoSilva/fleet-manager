import AsyncStorage from '@react-native-async-storage/async-storage';
import { Maintenance } from '../types';

const KEY = '@fleetmanager:maintenances';

export async function getMaintenances(): Promise<Maintenance[]> {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export async function getMaintenancesByVehicle(
  vehicleId: string
): Promise<Maintenance[]> {
  const all = await getMaintenances();
  return all
    .filter((m) => m.vehicleId === vehicleId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveMaintenance(m: Maintenance): Promise<void> {
  const all = await getMaintenances();
  all.push(m);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function deleteMaintenance(id: string): Promise<void> {
  const all = await getMaintenances();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(all.filter((m) => m.id !== id))
  );
}

export async function deleteMaintenancesByVehicle(
  vehicleId: string
): Promise<void> {
  const all = await getMaintenances();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(all.filter((m) => m.vehicleId !== vehicleId))
  );
}