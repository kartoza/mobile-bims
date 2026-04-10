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
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, {
  Details,
  Marker,
  Region,
  WMSTile,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  UrlTile,
} from 'react-native-maps';
import {styles} from './styles';
import {
  postLocationSite,
  pushUnsyncedSassSiteVisit,
  pushUnsyncedSiteVisit,
  SyncAttemptResult,
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
import {
  baseMapLayer,
  baseMapStyleUrl,
  downloadTiles,
  getZoomLevel,
  hasOfflineRiverTiles,
  isMapLibreSourceTimeout,
  localRiverTileUrl,
  probeOverlayTile,
  riverLayer,
  riverLayerMapLibre,
} from '../../utils/offline-map';
import {color} from '../../theme/color';
import Site from '../../models/site/site';
import {AuthContext} from '../../App';
import {TaxonGroup} from '../../models/taxon/taxon';
import {fontStyles} from '../../theme/font';
import type * as GeoJSON from 'geojson';
import type {supercluster} from 'react-native-clusterer';
import {Point} from '../../components/point';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

const mapViewRef = createRef();
const androidMapViewRef = createRef<MapLibreGL.MapViewRef>();
const androidCameraRef = createRef<MapLibreGL.CameraRef>();
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
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
const IS_ANDROID_MAPLIBRE = Platform.OS === 'android';
const DEFAULT_CAMERA_PADDING = {
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
};

export const MapScreen: React.FunctionComponent<MapScreenProps> = props => {
  // const {navigation} = props;
  const {signOut} = React.useContext(AuthContext);
  const pendingRegionRestoreRef = useRef<Region | null>(null);
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
  const [offlineRiverAvailable, setOfflineRiverAvailable] =
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

  const regionFromVisibleBounds = useCallback(
    (visibleBounds: [GeoJSON.Position, GeoJSON.Position]) => {
      const [northEast, southWest] = visibleBounds;
      const north = northEast[1];
      const east = northEast[0];
      const south = southWest[1];
      const west = southWest[0];

      return {
        latitude: (north + south) / 2,
        longitude: (east + west) / 2,
        latitudeDelta: Math.max(Math.abs(north - south), 0.0001),
        longitudeDelta: Math.max(Math.abs(east - west), 0.0001),
      };
    },
    [],
  );

  const animateToRegionCompat = useCallback(
    (nextRegion: Region, animationDuration: number = 1000) => {
      if (IS_ANDROID_MAPLIBRE) {
        androidCameraRef.current?.setCamera({
          centerCoordinate: [nextRegion.longitude, nextRegion.latitude],
          zoomLevel: getZoomLevel(nextRegion.longitudeDelta),
          padding: DEFAULT_CAMERA_PADDING,
          animationDuration,
          animationMode: 'easeTo',
        });
        return;
      }

      // @ts-ignore
      mapViewRef.current?.animateToRegion(nextRegion, animationDuration);
    },
    [],
  );

  const centerOnCoordinate = useCallback(
    async (
      latitudeValue: number,
      longitudeValue: number,
      animationDuration: number = 500,
    ) => {
      if (IS_ANDROID_MAPLIBRE) {
        androidCameraRef.current?.setCamera({
          centerCoordinate: [longitudeValue, latitudeValue],
          padding: DEFAULT_CAMERA_PADDING,
          animationDuration,
          animationMode: 'easeTo',
        });
        return;
      }

      if (mapViewRef.current) {
        const currentCamera = await mapViewRef.current.getCamera();
        mapViewRef.current.animateCamera({
          ...currentCamera,
          center: {
            latitude: latitudeValue,
            longitude: longitudeValue,
          },
        });
      }
    },
    [],
  );

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
    let isActive = true;

    if (!isConnected) {
      setRiverLayerAvailable(false);
      return () => {
        isActive = false;
      };
    }

    probeOverlayTile(riverLayerMapLibre).then(isAvailable => {
      if (isActive) {
        setRiverLayerAvailable(isAvailable);
      }
    });

    return () => {
      isActive = false;
    };
  }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
      if (!IS_ANDROID_MAPLIBRE) {
        return undefined;
      }

      MapLibreGL.Logger.setLogCallback(log => {
        if (isMapLibreSourceTimeout(log, 'river-layer')) {
          setRiverLayerAvailable(false);
          return true;
        }

        return false;
      });

      return undefined;
    }, []),
  );

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

  const isSiteIdMatch = (left: unknown, right: unknown) => {
    if (typeof left === 'undefined' || typeof right === 'undefined') {
      return false;
    }
    return String(left) === String(right);
  };

  const siteHasUnsyncedData = (siteId: unknown) => {
    return unsyncedData.some((record: any) => {
      if (isSiteIdMatch(record.id, siteId) && typeof record.latitude !== 'undefined') {
        return true;
      }
      if (record.site && isSiteIdMatch(record.site.id, siteId)) {
        return true;
      }
      if (isSiteIdMatch(record.siteId, siteId)) {
        return true;
      }
      return false;
    });
  };

  const getPointPinColor = (item: any) => {
    if (item.properties?.key === selectedMarker?.properties?.key) {
      return 'blue';
    }
    if (item.properties?.newData) {
      return 'yellow';
    }
    if (siteHasUnsyncedData(item.properties?.key)) {
      return 'red';
    }
    return 'gold';
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
              await centerOnCoordinate(
                parseFloat(site.latitude),
                parseFloat(site.longitude),
              );
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
    [centerOnCoordinate, isAddSite, sites],
  );

  const deselectMarkers = () => {
    setSelectedMarker(null);
    setShowBiodiversityModule(false);
  };

  const mapSelected = async (coordinate: {
    latitude: number;
    longitude: number;
  }) => {
    if (isAddSite) {
      setNewSiteMarker({
        coordinate,
      });
    }
    if (selectedMarker) {
      deselectMarkers();
    }
  };

  const updateSearch = (_search: React.SetStateAction<string>) => {
    setSearch(_search);
  };

  const requestLocationPermission = useCallback(async () => {
    try {
      const result = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      );

      return result === 'granted';
    } catch (error) {
      console.log('location permission error:', error);
      return false;
    }
  }, []);

  const watchLocation = useCallback(
    async ({
      showPermissionAlert = false,
      showTimeoutAlert = false,
    }: {
      showPermissionAlert?: boolean;
      showTimeoutAlert?: boolean;
    } = {}) => {
      await Geolocation.getCurrentPosition(
        (position: {
          coords: {
            latitude: Number | undefined;
            longitude: Number | undefined;
          };
        }) => {
          const {latitude: posLat, longitude: posLon} = position.coords;
          setLatitude(posLat);
          setLongitude(posLon);
          save('lastLocation', {latitude: posLat, longitude: posLon});
          if (
            sites.length === 0 &&
            latitude !== posLat &&
            longitude !== posLon &&
            !isFetchingSites
          ) {
            getSites(posLat, posLon);
          }
          animateToRegionCompat({
            latitude: posLat,
            longitude: posLon,
            latitudeDelta: 0.25,
            longitudeDelta: 0.25,
          });
        },
        (error: {code?: number; message: string}) => {
          console.log('watchLocation error:', error);

          if (error.code === 1 && showPermissionAlert) {
            Alert.alert(
              'Location Permission Required',
              'The app needs location permission to move to your current position.',
            );
            return;
          }

          if (error.code === 3 && showTimeoutAlert) {
            Alert.alert(
              'Location Request Timed Out',
              'Unable to get your current location right now. Please try again.',
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    },
    [
      animateToRegionCompat,
      getSites,
      isFetchingSites,
      latitude,
      longitude,
      sites.length,
    ],
  );

  const moveToCurrentLocation = useCallback(async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please allow location access, then tap the locate button again.',
      );
      return;
    }

    await watchLocation({
      showPermissionAlert: true,
      showTimeoutAlert: true,
    });
  }, [requestLocationPermission, watchLocation]);

  const zoomToSelected = useCallback((site: Site) => {
    if (!site) {
      return;
    }
    setSelectedSite(site);
  }, []);

  const remountMapPreservingRegion = useCallback((nextRegion?: Region) => {
    pendingRegionRestoreRef.current = nextRegion || region;
    setMapViewKey(Math.floor(Math.random() * 100));
  }, [region]);

  const refreshMap = useCallback(
    async (shouldDeselectMarkers = false) => {
      remountMapPreservingRegion();
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
    [getSites, remountMapPreservingRegion, search],
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
      if (IS_ANDROID_MAPLIBRE) {
        if (!geojsonMarkers.length) {
          return;
        }

        const coordinates = geojsonMarkers.map(
          (marker: any) => marker.geometry.coordinates,
        );
        const longitudes = coordinates.map((coord: number[]) => coord[0]);
        const latitudes = coordinates.map((coord: number[]) => coord[1]);

        androidCameraRef.current?.fitBounds(
          [Math.max(...longitudes), Math.max(...latitudes)],
          [Math.min(...longitudes), Math.min(...latitudes)],
          50,
          500,
        );
        return;
      }

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
    let syncResult: SyncAttemptResult = {ok: true};
    for (let i = 0; i < _unsyncedData.length; i++) {
      setSyncMessage(`${i + 1} records of ${unsyncedData.length} are synced`);
      // Check if unsynced data is site visit or location site
      if (_unsyncedData[i].latitude) {
        syncResult = await postLocationSite(_unsyncedData[i]);
        if (syncResult.ok) {
          sitesUpdated = true;
        }
      } else if (_unsyncedData[i].taxonGroup) {
        syncResult = await pushUnsyncedSiteVisit(_unsyncedData[i]);
      } else {
        syncResult = await pushUnsyncedSassSiteVisit(_unsyncedData[i]);
      }
      if (!syncResult.ok) {
        showError(
          syncResult.error?.debugMessage ||
            "One of the data can't be synchronized",
        );

        if (sitesUpdated) {
          await getSites();
        }
        return await getUnsyncedData();
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
    if (!pendingRegionRestoreRef.current) {
      return;
    }
    const regionToRestore = pendingRegionRestoreRef.current;
    pendingRegionRestoreRef.current = null;
    const timeoutId = setTimeout(() => {
      animateToRegionCompat(regionToRestore);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [animateToRegionCompat, mapViewKey]);

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
          animateToRegionCompat(currentRegion);
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

  const downloadRiverLayer = useCallback(async () => {
    if (!(await checkConnection())) {
      showError('No internet connection available, please try again later');
      return;
    }
    setIsSyncing(true);
    setSyncMessage('Downloading river layer...');
    setSyncProgress(0);
    try {
      await downloadTiles(region, getZoomLevel(region.longitudeDelta));
      setOfflineRiverAvailable(true);
      Alert.alert('Download Complete', 'River layer is now available offline.');
    } catch (error: any) {
      showError('Failed to download river layer tiles.');
    } finally {
      setIsSyncing(false);
      setSyncMessage('');
      setSyncProgress(0);
    }
  }, [region]);

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
      setOfflineRiverAvailable(await hasOfflineRiverTiles());
      const lastLocation = await load('lastLocation');
      if (isMounted) {
        delay(300).then(() => {
          if (lastLocation?.latitude && lastLocation?.longitude) {
            animateToRegionCompat({
              latitude: lastLocation.latitude,
              longitude: lastLocation.longitude,
              latitudeDelta: 0.25,
              longitudeDelta: 0.25,
            });
          }
          delay(200).then(() => {
            try {
              setIsLoading(false);
            } catch (error) {
              console.log('location set error:', error);
            }
          });
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
  }, [animateToRegionCompat, props.navigation]);

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
    try {
      await downloadTiles(currentRegion, zoomLevel);
      setOfflineRiverAvailable(true);
      Alert.alert('Download Complete', 'River layer is now available offline.');
    } catch (error: any) {
      showError('Failed to download river layer tiles.');
    } finally {
      setIsLoading(false);
      setDownloadLayerVisible(false);
    }
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
    remountMapPreservingRegion(currentRegion);
    delay(500).then(() => {
      animateToRegionCompat(currentRegion);
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
        animateToRegionCompat(toRegion, 500);
      } else {
        const selected = geojsonMarkers.find((marker: any) => {
          return marker.properties?.key === point.properties?.key;
        });
        if (selected) {
          markerSelected(selected);
        }
      }
    },
    [animateToRegionCompat, geojsonMarkers, markerSelected],
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
            downloadSiteVisible ? styles.MAP_VIEW_DOWNLOAD_RIVER : {},
          ]}>
          {IS_ANDROID_MAPLIBRE ? (
            <MapLibreGL.MapView
              key={mapViewKey}
              ref={androidMapViewRef}
              style={[
                styles.MAP,
                {
                  height: Dimensions.get('window').height - insets.top - 120,
                },
              ]}
              surfaceView={false}
              mapStyle={baseMapStyleUrl}
              logoEnabled={false}
              onPress={(event: MapLibreGL.OnPressEvent) => {
                mapSelected(event.coordinates).catch(error => console.log(error));
              }}
              onRegionDidChange={feature => {
                setRegion(
                  regionFromVisibleBounds(feature.properties.visibleBounds),
                );
              }}>
              <MapLibreGL.Camera
                ref={androidCameraRef}
                defaultSettings={{
                  centerCoordinate: [initialRegion.longitude, initialRegion.latitude],
                  zoomLevel: getZoomLevel(initialRegion.longitudeDelta),
                }}
              />
              <MapLibreGL.UserLocation
                visible={true}
                renderMode="native"
                androidRenderMode="normal"
              />
              {(isConnected && riverLayerAvailable) ||
              (!isConnected && offlineRiverAvailable) ? (
                <MapLibreGL.RasterSource
                  id="river-layer"
                  tileSize={256}
                  tileUrlTemplates={[
                    isConnected ? riverLayerMapLibre : localRiverTileUrl,
                  ]}>
                  <MapLibreGL.RasterLayer id="river-layer-raster" />
                </MapLibreGL.RasterSource>
              ) : null}
              {points.map((item: any) => {
                return (
                  <Point
                    key={
                      item.properties?.key ??
                      `point-${item.properties?.cluster_id}`
                    }
                    item={item}
                    pinColor={getPointPinColor(item)}
                    onPress={_handlePointPress}
                    isAddSite={isAddSite}
                    useMapLibre={true}
                  />
                );
              })}
              {newSiteMarker ? (
                <MapLibreGL.MarkerView
                  coordinate={[
                    newSiteMarker.coordinate.longitude,
                    newSiteMarker.coordinate.latitude,
                  ]}
                  anchor={{x: 0.5, y: 0.5}}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: 'orange',
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}
                  />
                </MapLibreGL.MarkerView>
              ) : null}
            </MapLibreGL.MapView>
          ) : (
            <MapView
              // @ts-ignore
              key={mapViewKey}
              provider={MAP_PROVIDER}
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
              mapType={baseMapLayer ? 'none' : 'satellite'}
              onPress={(e: {nativeEvent: {coordinate: any}}) => {
                mapSelected(e.nativeEvent.coordinate).catch(error =>
                  console.log(error),
                );
              }}>
              {isConnected && baseMapLayer ? (
                <UrlTile
                  urlTemplate={baseMapLayer}
                  zIndex={0}
                  tileSize={256}
                  shouldReplaceMapContent={true}
                />
              ) : null}
              {isConnected && riverLayerAvailable ? (
                <WMSTile urlTemplate={riverLayer} zIndex={99} tileSize={256} />
              ) : offlineRiverAvailable ? (
                <UrlTile
                  urlTemplate={localRiverTileUrl}
                  zIndex={99}
                  tileSize={256}
                />
              ) : null}
              {points.map((item: any) => {
                return (
                  <Point
                    key={
                      item.properties?.key ??
                      `point-${item.properties?.cluster_id}`
                    }
                    item={item}
                    pinColor={getPointPinColor(item)}
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
          )}
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
            {marginTop: insets.top + 72},
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

        <View style={[styles.BOTTOM_VIEW, {paddingBottom: insets.bottom, height: 60 + insets.bottom}]}>
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
              moveToCurrentLocation().catch(error => console.log(error));
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
