/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {View, Alert} from 'react-native';
import {Button, Overlay} from '@rneui/themed';
import {load, save} from '../../utils/storage';
import {ParamListBase} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/native-stack';
import {saveSiteVisits} from '../../models/site_visit/site_visit.store';
import {saveSites} from '../../models/site/site.store';
import {saveSassSiteVisits} from '../../models/sass/sass.store';
import { AuthContext } from '../../App';

export interface OverlayMenuProps {
  visible: boolean;
  navigation: NativeStackNavigationProp<ParamListBase>;
  refreshMap: Function;
  syncData: Function;
  downloadRiverClicked?: Function;
  downloadSiteClicked?: Function;
}

export function OverlayMenu(props: OverlayMenuProps) {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [user, setUser] = useState({});
  const {signOut} = React.useContext(AuthContext);

  useEffect(() => {
    (async () => {
      setOverlayVisible(props.visible);
      const userData = await load('user');
      setUser(userData);
    })();
  }, [props.visible]);

  const goToUnsynced = React.useMemo(
    () => () => {
      props.navigation.navigate({
        name: 'UnsyncedList',
        params: {
          onBack: () => props.refreshMap(),
          syncRecord: async () => {
            props.syncData(true);
          },
        },
        merge: true,
      });
    },
    [props],
  );

  const clearData = async () => {
    await saveSiteVisits([]);
    await saveSites([]);
    await saveSassSiteVisits([]);
    setOverlayVisible(false);
    props.refreshMap(true);
    return;
  };

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
            await save('@first_launch', null);
            await save('unsynced', []);
            await save('synced', []);
            await saveSiteVisits([]);
            await saveSassSiteVisits([]);
            await saveSites([]);
            signOut();
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
          title="Clear Data"
          raised
          titleStyle={{color: '#ffffff'}}
          containerStyle={{width: '100%', marginBottom: 20}}
          onPress={() => {
            return clearData();
          }}
        />
        <Button
          title="Log out"
          raised
          titleStyle={{color: '#ffffff'}}
          containerStyle={{width: '100%', marginBottom: 20}}
          onPress={() => {
            logout();
          }}
        />
        <Button
          title="Download River"
          raised
          titleStyle={{color: '#ffffff'}}
          containerStyle={{width: '100%', marginBottom: 20}}
          onPress={() => {
            setOverlayVisible(false);
            if (props.downloadRiverClicked) {
              props.downloadRiverClicked();
            }
          }}
        />
        <Button
          title="Download Sites"
          raised
          titleStyle={{color: '#ffffff'}}
          containerStyle={{width: '100%', marginBottom: 20}}
          onPress={() => {
            setOverlayVisible(false);
            if (props.downloadSiteClicked) {
              props.downloadSiteClicked();
            }
          }}
        />
        <Button
          title="List Unsynced Data"
          raised
          titleStyle={{color: '#ffffff'}}
          containerStyle={{width: '100%'}}
          onPress={() => {
            goToUnsynced();
          }}
        />
      </View>
    </Overlay>
  );
}
