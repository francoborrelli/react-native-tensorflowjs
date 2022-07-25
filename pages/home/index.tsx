import { Camera } from 'expo-camera';
import { Text, View } from 'react-native';
import React, { useState, useEffect, FC } from 'react';

import Detection from './components/DetectionCocoSSD';

interface HomeProps {}

const Home: FC<HomeProps> = () => {
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return <Detection />;
};

export default Home;
