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
import { Maintenance } from '../types';
import {
  getMaintenancesByVehicle,
  saveMaintenance,
  deleteMaintenance,
} from '../storage/maintenanceStorage';
import { getVehicles } from '../storage/vehicleStorage';
import { Colors, useTheme } from '../theme/ThemeContext';
import { formatMoney, formatKm, formatDate } from '../utils/format';

type Order = 'desc' | 'asc';

export default function MaintenanceScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Maintenance'>>();
  const { vehicleId } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [items, setItems] = useState<Maintenance[]>([]);
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [order, setOrder] = useState<Order>('desc');

  const load = useCallback(() => {
    getMaintenancesByVehicle(vehicleId).then(setItems);
  }, [vehicleId]);

  useFocusEffect(load);

  async function handleAdd() {
    const costNum = Number(cost.replace(',', '.'));
    if (!description.trim()) {
      Alert.alert('Atenção', 'Informe a descrição da manutenção.');
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      Alert.alert('Atenção', 'Informe um valor válido.');
      return;
    }

    // Guarda a km atual do veículo junto com a manutenção (usada nos alertas)
    const vehicles = await getVehicles();
    const vehicle = vehicles.find((v) => v.id === vehicleId);

    await saveMaintenance({
      id: Date.now().toString(),
      vehicleId,
      description: description.trim(),
      cost: costNum,
      date: new Date().toISOString(),
      mileage: vehicle?.mileage,
    });
    setDescription('');
    setCost('');
    load();
  }

  function confirmDelete(m: Maintenance) {
    Alert.alert('Excluir manutenção', 'Deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteMaintenance(m.id);
          load();
        },
      },
    ]);
  }

  const total = items.reduce((sum, m) => sum + m.cost, 0);

  const sorted = [...items].sort((a, b) =>
    order === 'desc'
      ? b.date.localeCompare(a.date)
      : a.date.localeCompare(b.date)
  );

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Descrição (ex: Troca de óleo)"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Valor (R$)"
          placeholderTextColor={colors.textMuted}
          value={cost}
          onChangeText={setCost}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addText}>Registrar manutenção</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.total}>Total gasto: {formatMoney(total)}</Text>
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
        >
          <Text style={styles.orderText}>
            {order === 'desc' ? '↓ Mais recentes' : '↑ Mais antigas'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma manutenção registrada.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onLongPress={() => confirmDelete(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.date}>
                {formatDate(item.date)}
                {item.mileage !== undefined
                  ? ` · ${formatKm(item.mileage)}`
                  : ''}
              </Text>
            </View>
            <Text style={styles.cost}>{formatMoney(item.cost)}</Text>
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
      backgroundColor: c.warning,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    addText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 12,
    },
    total: { fontSize: 16, fontWeight: 'bold', color: c.text },
    orderBtn: {
      borderWidth: 1,
      borderColor: c.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    orderText: { color: c.primary, fontSize: 12, fontWeight: '600' },
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

  