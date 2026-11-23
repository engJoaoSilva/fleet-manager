import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getVehicles } from '../storage/vehicleStorage';
import { getMaintenances } from '../storage/maintenanceStorage';
import { getFuelings } from '../storage/fuelStorage';
import { getDrivers } from '../storage/driverStorage';
import { Vehicle, Driver, Maintenance, Fueling } from '../types';
import { Colors, useTheme } from '../theme/ThemeContext';
import BarChart from '../components/BarChart';
import { formatMoney, formatKm } from '../utils/format';
import {
  getMaintenanceAlerts,
  MAINTENANCE_KM_LIMIT,
} from '../utils/alerts';
import { buildReportText, buildReportHtml } from '../utils/report';

type ChartMode = 'month' | 'vehicle';

function lastMonths(n: number) {
  const now = new Date();
  const out: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
        d.getFullYear()
      ).slice(2)}`,
    });
  }
  return out;
}

const monthKeyOf = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
};

export default function DashboardScreen() {
  const { colors, isDark, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [fuelings, setFuelings] = useState<Fueling[]>([]);
  const [mode, setMode] = useState<ChartMode>('month');
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        getVehicles(),
        getDrivers(),
        getMaintenances(),
        getFuelings(),
      ]).then(([v, d, m, f]) => {
        setVehicles(v);
        setDrivers(d);
        setMaintenances(m);
        setFuelings(f);
      });
    }, [])
  );

  const count = (status: Vehicle['status']) =>
    vehicles.filter((v) => v.status === status).length;

  const maintTotal = maintenances.reduce((s, m) => s + m.cost, 0);
  const fuelTotal = fuelings.reduce((s, f) => s + f.totalCost, 0);
  const alerts = getMaintenanceAlerts(vehicles, maintenances);

  // Junta manutenções e abastecimentos numa lista única de gastos
  const expenses = [
    ...maintenances.map((m) => ({
      vehicleId: m.vehicleId,
      date: m.date,
      value: m.cost,
    })),
    ...fuelings.map((f) => ({
      vehicleId: f.vehicleId,
      date: f.date,
      value: f.totalCost,
    })),
  ];

  const chartData =
    mode === 'month'
      ? lastMonths(6).map((m) => ({
          label: m.label,
          value: expenses
            .filter((e) => monthKeyOf(e.date) === m.key)
            .reduce((s, e) => s + e.value, 0),
        }))
      : vehicles
          .map((v) => ({
            label: v.plate,
            value: expenses
              .filter((e) => e.vehicleId === v.id)
              .reduce((s, e) => s + e.value, 0),
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

  const reportData = { vehicles, drivers, maintenances, fuelings };

  async function shareText() {
    try {
      await Share.share({ message: buildReportText(reportData) });
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar o relatório.');
    }
  }

  async function exportPdf() {
    try {
      setExporting(true);
      const { uri } = await Print.printToFileAsync({
        html: buildReportHtml(reportData),
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: 'Relatório da frota',
        });
      } else {
        Alert.alert('Indisponível', 'Compartilhamento não disponível aqui.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity style={styles.themeBtn} onPress={toggle}>
            <Text style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

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

        <View style={styles.row}>
          <View style={[styles.cardSmall, { backgroundColor: '#c62828' }]}>
            <Text style={styles.numberSmall}>{formatMoney(maintTotal)}</Text>
            <Text style={styles.label}>Manutenção</Text>
          </View>
          <View style={[styles.cardSmall, { backgroundColor: '#6a1b9a' }]}>
            <Text style={styles.numberSmall}>{formatMoney(fuelTotal)}</Text>
            <Text style={styles.label}>Combustível</Text>
          </View>
        </View>

        {/* Alertas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Alertas de manutenção</Text>
          {alerts.length === 0 ? (
            <Text style={styles.muted}>
              Nenhum veículo acima de {formatKm(MAINTENANCE_KM_LIMIT)} sem
              manutenção. ✅
            </Text>
          ) : (
            alerts.map((a) => (
              <View key={a.vehicle.id} style={styles.alertRow}>
                <Text style={styles.alertPlate}>{a.vehicle.plate}</Text>
                <Text style={styles.alertText}>
                  {a.vehicle.brand} {a.vehicle.model}: {formatKm(a.kmSince)}{' '}
                  desde a última manutenção
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Gráficos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Gastos totais</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, mode === 'month' && styles.chipActive]}
              onPress={() => setMode('month')}
            >
              <Text
                style={[
                  styles.chipText,
                  mode === 'month' && styles.chipTextActive,
                ]}
              >
                Por mês
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, mode === 'vehicle' && styles.chipActive]}
              onPress={() => setMode('vehicle')}
            >
              <Text
                style={[
                  styles.chipText,
                  mode === 'vehicle' && styles.chipTextActive,
                ]}
              >
                Por veículo
              </Text>
            </TouchableOpacity>
          </View>
          <BarChart data={chartData} color={colors.primary} />
          <Text style={styles.hint}>
            Soma de manutenções e abastecimentos.
          </Text>
        </View>

        {/* Relatório */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Relatório da frota</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.reportBtn, { backgroundColor: colors.primary }]}
              onPress={shareText}
            >
              <Text style={styles.reportText}>Compartilhar texto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reportBtn, { backgroundColor: colors.success }]}
              onPress={exportPdf}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.reportText}>Exportar PDF</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, paddingHorizontal: 16 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 16,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: c.text },
    themeBtn: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    card: {
      padding: 20,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: 'center',
    },
    cardSmall: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    number: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    numberSmall: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    label: { color: '#fff', fontSize: 13, marginTop: 4, textAlign: 'center' },
    section: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.text,
      marginBottom: 12,
    },
    muted: { color: c.textMuted },
    hint: { color: c.textMuted, fontSize: 11, marginTop: 4 },
    alertRow: {
      borderLeftWidth: 4,
      borderLeftColor: c.danger,
      paddingLeft: 10,
      marginBottom: 10,
    },
    alertPlate: { fontWeight: 'bold', color: c.text, fontSize: 15 },
    alertText: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
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
    reportBtn: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    reportText: { color: '#fff', fontWeight: 'bold' },
  });
  