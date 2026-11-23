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
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Fueling, Vehicle } from '../types';
import {
  getFuelingsByVehicle,
  saveFueling,
  deleteFueling,
} from '../storage/fuelStorage';
import { getVehicles, saveVehicle } from '../storage/vehicleStorage';
import { Colors, useTheme } from '../theme/ThemeContext';
import { averageConsumption } from '../utils/fuel';
import { formatMoney, formatKm, formatDate } from '../utils/format';

export default function FuelScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Fuel'>>();
  const { vehicleId } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [items, setItems] = useState<Fueling[]>([]);
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [km, setKm] = useState('');

  const load = useCallback(() => {
    Promise.all([getFuelingsByVehicle(vehicleId), getVehicles()]).then(
      ([list, vehicles]) => {
        setItems(list);
        const v = vehicles.find((x) => x.id === vehicleId) ?? null;
        setVehicle(v);
        // Preenche a km com a atual do veículo (só se o campo estiver vazio)
        setKm((prev) => (prev === '' && v ? String(v.mileage) : prev));
      }
    );
  }, [vehicleId]);

  useFocusEffect(load);

  async function handleAdd() {
    const litersNum = Number(liters.replace(',', '.'));
    const costNum = Number(cost.replace(',', '.'));
    const kmNum = Number(km.replace(',', '.'));

    if (!litersNum || litersNum <= 0) {
      Alert.alert('Atenção', 'Informe os litros abastecidos.');
      return;
    }
    if (!costNum || costNum <= 0) {
      Alert.alert('Atenção', 'Informe o valor total pago.');
      return;
    }
    if (isNaN(kmNum) || kmNum <= 0) {
      Alert.alert('Atenção', 'Informe a quilometragem atual.');
      return;
    }
    if (vehicle && kmNum < vehicle.mileage) {
      Alert.alert(
        'Atenção',
        `A quilometragem não pode ser menor que a atual do veículo (${formatKm(
          vehicle.mileage
        )}).`
      );
      return;
    }

    await saveFueling({
      id: Date.now().toString(),
      vehicleId,
      liters: litersNum,
      totalCost: costNum,
      mileage: kmNum,
      date: new Date().toISOString(),
    });

    // Atualiza a quilometragem do veículo
    if (vehicle) await saveVehicle({ ...vehicle, mileage: kmNum });

    setLiters('');
    setCost('');
    setKm(String(kmNum));
    load();
  }

  function confirmDelete(f: Fueling) {
    Alert.alert('Excluir abastecimento', 'Deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteFueling(f.id);
          load();
        },
      },
    ]);
  }

  const total = items.reduce((s, f) => s + f.totalCost, 0);
  const avg = averageConsumption(items);

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Litros"
            placeholderTextColor={colors.textMuted}
            value={liters}
            onChangeText={setLiters}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Valor (R$)"
            placeholderTextColor={colors.textMuted}
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Quilometragem atual"
          placeholderTextColor={colors.textMuted}
          value={km}
          onChangeText={setKm}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addText}>Registrar abastecimento</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {avg === null ? '—' : `${avg.toFixed(1).replace('.', ',')} km/l`}
          </Text>
          <Text style={styles.summaryLabel}>Consumo médio</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatMoney(total)}</Text>
          <Text style={styles.summaryLabel}>Total gasto</Text>
        </View>
      </View>
      {avg === null && (
        <Text style={styles.hint}>
          O consumo médio aparece a partir de 2 abastecimentos com km
          diferentes.
        </Text>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum abastecimento registrado.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onLongPress={() => confirmDelete(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.desc}>
                {item.liters.toFixed(1).replace('.', ',')} L ·{' '}
                {formatMoney(item.totalCost / item.liters)}/L
              </Text>
              <Text style={styles.date}>
                {formatDate(item.date)} · {formatKm(item.mileage)}
              </Text>
            </View>
            <Text style={styles.cost}>{formatMoney(item.totalCost)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: 16 },
    form: { marginBottom: 8 },
    inputRow: { flexDirection: 'row', gap: 8 },
    input: {
      backgroundColor: c.input,
      color: c.text,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      fontSize: 16,
      marginBottom: 8,
    },
    addBtn: {
      backgroundColor: c.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    addText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    summary: { flexDirection: 'row', gap: 10, marginVertical: 12 },
    summaryItem: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: c.text },
    summaryLabel: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    hint: { color: c.textMuted, fontSize: 12, marginBottom: 8 },
    empty: { textAlign: 'center', marginTop: 24, color: c.textMuted },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      padding: 14,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    desc: { fontSize: 16, fontWeight: '600', color: c.text },
    date: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    cost: { fontSize: 16, fontWeight: 'bold', color: c.danger },
  });
  