import * as ScreenOrientation from 'expo-screen-orientation';
import { StyleSheet, View, Platform, Text } from 'react-native';
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// Tensorflow js
import * as tf from '@tensorflow/tfjs';
import * as cocoSSD from '@tensorflow-models/coco-ssd';
import { useIsFocused } from '@react-navigation/native';

// Components
import Canvas from 'react-native-canvas';
import TensorCamera from '../../components/TensorCamera';
import ActivityIndicator from '../../components/ActivityIndicator';

// Utils
import { LAYOUT } from '../../constants/Layout';
import { checkIsPortrait } from '../../helpers/Camera';

// Constants
import { DETECTION_COLORS } from '../../constants/Colors';
import { COMPUTE_RECOGNITION_EVERY_N_FRAMES } from '../../constants/Tensorflow';

// Types
import type { FC } from 'react';
import type { CanvasRenderingContext2D } from 'react-native-canvas';

let frame = 0;

const { width, height } = LAYOUT.window;

const DetectionCocoSSD: FC<{}> = (props) => {
  const canvas = useRef<Canvas>();
  const context = useRef<CanvasRenderingContext2D>();

  const isFocused = useIsFocused();
  const [model, setModel] = useState<cocoSSD.ObjectDetection>();
  const [detections, setDetections] = useState<cocoSSD.DetectedObject[]>([]);
  const [orientation, setOrientation] = useState<ScreenOrientation.Orientation>();

  useEffect(() => {
    if (isFocused && !model) {
      async function prepare() {
        let model = await cocoSSD.load();
        setModel(model);
        // Set initial orientation.
        const curOrientation = await ScreenOrientation.getOrientationAsync();
        setOrientation(curOrientation);

        // Listens to orientation change.
        ScreenOrientation.addOrientationChangeListener((event) => {
          console.log(event.orientationInfo.orientation);
          setOrientation(event.orientationInfo.orientation);
        });
      }
      prepare();
    }
    if (!isFocused && model) {
      model.dispose();
      setModel(undefined);
    }
    return () => {
      if (model) {
        model.dispose();
        setModel(undefined);
      }
      ScreenOrientation.removeOrientationChangeListeners();
    };
  }, [isFocused, model]);

  const isPortrait = useMemo(() => checkIsPortrait(orientation), [orientation]);

  const drawRectangle = useCallback(
    (predictions: cocoSSD.DetectedObject[], nextImageTensor: any) => {
      if (!canvas.current || !context.current) return;
      const scaleWidth = width / nextImageTensor.shape[1];
      const scaleHeight = (height - 60) / nextImageTensor.shape[0];

      const flipHorizontal = Platform.OS === 'ios' ? false : true;

      // clear previous prediction
      context.current.clearRect(0, 0, width, height + 60);

      // draw rectangle for each prediction
      for (const [index, prediction] of predictions.entries()) {
        const [x, y, width, height] = prediction.bbox;

        // scale the coordinates based on the ratio calculated
        const boundingBoxX = flipHorizontal
          ? canvas.current.width - x * scaleWidth - width * scaleWidth
          : x * scaleWidth;
        const boundingBoxY = y * scaleHeight;

        context.current.strokeStyle = DETECTION_COLORS[index % 5];
        context.current.fillStyle = DETECTION_COLORS[index % 5];
        context.current.lineWidth = 1;

        context.current.strokeRect(
          boundingBoxX,
          boundingBoxY,
          width * scaleWidth,
          height * scaleWidth
        );

        context.current.strokeStyle = 'black';
        context.current.fillStyle = 'black';
        context.current.lineWidth = 1;

        context.current.strokeText(prediction.class, boundingBoxX - 5, boundingBoxY - 5);
      }
    },
    [context, canvas]
  );

  const handleCanvas = useCallback(
    async (can: Canvas) => {
      if (can) {
        can.width = width;
        can.height = height;
        const ctx: CanvasRenderingContext2D = can.getContext('2d');
        ctx.strokeStyle = 'red';
        ctx.fillStyle = 'red';
        ctx.lineWidth = 3;

        canvas.current = can;
        context.current = ctx;
      }
    },
    [context, canvas]
  );

  const handleCameraStream = useCallback(
    (images: IterableIterator<tf.Tensor3D>) => {
      const loop = async () => {
        if (model) {
          if (frame % COMPUTE_RECOGNITION_EVERY_N_FRAMES === 0) {
            const nextImageTensor = images.next().value;
            if (nextImageTensor) {
              await model
                .detect(nextImageTensor)
                .then((prediction) => {
                  setDetections(prediction);
                  drawRectangle(prediction, nextImageTensor);
                })
                .catch((e) => console.log(e));
            }
          }
          frame += 1;
          frame = frame % COMPUTE_RECOGNITION_EVERY_N_FRAMES;
        }
        requestAnimationFrame(loop);
      };
      loop();
    },
    [model, drawRectangle]
  );

  if (!model) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <TensorCamera style={styles.camera} isPortrait={isPortrait} onReady={handleCameraStream} />
      <Canvas style={styles.canvas} ref={handleCanvas} />
      <View style={styles.text}>
        {detections.map((detection, index) => (
          <Text key={index}>
            {detection.class}: {(detection.score * 100).toFixed(2)}%
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  camera: {
    height,
    flex: 20,
    width: '100%',
  },
  canvas: {
    width: '100%',
    height: '100%',
    zIndex: 10000000000,
    position: 'absolute',
  },
});

export default DetectionCocoSSD;
