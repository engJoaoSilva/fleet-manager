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
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Driver, Vehicle } from '../types';
import {
  getDrivers,
  saveDriver,
  deleteDriver,
} from '../storage/driverStorage';
import { getVehicles } from '../storage/vehicleStorage';
import { Colors, useTheme } from '../theme/ThemeContext';

export default function DriverScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [name, setName] = useState('');
  const [license, setLicense] = useState('');
  const [phone, setPhone] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([getDrivers(), getVehicles()]).then(([d, v]) => {
      setDrivers(d);
      setVehicles(v);
    });
  }, []);

  useFocusEffect(load);

  function resetForm() {
    setName('');
    setLicense('');
    setPhone('');
    setEditingId(null);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do motorista.');
      return;
    }
    await saveDriver({
      id: editingId ?? Date.now().toString(),
      name: name.trim(),
      license: license.trim(),
      phone: phone.trim(),
    });
    resetForm();
    load();
  }

  function startEdit(d: Driver) {
    setEditingId(d.id);
    setName(d.name);
    setLicense(d.license);
    setPhone(d.phone);
  }

  function confirmDelete(d: Driver) {
    Alert.alert('Excluir motorista', `Deseja excluir ${d.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteDriver(d.id);
          if (editingId === d.id) resetForm();
          load();
        },
      },
    ]);
  }

  const form = (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="CNH"
        placeholderTextColor={colors.textMuted}
        value={license}
        onChangeText={setLicense}
        keyboardType="numeric"
        maxLength={11}
      />
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        placeholderTextColor={colors.textMuted}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>
          {editingId ? 'Salvar alterações' : 'Cadastrar motorista'}
        </Text>
      </TouchableOpacity>
      {editingId && (
        <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
          <Text style={styles.cancelText}>Cancelar edição</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Motoristas</Text>
      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={form}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum motorista cadastrado.</Text>
        }
        renderItem={({ item }) => {
          const linked = vehicles.filter((v) => v.driverId === item.id);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => startEdit(item)}
              onLongPress={() => confirmDelete(item)}
            >
              <Text style={styles.name}>{item.name}</Text>
              {item.license !== '' && (
                <Text style={styles.info}>CNH: {item.license}</Text>
              )}
              {item.phone !== '' && (
                <Text style={styles.info}>Tel: {item.phone}</Text>
              )}
              <Text style={styles.vehicle}>
                {linked.length > 0
                  ? `🚗 ${linked.map((v) => v.plate).join(', ')}`
                  : 'Sem veículo vinculado'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      <Text style={styles.hint}>
        Toque para editar · segure para excluir
      </Text>
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
    form: { marginBottom: 12 },
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
    saveBtn: {
      backgroundColor: c.success,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { padding: 12, alignItems: 'center' },
    cancelText: { color: c.danger, fontWeight: '600' },
    empty: { textAlign: 'center', marginTop: 24, color: c.textMuted },
    card: {
      backgroundColor: c.card,
      padding: 14,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    name: { fontSize: 16, fontWeight: 'bold', color: c.text },
    info: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    vehicle: { fontSize: 13, color: c.primary, marginTop: 6, fontWeight: '600' },
    hint: { textAlign: 'center', color: c.textMuted, fontSize: 11, padding: 6 },
  });
  