import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatMoney } from '../utils/format';

interface Item {
  label: string;
  value: number;
}

export default function BarChart({
  data,
  color,
}: {
  data: Item[];
  color: string;
}) {
  const { colors } = useTheme();
  const max = Math.max(0, ...data.map((d) => d.value));

  if (data.length === 0 || max === 0) {
    return (
      <Text
        style={{
          color: colors.textMuted,
          textAlign: 'center',
          paddingVertical: 16,
        }}
      >
        Sem dados para exibir.
      </Text>
    );
  }

  return (
    <View>
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <View key={d.label} style={styles.row}>
            <Text
              style={[styles.label, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {d.label}
            </Text>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${pct}%` as `${number}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.value, { color: colors.text }]}>
              {formatMoney(d.value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 64, fontSize: 12 },
  track: { flex: 1, height: 16, borderRadius: 8, overflow: 'hidden' },
  bar: { height: 16, borderRadius: 8 },
  value: { width: 88, fontSize: 11, textAlign: 'right' },
});