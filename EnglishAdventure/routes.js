import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './src/pages/WelcomeScreen';
import LoginScreen from './src/pages/LoginScreen';
import RegisterScreen from './src/pages/RegisterScreen';
import HomeScreen from './src/pages/HomeScreen';
import PerfilScreen from './src/pages/PerfilScreen';
import PerformanceScreen from './src/pages/PerformanceScreen';
import PraticeScreen from './src/pages/PraticeScreen';
import PraticaExerciciosScreen from './src/pages/PraticaExerciciosScreen'; // ✅ ADICIONE ESTE IMPORT

const Stack = createNativeStackNavigator();

const AppRoutes = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
        />

        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />

        <Stack.Screen 
          name="Cadastro" 
          component={RegisterScreen}
        />

        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
        />

        <Stack.Screen 
          name="Perfil" 
          component={PerfilScreen}
        />

        <Stack.Screen 
          name="Performance" 
          component={PerformanceScreen}
        />

        <Stack.Screen 
          name="Pratice" 
          component={PraticeScreen}
        />

        {/* ✅ ADICIONE ESTA TELA */}
        <Stack.Screen 
          name="PraticaExercicios" 
          component={PraticaExerciciosScreen}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppRoutes;