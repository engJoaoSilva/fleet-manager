import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fueling } from '../types';

const KEY = '@fleetmanager:fuelings';

export async function getFuelings(): Promise<Fueling[]> {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export async function getFuelingsByVehicle(
  vehicleId: string
): Promise<Fueling[]> {
  const all = await getFuelings();
  return all
    .filter((f) => f.vehicleId === vehicleId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveFueling(f: Fueling): Promise<void> {
  const all = await getFuelings();
  all.push(f);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function deleteFueling(id: string): Promise<void> {
  const all = await getFuelings();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(all.filter((f) => f.id !== id))
  );
}

export async function deleteFuelingsByVehicle(
  vehicleId: string
): Promise<void> {
  const all = await getFuelings();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(all.filter((f) => f.vehicleId !== vehicleId))
  );
}
