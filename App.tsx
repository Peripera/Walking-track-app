// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Importa tus pantallas (ajusta las rutas según donde copies los archivos)
import TrackerScreen from './screens/TrackerScreen';
import RoutesScreen from './screens/MenuScreen';

const Tab = createBottomTabNavigator();

function TabBarIcon({ name, color }: { name: string; color: string }) {
  return (
    <Text style={{ 
      fontSize: 24, 
      opacity: color === '#3B82F6' ? 1 : 0.6 
    }}>
      {name}
    </Text>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600'
          },
          headerStyle: {
            backgroundColor: 'white',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB'
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#111827'
          }
        }}
      >
        <Tab.Screen
          name="Tracker"
          component={TrackerScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="▶️" color={color} />
            ),
            headerShown: false
          }}
        />
        <Tab.Screen
          name="Rutas"
          component={RoutesScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="🗺️" color={color} />
            ),
            headerShown: false
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
