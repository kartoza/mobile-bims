/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {
  useState,
  useEffect,
  createRef,
  useCallback,
  useRef,
} from 'react';
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
import MapView, {
  Details,
  Marker,
  Region,
  WMSTile,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  LocalTile,
} from 'react-native-maps';
import {styles} from './styles';
import {
  postLocationSite,
  pushUnsyncedSassSiteVisit,
  pushUnsyncedSiteVisit,
} from '../../models/sync/sync';
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
  saveSiteByField,
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
import {SassApi} from '../../services/api/sass-api';
import {
  getSassSiteVisitByField,
  saveSassTaxa,
} from '../../models/sass/sass.store';
import {AbioticApi} from '../../services/api/abiotic-api';
import {saveAbioticData} from '../../models/abiotic/abiotic.store';
import {spacing} from '../../theme/spacing';
import {downloadTiles, getZoomLevel, riverLayer} from '../../utils/offline-map';
import RNFS from 'react-native-fs';
import {color} from '../../theme/color';
import Site from '../../models/site/site';
import {AuthContext} from '../../App';
import { TaxonGroup } from '../../models/taxon/taxon';
import { fontStyles } from '../../theme/font';

const mapViewRef = createRef();
let SUBS: {unsubscribe: () => void} | null = null;

export interface MapScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export const MapScreen: React.FunctionComponent<MapScreenProps> = props => {
  // const {navigation} = props;
  const {signOut} = React.useContext(AuthContext);
  const [sites, setSites] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [newSiteMarker, setNewSiteMarker] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isAddSite, setIsAddSite] = useState(false);
  const [isFetchingSites, setIsFetchingSites] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>({});
  const [newCreatedSite, setNewCreatedSite] = useState<any>(null);
  const [unsyncedData, setUnsyncedData] = useState<any[any]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [latitude, setLatitude] = useState<Number | undefined>(undefined);
  const [longitude, setLongitude] = useState<Number | undefined>(undefined);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [taxonGroups, setTaxonGroups] = useState<any>([]);
  const [showBiodiversityModule, setShowBiodiversityModule] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(false);
  const [formStatus, setFormStatus] = useState<string>('closed');
  const [riverLayerAvailable, setRiverLayerAvailable] = useState<boolean>(false);
  const [downloadLayerVisible, setDownloadLayerVisible] =
    useState<boolean>(false);
  const [downloadSiteVisible, setDownloadSiteVisible] =
    useState<boolean>(false);
  const [mapViewKey, setMapViewKey] = useState<number>(
    Math.floor(Math.random() * 100),
  );

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

  useEffect(() => {
    if (isConnected) {
      fetch('https://maps.kartoza.com/geoserver/web/', {method: 'HEAD'})
        .then(result => result.ok)
        .then(ok => {
          setRiverLayerAvailable(ok);
        })
        .catch(error => {
          setRiverLayerAvailable(false);
        });
    }
  }, [isConnected]);

  const getSites = useCallback(
    async (_latitude?: Number | undefined, _longitude?: Number | undefined) => {
      if (isFetchingSites) {
        return;
      }
      let _sites = await loadSites();
      setIsFetchingSites(true);
      if (_sites.length === 0) {
        const userLatitude = _latitude || latitude;
        const userLongitude = _longitude || longitude;
        if (userLatitude && userLongitude) {
          const api = new SitesApi();
          await api.setup();
          const apiResult = await api.fetchSites(userLatitude, userLongitude);
          if (apiResult.kind === 'ok') {
            _sites = apiResult.sites;
          }
          await saveSites(_sites);
        }
      }
      if (_sites.length > 0) {
        setNewSiteMarker(null);
        setIsAddSite(false);
        setSites(_sites);
        drawMarkers(_sites);
        if (formStatus === 'sass' || formStatus === 'site_visit') {
          setShowBiodiversityModule(false);
        }
        setIsLoading(false);
        await delay(500);
        setIsFetchingSites(false);
      }
    },
    [latitude, longitude],
  );

  const getUnsyncedData = async () => {
    const unsyncedSiteVisits =
      (await getSiteVisitsByField('synced', false)) || [];
    const unsyncedSassSiteVisits =
      (await getSassSiteVisitByField('synced', false)) || [];
    const unsyncedSites = (await getSitesByField('synced', false)) || [];
    const allUnsyncedData = [];
    allUnsyncedData.push(...unsyncedSites);
    allUnsyncedData.push(...unsyncedSiteVisits);
    allUnsyncedData.push(...unsyncedSassSiteVisits);
    setUnsyncedData(allUnsyncedData);
    return allUnsyncedData;
  };

  useFocusEffect(
    React.useCallback(() => {
      const reloadMap = async () => {
        await clearTemporaryNewSites();
        await getUnsyncedData();
        await getSites(latitude, longitude);
        setSearch('');
      };
      reloadMap().catch(err => console.log(err));
      setOverlayVisible(false);
    }, [getSites, latitude, longitude]),
  );

  const onRegionChange = (region: Region, details: Details) => {
    setRegion(region);
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
    setShowBiodiversityModule(true);
  };

  const deselectMarkers = () => {
    setSelectedMarker(null);
    setShowBiodiversityModule(false);
  };

  const mapSelected = async (e: {nativeEvent: {coordinate: any}}) => {
    if (isAddSite) {
      setNewSiteMarker({
        coordinate: e.nativeEvent.coordinate,
      });
    }
    deselectMarkers();
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
          if (
            sites.length === 0 &&
            latitude !== position.coords.latitude &&
            longitude !== position.coords.longitude &&
            !isFetchingSites
          ) {
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
            zoom: 12,
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
  }, [getSites]);

  const zoomToSelected = useCallback((site: Site) => {
    if (!site) {
      return;
    }
    setSelectedSite(site);
  }, []);

  const refreshMap = useCallback(
    async (shouldDeselectMarkers = false) => {
      setMapViewKey(Math.floor(Math.random() * 100));
      if (shouldDeselectMarkers) {
        setMarkers([]);
        deselectMarkers();
      }
      await clearTemporaryNewSites();
      await getUnsyncedData();
      await getSites();
      if (shouldDeselectMarkers) {
        watchLocation();
      }
    },
    [getSites],
  );

  const addSiteVisit = React.useMemo(
    () => (moduleId: number) => {
      const siteId = selectedSite.id;
      const currentRegion = region;
      setFormStatus('site_visit');
      props.navigation.navigate({
        name: 'OccurrenceForm',
        params: {
          sitePk: selectedSite.id,
          ecosystemType: selectedSite.ecosystemType,
          modulePk: moduleId,
          onBack: async () => {
            await refreshMap();
            if (mapViewRef && mapViewRef.current) {
              // @ts-ignore
              mapViewRef.current.animateToRegion(currentRegion, 1000);
            }
            for (const site of sites) {
              if (site.id === siteId) {
                zoomToSelected(site);
              }
            }
            setFormStatus('map');
          },
        },
        merge: true,
      });
    },
    [props.navigation, refreshMap, selectedSite.id],
  );

  const addSassClicked = () => {
    const siteId = selectedSite.id;
    const currentRegion = region;
    setFormStatus('sass');
    props.navigation.navigate({
      name: 'SASSForm',
      params: {
        sitePk: selectedSite.id,
        onBack: async () => {
          await refreshMap();
          if (mapViewRef && mapViewRef.current) {
            // @ts-ignore
            mapViewRef.current.animateToRegion(currentRegion, 1000);
          }
          for (const site of sites) {
            if (site.id === siteId) {
              zoomToSelected(site);
            }
          }
          setFormStatus('map');
        },
      },
    });
  };

  const addRecordClicked = () => {
    setShowBiodiversityModule(true);
  };

  const addNewSite = async (ecosystemType: string = 'river') => {
    const newSite = await createNewSite(
      newSiteMarker.coordinate.latitude,
      newSiteMarker.coordinate.longitude,
      ecosystemType,
    );
    setFormStatus('site');
    props.navigation.navigate('siteForm', {
      siteId: newSite.id,
      editMode: true,
      onBackToMap: async (newSiteId: Number | null = null) => {
        const _sites = await loadSites();
        if (newSiteId) {
          for (const site of _sites) {
            if (site.id === newSiteId) {
              setSelectedSite(site);
              addRecordClicked();
            }
            delay(500).then(() => {
              setSelectedMarker(newSiteMarker);
            });
          }
        }
        setFormStatus('map');
        return;
      },
    });
  };

  const openSite = (siteId: any) => {
    props.navigation.navigate('siteForm', {
      siteId: siteId,
      title: 'View Site',
      editMode: false,
      onBackToMap: async (newSiteId: Number | null = null) => {
        for (const site of sites) {
          if (site.id === siteId) {
            setSelectedSite(site);
          }
        }
        setTimeout(() => {
          setShowBiodiversityModule(true);
        }, 300);
        return;
      },
    });
  };

  const addNewSiteMode = async () => {
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
    setShowBiodiversityModule(false);
    setSelectedMarker(null);
    setIsAddSite(false);
    setIsLoading(true);
    const results = [];
    if (sites) {
      for (const index in sites) {
        if (
          sites[index].siteCode.toLowerCase().includes(search.toLowerCase()) ||
          sites[index].userSiteCode
            ?.toLowerCase()
            .includes(search.toLowerCase())
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
    const _unsyncedData = Object.assign([], await getUnsyncedData());
    let sitesUpdated = false;
    if (_unsyncedData.length === 0) {
      return false;
    }
    let syncResult = true;
    for (let i = 0; i < _unsyncedData.length; i++) {
      setSyncMessage(`${i + 1} records of ${unsyncedData.length} are synced`);
      // Check if unsynced data is site visit or location site
      if (_unsyncedData[i].latitude) {
        syncResult = await postLocationSite(_unsyncedData[i]);
        if (syncResult) {
          sitesUpdated = true;
        }
      } else if (_unsyncedData[i].taxonGroup) {
        syncResult = await pushUnsyncedSiteVisit(_unsyncedData[i]);
      } else {
        syncResult = await pushUnsyncedSassSiteVisit(_unsyncedData[i]);
      }
      if (!syncResult) {
        showError("One of the data can't be synchronized");

        if (sitesUpdated) {
          await getSites();
        }
        return unsyncedData;
      } else {
        unsyncedData[i].synced = true;
        setSyncProgress((i + 1) / unsyncedData.length);
      }
    }
    if (sitesUpdated) {
      await getSites();
    }
    return await getUnsyncedData();
  };

  const fetchAndUpdateSites = useCallback(
    async (
      latitudeData: Number,
      longitudeData: Number,
      extent: string = '',
    ) => {
      // Fetch sites from server, and then update the existing ones
      const sitesApi = new SitesApi();
      await sitesApi.setup();
      const apiResult = await sitesApi.fetchSites(
        latitudeData,
        longitudeData,
        extent,
      );
      if (apiResult.kind === 'ok') {
        let apiResultSites = apiResult.sites;
        let newSites = await loadSites();
        if (sites.length > 0) {
          const existingSiteIds = new Set(
            newSites.map((site: Site) => site.id),
          );
          for (const site of apiResultSites) {
            if (!existingSiteIds.has(site.id)) {
              newSites.push(site);
              existingSiteIds.add(site.id);
            } else {
              for (const index in sites) {
                const _site = sites[index];
                if (_site.id === site.id) {
                  newSites[index] = site;
                }
              }
            }
          }
        } else {
          newSites = apiResultSites;
        }
        await saveSites(newSites);
        setSites(newSites);
        setMarkers([]);
        deselectMarkers();
        await getSites();
      }
    },
    [sites, getSites],
  );

  const navigateToUnsyncedList = () => {
    props.navigation.navigate({
      name: 'UnsyncedList',
      params: {
        onBack: () => refreshMap(true),
        syncRecord: () => syncData(true),
      },
      merge: true,
    });
  };

  async function downloadData() {
    await downloadNearestSites();
    await downloadSourceReferences();
    await downloadTaxaList();
    await downloadSassTaxa();
    await downloadAbiotic();
  }

  async function downloadNearestSites() {
    if (latitude && longitude) {
      setSyncMessage('Downloading Nearest Sites');
      setSyncProgress(0);
      await delay(1000).then(async () => {
        await fetchAndUpdateSites(latitude, longitude);
      });
      setSyncProgress(1);
    }
  }

  async function downloadSourceReferences() {
    setSyncMessage('Downloading Source References');
    setSyncProgress(1);
    const sourceReferenceApi = new SourceReferenceApi();
    await sourceReferenceApi.setup();
    const sourceReferenceApiResult =
      await sourceReferenceApi.getSourceReferences();
    if (sourceReferenceApiResult.kind === 'ok') {
      await saveSourceReferences(sourceReferenceApiResult.sourceReferences);
    }
    setSyncProgress(1);
  }

  async function downloadTaxaList() {
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
    if (storedTaxonGroups) {
      for (let i = 0; i < storedTaxonGroups.length; i++) {
        const taxonGroup = storedTaxonGroups[i];
        const apiResult = await api.getTaxa(taxonGroup.id + '');
        if (apiResult.kind === 'ok') {
          await saveTaxa(apiResult.taxa, taxonGroup.id);
        }
        setSyncProgress((i + 1) / storedTaxonGroups.length);
      }

      await downloadOptions(storedTaxonGroups);
    }
  }

  async function downloadOptions(storedTaxonGroups: TaxonGroup[]) {
    setSyncMessage('Downloading Options');
    setSyncProgress(0);
    const optionsApi = new OptionsApi();
    await optionsApi.setup();
    for (let i = 0; i < storedTaxonGroups.length; i++) {
      const taxonGroup = storedTaxonGroups[i];
      const apiResult = await optionsApi.getOptions(taxonGroup.id);
      if (apiResult.kind === 'ok') {
        await saveOptions(apiResult.options, taxonGroup.id);
      }
      setSyncProgress((i + 1) / storedTaxonGroups.length);
    }
  }

  async function downloadSassTaxa() {
    setSyncMessage('Downloading SASS Taxa');
    setSyncProgress(0);
    const sassApi = new SassApi();
    await sassApi.setup();
    const sassTaxaList = await sassApi.getSassTaxa();
    await saveSassTaxa(sassTaxaList);
    setSyncProgress(1);
    setSyncMessage('');
  }

  async function downloadAbiotic() {
    setSyncMessage('Downloading Abiotic');
    setSyncProgress(0);
    const abioticApi = new AbioticApi();
    await abioticApi.setup();
    const abioticData = await abioticApi.getAbioticList();
    await saveAbioticData(abioticData);
    setSyncProgress(1);
    setSyncMessage('');
  }

  const prepareForSync = () => {
    deselectMarkers();
    setSyncProgress(0);
    setIsSyncing(true);
    setSyncMessage('Push data to server');
  };

  function determineErrorMessage(error: Error) {
    if (error.name === 'NetworkError') {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (error.name === 'TimeoutError') {
      return 'The request timed out. Please try again later.';
    }
    if (error.name === 'AuthenticationError') {
      return 'You have been logged out. Please log in and try again.';
    }
    return `An unexpected issue occurred: ${error.message}. Please try again or contact support if the problem persists.`;
  }

  async function pushDataIfUnsynced(data: any) {
    if (data.length > 0) {
      await pushUnsynced();
    }
  }

  const syncData = async (force: boolean = false) => {
    if (isSyncing) {
      return;
    }

    if (unsyncedData.length > 0 && !force) {
      navigateToUnsyncedList();
      return;
    }

    if (!(await checkConnection())) {
      showError('No internet connection available, please try again later');
      return;
    }

    if (force) {
      watchLocation();
    }

    try {
      setIsSyncing(true);
      prepareForSync();
      await pushDataIfUnsynced(unsyncedData);
      await downloadData();
    } catch (error: any) {
      if (error) {
        showError(determineErrorMessage(error));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // check first launch
    const checkFirstLaunch = async () => {
      try {
        // Try to get the value from AsyncStorage
        const value = await load('@first_launch');
        if (value === null) {
          await save('@first_launch', 'true');
          await syncData();
        }
      } catch (e) {
        // Error reading value
        console.error(e);
      }
    };
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    let isMounted = true;
    // Subscribe to network status changes
    const unsubscribe = NetInfo.addEventListener(netInfoState => {
      setIsConnected(netInfoState.isConnected);
    });

    const setup = async () => {
      const token = await load('token');
      const _taxonGroups = await loadTaxonGroups();
      setTaxonGroups(_taxonGroups);
      if (!token) {
        sign;
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
      unsubscribe();
    };
  }, [props.navigation, watchLocation]);

  const downloadMap = async () => {
    const currentRegion = region;
    const zoomLevel = getZoomLevel(currentRegion.longitudeDelta);
    if (zoomLevel <= 11) {
      Alert.alert(
        'Zoom Level Error',
        'Zoom level too high. Please zoom in further.',
      );
      return;
    }
    setIsLoading(true);
    await downloadTiles(currentRegion, zoomLevel);
    setMapViewKey(Math.floor(Math.random() * 100));
    delay(500).then(() => {
      if (mapViewRef && mapViewRef.current) {
        // @ts-ignore
        mapViewRef.current.animateToRegion(currentRegion, 1000);
      }
      setIsLoading(false);
      setDownloadLayerVisible(false);
    });
  };

  const downloadSitesByExtent = async () => {
    const currentRegion = region;
    const zoomLevel = getZoomLevel(currentRegion.longitudeDelta);
    if (zoomLevel <= 8) {
      Alert.alert(
        'Zoom Level Error',
        'Zoom level too high. Please zoom in further.',
      );
      return;
    }
    setIsLoading(true);
    // await downloadTiles(currentRegion, zoomLevel);
    let _sites: any[] = [];
    const api = new SitesApi();
    await api.setup();
    const minLongitude = region.longitude - region.longitudeDelta / 2;
    const maxLongitude = region.longitude + region.longitudeDelta / 2;
    const minLatitude = region.latitude - region.latitudeDelta / 2;
    const maxLatitude = region.latitude + region.latitudeDelta / 2;
    const extent = `${minLongitude},${minLatitude},${maxLongitude},${maxLatitude}`;
    await fetchAndUpdateSites(0, 0, extent);
    setMapViewKey(Math.floor(Math.random() * 100));
    delay(500).then(() => {
      if (mapViewRef && mapViewRef.current) {
        // @ts-ignore
        mapViewRef.current.animateToRegion(currentRegion, 1000);
      }
      setIsLoading(false);
      setDownloadSiteVisible(false);
    });
  };

  // @ts-ignore
  return (
    <View style={styles.CONTAINER}>
      <OverlayMenu
        visible={overlayVisible}
        navigation={props.navigation}
        refreshMap={() => {
          watchLocation().catch(error => console.log(error));
          refreshMap();
        }}
        downloadRiverClicked={() => setDownloadLayerVisible(true)}
        downloadSiteClicked={() => setDownloadSiteVisible(true)}
      />

      <View style={styles.SEARCH_BAR_CONTAINER}>
        <SearchBar
          placeholder="Search site code"
          lightTheme
          round
          onChangeText={updateSearch}
          onClear={onClearSearch}
          onSubmitEditing={submitSearch}
          value={search}
          showLoading={isLoading}
          inputStyle={fontStyles.medium}
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
              name="bars"
              type="font-awesome"
              size={32}
              color="rgb(138, 151, 161)"
            />
          }
        />
      </View>
      <View
        style={[
          styles.MAP_VIEW_CONTAINER,
          downloadLayerVisible || downloadSiteVisible
            ? styles.MAP_VIEW_DOWNLOAD_RIVER
            : {},
        ]}>
        <MapView
          // @ts-ignore
          key={mapViewKey}
          provider={PROVIDER_DEFAULT}
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
          {!isConnected ? (
            <LocalTile
              pathTemplate={`${RNFS.DocumentDirectoryPath}/rivers/{z}/{x}/{y}.png`}
              tileSize={256}
            />
          ) : riverLayerAvailable ? (
            <WMSTile urlTemplate={riverLayer} zIndex={99} tileSize={256} />
          ) : (
            <LocalTile
              pathTemplate={`${RNFS.DocumentDirectoryPath}/rivers/{z}/{x}/{y}.png`}
              tileSize={256}
            />
          )}
          {markers.map((marker, index) => {
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
                  deselectMarkers();
                }}
                onSelect={() => {
                  markerSelected(marker);
                }}
                pinColor={
                  marker.newData
                    ? 'yellow'
                    : typeof marker.synced !== 'undefined'
                    ? marker.synced
                      ? 'gold'
                      : 'red'
                    : 'gold'
                }
              />
            );
          })}
          {selectedMarker ? (
            <Marker
              key="selectedMarker"
              coordinate={selectedMarker.coordinate}
              pinColor={'blue'}
            />
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
      <View style={styles.TOP_LEFT_CONTAINER}>
        <Icon
          name="circle"
          type="font-awesome"
          size={10}
          color={isConnected ? '#42D417' : '#AFAFAF'}
        />
        <Text style={styles.ONLINE_STATUS}>
          {isConnected ? 'Online' : 'Offline'}
        </Text>
      </View>

      {downloadLayerVisible || downloadSiteVisible ? (
        <>
          <View style={styles.TOP_CENTER_CONTAINER}>
            <Text style={styles.TOP_CENTER_TEXT}>
              Zoom into desired region to
              {downloadLayerVisible
                ? ' download river layer '
                : ' download sites '}
              for offline use.
            </Text>
          </View>
          <View style={styles.MID_BOTTOM_CONTAINER}>
            <Button
              color={color.primaryFBIS}
              icon={
                <Icon
                  name="close"
                  type="font-awesome"
                  size={23}
                  color="white"
                />
              }
              onPress={() => setDownloadLayerVisible(false)}
            />
            <Button
              title={downloadLayerVisible ? 'Download River' : 'Download Sites'}
              containerStyle={{
                backgroundColor: 'rgb(225, 232, 238)',
                justifyContent: 'center',
              }}
              type="clear"
              onPress={() =>
                downloadLayerVisible ? downloadMap() : downloadSitesByExtent()
              }
            />
          </View>
        </>
      ) : null}

      {isSyncing ? (
        <View
          style={{
            position: 'absolute',
            backgroundColor: 'transparent',
            zIndex: 999,
            width: '100%',
            height: '100%',
          }}>
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
        </View>
      ) : (
        <View />
      )}

      {showBiodiversityModule ? (
        <View
          style={[
            styles.BOTTOM_CONTAINER,
            {backgroundColor: 'rgba(255,255,255,0.80)'},
          ]}>
          <View
            style={[
              styles.MODULE_TEXT_CONTAINER,
              {backgroundColor: 'transparent', width: '100%'},
            ]}>
            <TouchableOpacity onPress={() => openSite(selectedSite.id)}>
              <Text style={[styles.MODULE_TEXT, {color: color.secondaryFBIS}]}>
                Add Record to{' '}
                {selectedSite.siteCode !== '-'
                  ? selectedSite.siteCode
                  : selectedSite.userSiteCode}{' '}
              </Text>
            </TouchableOpacity>
            <View
              style={{
                width: '100%',
                marginBottom: 10,
              }}>
              <Text
                style={[
                  styles.MODULE_TEXT_COLOR,
                  fontStyles.small,
                  {
                    textAlign: 'center',
                  },
                ]}>
                Ecosystem Type :{' '}
                {selectedSite.ecosystemType
                  ? selectedSite.ecosystemType[0].toUpperCase() +
                    selectedSite.ecosystemType.substring(
                      1,
                      selectedSite.ecosystemType.length,
                    )
                  : 'Unspecified'}
              </Text>
            </View>
            <View
              style={[
                styles.MODULE_TEXT_COLOR,
                {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-evenly',
                  paddingLeft: spacing[4],
                  paddingRight: spacing[4],
                },
              ]}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '33%',
                }}>
                <Icon
                  name="user"
                  type="font-awesome-5"
                  size={11}
                  color={'grey'}
                />
                <Text
                  style={[
                    styles.MODULE_TEXT_COLOR,
                    {paddingLeft: spacing[1], fontSize: 11, width: '90%'},
                  ]}>
                  {selectedSite.siteCode
                    ? selectedSite.owner
                      ? selectedSite.owner
                      : 'Unspecified'
                    : '-'}
                </Text>
              </View>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '33%',
                }}>
                <Icon
                  name="water"
                  type="font-awesome-5"
                  size={11}
                  color={'grey'}
                />
                <Text
                  style={[
                    styles.MODULE_TEXT_COLOR,
                    fontStyles.small,
                    {paddingLeft: spacing[1], width: '90%'},
                  ]}>
                  {selectedSite.riverName ? selectedSite.riverName : '-'}
                </Text>
              </View>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '33%',
                }}>
                <Icon
                  name="map-pin"
                  type="font-awesome-5"
                  size={11}
                  color={'grey'}
                />
                <Text
                  style={[
                    styles.MODULE_TEXT_COLOR,
                    {paddingLeft: spacing[1], fontSize: 11},
                  ]}>
                  LAT: {selectedSite.latitude?.toFixed(2)} LON:{' '}
                  {selectedSite.longitude?.toFixed(2)}
                </Text>
              </View>
            </View>
            <Text style={styles.MODULE_TEXT}>Select Biodiversity Module</Text>
          </View>
          <View
            style={[
              styles.MODULE_BUTTONS_CONTAINER,
              {backgroundColor: 'transparent'},
            ]}>
            {taxonGroups
              .filter(
                (taxonGroup: any) =>
                  !taxonGroup.name.toLowerCase().includes('algae') &&
                  !taxonGroup.name.toLowerCase().includes('odonate') &&
                  !taxonGroup.name.toLowerCase().includes('invert'),
              )
              .map(
                (taxonGroup: {id: React.Key | null | undefined; name: any}) => (
                  <View style={styles.MODULE_BUTTONS} key={taxonGroup.id}>
                    <Button
                      type="outline"
                      raised
                      buttonStyle={styles.MID_BOTTOM_BUTTON}
                      titleStyle={{color: '#ffffff'}}
                      containerStyle={{width: '100%'}}
                      onPress={() => addSiteVisit(taxonGroup.id as number)}>
                      <Text
                        style={[
                          fontStyles.mediumSmall,
                          {color: '#ffffff', fontWeight: 'bold'},
                        ]}>
                        {taxonGroup.name}
                      </Text>
                    </Button>
                  </View>
                ),
              )}
          </View>
          {selectedSite.ecosystemType &&
          selectedSite.ecosystemType.toLowerCase() === 'river' ? (
            <View
              style={{
                width: '100%',
                paddingBottom: spacing[2],
                alignItems: 'center',
              }}>
              <Button
                title="Add SASS"
                type="outline"
                raised
                buttonStyle={styles.SASS_BUTTON}
                titleStyle={{color: '#ffffff'}}
                onPress={() => addSassClicked()}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {isAddSite ? (
        <View style={styles.MID_BOTTOM_CONTAINER}>
          <View style={styles.MID_BOTTOM_CONTENTS}>
            <Text style={[styles.MID_BOTTOM_TEXT, {paddingBottom: spacing[2]}]}>
              Add Site
            </Text>
            {newSiteMarker ? (
              <Text style={{paddingBottom: spacing[3], fontSize: 11}}>
                LAT: {newSiteMarker.coordinate.latitude?.toFixed(2)} LON:{' '}
                {newSiteMarker.coordinate.longitude?.toFixed(2)}
              </Text>
            ) : null}
            <View style={{flexDirection: 'row'}}>
              {newSiteMarker ? (
                <>
                  <Button
                    title="River"
                    type="outline"
                    raised
                    buttonStyle={styles.MID_BOTTOM_BUTTON}
                    titleStyle={[fontStyles.mediumSmall, {color: '#ffffff'}]}
                    containerStyle={{width: '30%'}}
                    onPress={() => {
                      addNewSite('river').then(err => console.log(err));
                    }}
                  />
                  <Button
                    title="Wetland"
                    type="outline"
                    raised
                    buttonStyle={styles.MID_BOTTOM_BUTTON}
                    titleStyle={[fontStyles.mediumSmall, {color: '#ffffff'}]}
                    containerStyle={{
                      width: '30%',
                      marginLeft: 5,
                    }}
                    onPress={() => {
                      addNewSite('wetland').then(err => console.log(err));
                    }}
                  />
                  <Button
                    title={'Open\nWaterbody'}
                    type="outline"
                    raised
                    buttonStyle={styles.MID_BOTTOM_BUTTON}
                    titleStyle={[fontStyles.mediumSmall, {color: '#ffffff'}]}
                    containerStyle={{width: '30%', marginLeft: 5}}
                    onPress={() => {
                      addNewSite('open waterbody').then(err =>
                        console.log(err),
                      );
                    }}
                  />
                </>
              ) : null}
            </View>
            <View style={{ paddingTop: 10 }}>
              <Button
                title="Cancel"
                type="outline"
                raised
                buttonStyle={[styles.MID_BOTTOM_BUTTON, {backgroundColor: '#58595B'}]}
                titleStyle={{color: '#ffffff', fontSize: 12}}
                containerStyle={{width: '50%'}}
                onPress={() => {
                  setNewSiteMarker(null);
                  setIsAddSite(false);
                }}
              />
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.BOTTOM_VIEW}>
        <Button
          icon={
            <View
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon
                name="map-marker"
                type="font-awesome-5"
                size={30}
                color={isAddSite ? 'rgb(241, 137, 3)' : 'rgb(196, 196, 196)'}
              />
              <Icon
                name="plus"
                type="font-awesome-5"
                size={15}
                color={'#FFF'}
                containerStyle={{
                  position: 'absolute',
                  zIndex: 99,
                  height: '100%',
                  paddingTop: spacing[1],
                }}
              />
            </View>
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
              type="font-awesome-5"
              size={25}
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
              name="sync"
              type="font-awesome-5"
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
