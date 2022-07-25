import { CameraType } from 'expo-camera';
import React, { useState, FC, useCallback, useEffect, useMemo } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StyleSheet, Text, View, Dimensions } from 'react-native';

import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

import TensorCamera from '../../../components/TensorCamera';
import { COMPUTE_RECOGNITION_EVERY_N_FRAMES } from '../../../constants/Tensorflow';
import { CAM_PREVIEW_HEIGHT, CAM_PREVIEW_WIDTH, checkIsPortrait } from '../../../helpers/Camera';

let frame = 0;

interface DetectionProps {
  net: mobilenet.MobileNet | undefined;
}

const Detection: FC<DetectionProps> = (props) => {
  const { net } = props;
  const [detections, setDetections] = useState<string[]>([]);
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.back);
  const [orientation, setOrientation] = useState<ScreenOrientation.Orientation>();

  useEffect(() => {
    async function prepare() {
      // Set initial orientation.
      const curOrientation = await ScreenOrientation.getOrientationAsync();
      console.log(curOrientation);
      setOrientation(curOrientation);

      // Listens to orientation change.
      ScreenOrientation.addOrientationChangeListener((event) => {
        console.log(event.orientationInfo.orientation);
        setOrientation(event.orientationInfo.orientation);
      });
    }
    prepare();
  }, []);

  const isPortrait = useMemo(() => checkIsPortrait(orientation), [orientation]);

  const handleSwitchCameraType = useCallback(() => {
    if (cameraType === CameraType.front) {
      setCameraType(CameraType.back);
    } else {
      setCameraType(CameraType.front);
    }
  }, [cameraType, setCameraType]);

  const renderCameraTypeSwitcher = useCallback(
    () => (
      <View style={styles.cameraTypeSwitcher} onTouchEnd={handleSwitchCameraType}>
        <Text>Switch to {cameraType === CameraType.front ? 'back' : 'front'} camera</Text>
      </View>
    ),
    [cameraType, handleSwitchCameraType]
  );

  const handleCameraStream = useCallback(
    (images: IterableIterator<tf.Tensor3D>) => {
      const loop = async () => {
        if (net) {
          if (frame % COMPUTE_RECOGNITION_EVERY_N_FRAMES === 0) {
            const nextImageTensor = images.next().value;
            if (nextImageTensor) {
              const objects = await net.classify(nextImageTensor);
              if (objects && objects.length > 0) {
                console.log(objects);
                setDetections(
                  objects.map((object) => `${object.className}: ${object.probability}\n`)
                );
              }
              tf.dispose([nextImageTensor]);
            }
          }
          frame += 1;
          frame = frame % COMPUTE_RECOGNITION_EVERY_N_FRAMES;
        }

        requestAnimationFrame(loop);
      };
      loop();
    },
    [net]
  );

  return (
    <View style={isPortrait ? styles.containerPortrait : styles.containerLandscape}>
      <TensorCamera
        type={cameraType}
        style={styles.camera}
        isPortrait={isPortrait}
        onReady={handleCameraStream}
      />
      {renderCameraTypeSwitcher()}
      <View style={styles.text}>
        {detections.map((detection, index) => (
          <Text key={index}>{detection}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    flex: 1,
  },
  camera: {
    flex: 20,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTypeSwitcher: {
    top: 10,
    right: 10,
    width: 180,
    padding: 8,
    zIndex: 20,
    borderRadius: 2,
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, .7)',
  },
  containerPortrait: {
    marginTop: 35,
    position: 'relative',
    width: CAM_PREVIEW_WIDTH,
    height: CAM_PREVIEW_HEIGHT,
  },
  containerLandscape: {
    position: 'relative',
    width: CAM_PREVIEW_HEIGHT,
    height: CAM_PREVIEW_WIDTH,
    marginLeft: Dimensions.get('window').height / 2 - CAM_PREVIEW_HEIGHT / 2,
  },
});

export default Detection;