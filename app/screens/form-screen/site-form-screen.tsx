/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import React, {createRef, useCallback, useEffect, useState} from 'react';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import {getSiteByField, saveSiteByField} from '../../models/site/site.store';
import {
  Alert,
  Platform,
  ScrollView,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import {Button} from '@rneui/base';
import {styles} from './styles';
import {Formik, isNaN} from 'formik';
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
  UrlTile,
  WMSTile,
} from 'react-native-maps';
import {FormInput} from '../../components/form-input/form-input';
import {LogBox} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  baseMapLayer,
  baseMapStyleUrl,
  isMapLibreSourceTimeout,
  probeOverlayTile,
  riverLayer,
  riverLayerMapLibre,
  wetlandLayer,
  wetlandLayerMapLibre,
} from '../../utils/offline-map';
import {load} from '../../utils/storage';
import {Api} from '../../services/api/api';
import {ApiResponse} from 'apisauce';
import {Dialog} from '@rneui/themed';
import CustomHeader from '../../components/header/header';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

const mapViewRef = createRef();
const androidCameraRef = createRef<MapLibreGL.CameraRef>();
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
const IS_ANDROID_MAPLIBRE = Platform.OS === 'android';

export const SiteFormScreen: React.FunctionComponent<
  FormScreenProps
> = props => {
  // @ts-ignore
  const {route} = props;
  const [siteData, setSiteData] = useState({} as any);
  const [editMode, setEditMode] = useState(route.params.editMode);
  const [updatedSiteData, setUpdatedSiteData] = useState({} as any);
  const [isConnected, setIsConnected] = useState<boolean | null>(false);
  const [overlayLayerAvailable, setOverlayLayerAvailable] = useState(false);
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

  const submitForm = async (formValues: any) => {
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

  const siteCoordinate =
    updatedSiteData.latitude && updatedSiteData.longitude
      ? ([
          parseFloat(updatedSiteData.longitude),
          parseFloat(updatedSiteData.latitude),
        ] as [number, number])
      : null;

  const overlayTileUrl =
    siteData.ecosystemType !== 'wetland'
      ? riverLayerMapLibre
      : wetlandLayerMapLibre;
  const overlaySourceId = 'site-overlay-layer';

  useEffect(() => {
    let isActive = true;

    if (!isConnected) {
      setOverlayLayerAvailable(false);
      return () => {
        isActive = false;
      };
    }

    probeOverlayTile(overlayTileUrl).then(isAvailable => {
      if (isActive) {
        setOverlayLayerAvailable(isAvailable);
      }
    });

    return () => {
      isActive = false;
    };
  }, [isConnected, overlayTileUrl]);

  useEffect(() => {
    if (!IS_ANDROID_MAPLIBRE) {
      return;
    }

    MapLibreGL.Logger.setLogCallback(log => {
      if (isMapLibreSourceTimeout(log, overlaySourceId)) {
        setOverlayLayerAvailable(false);
        return true;
      }

      return false;
    });
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <CustomHeader
        title={
          route.params.title
            ? route.params.title
            : `ADD ${siteData.ecosystemType?.toUpperCase()} SITE`
        }
        onBackPress={() => goToMapScreen()}
      />
      <ScrollView
        style={styles.CONTAINER}
        overScrollMode={Platform.OS === 'ios' ? 'auto' : 'never'}>
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
          onSubmit={values => submitForm(values)}>
          {({handleChange, handleBlur, handleSubmit, setFieldValue}) => (
            <View style={{marginBottom: 50}}>
              <View style={{height: 200, marginTop: 20}}>
                {siteData && siteData.longitude && siteData.latitude ? (
                  IS_ANDROID_MAPLIBRE ? (
                    <MapLibreGL.MapView
                      style={{
                        height: '100%',
                        marginVertical: 0,
                      }}
                      mapStyle={baseMapStyleUrl}
                      logoEnabled={false}
                      onPress={(event: MapLibreGL.OnPressEvent) => {
                        if (!editMode) {
                          return;
                        }

                        setUpdatedSiteData({
                          ...updatedSiteData,
                          latitude: event.coordinates[1],
                          longitude: event.coordinates[0],
                        });
                      }}>
                      <MapLibreGL.Camera
                        ref={androidCameraRef}
                        defaultSettings={{
                          centerCoordinate: [
                            parseFloat(siteData.longitude),
                            parseFloat(siteData.latitude),
                          ],
                          zoomLevel: 14,
                        }}
                      />
                      <MapLibreGL.UserLocation
                        visible={true}
                        renderMode="native"
                        androidRenderMode="normal"
                      />
                      {isConnected && overlayLayerAvailable ? (
                        <MapLibreGL.RasterSource
                          id={overlaySourceId}
                          tileSize={256}
                          tileUrlTemplates={[overlayTileUrl]}>
                          <MapLibreGL.RasterLayer id="site-overlay-raster" />
                        </MapLibreGL.RasterSource>
                      ) : null}
                      {siteCoordinate ? (
                        <MapLibreGL.MarkerView
                          coordinate={siteCoordinate}
                          anchor={{x: 0.5, y: 0.5}}>
                          <View
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: 'gold',
                              borderWidth: 2,
                              borderColor: '#fff',
                            }}
                          />
                        </MapLibreGL.MarkerView>
                      ) : null}
                    </MapLibreGL.MapView>
                  ) : (
                    <MapView
                      provider={MAP_PROVIDER}
                      mapType={baseMapLayer ? 'none' : 'satellite'}
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
                        setUpdatedSiteData({
                          ...updatedSiteData,
                          ...{
                            latitude: coordinate.latitude,
                            longitude: coordinate.longitude,
                          },
                        });
                      }}>
                      {isConnected && baseMapLayer ? (
                        <UrlTile
                          urlTemplate={baseMapLayer}
                          zIndex={0}
                          tileSize={256}
                          shouldReplaceMapContent={true}
                        />
                      ) : null}
                      {isConnected ? (
                        siteData.ecosystemType !== 'wetland' ? (
                          <WMSTile
                            urlTemplate={riverLayer}
                            zIndex={99}
                            tileSize={256}
                          />
                        ) : (
                          <WMSTile
                            urlTemplate={wetlandLayer}
                            zIndex={99}
                            tileSize={256}
                          />
                        )
                      ) : (
                        <></>
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
                  )
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
                        wetlandName = wetlandData.name || '-';
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
                    onPress={() => handleSubmit()}
                  />
                </View>
              ) : null}
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
