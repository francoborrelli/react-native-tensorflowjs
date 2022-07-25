import { FC, useCallback, useMemo, useState } from 'react';

import { Camera, CameraType } from 'expo-camera';
import * as ScreenOrientation from 'expo-screen-orientation';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

import { getTextureRotationAngleInDegrees } from '../helpers/Camera';
import { StyleSheet, Text, View } from 'react-native';

export const TensorCamera = cameraWithTensors(Camera);

interface TensorCameraComponent {
  isPortrait: boolean;
  orientation: ScreenOrientation.Orientation;
  [key: string]: any;
}

export const TensorCameraComponent: FC<TensorCameraComponent> = (props) => {
  const { isPortrait, orientation, ...otherProps } = props;

  const [cameraType, setCameraType] = useState<CameraType>(CameraType.back);

  const handleSwitchCameraType = useCallback(() => {
    if (cameraType === CameraType.front) {
      setCameraType(CameraType.back);
    } else {
      setCameraType(CameraType.front);
    }
  }, [cameraType, setCameraType]);

  const CameraTypeSwitcher = useMemo(
    () => (
      <View style={styles.cameraTypeSwitcher} onTouchEnd={handleSwitchCameraType}>
        <Text>Cambiar a cámara {cameraType === CameraType.front ? 'trasera' : 'frontal'}</Text>
      </View>
    ),
    [cameraType, handleSwitchCameraType]
  );

  return (
    <>
      {/*@ts-ignore*/}
      <TensorCamera
        resizeDepth={3}
        type={cameraType}
        autorender={true}
        resizeWidth={152}
        resizeHeight={200}
        rotation={getTextureRotationAngleInDegrees(cameraType, orientation)}
        {...otherProps}
      />
      {CameraTypeSwitcher}
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default TensorCameraComponent;
