import React, { useEffect, useState } from 'react';

// Components
import { Camera } from 'expo-camera';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Tensorflow js
import * as tf from '@tensorflow/tfjs';

// Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Pages
import DetectionCocoSSD from './pages/CocoSSD/DetectionCocoSSD';
import DetectionMobilenet from './pages/Mobilenet/DetectionMobilenet';

// Types
import type { FC } from 'react';

// Inicializo Tensorflow
const initialiseTensorflow = async () => {
  await tf.ready();
  tf.getBackend();
};

const Stack = createBottomTabNavigator();

const App: FC<{}> = () => {
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      await initialiseTensorflow();
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ route }) => ({
          unmountOnBlur: true,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'CocoSSD') {
              iconName = focused ? 'images' : 'images-outline';
            } else if (route.name === 'Mobilenet') {
              iconName = focused ? 'ios-information-circle' : 'ios-information-circle-outline';
            }
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}>
        <Stack.Screen name='CocoSSD' component={DetectionCocoSSD} />
        <Stack.Screen name='Mobilenet' component={DetectionMobilenet} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
