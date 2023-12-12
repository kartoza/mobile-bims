/* eslint-disable react-native/no-inline-styles */

import {Header} from '@rneui/themed';
import React from 'react';
import {styles} from '../../screens/form-screen/styles';
import {fontStyles} from '../../theme/font';

interface CustomHeaderInterface {
  onBackPress: object;
  title: string;
}

export default function CustomHeader(props: CustomHeaderInterface) {
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
      containerStyle={styles.HEADER_CONTAINER}
    />
  );
}
