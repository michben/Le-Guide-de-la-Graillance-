import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/theme';
import { RootStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import LocationScreen from '../screens/LocationScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import MapListScreen from '../screens/MapListScreen';
import SpotDetailScreen from '../screens/SpotDetailScreen';
import { HeaderProfile } from '../components/HeaderProfile';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoggedIn } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen
              name="Location"
              component={LocationScreen}
              options={{ title: '', headerRight: () => <HeaderProfile /> }}
            />
            <Stack.Screen
              name="Categories"
              component={CategoriesScreen}
              options={{ title: '', headerRight: () => <HeaderProfile /> }}
            />
            <Stack.Screen
              name="MapList"
              component={MapListScreen}
              options={{ title: 'Autour de toi', headerRight: () => <HeaderProfile /> }}
            />
            <Stack.Screen
              name="SpotDetail"
              component={SpotDetailScreen}
              options={{ title: '', headerRight: () => <HeaderProfile /> }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
