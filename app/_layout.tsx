import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { BleProvider } from '@/context/BleContext';

export default function RootLayout() {
  return (
    <BleProvider>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.cyan,
          headerTitleStyle: { fontWeight: '900', letterSpacing: 3, fontSize: 14 },
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: Colors.cyan,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontSize: 10, letterSpacing: 1, fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'CHASSIS',
            headerTitle: 'RIGLIGHT',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car-sport" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'SETTINGS',
            headerTitle: 'SETTINGS',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </BleProvider>
  );
}
