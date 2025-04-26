import React from 'react';
import RNSlider from '@react-native-community/slider';
import { View, StyleSheet } from 'react-native';

const Slider = ({ 
  value, 
  onValueChange, 
  minimumValue = 0, 
  maximumValue = 1,
  step = 0.1,
  minimumTrackTintColor = '#3f51b5',
  maximumTrackTintColor = '#b0b0b0',
  thumbTintColor = '#3f51b5',
  style,
  ...rest
}) => {
  return (
    <View style={[styles.container, style]}>
      <RNSlider
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        minimumTrackTintColor={minimumTrackTintColor}
        maximumTrackTintColor={maximumTrackTintColor}
        thumbTintColor={thumbTintColor}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
});

export default Slider;