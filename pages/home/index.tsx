import { Camera } from 'expo-camera';
import { Text, View } from 'react-native';
import React, { useState, useEffect, FC } from 'react';

import * as mobilenet from '@tensorflow-models/mobilenet';

import Detection from './components/Detection';

interface HomeProps {}

const Home: FC<HomeProps> = () => {
  const [net, setNet] = useState<mobilenet.MobileNet>();
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      setNet(await mobilenet.load({ version: 1, alpha: 0.25 }));
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  if (!net) {
    return <Text>Model not loaded</Text>;
  }

  return <Detection net={net} />;
};

export default Home;
