import AsyncStorage from '@react-native-async-storage/async-storage';
import { Driver } from '../types';
import { getVehicles, saveVehicle } from './vehicleStorage';

const KEY = '@fleetmanager:drivers';

export async function getDrivers(): Promise<Driver[]> {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveDriver(driver: Driver): Promise<void> {
  const drivers = await getDrivers();
  const index = drivers.findIndex((d) => d.id === driver.id);
  if (index >= 0) {
    drivers[index] = driver;
  } else {
    drivers.push(driver);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(drivers));
}

export async function deleteDriver(id: string): Promise<void> {
  const drivers = await getDrivers();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(drivers.filter((d) => d.id !== id))
  );
  // Desvincula o motorista dos veículos
  const vehicles = await getVehicles();
  for (const v of vehicles) {
    if (v.driverId === id) {
      await saveVehicle({ ...v, driverId: undefined });
    }
  }
}
