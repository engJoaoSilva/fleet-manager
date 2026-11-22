import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import DashboardScreen from '../screens/DashboardScreen';
import VehicleListScreen from '../screens/VehicleListScreen';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import { RootStackParamList } from './types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#1565c0',
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={route.name === 'Dashboard' ? 'stats-chart' : 'car'}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Veículos" component={VehicleListScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}