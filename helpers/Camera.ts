import { Dimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

import { IS_ANDROID, IS_IOS } from './Device';
import { CameraType } from 'expo-camera';

export const CAM_PREVIEW_WIDTH = Dimensions.get('window').width;
export const CAM_PREVIEW_HEIGHT = CAM_PREVIEW_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4);

export const checkIsPortrait = (orientation: ScreenOrientation.Orientation | undefined) => {
  return (
    orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
    orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
  );
};

// The size of the resized output from TensorCamera.
// For movenet, the size here doesn't matter too much because the model will
// preprocess the input (crop, resize, etc). For best result, use the size that
// doesn't distort the image.
const OUTPUT_TENSOR_WIDTH = 180;
const OUTPUT_TENSOR_HEIGHT = OUTPUT_TENSOR_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4);

export const getOutputTensorWidth = (portrait: boolean) => {
  // On iOS landscape mode, switch width and height of the output tensor to
  // get better result. Without this, the image stored in the output tensor
  // would be stretched too much.
  //
  // Same for getOutputTensorHeight below.
  return portrait || IS_ANDROID ? OUTPUT_TENSOR_WIDTH : OUTPUT_TENSOR_HEIGHT;
};

export const getOutputTensorHeight = (portrait: boolean) => {
  return portrait || IS_ANDROID ? OUTPUT_TENSOR_HEIGHT : OUTPUT_TENSOR_WIDTH;
};

export const getTextureRotationAngleInDegrees = (
  cameraType: string,
  orientation: ScreenOrientation.Orientation
) => {
  // On Android, the camera texture will rotate behind the scene as the phone
  // changes orientation, so we don't need to rotate it in TensorCamera.
  if (IS_ANDROID) {
    return 0;
  }

  // For iOS, the camera texture won't rotate automatically. Calculate the
  // rotation angles here which will be passed to TensorCamera to rotate it
  // internally.
  switch (orientation) {
    // Not supported on iOS as of 11/2021, but add it here just in case.
    case ScreenOrientation.Orientation.PORTRAIT_DOWN:
      return 180;
    case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
      return cameraType === CameraType.front ? 270 : 90;
    case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
      return cameraType === CameraType.front ? 90 : 270;
    default:
      return 0;
  }
};
