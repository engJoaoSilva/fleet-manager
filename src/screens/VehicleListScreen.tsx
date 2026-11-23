import { useCallback, useMemo, useState } from 'react';
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
import { Vehicle, VehicleStatus, Driver, Maintenance } from '../types';
import { getVehicles, deleteVehicle } from '../storage/vehicleStorage';
import { getDrivers } from '../storage/driverStorage';
import { getMaintenances } from '../storage/maintenanceStorage';
import { RootStackParamList } from '../navigation/types';
import { Colors, useTheme } from '../theme/ThemeContext';
import { STATUS_LABEL, STATUS_COLOR } from '../utils/status';
import { formatKm } from '../utils/format';
import { getMaintenanceAlerts } from '../utils/alerts';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = VehicleStatus | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'in_use', label: 'Em uso' },
  { value: 'maintenance', label: 'Manutenção' },
];

export default function VehicleListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(() => {
    Promise.all([getVehicles(), getDrivers(), getMaintenances()]).then(
      ([v, d, m]) => {
        setVehicles(v);
        setDrivers(d);
        setMaintenances(m);
      }
    );
  }, []);

  useFocusEffect(load);

  const alertMap = useMemo(() => {
    const map: Record<string, number> = {};
    getMaintenanceAlerts(vehicles, maintenances).forEach((a) => {
      map[a.vehicle.id] = a.kmSince;
    });
    return map;
  }, [vehicles, maintenances]);

  const driverName = (id?: string) => drivers.find((d) => d.id === id)?.name;

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
          load();
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
        placeholderTextColor={colors.textMuted}
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
        renderItem={({ item }) => {
          const driver = driverName(item.driverId);
          const kmSince = alertMap[item.id];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('VehicleForm', { vehicleId: item.id })
              }
              onLongPress={() => confirmDelete(item)}
            >
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plate}>{item.plate}</Text>
                  <Text style={styles.model}>
                    {item.brand} {item.model} ({item.year})
                  </Text>
                  <Text style={styles.km}>{formatKm(item.mileage)}</Text>
                  {driver && (
                    <Text style={styles.driver}>
                      👤{' '}
                      {item.status === 'in_use'
                        ? `Em uso por ${driver}`
                        : `Motorista: ${driver}`}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: STATUS_COLOR[item.status] },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>

              {kmSince !== undefined && (
                <Text style={styles.alert}>
                  ⚠️ Revisão pendente: {formatKm(kmSince)} desde a última
                  manutenção
                </Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: colors.warning }]}
                  onPress={() =>
                    navigation.navigate('Maintenance', { vehicleId: item.id })
                  }
                >
                  <Text style={[styles.actionText, { color: colors.warning }]}>
                    🔧 Manutenção
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: colors.primary }]}
                  onPress={() =>
                    navigation.navigate('Fuel', { vehicleId: item.id })
                  }
                >
                  <Text style={[styles.actionText, { color: colors.primary }]}>
                    ⛽ Abastecer
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, paddingHorizontal: 16 },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 16,
      color: c.text,
    },
    search: {
      backgroundColor: c.input,
      color: c.text,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
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
      borderColor: c.primary,
    },
    chipActive: { backgroundColor: c.primary },
    chipText: { color: c.primary, fontSize: 12, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    empty: { textAlign: 'center', marginTop: 40, color: c.textMuted },
    card: {
      backgroundColor: c.card,
      padding: 16,
      borderRadius: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    topRow: { flexDirection: 'row', alignItems: 'flex-start' },
    plate: { fontSize: 18, fontWeight: 'bold', color: c.text },
    model: { fontSize: 14, color: c.textSecondary, marginTop: 2 },
    km: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    driver: { fontSize: 13, color: c.primary, marginTop: 6, fontWeight: '600' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    alert: {
      color: c.danger,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 10,
    },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: {
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
    },
    actionText: { fontSize: 12, fontWeight: '600' },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    fabText: { color: '#fff', fontSize: 28, marginTop: -2 },
  });
  