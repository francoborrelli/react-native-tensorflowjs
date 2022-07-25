import { StyleSheet, View, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useState, FC, useCallback, useEffect, useMemo, useRef } from 'react';

import * as tf from '@tensorflow/tfjs';
import * as cocoSSD from '@tensorflow-models/coco-ssd';

import Canvas, { CanvasRenderingContext2D } from 'react-native-canvas';

import { LAYOUT } from '../../../constants/Layout';
import { checkIsPortrait } from '../../../helpers/Camera';
import TensorCamera from '../../../components/TensorCamera';
import { COMPUTE_RECOGNITION_EVERY_N_FRAMES } from '../../../constants/Tensorflow';

let frame = 0;

const { width, height } = LAYOUT.window;

const DetectionCocoSSD: FC<{}> = (props) => {
  const canvas = useRef<Canvas>();
  const context = useRef<CanvasRenderingContext2D>();

  const [model, setModel] = useState<cocoSSD.ObjectDetection>();

  const [orientation, setOrientation] = useState<ScreenOrientation.Orientation>();

  useEffect(() => {
    async function prepare() {
      setModel(await cocoSSD.load());
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

  const drawRectangle = useCallback(
    (predictions: cocoSSD.DetectedObject[], nextImageTensor: any) => {
      if (!canvas.current || !context.current) return;
      const scaleWidth = width / nextImageTensor.shape[1];
      const scaleHeight = height / nextImageTensor.shape[0];

      const flipHorizontal = Platform.OS === 'ios' ? false : true;

      // clear previous prediction
      context.current.clearRect(0, 0, width, height);

      console.log(predictions);

      // draw rectangle for each prediction
      for (const prediction of predictions) {
        const [x, y, width, height] = prediction.bbox;

        // scale the coordinates based on the ratio calculated
        const boundingBoxX = flipHorizontal
          ? canvas.current.width - x * scaleWidth - width * scaleWidth
          : x * scaleWidth;
        const boundingBoxY = y * scaleHeight;

        context.current.strokeStyle = 'red';
        context.current.fillStyle = 'red';
        context.current.lineWidth = 3;

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

  return (
    <View style={styles.container}>
      <TensorCamera style={styles.camera} isPortrait={isPortrait} onReady={handleCameraStream} />
      <Canvas style={styles.canvas} ref={handleCanvas} />
    </View>
  );
};

const styles = StyleSheet.create({
  camera: {
    width: '100%',
    height: '100%',
  },
  canvas: {
    position: 'absolute',
    zIndex: 10000000000,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
});

export default DetectionCocoSSD;
