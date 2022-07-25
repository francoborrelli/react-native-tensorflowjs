import React, { FC, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

import Home from './pages/home';

// Inicializo Tensorflow
const initialiseTensorflow = async () => {
  await tf.ready();
  tf.getBackend();
};

const App: FC<{}> = () => {
  useEffect(() => {
    (async () => {
      await initialiseTensorflow();
    })();
  }, []);

  return <Home />;
};

export default App;
