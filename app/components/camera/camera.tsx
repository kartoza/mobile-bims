/* eslint-disable react-native/no-inline-styles */
import React from 'react';
// import {RNCamera} from 'react-native-camera';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  capture: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    flex: 0,
    margin: 20,
    padding: 15,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
});

const PendingView = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: 'lightgreen',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <Text>Waiting</Text>
  </View>
);

export function Camera(props: any) {
  const takePicture = async function (camera: {
    takePictureAsync: (arg0: {quality: number; base64: boolean}) => any;
  }) {
    const options = {quality: 0.5, base64: true};
    const data = await camera.takePictureAsync(options);
    props.pictureTaken(data);
  };

  return (
    <View style={styles.container}>
      <Text>Camera here</Text>
    </View>
  );
}
