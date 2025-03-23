import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      <RootLayoutNav />
    </>
  );
}

function RootLayoutNav() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0a7ea4',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory/index"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <Ionicons name="cube" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales/index"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color }) => <Ionicons name="cart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}