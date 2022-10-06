{
  /* eslint-disable @typescript-eslint/no-unused-vars */
}
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import React, {createRef, useCallback, useEffect, useState} from 'react';
import {getSiteByField, saveSiteByField} from '../../models/site/site.store';
import {Alert, ScrollView, View} from 'react-native';
import {Button, Header} from '@rneui/base';
import {styles} from './styles';
import {Formik, isNaN} from 'formik';
import MapView, {Marker} from 'react-native-maps';
import {FormInput} from '../../components/form-input/form-input';
import {LogBox} from 'react-native';

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
  const [editMode, setEditMode] = useState(true);
  const [updatedSiteData, setUpdatedSiteData] = useState({} as any);

  const loadSiteData = useCallback(async () => {
    const _siteData = await getSiteByField('id', route.params.siteId);
    setUpdatedSiteData(_siteData);
    setSiteData(_siteData);
  }, [route.params.siteId]);

  const goToMapScreen = React.useMemo(
    () =>
      (siteId: Number | null = null) => {
        route.params.onBackToMap(siteId);
        return props.navigation.pop();
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
    await setUpdatedSiteData({...updatedSiteData, [key]: value});
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
    await setUpdatedSiteData(updatedSiteData);
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
          text: 'ADD SITE',
          style: {fontSize: 18, color: '#fff', fontWeight: 'bold'},
        }}
        containerStyle={styles.HEADER_CONTAINER}
      />
      <ScrollView style={styles.CONTAINER}>
        <Formik
          initialValues={{
            original_id: '-',
          }}
          onSubmit={values => console.log(values)}>
          {({handleChange, handleBlur, handleSubmit, setFieldValue}) => (
            <View>
              <View style={{height: 200, marginTop: 20}}>
                {siteData.longitude && siteData.latitude ? (
                  <MapView
                    pitchEnabled={editMode}
                    rotateEnabled={editMode}
                    zoomEnabled={editMode}
                    scrollEnabled={editMode}
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
                    {updatedSiteData.latitude && updatedSiteData.longitude ? (
                      <Marker
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
                editable={true}
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
                editable={true}
                checkValue={(val: number) => {
                  if (val < -90 || val > 90) {
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
              <FormInput
                key="site_description"
                title="Site Description"
                onChange={(val: string) => formOnChange(val, 'description')}
                value={updatedSiteData ? updatedSiteData.description : ''}
              />
              <FormInput
                key="site_code"
                title="Site Code (optional)"
                onChange={(val: string) => formOnChange(val, 'siteCode')}
                value={updatedSiteData ? updatedSiteData.siteCode : ''}
              />
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
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  );
};
