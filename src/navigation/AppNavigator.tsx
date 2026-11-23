import { useMemo } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import DashboardScreen from '../screens/DashboardScreen';
import VehicleListScreen from '../screens/VehicleListScreen';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import FuelScreen from '../screens/FuelScreen';
import DriverScreen from '../screens/DriverScreen';
import { RootStackParamList } from './types';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'stats-chart',
  Veículos: 'car',
  Motoristas: 'people',
};

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={ICONS[route.name] ?? 'ellipse'}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Veículos" component={VehicleListScreen} />
      <Tab.Screen name="Motoristas" component={DriverScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isDark, colors } = useTheme();

  const theme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [isDark, colors]);

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VehicleForm"
          component={VehicleFormScreen}
          options={{ title: 'Veículo' }}
        />
        <Stack.Screen
          name="Maintenance"
          component={MaintenanceScreen}
          options={{ title: 'Manutenções' }}
        />
        <Stack.Screen
          name="Fuel"
          component={FuelScreen}
          options={{ title: 'Abastecimentos' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
