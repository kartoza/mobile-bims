/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {
  useState,
  useEffect,
  createRef,
  useCallback,
  useRef,
} from 'react';
import {Clusterer, useClusterer} from 'react-native-clusterer';
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
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
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
import {TaxonGroup} from '../../models/taxon/taxon';
import {fontStyles} from '../../theme/font';
import {GeoJsonProperties} from 'geojson';
import type {supercluster} from 'react-native-clusterer';
import {Point} from '../../components/point';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

const mapViewRef = createRef();
let SUBS: {unsubscribe: () => void} | null = null;

export interface MapScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export const initialRegion = {
  latitude: 17.150642213990213,
  latitudeDelta: 102.40413819692193,
  longitude: -90.13384625315666,
  longitudeDelta: 72.32146382331848,
};

const MAP_WIDTH = Dimensions.get('window').width;
const MAP_HEIGHT = Dimensions.get('window').height - 80;
const MAP_DIMENSIONS = {width: MAP_WIDTH, height: MAP_HEIGHT};

export const MapScreen: React.FunctionComponent<MapScreenProps> = props => {
  // const {navigation} = props;
  const {signOut} = React.useContext(AuthContext);
  const [sites, setSites] = useState<any[]>([]);
  const [newSiteMarker, setNewSiteMarker] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<any>(initialRegion);
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
  const [riverLayerAvailable, setRiverLayerAvailable] =
    useState<boolean>(false);
  const [downloadLayerVisible, setDownloadLayerVisible] =
    useState<boolean>(false);
  const [downloadSiteVisible, setDownloadSiteVisible] =
    useState<boolean>(false);
  const [mapViewKey, setMapViewKey] = useState<number>(
    Math.floor(Math.random() * 100),
  );
  const [geojsonMarkers, setGeojsonMarkers] = useState<any>([]);
  const geojson = [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [125.6, 10.1],
      },
      properties: {
        name: 'Dinagat Islands',
      },
    },
  ];
  const [points, supercluster] = useClusterer(
    geojsonMarkers,
    MAP_DIMENSIONS,
    region,
    {
      minPoints: 50,
    },
  );

  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;

  const drawMarkers = (data: any[]) => {
    let _geojsonMarkers: any[];
    _geojsonMarkers = [];
    data.forEach(_data => {
      _geojsonMarkers.push({
        type: 'Feature',
        id: _data.id,
        geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(_data.longitude),
            parseFloat(_data.latitude),
          ],
        },
        properties: {
          title: '' + _data.id,
          key: _data.id,
          synced: _data.synced,
          newData: _data.newData,
          selected: _data.selected,
        },
      });
    });
    _geojsonMarkers.sort((a, b) =>
      a.properties.newData ? 1 : b.properties.newData ? -1 : 0,
    );
    setGeojsonMarkers(_geojsonMarkers);
  };

  useEffect(() => {
    if (downloadLayerVisible || downloadSiteVisible) {
      setIsAddSite(false);
      setShowBiodiversityModule(false);
    }
  }, [downloadLayerVisible, downloadSiteVisible]);

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
      if (_sites.length === 0) {
        const userLatitude = _latitude || latitude;
        const userLongitude = _longitude || longitude;
        if (userLatitude && userLongitude) {
          const api = new SitesApi();
          await api.setup();
          setIsFetchingSites(true);
          const apiResult = await api.fetchSites(userLatitude, userLongitude);
          if (apiResult.kind === 'ok') {
            _sites = apiResult.sites;
            setIsFetchingSites(false);
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
      }
      await delay(500);
      setIsFetchingSites(false);
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
      };
      reloadMap().catch(err => console.log(err));
      setOverlayVisible(false);
    }, [getSites, latitude, longitude]),
  );

  const onRegionChange = (region: Region, details: Details) => {
    setRegion(region);
  };

  const markerSelected = useCallback(
    async (marker: React.SetStateAction<any>) => {
      if (isAddSite) {
        return;
      }
      for (const site of sites) {
        if (marker) {
          try {
            if (site.id === marker.id) {
              if (mapViewRef.current) {
                const currentCamera = await mapViewRef.current.getCamera();
                mapViewRef.current.animateCamera({
                  ...currentCamera,
                  center: {
                    latitude: site.latitude,
                    longitude: site.longitude,
                  },
                });
              }
              setSelectedSite(site);
              setSelectedMarker(marker);
              setShowBiodiversityModule(true);
              return;
            }
          } catch (e) {
            console.log(e);
          }
        }
      }
    },
    [isAddSite, sites, region],
  );

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
    if (selectedMarker) {
      deselectMarkers();
    }
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
          mapViewRef.current.animateToRegion({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.25,
            longitudeDelta: 0.25,
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
        setGeojsonMarkers([]);
        deselectMarkers();
      }
      await clearTemporaryNewSites();
      await getUnsyncedData();
      await getSites();
      if (shouldDeselectMarkers) {
        watchLocation();
      }
      if (search) {
        submitSearch();
      }
    },
    [getSites, search],
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
              setIsAddSite(false);
              drawMarkers(_sites);
            }
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
        refreshMap();
        return;
      },
    });
  };

  const addNewSiteMode = async () => {
    setShowBiodiversityModule(false);
    setSelectedMarker(false);
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
    setIsAddSite(false);
    setIsLoading(true);
    let isSelectedInResult = false;
    const results = [];
    if (sites) {
      for (const index in sites) {
        if (
          sites[index].siteCode.toLowerCase().includes(search.toLowerCase()) ||
          sites[index].userSiteCode
            ?.toLowerCase()
            .includes(search.toLowerCase())
        ) {
          if (sites[index].id === selectedSite.id) {
            isSelectedInResult = true;
          }
          results.push(sites[index]);
        }
      }
    }
    if (!isSelectedInResult) {
      setSelectedMarker(null);
      setShowBiodiversityModule(false);
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
        setGeojsonMarkers([]);
        deselectMarkers();
        await getSites();
      }
    },
    [sites, getSites],
  );

  useEffect(() => {
    if (mapViewRef && mapViewRef.current && region) {
      // @ts-ignore
      setTimeout(() => {
        mapViewRef.current?.animateToRegion(region, 1000);
      }, 500);
    }
  }, [mapViewKey]);

  const navigateToUnsyncedList = () => {
    const currentRegion = region;
    props.navigation.navigate({
      name: 'UnsyncedList',
      params: {
        onBack: async () => {
          await refreshMap();
          setFormStatus('map');
        },
        syncRecord: async () => {
          if (mapViewRef && mapViewRef.current && currentRegion) {
            // @ts-ignore
            mapViewRef.current.animateToRegion(currentRegion, 1000);
          }
          syncData(true);
        },
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
        signOut();
      }
      if (isMounted) {
        delay(500).then(() => {
          try {
            setIsLoading(false);
            request(
              Platform.OS === 'ios'
                ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
                : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            ).then((res: string) => {
              if (res === 'granted') {
                watchLocation().catch(err => console.log(err));
              } else {
                // getSites()
              }
            });
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

  const initial_region = {
    latitude: 52.5,
    longitude: 19.2,
    latitudeDelta: 8.5,
    longitudeDelta: 8.5,
  };

  const _handlePointPress = useCallback(
    async (
      point:
        | supercluster.PointFeature<GeoJSON.GeoJsonProperties>
        | supercluster.ClusterFeatureClusterer<GeoJSON.GeoJsonProperties>,
    ) => {
      if (point.properties?.getClusterExpansionRegion) {
        const toRegion = point.properties?.getClusterExpansionRegion();
        //@ts-ignore
        mapViewRef.current?.animateToRegion(toRegion, 500);
      } else {
        const selected = geojsonMarkers.find((marker: any) => {
          return marker.properties?.title + '' === point.properties?.title;
        });
        if (selected) {
          markerSelected(selected);
        }
      }
    },
    [geojsonMarkers, markerSelected],
  );

  // @ts-ignore
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.CONTAINER}>
        <OverlayMenu
          visible={overlayVisible}
          navigation={props.navigation}
          refreshMap={() => {
            watchLocation().catch(error => console.log(error));
            refreshMap();
          }}
          syncData={() => syncData(true)}
          downloadRiverClicked={() => setDownloadLayerVisible(true)}
          downloadSiteClicked={() => setDownloadSiteVisible(true)}
        />

        <View style={[styles.SEARCH_BAR_CONTAINER, {marginTop: insets.top}]}>
          <SearchBar
            placeholder={'Search site code'}
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
                type="font-awesome-5"
                size={20}
                color="rgb(138, 151, 161)"
                onPress={onClearSearch}
              />
            }
            searchIcon={
              <Icon
                name="search"
                type="font-awesome-5"
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
                type="font-awesome-5"
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
            onRegionChangeComplete={onRegionChange}
            style={[
              styles.MAP,
              Platform.OS === 'ios'
                ? {
                    height: Dimensions.get('window').height - insets.top - 140,
                  }
                : {},
            ]}
            loadingEnabled={true}
            showsUserLocation={true}
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
            {points.map((item: any) => {
              return (
                <Point
                  key={
                    item.properties?.key ??
                    `point-${item.properties?.cluster_id}`
                  }
                  item={item}
                  pinColor={
                    item.properties?.key === selectedMarker?.properties?.key
                      ? 'blue'
                      : item.properties?.newData
                      ? 'yellow'
                      : typeof item.properties?.synced !== 'undefined'
                      ? item.properties?.synced
                        ? 'gold'
                        : 'red'
                      : 'gold'
                  }
                  onPress={_handlePointPress}
                  isAddSite={isAddSite}
                />
              );
            })}
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
        <View
          style={[
            styles.TOP_LEFT_CONTAINER,
            Platform.OS === 'ios'
              ? {marginTop: insets.top + 70}
              : {marginTop: 70},
          ]}>
          <Icon
            solid
            name="circle"
            type="font-awesome-5"
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
                    name="times"
                    type="font-awesome-5"
                    size={23}
                    color="white"
                  />
                }
                onPress={() => {
                  setDownloadLayerVisible(false);
                  setDownloadSiteVisible(false);
                }}
              />
              <Button
                title={
                  downloadLayerVisible ? 'Download River' : 'Download Sites'
                }
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
                {
                  backgroundColor: 'transparent',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                },
              ]}>
              <TouchableOpacity
                style={styles.CLOSE_BUTTON}
                onPress={() => deselectMarkers()}>
                <Icon
                  name="times"
                  type="font-awesome-5"
                  size={25}
                  iconStyle={{color: 'rgba(0, 0, 0, 0.5)'}}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{width: '75%'}}
                onPress={() => openSite(selectedSite.id)}>
                <Text
                  style={[styles.MODULE_TEXT, {color: color.secondaryFBIS}]}>
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
                    width: '50%',
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
                    width: '50%',
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
                  (taxonGroup: {
                    id: React.Key | null | undefined;
                    name: any;
                  }) => (
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
              {selectedSite.ecosystemType &&
              selectedSite.ecosystemType.toLowerCase() === 'river' ? (
                <View style={styles.MODULE_BUTTONS}>
                  <Button
                    title="Add SASS"
                    type="outline"
                    raised
                    buttonStyle={[styles.MID_BOTTOM_BUTTON, styles.SASS_BUTTON]}
                    containerStyle={{width: '100%'}}
                    titleStyle={[
                      fontStyles.mediumSmall,
                      {color: '#ffffff', fontWeight: 'bold'}
                    ]}
                    onPress={() => addSassClicked()}
                  />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {isAddSite ? (
          <>
            <View style={styles.TOP_CENTER_CONTAINER}>
              <Text style={styles.TOP_CENTER_TEXT}>
                Default is add site at current location. Click on map to change
                site location.
              </Text>
            </View>
            <View style={styles.MID_BOTTOM_CONTAINER}>
              <View style={styles.MID_BOTTOM_CONTENTS}>
                <Text
                  style={[
                    styles.MODULE_TEXT,
                    {paddingBottom: spacing[2], paddingTop: spacing[4]},
                  ]}>
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
                        titleStyle={[
                          fontStyles.mediumSmall,
                          {color: '#ffffff'},
                        ]}
                        containerStyle={styles.MID_BOTTOM_BUTTON_CONTAINER}
                        onPress={() => {
                          addNewSite('river').then(err => console.log(err));
                        }}
                      />
                      <Button
                        title="Wetland"
                        type="outline"
                        raised
                        buttonStyle={styles.MID_BOTTOM_BUTTON}
                        titleStyle={[
                          fontStyles.mediumSmall,
                          {color: '#ffffff'},
                        ]}
                        containerStyle={[
                          styles.MID_BOTTOM_BUTTON_CONTAINER,
                          {
                            marginLeft: 5,
                          },
                        ]}
                        onPress={() => {
                          addNewSite('wetland').then(err => console.log(err));
                        }}
                      />
                      <Button
                        title={'Open\nWaterbody'}
                        type="outline"
                        raised
                        buttonStyle={styles.MID_BOTTOM_BUTTON}
                        titleStyle={[
                          fontStyles.mediumSmall,
                          {color: '#ffffff'},
                        ]}
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
                <View style={{flexDirection: 'row', paddingTop: 10}}>
                  <Button
                    title="Cancel"
                    type="outline"
                    raised
                    buttonStyle={[
                      styles.MID_BOTTOM_BUTTON,
                      {backgroundColor: '#58595B', height: 50},
                    ]}
                    titleStyle={[fontStyles.mediumSmall, {color: '#ffffff'}]}
                    containerStyle={styles.MID_BOTTOM_BUTTON_CONTAINER}
                    onPress={() => {
                      setNewSiteMarker(null);
                      setIsAddSite(false);
                    }}
                  />
                </View>
              </View>
            </View>
          </>
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
                  size={40}
                  color={isAddSite ? 'rgb(241, 137, 3)' : 'rgb(196, 196, 196)'}
                />
                <Icon
                  name="plus"
                  type="font-awesome-5"
                  size={22}
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
                name="sync"
                type="font-awesome-5"
                size={30}
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
    </TouchableWithoutFeedback>
  );
};
