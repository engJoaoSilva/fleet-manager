import { useEffect, useState } from 'react';
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
import { Vehicle, VehicleStatus } from '../types';
import { getVehicles, saveVehicle } from '../storage/vehicleStorage';

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'available', label: 'Disponível' },
  { value: 'in_use', label: 'Em uso' },
  { value: 'maintenance', label: 'Manutenção' },
];

export default function VehicleFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'VehicleForm'>>();
  const vehicleId = route.params?.vehicleId;

  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('available');

  // Se for edição, carrega os dados do veículo
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
    };

    await saveVehicle(vehicle);
    navigation.goBack();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Placa</Text>
      <TextInput
        style={styles.input}
        value={plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
        maxLength={8}
        placeholder="ABC1D23"
      />

      <Text style={styles.label}>Marca</Text>
      <TextInput
        style={styles.input}
        value={brand}
        onChangeText={setBrand}
        placeholder="Ex: Fiat"
      />

      <Text style={styles.label}>Modelo</Text>
      <TextInput
        style={styles.input}
        value={model}
        onChangeText={setModel}
        placeholder="Ex: Strada"
      />

      <Text style={styles.label}>Ano</Text>
      <TextInput
        style={styles.input}
        value={year}
        onChangeText={setYear}
        keyboardType="numeric"
        maxLength={4}
        placeholder="2022"
      />

      <Text style={styles.label}>Quilometragem</Text>
      <TextInput
        style={styles.input}
        value={mileage}
        onChangeText={setMileage}
        keyboardType="numeric"
        placeholder="0"
      />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.statusBtn, status === opt.value && styles.statusBtnActive]}
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

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Salvar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
  },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statusBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1565c0',
    alignItems: 'center',
  },
  statusBtnActive: { backgroundColor: '#1565c0' },
  statusText: { color: '#1565c0', fontSize: 13 },
  statusTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
