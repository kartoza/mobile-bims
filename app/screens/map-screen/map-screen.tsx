/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, createRef, useCallback} from 'react';
import {NativeStackNavigationProp} from 'react-native-screens/native-stack';
import {ParamListBase, useFocusEffect} from '@react-navigation/native';
import {SearchBar, Button, Icon, Badge} from '@rneui/themed';
import {PERMISSIONS, request} from 'react-native-permissions';
import {
  View,
  Text,
  ActivityIndicator,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, {Details, Marker, Region} from 'react-native-maps';
import {styles} from './styles';
import {postLocationSite, pushUnsyncedSiteVisit} from '../../models/sync/sync';
import {delay} from '../../utils/delay';
import NetInfo from '@react-native-community/netinfo';
import * as Progress from 'react-native-progress';
import {SitesApi} from '../../services/api/sites-api';
import {TaxaApi} from '../../services/api/taxa-api';
import {
  loadSites,
  saveSites,
  clearTemporaryNewSites,
  createNewSite,
  getSitesByField,
} from '../../models/site/site.store';
import {OverlayMenu} from './overlay-menu';
import {load, save} from '../../utils/storage';
import {
  loadTaxonGroups,
  saveTaxa,
  saveTaxonGroups,
} from '../../models/taxon/taxon.store';
import {OptionsApi} from '../../services/api/options-api';
import {saveOptions} from '../../models/options/option.store';
import {getSiteVisitsByField} from '../../models/site_visit/site_visit.store';
import {SourceReferenceApi} from '../../services/api/source-reference-api';
import {saveSourceReferences} from '../../models/source-reference/source-reference.store';

const mapViewRef = createRef();
let SUBS: {unsubscribe: () => void} | null = null;

export interface MapScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export const MapScreen: React.FunctionComponent<MapScreenProps> = props => {
  // const {navigation} = props;
  const [sites, setSites] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [newSiteMarker, setNewSiteMarker] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isViewRecord, setIsViewRecord] = useState(false);
  const [isAddSite, setIsAddSite] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>({});
  const [unsyncedData, setUnsyncedData] = useState<any[any]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [latitude, setLatitude] = useState<Number | undefined>(undefined);
  const [longitude, setLongitude] = useState<Number | undefined>(undefined);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [taxonGroups, setTaxonGroups] = useState<any>([]);
  const [showBiodiversityModule, setShowBiodiversityModule] = useState(false);

  const drawMarkers = (data: any[]) => {
    let _markers: any[];
    _markers = [];
    data.forEach(_data => {
      _markers.push({
        coordinate: {
          latitude: parseFloat(_data.latitude),
          longitude: parseFloat(_data.longitude),
        },
        title: _data.id,
        key: _data.id,
        synced: _data.synced,
        newData: _data.newData,
        selected: _data.selected,
      });
    });
    _markers.sort((a, b) => (a.newData ? 1 : b.newData ? -1 : 0));
    setMarkers(_markers);
  };

  const getSites = useCallback(
    async (_latitude?: Number | undefined, _longitude?: Number | undefined) => {
      await clearTemporaryNewSites();
      let _sites = await loadSites();
      if (_sites.length === 0) {
        const userLatitude = _latitude || latitude;
        const userLongitude = _longitude || longitude;
        if (userLatitude && userLongitude) {
          const api = new SitesApi();
          await api.setup();
          const apiResult = await api.getSites(userLatitude, userLongitude);
          if (apiResult.kind === 'ok') {
            _sites = apiResult.sites;
          }
          await saveSites(_sites);
        }
      }
      if (_sites) {
        setNewSiteMarker(null);
        setIsAddSite(false);
        setSites(_sites);
        drawMarkers(_sites);
        setIsViewRecord(false);
        setIsLoading(false);
      }
    },
    [latitude, longitude],
  );

  const getUnsyncedData = async () => {
    const unsyncedSiteVisits =
      (await getSiteVisitsByField('synced', false)) || [];
    const unsyncedSites = (await getSitesByField('synced', false)) || [];
    const allUnsyncedData = [];
    allUnsyncedData.push(...unsyncedSites);
    allUnsyncedData.push(...unsyncedSiteVisits);
    setUnsyncedData(allUnsyncedData);
    return allUnsyncedData;
  };

  useFocusEffect(
    React.useCallback(() => {
      const reloadMap = async () => {
        await getUnsyncedData();
        await getSites(latitude, longitude);
        setSearch('');
      };
      reloadMap().catch(err => console.log(err));
      setOverlayVisible(false);
    }, [getSites, latitude, longitude]),
  );

  const onRegionChange = (region: Region, details: Details) => {
    // console.log(region, details);
  };

  const markerSelected = (marker: React.SetStateAction<any>) => {
    if (isAddSite) {
      return;
    }
    for (const site of sites) {
      if (marker) {
        try {
          if (site.id === marker.key) {
            setSelectedSite(site);
            setSelectedMarker(marker);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    setIsViewRecord(true);
  };

  const markerDeselected = () => {
    setIsViewRecord(false);
    setSelectedMarker(null);
    setShowBiodiversityModule(false);
  };

  const refreshMap = useCallback(async () => {
    // setMarkers([])
    markerDeselected();
    await getUnsyncedData();
    await getSites();
  }, [getSites]);

  const mapSelected = async (e: {nativeEvent: {coordinate: any}}) => {
    if (isAddSite) {
      setNewSiteMarker({
        coordinate: e.nativeEvent.coordinate,
      });
    }
    markerDeselected();
  };

  const updateSearch = (_search: React.SetStateAction<string>) => {
    setSearch(_search);
  };

  // @ts-ignore
  const watchLocation = useCallback(async () => {
    await Geolocation.getCurrentPosition(
      (position: {
        coords: {
          latitude: Number | undefined;
          longitude: Number | undefined;
        };
      }) => {
        if (mapViewRef && mapViewRef.current) {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          if (sites.length === 0) {
            getSites(position.coords.latitude, position.coords.longitude);
          }
          // @ts-ignore
          mapViewRef.current.animateCamera({
            center: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            heading: 0,
            pitch: 0,
            zoom: 11,
          });
        }
      },
      (error: {message: string}) => {
        Alert.alert(
          error.message,
          'The app needs location permissions. ' +
            'Please grant this permission to continue using this feature.',
        );
      },
      {enableHighAccuracy: true, timeout: 1000},
    );
  }, [getSites, sites.length]);

  const addSiteVisit = React.useMemo(
    () => (moduleId: number) => {
      props.navigation.navigate({
        name: 'OccurrenceForm',
        params: {
          sitePk: selectedSite.id,
          modulePk: moduleId,
          onBackToMap: () => refreshMap(),
        },
        merge: true,
      });
    },
    [props.navigation, refreshMap, selectedSite.id],
  );

  const addRecordClicked = () => {
    setShowBiodiversityModule(true);
  };

  const addNewSite = async () => {
    const newSite = await createNewSite(
      newSiteMarker.coordinate.latitude,
      newSiteMarker.coordinate.longitude,
    );
    props.navigation.navigate('siteForm', {
      siteId: newSite.id,
      editMode: true,
      onBackToMap: () => refreshMap(),
    });
  };

  const addNewSiteMode = async () => {
    await watchLocation();
    setIsAddSite(true);
    if (latitude && longitude) {
      setNewSiteMarker({
        coordinate: {
          latitude: latitude,
          longitude: longitude,
        },
      });
    }
  };

  const fitMapToMarkers = () => {
    delay(300).then(() => {
      if (mapViewRef) {
        // @ts-ignore
        mapViewRef.current.fitToElements(true);
      }
    });
  };

  const submitSearch = async () => {
    setIsViewRecord(false);
    setSelectedMarker(null);
    setIsAddSite(false);
    setIsLoading(true);
    const results = [];
    if (sites) {
      for (const index in sites) {
        if (
          sites[index].siteCode.toLowerCase().includes(search.toLowerCase())
        ) {
          results.push(sites[index]);
        }
      }
    }
    drawMarkers(results);
    fitMapToMarkers();
    setIsLoading(false);
  };

  const onClearSearch = async () => {
    setSearch('');
    await getSites();
    fitMapToMarkers();
  };

  const showError = (errorMessage: string | undefined) => {
    Alert.alert('Error', errorMessage);
  };

  const checkConnection = async () => {
    return NetInfo.fetch().then((state: {isConnected: any}) => {
      return state.isConnected;
    });
  };

  const pushUnsynced = async () => {
    const _unsyncedData = Object.assign([], unsyncedData);
    let syncResult = true;
    for (let i = 0; i < _unsyncedData.length; i++) {
      setSyncMessage(`${i + 1} records of ${unsyncedData.length} are synced`);
      // Check if unsynced data is site visit or location site
      if (_unsyncedData[i].latitude) {
        syncResult = await postLocationSite(_unsyncedData[i]);
      } else {
        syncResult = await pushUnsyncedSiteVisit(_unsyncedData[i]);
      }
      if (!syncResult) {
        showError("One of the data can't be synchronized");
        return unsyncedData;
      } else {
        unsyncedData[i].synced = true;
        setSyncProgress((i + 1) / unsyncedData.length);
      }
    }
    return await getUnsyncedData();
  };

  const syncData = async () => {
    if (isSyncing) {
      return;
    }
    const isConnected = await checkConnection();
    if (!isConnected) {
      showError('No internet connection available, please try again later');
      return;
    }
    markerDeselected();
    setSyncProgress(0);
    setIsSyncing(true);

    setSyncMessage('Push data to server');
    let currentUnsyncedData = unsyncedData;
    if (currentUnsyncedData.length > 0) {
      currentUnsyncedData = await pushUnsynced();
    }

    setSyncMessage('Downloading Source References');
    const sourceReferenceApi = new SourceReferenceApi();
    await sourceReferenceApi.setup();
    const sourceReferenceApiResult =
      await sourceReferenceApi.getSourceReferences();
    if (sourceReferenceApiResult.kind === 'ok') {
      await saveSourceReferences(sourceReferenceApiResult.sourceReferences);
    }
    setSyncProgress(1);

    setSyncMessage('Downloading Taxa List');
    setSyncProgress(0);
    const api = new TaxaApi();
    await api.setup();
    let storedTaxonGroups = await loadTaxonGroups();
    if (storedTaxonGroups.length === 0) {
      const taxonGroupResult = await api.getTaxonGroup();
      if (taxonGroupResult.kind === 'ok') {
        storedTaxonGroups = taxonGroupResult.taxonGroups;
        await saveTaxonGroups(storedTaxonGroups);
      }
    }
    await setTaxonGroups(storedTaxonGroups);
    if (taxonGroups) {
      for (let i = 0; i < taxonGroups.length; i++) {
        const taxonGroup = taxonGroups[i];
        const apiResult = await api.getTaxa(taxonGroup.id + '');
        if (apiResult.kind === 'ok') {
          await saveTaxa(apiResult.taxa, taxonGroup.id);
        }
        setSyncProgress((i + 1) / taxonGroups.length);
      }

      // Options data
      setSyncMessage('Downloading Options');
      setSyncProgress(0);
      const optionsApi = new OptionsApi();
      await optionsApi.setup();
      for (let i = 0; i < taxonGroups.length; i++) {
        const taxonGroup = taxonGroups[i];
        const apiResult = await optionsApi.getOptions(taxonGroup.id);
        if (apiResult.kind === 'ok') {
          await saveOptions(apiResult.options, taxonGroup.id);
        }
        setSyncProgress((i + 1) / taxonGroups.length);
      }
    }
    setSyncMessage('');
    setIsSyncing(false);
  };

  useEffect(() => {
    let isMounted = true;
    const setup = async () => {
      const token = await load('token');
      const _taxonGroups = await loadTaxonGroups();
      setTaxonGroups(_taxonGroups);
      if (!token) {
        props.navigation.pop();
      }
      if (isMounted) {
        delay(500).then(() => {
          try {
            setIsLoading(false);
            request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(
              (res: string) => {
                if (res === 'granted') {
                  watchLocation().catch(err => console.log(err));
                } else {
                  // getSites()
                }
              },
            );
          } catch (error) {
            console.log('location set error:', error);
          }
        });
      }
    };
    setup().catch(error => console.log(error));
    return function cleanup() {
      if (SUBS) {
        SUBS.unsubscribe();
        SUBS = null;
      }
      isMounted = false;
    };
  }, [props.navigation, watchLocation]);

  // @ts-ignore
  return (
    <View style={styles.CONTAINER}>
      <OverlayMenu visible={overlayVisible} navigation={props.navigation} />

      <View style={styles.SEARCH_BAR_CONTAINER}>
        <SearchBar
          placeholder="Search Sites"
          lightTheme
          round
          onChangeText={updateSearch}
          onClear={onClearSearch}
          onSubmitEditing={submitSearch}
          value={search}
          showLoading={isLoading}
          containerStyle={{width: '85%'}}
          clearIcon={
            <Icon
              style={!search ? {display: 'none'} : {}}
              name="times"
              type="font-awesome"
              size={20}
              color="rgb(138, 151, 161)"
              onPress={() => setSearch('')}
            />
          }
          searchIcon={
            <Icon
              name="search"
              type="font-awesome"
              size={20}
              color="rgb(138, 151, 161)"
            />
          }
        />
        <Button
          containerStyle={{
            backgroundColor: 'rgb(225, 232, 238)',
            width: '15%',
            justifyContent: 'center',
          }}
          type="clear"
          raised
          onPress={() => {
            setOverlayVisible(false);
            delay(100).then(() => setOverlayVisible(true));
          }}
          icon={
            <Icon
              name="user-circle-o"
              type="font-awesome"
              size={35}
              color="rgb(138, 151, 161)"
            />
          }
        />
      </View>
      <View style={styles.MAP_VIEW_CONTAINER}>
        <MapView
          // @ts-ignore
          ref={mapViewRef}
          onRegionChange={onRegionChange}
          followsUserLocation
          style={styles.MAP}
          loadingEnabled={true}
          showsUserLocation={true}
          moveOnMarkerPress={true}
          mapType={'satellite'}
          onPress={(e: {nativeEvent: {coordinate: any}}) => {
            mapSelected(e).catch(error => console.log(error));
          }}>
          {markers.map(marker => {
            return (
              <Marker
                key={marker.key}
                coordinate={marker.coordinate}
                title={marker.siteCode}
                ref={(ref: any) => {
                  marker.ref = ref;
                }}
                onPress={() => {
                  markerSelected(marker);
                }}
                onDeselect={() => {
                  markerDeselected();
                }}
                onSelect={() => {
                  markerSelected(marker);
                }}
                pinColor={
                  marker.newData ? 'orange' : marker.synced ? 'red' : 'gold'
                }
              />
            );
          })}
          {selectedMarker ? (
            <Marker coordinate={selectedMarker.coordinate} pinColor={'blue'} />
          ) : null}
          {newSiteMarker ? (
            <Marker
              key={'newRecord'}
              coordinate={newSiteMarker.coordinate}
              title={'New Record'}
              pinColor={'orange'}
            />
          ) : null}
        </MapView>
      </View>

      <Modal
        transparent={true}
        animationType={'none'}
        visible={isLoading}
        onRequestClose={() => {
          setIsLoading(false);
        }}>
        <View style={styles.MODAL_BACKGROUND}>
          <View style={styles.ACTIVITY_INDICATOR_WRAPPER}>
            <ActivityIndicator
              animating={isLoading}
              size="large"
              color="#ff8000"
              style={styles.ACTIVITY_INDICATOR}
            />
            <Text style={styles.MODAL_TEXT}>Loading...</Text>
          </View>
        </View>
      </Modal>

      {isSyncing ? (
        <View style={styles.MID_BOTTOM_CONTAINER}>
          <View style={styles.MID_BOTTOM_CONTENTS}>
            <Text style={styles.MID_BOTTOM_TEXT}>Sync is on</Text>
            <Text style={styles.MID_BOTTOM_SUB_TEXT}>{syncMessage}</Text>
            <Progress.Bar
              color={'rgb(241, 137, 3)'}
              height={12}
              progress={syncProgress}
              width={250}
            />
          </View>
        </View>
      ) : (
        <View />
      )}

      {isViewRecord ? (
        <View style={styles.MID_BOTTOM_CONTAINER}>
          <View style={styles.MID_BOTTOM_CONTENTS}>
            <Text style={styles.MID_BOTTOM_TEXT}>
              {selectedSite.siteCode !== '-'
                ? selectedSite.siteCode
                : selectedSite.description}{' '}
            </Text>
            <View style={{flexDirection: 'row'}}>
              <Button
                title="Add Record"
                type="outline"
                raised
                buttonStyle={styles.MID_BOTTOM_BUTTON}
                titleStyle={{color: '#ffffff'}}
                containerStyle={{width: '40%'}}
                onPress={() => {
                  addRecordClicked();
                }}
              />
              <Button
                title="Add SASS"
                type="outline"
                raised
                buttonStyle={styles.SASS_BUTTON}
                titleStyle={{color: '#ffffff'}}
                containerStyle={{width: '40%', marginLeft: 10}}
                onPress={() => {}}
              />
              {selectedSite.newData ? (
                <Button
                  title="Delete"
                  type="outline"
                  raised
                  buttonStyle={[
                    styles.MID_BOTTOM_BUTTON,
                    {backgroundColor: 'rgb(234, 53, 53)'},
                  ]}
                  titleStyle={{color: '#ffffff'}}
                  containerStyle={{width: '40%', marginLeft: 10}}
                  onPress={() => {}}
                />
              ) : null}
            </View>
          </View>
        </View>
      ) : (
        <View />
      )}

      {showBiodiversityModule ? (
        <View style={styles.BOTTOM_CONTAINER}>
          <View style={styles.MODULE_TEXT_CONTAINER}>
            <Text style={styles.MODULE_TEXT}>Select Biodiversity Module</Text>
          </View>
          <View style={styles.MODULE_BUTTONS_CONTAINER}>
            {taxonGroups.map(
              (taxonGroup: {id: React.Key | null | undefined; name: any}) => (
                <View style={styles.MODULE_BUTTONS} key={taxonGroup.id}>
                  <Button
                    title={taxonGroup.name}
                    type="outline"
                    raised
                    buttonStyle={styles.MID_BOTTOM_BUTTON}
                    titleStyle={{color: '#ffffff'}}
                    containerStyle={{width: '100%'}}
                    onPress={() => addSiteVisit(taxonGroup.id as number)}
                  />
                </View>
              ),
            )}
          </View>
        </View>
      ) : null}

      {isAddSite ? (
        <View style={styles.MID_BOTTOM_CONTAINER}>
          <View style={styles.MID_BOTTOM_CONTENTS}>
            <Text style={styles.MID_BOTTOM_TEXT}>Add new location site</Text>
            <View style={{flexDirection: 'row'}}>
              <Button
                title="Cancel"
                type="outline"
                raised
                buttonStyle={styles.MID_BOTTOM_BUTTON}
                titleStyle={{color: '#ffffff'}}
                containerStyle={{width: '30%'}}
                onPress={() => {
                  setNewSiteMarker(null);
                  setIsAddSite(false);
                }}
              />
              {newSiteMarker ? (
                <Button
                  title="Add"
                  type="outline"
                  raised
                  buttonStyle={styles.MID_BOTTOM_BUTTON}
                  titleStyle={{color: '#ffffff'}}
                  containerStyle={{width: '30%', marginLeft: 10}}
                  onPress={() => {
                    addNewSite().then(err => console.log(err));
                  }}
                />
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.BOTTOM_VIEW}>
        <Button
          icon={
            <Icon
              name="plus-circle"
              type="font-awesome"
              size={25}
              color="rgb(196, 196, 196)"
            />
          }
          onPress={() => addNewSiteMode()}
          buttonStyle={styles.USER_BUTTON}
          containerStyle={styles.USER_BUTTON_CONTAINER}
          // TouchableComponent={TouchableWithoutFeedback}
        />
        <Button
          icon={
            <Icon
              name="location-arrow"
              type="font-awesome"
              size={30}
              color="#ffffff"
            />
          }
          title=""
          type="outline"
          buttonStyle={styles.LOCATE_ME_BUTTON}
          containerStyle={styles.LOCATE_ME_CONTAINER}
          onPress={() => {
            watchLocation().catch(error => console.log(error));
          }}
        />
        <Button
          icon={
            <Icon
              name="refresh"
              type="font-awesome"
              size={25}
              color={isSyncing ? 'rgb(241, 137, 3)' : 'rgb(196, 196, 196)'}
            />
          }
          onPress={() => syncData()}
          buttonStyle={styles.SYNC_BUTTON}
          containerStyle={styles.SYNC_BUTTON_CONTAINER}
          // TouchableComponent={TouchableWithoutFeedback}
        />
        {unsyncedData.length > 0 ? (
          <Badge
            value={unsyncedData.length}
            status="error"
            containerStyle={styles.SYNC_BADGE}
          />
        ) : (
          <View />
        )}
      </View>
    </View>
  );
};
