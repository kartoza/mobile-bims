/* eslint-disable react-native/no-inline-styles */
import RNFS from 'react-native-fs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import React, {createRef, useCallback, useEffect, useState} from 'react';
import {getSiteByField, saveSiteByField} from '../../models/site/site.store';
import {Alert, ScrollView, View} from 'react-native';
import {Button, Header} from '@rneui/base';
import {styles} from './styles';
import {Formik, isNaN} from 'formik';
import MapView, {LocalTile, Marker, WMSTile} from 'react-native-maps';
import {FormInput} from '../../components/form-input/form-input';
import {LogBox} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { riverLayer, wetlandLayer } from "../../utils/offline-map";
import {load} from '../../utils/storage';
import {Api} from '../../services/api/api';
import {ApiResponse} from 'apisauce';
import {Dialog} from '@rneui/themed';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

const mapViewRef = createRef();

export const SiteFormScreen: React.FunctionComponent<
  FormScreenProps
> = props => {
  // @ts-ignore
  const {route} = props;
  const [siteData, setSiteData] = useState({} as any);
  const [editMode, setEditMode] = useState(route.params.editMode);
  const [updatedSiteData, setUpdatedSiteData] = useState({} as any);
  const [isConnected, setIsConnected] = useState<boolean | null>(false);
  const [username, setUsername] = useState<string>('');
  const [fetchingRiverName, setFetchingRiverName] = useState<boolean>(false);

  const loadSiteData = useCallback(async () => {
    const _siteData = await getSiteByField('id', route.params.siteId);
    if (!_siteData) {
      props.navigation.pop();
    }
    setUpdatedSiteData(_siteData);
    setSiteData(_siteData);
    setUsername(_siteData.id > 0 ? _siteData.owner : await load('user'));
    const unsubscribe = NetInfo.addEventListener(netInfoState => {
      setIsConnected(netInfoState.isConnected);
    });
    return function cleanup() {
      unsubscribe();
    };
  }, [props.navigation, route.params.siteId]);

  const goToMapScreen = React.useMemo(
    () =>
      (siteId: Number | null = null) => {
        props.navigation.pop();
        if (typeof route.params.onBackToMap !== 'undefined') {
          route.params.onBackToMap(siteId);
        }
      },
    [props.navigation, route.params],
  );

  useEffect(() => {
    let setupSite = async () => {
      await loadSiteData();
    };
    setupSite();
  }, [loadSiteData]);

  const formOnChange = async (value: any, key: string) => {
    if (isNaN(value)) {
      value = '';
    }
    updatedSiteData[key] = value;
    setUpdatedSiteData({...updatedSiteData, [key]: value});
  };

  const fetchRiverName = async (lat: Number, lon: Number) => {
    const url = `/mobile/river/?lon=${lon}&lat=${lat}`;
    const api = new Api();
    await api.setup();
    const response: ApiResponse<any> = await api.apisauce.get(url);
    if (response.data) {
      return response.data.river_name;
    } else {
      return '';
    }
  };

  const fetchWetlandData = async (lat: Number, lon: Number) => {
    const url = `/mobile/wetland/?lon=${lon}&lat=${lat}`;
    const api = new Api();
    await api.setup();
    const response: ApiResponse<any> = await api.apisauce.get(url);
    if (response.data) {
      return response.data;
    } else {
      Alert.alert('', 'Please add User Wetland Name.', [
        {
          text: 'OK',
        },
      ]);
      return {};
    }
  };

  const submitForm = async () => {
    if (!updatedSiteData.latitude || !updatedSiteData.longitude) {
      Alert.alert('Error', 'You must have correct coordinates.', [
        {
          text: 'OK',
        },
      ]);
      return;
    }
    updatedSiteData.newData = false;
    updatedSiteData.synced = false;
    updatedSiteData.owner = await load('user');
    setUpdatedSiteData(updatedSiteData);
    await saveSiteByField('id', updatedSiteData.id, updatedSiteData);
    goToMapScreen(updatedSiteData.id);
  };

  return (
    <View style={{height: '100%'}}>
      <Header
        placement="center"
        leftComponent={{
          icon: 'chevron-left',
          type: 'font-awesome',
          color: '#fff',
          onPress: () => goToMapScreen(),
        }}
        centerComponent={{
          text: route.params.title
            ? route.params.title
            : `ADD ${siteData.ecosystemType?.toUpperCase()} SITE`,
          style: {fontSize: 18, color: '#fff', fontWeight: 'bold'},
        }}
        containerStyle={styles.HEADER_CONTAINER}
      />
      <ScrollView style={styles.CONTAINER}>
        <Dialog
          isVisible={fetchingRiverName}
          overlayStyle={{
            backgroundColor: '#FFFFFF00',
            shadowColor: '#FFFFFF00',
          }}>
          <Dialog.Loading />
        </Dialog>
        <Formik
          initialValues={{
            original_id: '-',
          }}
          onSubmit={values => console.log(values)}>
          {({handleChange, handleBlur, handleSubmit, setFieldValue}) => (
            <View style={{marginBottom: 50}}>
              <View style={{height: 200, marginTop: 20}}>
                {siteData && siteData.longitude && siteData.latitude ? (
                  <MapView
                    mapType={'satellite'}
                    // @ts-ignore
                    ref={mapViewRef}
                    initialRegion={{
                      latitude: parseFloat(siteData.latitude),
                      longitude: parseFloat(siteData.longitude),
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }}
                    style={{
                      height: '100%',
                      marginVertical: 0,
                    }}
                    showsUserLocation={true}
                    moveOnMarkerPress={true}
                    onPress={e => {
                      if (!editMode) {
                        return false;
                      }
                      const coordinate = e.nativeEvent.coordinate;
                      // setUpdated(true);
                      setUpdatedSiteData({
                        ...updatedSiteData,
                        ...{
                          latitude: coordinate.latitude,
                          longitude: coordinate.longitude,
                        },
                      });
                    }}>
                    {siteData.ecosystemType !== 'wetland' ? (
                      !isConnected ? (
                        <LocalTile
                          pathTemplate={`${RNFS.DocumentDirectoryPath}/rivers/{z}/{x}/{y}.png`}
                          tileSize={256}
                        />
                      ) : (
                        <WMSTile
                          urlTemplate={riverLayer}
                          zIndex={99}
                          tileSize={256}
                        />
                      )
                    ) : (
                      <WMSTile
                        urlTemplate={wetlandLayer}
                        zIndex={99}
                        tileSize={256}
                      />
                    )}
                    {updatedSiteData.latitude && updatedSiteData.longitude ? (
                      <Marker
                        pinColor={'gold'}
                        key={updatedSiteData.id}
                        title={'Site'}
                        coordinate={{
                          latitude: parseFloat(updatedSiteData.latitude),
                          longitude: parseFloat(updatedSiteData.longitude),
                        }}
                      />
                    ) : null}
                  </MapView>
                ) : null}
              </View>
              <FormInput
                editable={editMode}
                checkValue={(val: number) => {
                  if (val < -90 || val > 90) {
                    return 'Please enter value comprised between -90 and 90';
                  }
                  return '';
                }}
                key="latitude"
                value={updatedSiteData ? updatedSiteData.latitude : ''}
                numeric
                required
                title="Latitude"
                onChange={(val: string) =>
                  formOnChange(parseFloat(val), 'latitude')
                }
              />
              <FormInput
                editable={editMode}
                checkValue={(val: number) => {
                  if (val < -180 || val > 180) {
                    return 'Please enter value comprised between -90 and 90';
                  }
                  return '';
                }}
                key="longitude"
                value={updatedSiteData ? updatedSiteData.longitude : ''}
                numeric
                required
                title="Longitude"
                onChange={(val: string) =>
                  formOnChange(parseFloat(val), 'longitude')
                }
              />
              {siteData.ecosystemType === 'wetland' ? (
                <FormInput
                  key="wetland_name"
                  editable={false}
                  title={'Wetland'}
                  value={
                    updatedSiteData.wetlandName
                      ? updatedSiteData.wetlandName
                      : ''
                  }
                />
              ) : (
                <FormInput
                  key="river_name"
                  editable={false}
                  title={'River'}
                  value={
                    updatedSiteData.riverName ? updatedSiteData.riverName : ''
                  }
                />
              )}
              {editMode ? (
                siteData.ecosystemType === 'wetland' ? (
                  <Button
                    title={'Fetch Wetland'}
                    buttonStyle={{borderRadius: 5, marginTop: 5}}
                    disabled={fetchingRiverName}
                    loading={fetchingRiverName}
                    onPress={async () => {
                      setFetchingRiverName(true);
                      const wetlandData = await fetchWetlandData(
                        updatedSiteData.latitude,
                        updatedSiteData.longitude,
                      );
                      let wetlandName = '';
                      if (wetlandData) {
                        wetlandName = wetlandData['name'] || '-';
                      }
                      setUpdatedSiteData({
                        ...updatedSiteData,
                        ...{
                          wetlandName: wetlandName,
                          wetlandData: wetlandData,
                        },
                      });
                      setFetchingRiverName(false);
                    }}
                  />
                ) : (
                  <Button
                    title={'Fetch River Name'}
                    buttonStyle={{borderRadius: 5, marginTop: 5}}
                    disabled={fetchingRiverName}
                    loading={fetchingRiverName}
                    onPress={async () => {
                      setFetchingRiverName(true);
                      const riverName = await fetchRiverName(
                        updatedSiteData.latitude,
                        updatedSiteData.longitude,
                      );
                      setUpdatedSiteData({
                        ...updatedSiteData,
                        ...{
                          riverName: riverName,
                        },
                      });
                      setFetchingRiverName(false);
                    }}
                  />
                )
              ) : null}
              {siteData.ecosystemType === 'wetland' ? (
                <FormInput
                  key="user_wetland_name"
                  editable={editMode}
                  title={'User Wetland Name'}
                  value={updatedSiteData ? updatedSiteData.userWetlandName : ''}
                  onChange={(val: string) =>
                    formOnChange(val, 'userWetlandName')
                  }
                />
              ) : (
                <FormInput
                  key="user_river_name"
                  editable={editMode}
                  title={'User River Name'}
                  value={updatedSiteData ? updatedSiteData.userRiverName : ''}
                  onChange={(val: string) => formOnChange(val, 'userRiverName')}
                />
              )}
              <FormInput
                editable={editMode}
                key="site_description"
                multiline={true}
                title="Site Description"
                onChange={(val: string) => formOnChange(val, 'description')}
                value={updatedSiteData ? updatedSiteData.description : ''}
              />
              <FormInput
                editable={false}
                key="site_code"
                title="Site Code"
                onChange={(val: string) => formOnChange(val, 'siteCode')}
                value={updatedSiteData ? updatedSiteData.siteCode : ''}
              />
              <FormInput
                editable={editMode}
                key="user_site_code"
                title="User Site Code"
                value={updatedSiteData ? updatedSiteData.userSiteCode : ''}
                onChange={(val: string) => formOnChange(val, 'userSiteCode')}
              />
              <FormInput
                key="owner"
                editable={false}
                title={'Owner'}
                value={username}
              />
              {editMode ? (
                <View style={{marginBottom: 20, marginTop: 20}}>
                  <Button
                    title="Submit"
                    buttonStyle={{
                      width: '100%',
                      backgroundColor: 'rgb(241, 137, 3)',
                    }}
                    onPress={() => submitForm()}
                  />
                </View>
              ) : null}
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  );
};
