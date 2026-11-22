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
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Maintenance } from '../types';
import {
  getMaintenancesByVehicle,
  saveMaintenance,
  deleteMaintenance,
} from '../storage/maintenanceStorage';

type Order = 'desc' | 'asc';

export default function MaintenanceScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Maintenance'>>();
  const { vehicleId } = route.params;

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
    await saveMaintenance({
      id: Date.now().toString(),
      vehicleId,
      description: description.trim(),
      cost: costNum,
      date: new Date().toISOString(),
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

  // Ordena conforme a opção escolhida
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
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Valor (R$)"
          value={cost}
          onChangeText={setCost}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addText}>Registrar manutenção</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.total}>
          Total gasto: R$ {total.toFixed(2).replace('.', ',')}
        </Text>
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
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <Text style={styles.cost}>
              R$ {item.cost.toFixed(2).replace('.', ',')}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  form: { marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: '#ef6c00',
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
  total: { fontSize: 16, fontWeight: 'bold' },
  orderBtn: {
    borderWidth: 1,
    borderColor: '#1565c0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderText: { color: '#1565c0', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 24, color: '#777' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  desc: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
  cost: { fontSize: 16, fontWeight: 'bold', color: '#c62828' },
});
