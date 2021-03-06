/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {View, Alert} from 'react-native';
import {Button, Overlay} from '@rneui/themed';
import {load, save} from '../../utils/storage';
import {ParamListBase} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/native-stack';
import {saveSiteVisits} from '../../models/site_visit/site_visit.store';
import {saveSites} from '../../models/site/site.store';

export interface OverlayMenuProps {
  visible: boolean;
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export function OverlayMenu(props: OverlayMenuProps) {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [user, setUser] = useState({});

  useEffect(() => {
    (async () => {
      setOverlayVisible(props.visible);
      const userData = await load('user');
      setUser(userData);
    })();
  }, [props.visible]);

  const goToLoginScreen = React.useMemo(
    () => () => props.navigation.navigate('login'),
    [props.navigation],
  );

  const logout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          onPress: () => setOverlayVisible(false),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            await save('token', '');
            await save('user', '');
            await saveSiteVisits([]);
            await saveSites([]);
            goToLoginScreen();
          },
        },
      ],
      {cancelable: false},
    );
  };

  return (
    <Overlay
      isVisible={overlayVisible}
      onBackdropPress={() => setOverlayVisible(false)}>
      <View style={{width: 300, padding: 20}}>
        <Button
          title="Log out"
          raised
          titleStyle={{color: '#ffffff'}}
          containerStyle={{width: '100%'}}
          onPress={() => {
            logout();
          }}
        />
      </View>
    </Overlay>
  );
}
