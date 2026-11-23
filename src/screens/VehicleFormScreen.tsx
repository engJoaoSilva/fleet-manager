import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Vehicle, VehicleStatus, Driver } from '../types';
import { getVehicles, saveVehicle } from '../storage/vehicleStorage';
import { getDrivers } from '../storage/driverStorage';
import { Colors, useTheme } from '../theme/ThemeContext';

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'available', label: 'Disponível' },
  { value: 'in_use', label: 'Em uso' },
  { value: 'maintenance', label: 'Manutenção' },
];

export default function VehicleFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'VehicleForm'>>();
  const vehicleId = route.params?.vehicleId;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('available');
  const [driverId, setDriverId] = useState<string | undefined>(undefined);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    getDrivers().then(setDrivers);
  }, []);

  useEffect(() => {
    if (!vehicleId) return;
    navigation.setOptions({ title: 'Editar veículo' });
    getVehicles().then((list) => {
      const v = list.find((item) => item.id === vehicleId);
      if (v) {
        setPlate(v.plate);
        setBrand(v.brand);
        setModel(v.model);
        setYear(String(v.year));
        setMileage(String(v.mileage));
        setStatus(v.status);
        setDriverId(v.driverId);
      }
    });
  }, [vehicleId]);

  async function handleSave() {
    if (!plate.trim() || !brand.trim() || !model.trim()) {
      Alert.alert('Atenção', 'Preencha placa, marca e modelo.');
      return;
    }
    const yearNum = Number(year);
    const kmNum = Number(mileage);
    if (!yearNum || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Atenção', 'Informe um ano válido.');
      return;
    }
    if (isNaN(kmNum) || kmNum < 0) {
      Alert.alert('Atenção', 'Informe uma quilometragem válida.');
      return;
    }

    const vehicle: Vehicle = {
      id: vehicleId ?? Date.now().toString(),
      plate: plate.trim().toUpperCase(),
      brand: brand.trim(),
      model: model.trim(),
      year: yearNum,
      mileage: kmNum,
      status,
      driverId,
    };

    await saveVehicle(vehicle);
    navigation.goBack();
  }

  const input = (props: React.ComponentProps<typeof TextInput>) => (
    <TextInput
      style={styles.input}
      placeholderTextColor={colors.textMuted}
      {...props}
    />
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Placa</Text>
      {input({
        value: plate,
        onChangeText: setPlate,
        autoCapitalize: 'characters',
        maxLength: 8,
        placeholder: 'ABC1D23',
      })}

      <Text style={styles.label}>Marca</Text>
      {input({ value: brand, onChangeText: setBrand, placeholder: 'Ex: Fiat' })}

      <Text style={styles.label}>Modelo</Text>
      {input({
        value: model,
        onChangeText: setModel,
        placeholder: 'Ex: Strada',
      })}

      <Text style={styles.label}>Ano</Text>
      {input({
        value: year,
        onChangeText: setYear,
        keyboardType: 'numeric',
        maxLength: 4,
        placeholder: '2022',
      })}

      <Text style={styles.label}>Quilometragem</Text>
      {input({
        value: mileage,
        onChangeText: setMileage,
        keyboardType: 'numeric',
        placeholder: '0',
      })}

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.statusBtn,
              status === opt.value && styles.statusBtnActive,
            ]}
            onPress={() => setStatus(opt.value)}
          >
            <Text
              style={[
                styles.statusText,
                status === opt.value && styles.statusTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Motorista</Text>
      {drivers.length === 0 ? (
        <Text style={styles.hint}>
          Nenhum motorista cadastrado. Cadastre na aba Motoristas.
        </Text>
      ) : (
        <View style={styles.wrapRow}>
          <TouchableOpacity
            style={[styles.chip, driverId === undefined && styles.chipActive]}
            onPress={() => setDriverId(undefined)}
          >
            <Text
              style={[
                styles.chipText,
                driverId === undefined && styles.chipTextActive,
              ]}
            >
              Nenhum
            </Text>
          </TouchableOpacity>
          {drivers.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.chip, driverId === d.id && styles.chipActive]}
              onPress={() => setDriverId(d.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  driverId === d.id && styles.chipTextActive,
                ]}
              >
                {d.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Salvar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 4,
      color: c.text,
    },
    hint: { color: c.textMuted, fontSize: 13 },
    input: {
      backgroundColor: c.input,
      color: c.text,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      fontSize: 16,
    },
    statusRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    statusBtn: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.primary,
      alignItems: 'center',
    },
    statusBtnActive: { backgroundColor: c.primary },
    statusText: { color: c.primary, fontSize: 13 },
    statusTextActive: { color: '#fff' },
    wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.primary,
    },
    chipActive: { backgroundColor: c.primary },
    chipText: { color: c.primary, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    saveBtn: {
      backgroundColor: c.success,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  });
  