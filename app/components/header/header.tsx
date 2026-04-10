/* eslint-disable react-native/no-inline-styles */

import {Header} from '@rneui/themed';
import React from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {styles} from '../../screens/form-screen/styles';
import {fontStyles} from '../../theme/font';

interface CustomHeaderInterface {
  onBackPress: object;
  title: string;
}

export default function CustomHeader(props: CustomHeaderInterface) {
  const insets = useSafeAreaInsets();
  return (
    <Header
      placement="center"
      leftComponent={{
        icon: 'chevron-left',
        type: 'font-awesome-5',
        color: '#fff',
        onPress: props.onBackPress,
        style: {
          justifyContent: 'center',
          alignItems: 'center',
          width: 60,
          height: 60,
        },
      }}
      centerComponent={{
        text: props.title,
        style: [
          {
            color: '#fff',
            fontWeight: 'bold',
          },
          fontStyles.large,
        ],
      }}
      centerContainerStyle={{
        justifyContent: 'center',
      }}
      edges={['left', 'right']}
      containerStyle={[
        styles.HEADER_CONTAINER,
        {
          height: 60 + insets.top,
          paddingTop: insets.top,
        },
      ]}
    />
  );
}
