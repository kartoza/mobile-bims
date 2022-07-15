import React, { useState, useEffect, createRef, useCallback } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase, useFocusEffect } from "@react-navigation/native"
import { SearchBar, Button, Icon, Badge, Overlay } from 'react-native-elements'
import { PERMISSIONS, request } from "react-native-permissions"
import { View, Text, ActivityIndicator, Modal, Platform, Alert, TouchableOpacity } from "react-native"
import Geolocation from 'react-native-geolocation-service'
import MapView, { Marker, WMSTile } from "react-native-maps"
import { styles } from "../map-screen/styles"
import { TouchableWithoutFeedback } from "react-native-gesture-handler"
import {
  getUnsynced,
  syncPullData,
  pushUnsyncedSiteVisit,
} from "../../models/sync/sync"
import { delay } from "../../utils/delay"
import NetInfo from "@react-native-community/netinfo"
import * as Progress from 'react-native-progress'
import { Api } from "../../services/api/api"
import {
  loadSites,
  saveSites,
  removeWellsByField,
  createNewSite, clearTemporaryNewSites,
} from "../../models/site/site.store"
import Well from "../../models/site/well"
import { WellStatusBadge } from "../../components/well/well-status-badge"
import { OverlayMenu } from "../map-screen/overlay-menu"
import { load } from "../../utils/storage"
import { loadTaxonGroups, saveTaxa, saveTaxonGroups } from "../../models/taxon/taxon.store"
import { saveOptions } from "../../models/options/option.store"
import { getSiteVisitsByField } from "../../models/site_visit/site_visit.store"

const mapViewRef = createRef()
let SUBS = null

export interface MapScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

export const MapScreen: React.FunctionComponent<MapScreenProps> = props => {
  const { navigation } = props
  const [sites, setSites] = useState([])
  const [markers, setMarkers] = useState([])
  const [newSiteMarker, setNewSiteMarker] = useState(null)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [isViewRecord, setIsViewRecord] = useState(false)
  const [isAddSite, setIsAddSite] = useState(false)
  const [selectedSite, setSelectedSite] = useState({} as Well)
  const [unsyncedData, setUnsyncedData] = useState([])
  const [syncProgress, setSyncProgress] = useState(0)
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [taxonGroups, setTaxonGroups] = useState([])
  const [showBiodiversityModule, setShowBiodiversityModule] = useState(false)

  const drawMarkers = (data) => {
    const _markers = []
    data.forEach((data) => {
      _markers.push({
        coordinate: {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude)
        },
        title: data.id,
        key: data.id,
        synced: data.synced,
        newData: data.newData,
        selected: data.selected
      })
    })
    _markers.sort((a, b) => (a.newData) ? 1 : ((b.newData) ? -1 : 0))
    setMarkers(_markers)
  }

  const getSites = async(_latitude?, _longitude?) => {
    await clearTemporaryNewSites()
    let _sites = await loadSites()
    if (_sites.length === 0) {
      const userLatitude = _latitude || latitude
      const userLongitude = _longitude || longitude
      const api = new Api()
      await api.setup()
      const apiResult = await api.getSites(
        userLatitude,
        userLongitude
      )
      if (apiResult.kind === "ok") {
        _sites = apiResult.sites
      }
      await saveSites(_sites)
    }
    if (_sites) {
      setNewSiteMarker(null)
      setIsAddSite(false)
      setSites(_sites)
      drawMarkers(_sites)
      setIsViewRecord(false)
      setIsLoading(false)
    }
  }

  const getUnsyncedData = async () => {
    const _unsyncedSiteVisits = await getSiteVisitsByField("synced", false) || []
    setUnsyncedData(_unsyncedSiteVisits)
  }

  useFocusEffect(
    React.useCallback(() => {
      const reloadMap = async () => {
        // await getUnsyncedData()
        await getSites(latitude, longitude)
        setSearch("")
      }
      // reloadMap()
      getUnsyncedData()
      setOverlayVisible(false)
    }, [])
  )

  const onRegionChange = async (region) => {
    // setCurrentRegion(region)
    // console.log('Region changed', region)
  }

  const markerSelected = (marker) => {
    if (isAddSite) return
    for (const site of sites) {
      if (site.id === marker.key) {
        setSelectedSite(site)
        setSelectedMarker(marker)
      }
    }
    setIsViewRecord(true)
  }

  const markerDeselected = () => {
    setIsViewRecord(false)
    setSelectedMarker(null)
    setShowBiodiversityModule(false)
  }

  const refreshMap = useCallback(async () => {
    // setMarkers([])
    markerDeselected()
    await getUnsyncedData()
    // await getSites()
  }, [])

  const mapSelected = async (e) => {
    if (isAddSite) {
      setNewSiteMarker({
        coordinate: e.nativeEvent.coordinate
      })
    }
    markerDeselected()
  }

  const updateSearch = _search => {
    setSearch(_search)
  }

  const watchLocation = async () => {
    await Geolocation.getCurrentPosition(
      (position) => {
        if (mapViewRef && mapViewRef.current) {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
          if (sites.length === 0) {
            getSites(position.coords.latitude, position.coords.longitude)
          }
          mapViewRef.current.animateCamera({
            center: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            heading: 0,
            pitch: 0,
            zoom: 11
          })
        }
      },
      error => {
        Alert.alert(
          error.message,
          "The app needs location permissions. Please grant this permission to continue using this feature."
        )
      },
      { enableHighAccuracy: true, timeout: 1000 },
    )
  }

  const requestLocation = () => {
    try {
      setIsLoading(false)
      request(
        Platform.select({
          android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        })
      ).then(res => {
        if (res === "granted") {
          watchLocation()
        } else {
          // getSites()
        }
      })
    } catch (error) {
      console.log("location set error:", error)
    }
  }

  const addSiteVisit = React.useMemo(() => (moduleId: number) => props.navigation.navigate(
    "occurrenceForm", {
      sitePk: selectedSite.id,
      modulePk: moduleId,
      onBackToMap: () => refreshMap()
    }), [
    props.navigation,
    selectedSite,
    refreshMap
  ])

  const addRecordClicked = () => {
    setShowBiodiversityModule(true)
  }

  const deleteRecord = async (wellPk) => {
    await Alert.alert(
      'Deleting Location Data',
      'Are you sure you want to delete this location?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            const deleted = await removeWellsByField('pk', wellPk)
            if (deleted) {
              await getSites()
              const currentUnsyncedData = await getUnsynced()
              setUnsyncedData(currentUnsyncedData)
            }
          }
        }
      ],
      { cancelable: false }
    )
  }

  const addNewSite = async () => {
    const newSite = await createNewSite(newSiteMarker.coordinate.latitude, newSiteMarker.coordinate.longitude)
    props.navigation.navigate("form", {
      wellPk: newSite.id,
      editMode: true,
      onBackToMap: () => refreshMap()
    })
  }

  const addNewSiteMode = async () => {
    watchLocation()
    setIsAddSite(true)
    if (latitude && longitude) {
      setNewSiteMarker({
        coordinate: {
          latitude: latitude,
          longitude: longitude
        }
      })
    }
  }

  const fitMapToMarkers = () => {
    delay(300).then(() => {
      if (mapViewRef) {
        mapViewRef.current.fitToElements(true)
      }
    })
  }

  const submitSearch = async() => {
    setIsViewRecord(false)
    setSelectedMarker(null)
    setIsAddSite(false)
    setIsLoading(true)
    const results = []
    if (sites) {
      for (const index in sites) {
        if (sites[index].siteCode.toLowerCase().includes(search.toLowerCase())) {
          results.push(sites[index])
        }
      }
    }
    drawMarkers(results)
    fitMapToMarkers()
    setIsLoading(false)
  }

  const onClearSearch = async() => {
    setSearch('')
    await getSites()
    fitMapToMarkers()
  }

  const showError = (errorMessage) => {
    Alert.alert(
      "Error",
      errorMessage
    )
  }

  const checkConnection = async() => {
    return NetInfo.fetch().then(state => {
      return state.isConnected
    })
  }

  const syncUpdateSite = async() => {
    setSyncMessage("Updating sites data")
    await syncPullData(setSyncProgress, setSyncMessage, showError)
  }

  const pushUnsynced = async() => {
    const _unsyncedData = Object.assign([], unsyncedData)
    let syncResult = true
    for (let i = 0; i < _unsyncedData.length; i++) {
      setSyncMessage(`${i + 1} records of ${unsyncedData.length} are synced`)
      syncResult = await pushUnsyncedSiteVisit(_unsyncedData[i])
      if (!syncResult) {
        showError("One of the data can't be synchronized")
        return unsyncedData
      } else {
        unsyncedData[i].synced = true
        setSyncProgress((i + 1) / unsyncedData.length)
      }
    }
    const currentUnsyncedData = await getUnsynced()
    setUnsyncedData(currentUnsyncedData)
    return currentUnsyncedData
  }

  const syncData = async() => {
    if (isSyncing) {
      return
    }
    const isConnected = await checkConnection()
    if (!isConnected) {
      showError("No internet connection available, please try again later")
      return
    }
    markerDeselected()
    setSyncProgress(0)
    setIsSyncing(true)
    setSyncMessage('Downloading Taxa List')

    const api = new Api()
    await api.setup()
    let taxonGroups = await loadTaxonGroups()
    if (taxonGroups.length === 0) {
      const taxonGroupResult = await api.getTaxonGroup()
      if (taxonGroupResult.kind === 'ok') {
        taxonGroups = taxonGroupResult.taxonGroups
        await saveTaxonGroups(taxonGroups)
      }
    }
    if (taxonGroups) {
      for (let i = 0; i < taxonGroups.length; i++) {
        const taxonGroup = taxonGroups[i]
        const apiResult = await api.getTaxa(taxonGroup.id + "")
        if (apiResult.kind === "ok") {
          await saveTaxa(apiResult.taxa, taxonGroup.id)
        }
        setSyncProgress((i + 1) / taxonGroups.length)
      }

      // Options data
      setSyncMessage('Downloading Options')
      setSyncProgress(0)
      for (let i = 0; i < taxonGroups.length; i++) {
        const taxonGroup = taxonGroups[i]
        const apiResult = await api.getOptions(taxonGroup.id)
        if (apiResult.kind === "ok") {
          await saveOptions(apiResult.options, taxonGroup.id)
        }
        setSyncProgress((i + 1) / taxonGroups.length)
      }
    }

    let currentUnsyncedData = unsyncedData
    if (currentUnsyncedData.length > 0) {
      currentUnsyncedData = await pushUnsynced()
    }

    setSyncMessage('')
    setIsSyncing(false)
    // if (currentUnsyncedData.length > 0) {
    //   currentUnsyncedData = await pushUnsynced()
    // }
    // if (currentUnsyncedData.length === 0) {
    //   await syncUpdateSite()
    //   await delay(250)
    //   setSyncMessage('')
    //   setMarkers([])
    //   setSelectedSite(null)
    //   await getSites()
    //   setSyncProgress(0)
    // }
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const token = await load("token")
      const taxonGroups = await loadTaxonGroups()
      setTaxonGroups(taxonGroups)
      if (!token) {
        props.navigation.pop()
      }
      if (isMounted) {
        delay(500).then(() => requestLocation())
      }
    })()
    return function cleanup() {
      if (SUBS) {
        SUBS.unsubscribe()
        SUBS = null
      }
      isMounted = false
    }
  }, [])

  return (
    <View style = { styles.CONTAINER }>

      <OverlayMenu visible={overlayVisible} navigation={props.navigation}></OverlayMenu>

      <View style={ styles.SEARCH_BAR_CONTAINER }>
        <SearchBar
          placeholder="Search"
          lightTheme
          round
          onChangeText={ updateSearch }
          onClear={ onClearSearch }
          onSubmitEditing={ submitSearch }
          value={ search }
          showLoading={ isLoading }
          containerStyle={{ width: "85%" }}
        />
        <Button
          containerStyle={{ backgroundColor: "rgb(225, 232, 238)", width: "15%", justifyContent: "center" }}
          type="clear"
          raised
          onPress={ () => { setOverlayVisible(false); delay(100).then(() => setOverlayVisible(true)) } }
          icon={
            <Icon
              name="user-circle-o"
              type="font-awesome"
              size={35}
              color="rgb(138, 151, 161)"
            ></Icon>
          }></Button>
      </View>
      <View style={ styles.MAP_VIEW_CONTAINER }>
        <MapView
          ref = { mapViewRef }
          onRegionChange={ onRegionChange }
          followsUserLocation
          style={ styles.MAP }
          loadingEnabled={true}
          showsUserLocation={true}
          moveOnMarkerPress = {true}
          mapType={'satellite'}
          onPress={(e) => { mapSelected(e) }}>
          {markers.map(marker => {
            return (
              <Marker
                key={marker.key}
                coordinate={marker.coordinate}
                title={marker.siteCode}
                ref={ref => { marker.ref = ref }}
                onPress={() => { markerSelected(marker) }}
                onDeselect={() => { markerDeselected() }}
                onSelect={() => { markerSelected(marker) }}
                pinColor= { marker.newData ? 'orange' : marker.synced ? 'red' : 'gold'}
              />
            )
          })}
          {selectedMarker ? <Marker coordinate={ selectedMarker.coordinate } pinColor={'blue'} /> : null }
          {newSiteMarker
            ? <Marker
              key={'newRecord'}
              coordinate={newSiteMarker.coordinate}
              title={'New Record'}
              pinColor={'orange'}
            /> : null }
        </MapView>
      </View>

      <Modal
        transparent={true}
        animationType={"none"}
        visible={ isLoading }
        onRequestClose={() => { setIsLoading(false) }}>
        <View style={ styles.MODAL_BACKGROUND }>
          <View style={ styles.ACTIVITY_INDICATOR_WRAPPER }>
            <ActivityIndicator
              animating={ isLoading } size="large" color="#ff8000" style={ styles.ACTIVITY_INDICATOR } />
            <Text style={ styles.MODAL_TEXT }>Loading...</Text>
          </View>
        </View>
      </Modal>

      { isSyncing
        ? (
          <View style={ styles.MID_BOTTOM_CONTAINER }>
            <View style={ styles.MID_BOTTOM_CONTENTS }>
              <Text style={ styles.MID_BOTTOM_TEXT }>Sync is on</Text>
              <Text style={ styles.MID_BOTTOM_SUB_TEXT }>{ syncMessage }</Text>
              <Progress.Bar color={ "rgb(241, 137, 3)" } height={ 12 } progress={ syncProgress } width={250} />
            </View>
          </View>
        ) : <View></View>}

      { isViewRecord
        ? (
          <View style={ styles.MID_BOTTOM_CONTAINER }>
            <View style={ styles.MID_BOTTOM_CONTENTS }>
              <WellStatusBadge well={selectedSite} containerStyle={{ position: 'absolute', top: 10, left: 10 }}></WellStatusBadge>
              <Text style={ styles.MID_BOTTOM_TEXT }>{ selectedSite.siteCode } </Text>
              <View style={{ flexDirection: 'row' }}>
                <Button
                  title="Add Record"
                  type="outline"
                  raised
                  buttonStyle={ styles.MID_BOTTOM_BUTTON }
                  titleStyle={{ color: "#ffffff" }}
                  containerStyle={{ width: "40%" }}
                  onPress={ () => { addRecordClicked() }}
                />
                <Button
                  title="Add SASS"
                  type="outline"
                  raised
                  buttonStyle={ styles.SASS_BUTTON }
                  titleStyle={{ color: "#ffffff" }}
                  containerStyle={{ width: "40%", marginLeft: 10 }}
                  onPress={ () => { addRecordClicked() }}
                />
                { selectedSite.newData ? <Button
                  title="Delete"
                  type="outline"
                  raised
                  buttonStyle={[styles.MID_BOTTOM_BUTTON, { backgroundColor: "rgb(234, 53, 53)" }] }
                  titleStyle={{ color: "#ffffff" }}
                  containerStyle={{ width: "40%", marginLeft: 10 }}
                  onPress={ () => { deleteRecord(selectedSite.pk) }}
                /> : null }
              </View>
            </View>
          </View>
        ) : <View></View>}

      { showBiodiversityModule ? (
        <View style={styles.BOTTOM_CONTAINER}>
          <View style={ styles.MODULE_TEXT_CONTAINER }>
            <Text style={ styles.MODULE_TEXT }>
              Select Biodiversity Module</Text>
          </View>
          <View style={ styles.MODULE_BUTTONS_CONTAINER }>
            { taxonGroups.map(taxonGroup => (
              <View style={ styles.MODULE_BUTTONS } key={taxonGroup.id}>
                <Button
                  title={taxonGroup.name}
                  type="outline"
                  raised
                  buttonStyle={ styles.MID_BOTTOM_BUTTON }
                  titleStyle={{ color: "#ffffff" }}
                  containerStyle={{ width: "100%" }}
                  onPress={() => addSiteVisit(taxonGroup.id)}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null }

      { isAddSite
        ? (
          <View style={styles.MID_BOTTOM_CONTAINER}>
            <View style={styles.MID_BOTTOM_CONTENTS}>
              <Text style={styles.MID_BOTTOM_TEXT}>Add new location site</Text>
              <View style={{ flexDirection: "row" }}>
                <Button
                  title="Cancel"
                  type="outline"
                  raised
                  buttonStyle={ styles.MID_BOTTOM_BUTTON }
                  titleStyle={{ color: "#ffffff" }}
                  containerStyle={{ width: "30%" }}
                  onPress={ () => { setNewSiteMarker(null); setIsAddSite(false) }}
                />
                { newSiteMarker ? <Button
                  title="Add"
                  type="outline"
                  raised
                  buttonStyle={ styles.MID_BOTTOM_BUTTON }
                  titleStyle={{ color: "#ffffff" }}
                  containerStyle={{ width: "30%", marginLeft: 10 }}
                  onPress={ () => { addNewSite() }}
                /> : null }
              </View>
            </View>
          </View>
        ) : null
      }

      <View style={ styles.BOTTOM_VIEW }>
        <Button
          icon={
            <Icon
              name="plus-circle"
              type="font-awesome"
              size={25}
              color="rgb(196, 196, 196)"
            ></Icon>
          }
          onPress={ () => addNewSiteMode() }
          buttonStyle={ styles.USER_BUTTON }
          containerStyle={ styles.USER_BUTTON_CONTAINER }
          TouchableComponent={TouchableWithoutFeedback}
        >
        </Button>
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
          buttonStyle={ styles.LOCATE_ME_BUTTON }
          containerStyle={ styles.LOCATE_ME_CONTAINER }
          onPress={ () => { watchLocation() }}
        />
        <Button
          icon={
            <Icon
              name="refresh"
              type="font-awesome"
              size={25}
              color={ isSyncing ? "rgb(241, 137, 3)" : "rgb(196, 196, 196)" }
            ></Icon>
          }
          onPress={() => syncData() }
          buttonStyle={ styles.SYNC_BUTTON }
          containerStyle={ styles.SYNC_BUTTON_CONTAINER }
          TouchableComponent={TouchableWithoutFeedback}
        ></Button>
        { unsyncedData.length > 0 ? <Badge value={ unsyncedData.length } status="error" containerStyle={ styles.SYNC_BADGE } /> : <View></View> }
      </View>
    </View>
  )
}
