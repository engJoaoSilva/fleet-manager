export type RootStackParamList = {
  Tabs: undefined;
  VehicleForm: { vehicleId?: string } | undefined;
  Maintenance: { vehicleId: string };
  Fuel: { vehicleId: string };
};
