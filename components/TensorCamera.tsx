import type { FC } from 'react';

import { Camera, CameraType } from 'expo-camera';
import * as ScreenOrientation from 'expo-screen-orientation';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

import {
  getOutputTensorWidth,
  getOutputTensorHeight,
  getTextureRotationAngleInDegrees,
} from '../helpers/Camera';

export const TensorCamera = cameraWithTensors(Camera);

interface TensorCameraComponent {
  type: CameraType;
  isPortrait: boolean;
  orientation: ScreenOrientation.Orientation;
  [key: string]: any;
}

export const TensorCameraComponent: FC<TensorCameraComponent> = (props) => {
  const { isPortrait, orientation, type = CameraType.back, ...otherProps } = props;

  return (
    // @ts-ignore
    <TensorCamera
      type={type}
      resizeDepth={3}
      autorender={true}
      resizeHeight={200}
      resizeWidth={152}
      // resizeWidth={getOutputTensorWidth(isPortrait)}
      // resizeHeight={getOutputTensorHeight(isPortrait)}
      rotation={getTextureRotationAngleInDegrees(type, orientation)}
      {...otherProps}
    />
  );
};

export default TensorCameraComponent;
