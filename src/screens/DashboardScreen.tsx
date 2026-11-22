import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVehicles } from '../storage/vehicleStorage';
import { getMaintenances } from '../storage/maintenanceStorage';
import { Vehicle } from '../types';

export default function DashboardScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getVehicles().then(setVehicles);
      getMaintenances().then((list) =>
        setTotalCost(list.reduce((sum, m) => sum + m.cost, 0))
      );
    }, [])
  );

  const count = (status: Vehicle['status']) =>
    vehicles.filter((v) => v.status === status).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.title}>Dashboard</Text>

        <View style={[styles.card, { backgroundColor: '#37474f' }]}>
          <Text style={styles.number}>{vehicles.length}</Text>
          <Text style={styles.label}>Total de veículos</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.cardSmall, { backgroundColor: '#2e7d32' }]}>
            <Text style={styles.number}>{count('available')}</Text>
            <Text style={styles.label}>Disponíveis</Text>
          </View>
          <View style={[styles.cardSmall, { backgroundColor: '#1565c0' }]}>
            <Text style={styles.number}>{count('in_use')}</Text>
            <Text style={styles.label}>Em uso</Text>
          </View>
          <View style={[styles.cardSmall, { backgroundColor: '#ef6c00' }]}>
            <Text style={styles.number}>{count('maintenance')}</Text>
            <Text style={styles.label}>Manutenção</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: '#c62828' }]}>
          <Text style={styles.number}>
            R$ {totalCost.toFixed(2).replace('.', ',')}
          </Text>
          <Text style={styles.label}>Gasto total com manutenção</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 16 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  card: { padding: 20, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  cardSmall: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  number: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  label: { color: '#fff', fontSize: 13, marginTop: 4, textAlign: 'center' },
});
