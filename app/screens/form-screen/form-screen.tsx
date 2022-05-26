/* eslint-disable @typescript-eslint/camelcase */
import React, { useState, useEffect, createRef } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { Button, Header } from 'react-native-elements'
import { View, ScrollView, Text, Alert, ActivityIndicator, Keyboard } from 'react-native'
import { Formik } from 'formik'
import { styles } from "../form-screen/styles"
import { getSiteByField, saveWellByField } from "../../models/site/site.store"
import Well, { MeasurementType } from "../../models/site/well"
import { loadTerms } from "../../models/site/term.store"
import { MeasurementChart } from "../../components/measurement-chart/measurement-chart"
import { FormInput } from "../../components/form-input/form-input"
import { styles as mapStyles } from "../../screens/map-screen/styles"
import { WellStatusBadge } from "../../components/well/well-status-badge"
import Geolocation from 'react-native-geolocation-service'
import MapView, { Marker } from "react-native-maps"
import { delay } from "../../utils/delay"

const countryList = require("country-list")
const mapViewRef = createRef()

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const FormScreen: React.FunctionComponent<FormScreenProps> = props => {
  const { route, navigation } = props
  const [siteData, setSiteData] = useState({} as any)
  const [measurementData, setMeasurementData] = useState({} as any)
  const [updatedWellData, setUpdatedWellData] = useState({} as Well)
  const [updated, setUpdated] = useState(false)
  const [editMode, setEditMode] = useState(route.params.editMode !== undefined ? route.params.editMode : false)
  const [loading, setLoading] = useState(true)
  const [updateLocationMap, setUpdateLoationMap] = useState(false)
  const [editRecordTitle, setEditRecordTitle] = useState("...")

  const [originalIdError, setOriginalIdError] = useState("")
  const [organizationError, setOrganizationError] = useState("")
  const [nameError, setNameError] = useState("")
  const [featureTypeError, setFeatureTypeError] = useState("")
  const [purposeError, setPurposeError] = useState("")
  const [latitudeError, setLatitudeError] = useState("")
  const [longitudeError, setLongitudeError] = useState("")
  const [porosityError, setPorosityError] = useState("")
  const [specificYieldError, setSpecificYieldError] = useState("")
  const [constructionYearError, setConstructionYearError] = useState("")

  const [terms, setTerms] = useState({
    organisation: [],
    units: {}
  } as any)

  const goToMapScreen = React.useMemo(() => () => props.navigation.pop(), [
    props.navigation,
  ])

  const getUnsyncedMeasurement = (_measurementData) => {
    for (let i = 0; i < _measurementData.length; i++) {
      if (_measurementData[i].id === "") {
        return true
      }
    }
    return false
  }

  const loadSiteData = async () => {
    setEditRecordTitle("ADD A LOCATION SITE")
    const _siteData = await getSiteByField("pk", route.params.wellPk)
    console.log(_siteData)
    // if (!_wellData) {
    //   goToMapScreen()
    // }
    // if (_wellData.newData && typeof _wellData.id === "undefined") {
    //   setEditRecordTitle("ADD A LOCATION SITE")
    //   setUpdated(true)
    // } else {
    //   setEditRecordTitle("Edit Record")
    // }
    setSiteData(_siteData)
    // setUpdatedWellData(new Well(Object.assign({}, _wellData)))
    // const _terms = await loadTerms()
    // setTerms(_terms)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateMeasurementData = (measurementType, _wellData) => {
    setMeasurementData({
      level_measurements: [],
      yield_measurements: [],
      quality_measurements: [],
    })
    setMeasurementData({
      ...measurementData,
      [measurementType]: _wellData[measurementType],
      level_measurements_unsynced_exist: getUnsyncedMeasurement(_wellData.level_measurements),
      yield_measurements_unsynced_exist: getUnsyncedMeasurement(_wellData.yield_measurements),
      quality_measurements_unsynced_exist: getUnsyncedMeasurement(_wellData.quality_measurements)
    })
  }

  useEffect(() => {
    ;(async () => {
      await loadSiteData()
    })()
  }, [])

  const formOnChange = async (value, key) => {
    updatedWellData[key] = value
    await setUpdated(true)
    await setUpdatedWellData({ ...updatedWellData, [key]: value })
  }

  const checkPercentInput = (val) => {
    if (val < 0 || val > 100) {
      return "Values range from 0 to 100"
    }
    return ""
  }

  const checkSpecificYieldInput = (val) => {
    if (val < 0 || val > 1) {
      return "Values range from 0 to 1"
    }
    return ""
  }

  const checkRequiredFields = () => {
    const errorMessage = "Required value"
    let error = false
    if (!updatedWellData.id) {
      setOriginalIdError(errorMessage)
      error = true
    }
    if (!updatedWellData.name) {
      setNameError(errorMessage)
      error = true
    }
    if (!updatedWellData.organisation) {
      setOrganizationError(errorMessage)
      error = true
    }
    if (!updatedWellData.latitude) {
      setLatitudeError(errorMessage)
      error = true
    }
    if (!updatedWellData.longitude) {
      setLongitudeError(errorMessage)
      error = true
    }
    if (!updatedWellData.feature_type) {
      setFeatureTypeError(errorMessage)
      error = true
    } else {
      if (updatedWellData.feature_type === "Water well" && !updatedWellData.purpose) {
        setPurposeError(errorMessage)
        error = true
      }
    }
    return !error
  }

  function yearValidation(year) {
    if (year !== 0) {
      if (("" + year).length !== 4) {
        return "Year is not proper. Please check"
      }
      const currentYear = new Date().getFullYear()
      if ((year < 1920) || (year > currentYear)) {
        return "Year should be in range 1920 to current year"
      }
      return "ok"
    }
  }

  const validateForm = async () => {
    const validationErrorMessage = "There are items that require your attention"
    let error = false
    await delay(100)
    const requiredFieldsOk = checkRequiredFields()
    error = !requiredFieldsOk
    const porosityCheck = checkPercentInput(updatedWellData.porosity)
    const specificYieldCheck = checkSpecificYieldInput(updatedWellData.specific_yield)
    if (porosityCheck) {
      setPorosityError(porosityCheck)
      error = true
    }
    if (specificYieldCheck) {
      setSpecificYieldError(specificYieldCheck)
      error = true
    }
    // Check long and lat
    if (updatedWellData.latitude < -90 || updatedWellData.latitude > 90) {
      error = true
      setLatitudeError("Please enter value comprised between -90 and 90")
    }
    if (updatedWellData.longitude < -180 || updatedWellData.latitude > 180) {
      error = true
      setLongitudeError("Please enter value comprised between -180 and 180")
    }
    if (updatedWellData.construction_year) {
      const validation = yearValidation(updatedWellData.construction_year)
      if (validation !== "ok") {
        error = true
        setConstructionYearError("Year should be in range 1920 to current year")
      }
    }
    if (error) {
      return { kind: "bad", errorMessage: validationErrorMessage }
    }
    return { kind: "ok", errorMessage: "" }
  }

  const submitForm = async () => {
    const validated = await validateForm()
    Keyboard.dismiss()
    if (validated.kind === "ok") {
      updatedWellData.synced = false
      await saveWellByField('pk', updatedWellData.pk, updatedWellData)
      setUpdated(false)
      if (route.params.onBackToMap) {
        route.params.onBackToMap()
      }
      props.navigation.navigate("map")
    } else {
      Alert.alert(
        "Form Error",
        validated.errorMessage
      )
    }
  }

  const editRecord = React.useMemo(() => () => props.navigation.push("form", {
    wellPk: route.params.wellPk,
    editMode: true,
    onBackToMap: () => route.params.onBackToMap()
  }), [
    props.navigation,
    route.params
  ])

  const setCoordinateToCurrentLocation = async () => {
    setLoading(true)
    await Geolocation.getCurrentPosition(
      async (position) => {
        if (updatedWellData.latitude !== position.coords.latitude || updatedWellData.longitude !== position.coords.longitude) {
          setSiteData({
            ...siteData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          setUpdatedWellData({
            ...updatedWellData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          setUpdated(true)
          if (mapViewRef.current) {
            mapViewRef.current.animateCamera({
              center: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            })
          }
        }
        setLoading(false)
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

  return (
    <View style={{ height: "100%" }}>
      <Header
        placement="center"
        leftComponent={{ icon: "chevron-left", size: 35, color: "#fff", onPress: () => goToMapScreen() }}
        centerComponent={{ text: editMode ? editRecordTitle : "View Record", style: { fontSize: 18, color: "#fff", fontWeight: "bold" } }}
        containerStyle={ styles.HEADER_CONTAINER }
        rightComponent={ siteData.editable && !editMode ? { icon: "mode-edit", size: 35, color: "#fff", onPress: () => editRecord() } : {}}
      />
      { updated && terms.units ? <View style={[mapStyles.BOTTOM_VIEW, { zIndex: 99 }]}>
        <Button
          title="Submit"
          buttonStyle={{ width: "100%", backgroundColor: "rgb(241, 137, 3)" }}
          onPress={submitForm}
        />
      </View> : <View></View>}
      { loading ? <View style={styles.LOADING}>
        <ActivityIndicator animating color="rgb(241, 137, 3)" size='large' />
      </View> : null }
      <ScrollView style = { styles.CONTAINER }>
        <WellStatusBadge well={siteData}></WellStatusBadge>
        { siteData.last_update ? <Text style={ styles.LAST_UPDATE_TEXT }>Last update : { siteData.last_update }</Text> : null }
        {/* <Text style={ styles.FORM_HEADER }>GENERAL INFORMATION</Text> */}
        <Formik
          initialValues={{ original_id: '-', status: '-', feature_type: '-', purpose: '-', description: '-' }}
          onSubmit={values => console.log(values)}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <View>
              <View style={{
                height: 200,
                marginTop: 35,
              }}>
                { siteData.latitude && siteData.longitude
                  ? <MapView
                    pitchEnabled={editMode} rotateEnabled={editMode} zoomEnabled={editMode} scrollEnabled={editMode}
                    ref={mapViewRef}
                    initialRegion={{
                      latitude: parseFloat(siteData.latitude),
                      longitude: parseFloat(siteData.longitude),
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }}
                    style={{
                      height: "100%",
                      marginVertical: 0,
                    }}
                    showsUserLocation={true}
                    moveOnMarkerPress={true}
                    onPress={(e) => {
                      if (!editMode) return false
                      const coordinate = e.nativeEvent.coordinate
                      setUpdated(true)
                      setSiteData({
                        ...siteData,
                        ...{
                          latitude: coordinate.latitude,
                          longitude: coordinate.longitude,
                        },
                      })
                      setUpdatedWellData({
                        ...updatedWellData,
                        ...{
                          latitude: coordinate.latitude,
                          longitude: coordinate.longitude,
                        },
                      })
                    }}>
                    <Marker
                      key={siteData.pk}
                      coordinate={{
                        latitude: parseFloat(siteData.latitude),
                        longitude: parseFloat(siteData.longitude),
                      }}
                      title={siteData.id}
                    />
                  </MapView> : null }
              </View>
              <FormInput editable={ siteData.newData ? editMode : false } errorMessage={ latitudeError }
                checkValue={ (val) => {
                  if (val < -90 || val > 90) {
                    return "Please enter value comprised between -90 and 90"
                  }
                  return ""
                }}
                key="latitude" value={ siteData.latitude } numeric required title="Latitude" onChange={ val => formOnChange(parseFloat(val), "latitude")}></FormInput>
              <FormInput editable={ siteData.newData ? editMode : false } errorMessage={ longitudeError }
                checkValue={ (val) => {
                  if (val < -180 || val > 180) {
                    return "Please enter value comprised between -180 and 180"
                  }
                  return ""
                }}
                key="longitude" value={ siteData.longitude } numeric required title="Longitude" onChange={ val => formOnChange(parseFloat(val), "longitude")}></FormInput>

              <FormInput editable={editMode} errorMessage={organizationError} key="riverName"
                value={siteData.riverName} required
                onChange={val => formOnChange(val, "riverName")} title="River Name">
              </FormInput>
              <Button
                title="Fetch River Name"
                containerStyle={{ marginTop: 10 }}
                onPress={() => console.log('fetch river name...')}></Button>
              <FormInput
                editable={ editMode }
                key="original_id"
                value={ siteData.id }
                title="Site Code"
                required
                errorMessage={ originalIdError }
                maxLength={20}
                checkValue={ (val) => {
                  if (val.indexOf(' ') >= 0) {
                    return 'No space allowed'
                  }
                  return ''
                }}
                onChange={ (val) => formOnChange(val, "id") }></FormInput>
              <Text style={{ fontSize: 10, color: 'grey' }}>
                The following standard has been adopted for naming site code:
                Secondary catchment code, 1st four letters of river name, 1st five letters of location.
                E.g. X2CROC-VELOR (Crocodile River @ Veloren Vallei Nature Reserve)
              </Text>
              <FormInput editable={ false } errorMessage={ nameError } key="geomorphological_zone" maxLength={20} required value={ siteData.name } title="Geomorphological Zone" onChange={ val => formOnChange(val, "name")}></FormInput>

              <FormInput editable={ editMode } key="description" maxLength={1000} value={ siteData.description } title="Site Description" multiline onChange={ val => formOnChange(val, "description")}></FormInput>
            </View>
          )}
        </Formik>
        <View style={{ height: 100 }}></View>

      </ScrollView>
    </View>
  )
}
