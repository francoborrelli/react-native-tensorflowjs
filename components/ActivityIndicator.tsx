import { StyleSheet, View, ActivityIndicator } from 'react-native';
import React, { FC } from 'react';

interface ActivityIndicatorProps {}

const CustomActivityIndicator: FC<ActivityIndicatorProps> = (props) => (
  <View style={[styles.container]}>
    <ActivityIndicator {...props} color='tomato' />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default CustomActivityIndicator;
