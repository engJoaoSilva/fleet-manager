import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Vehicle, VehicleStatus } from '../types';
import { getVehicles, deleteVehicle } from '../storage/vehicleStorage';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = VehicleStatus | 'all';

const STATUS_LABEL: Record<VehicleStatus, string> = {
  available: 'Disponível',
  in_use: 'Em uso',
  maintenance: 'Em manutenção',
};

const STATUS_COLOR: Record<VehicleStatus, string> = {
  available: '#2e7d32',
  in_use: '#1565c0',
  maintenance: '#ef6c00',
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'in_use', label: 'Em uso' },
  { value: 'maintenance', label: 'Manutenção' },
];

export default function VehicleListScreen() {
  const navigation = useNavigation<Nav>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useFocusEffect(
    useCallback(() => {
      getVehicles().then(setVehicles);
    }, [])
  );

  // Normaliza para ignorar maiúsculas, hífen e espaços (ex: "abc-1234" = "ABC1234")
  const normalize = (text: string) =>
    text.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const filtered = vehicles.filter((v) => {
    const matchesStatus = filter === 'all' || v.status === filter;
    const matchesSearch = normalize(v.plate).includes(normalize(search));
    return matchesStatus && matchesSearch;
  });

  function confirmDelete(vehicle: Vehicle) {
    Alert.alert('Excluir veículo', `Deseja excluir ${vehicle.plate}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteVehicle(vehicle.id);
          setVehicles(await getVehicles());
        },
      },
    ]);
  }

  const hasFilters = search.trim() !== '' || filter !== 'all';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Veículos</Text>

      <TextInput
        style={styles.search}
        placeholder="Buscar por placa"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.chipText,
                filter === f.value && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>
            {hasFilters
              ? 'Nenhum veículo encontrado.'
              : 'Nenhum veículo cadastrado.'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('VehicleForm', { vehicleId: item.id })
            }
            onLongPress={() => confirmDelete(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.plate}>{item.plate}</Text>
              <Text style={styles.model}>
                {item.brand} {item.model} ({item.year})
              </Text>
              <Text style={styles.km}>
                {item.mileage.toLocaleString('pt-BR')} km
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: STATUS_COLOR[item.status] },
                ]}
              >
                <Text style={styles.badgeText}>{STATUS_LABEL[item.status]}</Text>
              </View>
              <TouchableOpacity
                style={styles.maintBtn}
                onPress={() =>
                  navigation.navigate('Maintenance', { vehicleId: item.id })
                }
              >
                <Text style={styles.maintBtnText}>🔧 Manutenção</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('VehicleForm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 16 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1565c0',
  },
  chipActive: { backgroundColor: '#1565c0' },
  chipText: { color: '#1565c0', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  empty: { textAlign: 'center', marginTop: 40, color: '#777' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  plate: { fontSize: 18, fontWeight: 'bold' },
  model: { fontSize: 14, color: '#444', marginTop: 2 },
  km: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  maintBtn: {
    borderWidth: 1,
    borderColor: '#ef6c00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  maintBtnText: { color: '#ef6c00', fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, marginTop: -2 },
});
