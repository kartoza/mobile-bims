/* eslint-disable @typescript-eslint/camelcase */
import React, { useState, useEffect, createRef } from "react"
import { FormScreenProps } from "./form-screen"
import { View, ScrollView, Text, TextInput, Platform, TouchableOpacity, LogBox } from "react-native"
import CheckBox from '@react-native-community/checkbox'
import { styles } from "./styles"
import { Button, Header } from "react-native-elements"
import { Formik } from "formik"
import Moment from "moment"
import { TouchableWithoutFeedback } from "react-native-gesture-handler"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Picker } from "@react-native-picker/picker"
import { Camera } from "../../components/camera/camera"
import Autocomplete from "react-native-autocomplete-input"
import { loadTaxonGroups, loadTaxa } from "../../models/taxon/taxon.store"
import Taxon from "../../models/taxon/taxon"

export const OccurrenceFormScreen: React.FunctionComponent<FormScreenProps> = props => {
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [mode, setMode] = useState('date')
  const [broadBiotope, setBroadBiotope] = useState('not_specified')
  const [selectedObservedTaxa, setSelectedObservedTaxa] = useState([])
  const [takingPicture, setTakingPicture] = useState(false)
  const [taxonQuery, setTaxonQuery] = useState('')
  const [taxaList, setTaxaList] = useState([])
  const [observedTaxaList, setObservedTaxaList] = useState([])

  useEffect(() => {
    LogBox.ignoreLogs(['VirtualizedLists should never be nested'])
    ;(async () => {
      const _taxaList = await loadTaxa()
      setTaxaList(_taxaList)
    })()
  }, [])

  const openDatePicker = (mode = 'date') => {
    setShowDatePicker(true)
    setMode(mode)
  }

  const submitForm = async (data) => {
    console.log(data)
  }

  const filterTaxonList = (query) => {
    if (query.length <= 2) {
      return []
    }
    let filteredTaxaList = (
      taxaList.filter((el, index, array) => {
        return el.canonicalName.toLowerCase().includes(query.toLowerCase()) &&
          !(el.id in observedTaxaList)
      })
    )
    if (filteredTaxaList.length > 3) {
      filteredTaxaList = filteredTaxaList.splice(0, 3)
    }
    return filteredTaxaList
  }

  const addTaxon = (taxon: Taxon) => {
    setTaxonQuery('')
    setObservedTaxaList({ ...observedTaxaList, [taxon.id]: taxon })
  }

  const checkObservedTaxon = (taxon) => {
    const newSelectedObservedTaxon = Object.assign([], selectedObservedTaxa)
    const index = selectedObservedTaxa.indexOf(taxon.id)
    if (index >= 0) {
      newSelectedObservedTaxon.splice(index, 1)
    } else {
      newSelectedObservedTaxon.push(taxon.id)
    }
    setSelectedObservedTaxa(newSelectedObservedTaxon)
  }

  const onChange = (event, selectedDate, setFieldValue) => {
    const currentDate = selectedDate || date
    setShowDatePicker(Platform.OS === 'ios')
    setDate(currentDate)
    setFieldValue('datetime', Moment(currentDate).unix())
  }

  return (
    <View>
      <Header
        placement="center"
        leftComponent={{ icon: "chevron-left", size: 30, color: "#fff", onPress: () => props.navigation.goBack() }}
        centerComponent={{ text: 'Add Record', style: { fontSize: 18, color: "#fff", fontWeight: "bold" } }}
        containerStyle={ styles.HEADER_CONTAINER }
      />
      <ScrollView style = { styles.CONTAINER }>
        <Formik
          initialValues={{
            methodology: "",
            value: "",
            owner: "kartoza_admin"
          }}
          onSubmit={submitForm}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue, values }) => (
            <View>
              {/* Date input */}
              <Text style={ styles.REQUIRED_LABEL }>Date</Text>
              <TouchableWithoutFeedback onPress={ () => openDatePicker('date') }>
                <View pointerEvents="none">
                  <TextInput
                    value={ Moment(date).format('YYYY-MM-DD') }
                    style={ styles.TEXT_INPUT_STYLE }
                  />
                </View>
              </TouchableWithoutFeedback>
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode={mode}
                  is24Hour={true}
                  display="default"
                  onChange={ (e, selectedDate) => {
                    onChange(e, selectedDate, setFieldValue)
                  }}
                />
              )}
              {/* Owner input */}
              <Text style={ styles.REQUIRED_LABEL }>Owner</Text>
              <TextInput
                key='owner'
                onChangeText={ handleChange('owner') }
                onBlur={ handleBlur('owner') }
                style={ styles.TEXT_INPUT_STYLE }
                value={ values.owner }
              />
              {/* Broad biotope */}
              <Text style={ styles.LABEL }>Broad Biotope</Text>
              <View style={ styles.TEXT_INPUT_STYLE }>
                <Picker
                  selectedValue={ broadBiotope }
                  style={ styles.PICKER_INPUT_STYLE }
                  onValueChange={(itemValue, itemIndex) => {
                    setBroadBiotope(itemValue + '')
                  }}>
                  <Picker.Item key="not_specified" label="Not specified" value="not_specified" />
                  <Picker.Item key="mixed" label="Mixed" value="mixed" />
                </Picker>
              </View>
              {/* Specific biotope */}
              <Text style={ styles.LABEL }>Specific Biotope</Text>
              <View style={ styles.TEXT_INPUT_STYLE }>
                <Picker
                  selectedValue={ broadBiotope }
                  style={ styles.PICKER_INPUT_STYLE }
                  onValueChange={(itemValue, itemIndex) => {
                    setBroadBiotope(itemValue + '')
                  }}>
                  <Picker.Item key="not_specified" label="Not specified" value="not_specified" />
                  <Picker.Item key="mixed" label="Mixed" value="mixed" />
                </Picker>
              </View>
              {/* Substratum */}
              <Text style={ styles.LABEL }>Substratum</Text>
              <View style={ styles.TEXT_INPUT_STYLE }>
                <Picker
                  selectedValue={ broadBiotope }
                  style={ styles.PICKER_INPUT_STYLE }
                  onValueChange={(itemValue, itemIndex) => {
                    setBroadBiotope(itemValue + '')
                  }}>
                  <Picker.Item key="not_specified" label="Not specified" value="not_specified" />
                  <Picker.Item key="mixed" label="Mixed" value="mixed" />
                </Picker>
              </View>
              {/* Sampling Method */}
              <Text style={ styles.LABEL }>Sampling Method</Text>
              <View style={ styles.TEXT_INPUT_STYLE }>
                <Picker
                  selectedValue={ broadBiotope }
                  style={ styles.PICKER_INPUT_STYLE }
                  onValueChange={(itemValue, itemIndex) => {
                    setBroadBiotope(itemValue + '')
                  }}>
                  <Picker.Item key="not_specified" label="Not specified" value="not_specified" />
                  <Picker.Item key="mixed" label="Mixed" value="mixed" />
                </Picker>
              </View>
              {/* Capture Image */}
              <View style={{ marginTop: 10, marginBottom: 10 }}>
                <Text style={ styles.LABEL }>Site Image</Text>
                <Button
                  title={ takingPicture ? "Close Camera" : "Capture Site Image" }
                  type="outline"
                  raised
                  containerStyle={{ width: "100%" }}
                  onPress={() => {
                    setTakingPicture(!takingPicture)
                  }}
                />
                { takingPicture ? <View style={{ height: 450 }}><Camera/></View> : null }
              </View>
              {/* Sampling Method */}
              <View>
                <Text style={ styles.REQUIRED_LABEL }>Observed Taxa</Text>
                <View style={styles.AUTOCOMPLETE_CONTAINER}>
                  <Autocomplete
                    data={filterTaxonList(taxonQuery)}
                    value={taxonQuery}
                    onChangeText={setTaxonQuery}
                    flatListProps={{
                      vertical: true,
                      keyExtractor: (taxon: Taxon) => '' + taxon.id,
                      // eslint-disable-next-line react/display-name
                      renderItem: (taxon: any) => {
                        taxon = taxon.item
                        return <TouchableOpacity style={ styles.AUTOCOMPLETE_LIST } onPress={() => addTaxon(taxon)}>
                          <Text style={ styles.AUTOCOMPLETE_LIST_TEXT }>{ taxon.canonicalName }</Text>
                        </TouchableOpacity>
                      }
                    }}
                  />
                </View>
                <View style={{ marginTop: 50, marginBottom: 20 }}>
                  { Object.keys(observedTaxaList).map((taxaId, index) =>
                    <TouchableOpacity key={taxaId}
                      style={ styles.OBSERVED_TAXA_LIST }
                      onPress={() => checkObservedTaxon(observedTaxaList[taxaId])}>
                      <CheckBox
                        disabled={false}
                        value={ selectedObservedTaxa.includes(observedTaxaList[taxaId].id) }
                        onValueChange={(newValue) => checkObservedTaxon(
                          observedTaxaList[taxaId])}
                      />
                      <Text>{observedTaxaList[taxaId].canonicalName}</Text>
                      <TextInput
                        keyboardType={"numeric"}
                        editable={ selectedObservedTaxa.includes(taxaId) }
                        style={ styles.TEXT_INPUT_TAXA }
                        value={'0'}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={{ marginBottom: 150 }}>
                <Button
                  title="Submit"
                  buttonStyle={{ width: "100%", backgroundColor: "rgb(241, 137, 3)" }}
                  onPress={() => console.log('SUBMIT')}
                />
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  )
}
