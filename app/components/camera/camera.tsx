/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {ViewPropTypes} from 'deprecated-react-native-prop-types';
import {RNCamera} from 'react-native-camera';
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
      <RNCamera
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.on}
        captureAudio={false}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}>
        {/* @ts-ignore */}
        {({camera, status}) => {
          if (status !== 'READY') {
            return <PendingView />;
          }
          return (
            <View
              style={{
                flex: 0,
                flexDirection: 'row',
                justifyContent: 'center',
              }}>
              <TouchableOpacity
                onPress={() => takePicture(camera)}
                style={styles.capture}>
                <Text style={{fontSize: 14}}> Capture Site Image </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      </RNCamera>
    </View>
  );
}
