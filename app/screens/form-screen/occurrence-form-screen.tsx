import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Platform,
  TouchableOpacity,
  LogBox,
  Image,
  Alert,
} from 'react-native';
import {Button, Header, CheckBox} from '@rneui/themed';
import {Formik} from 'formik';
import Moment from 'moment';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import {styles} from './styles';
import {Camera} from '../../components/camera/camera';
import {
  loadTaxonGroups,
  loadTaxa,
  getTaxonGroupByField,
} from '../../models/taxon/taxon.store';
import {loadOptions} from '../../models/options/option.store';
import Taxon from '../../models/taxon/taxon';
import {load} from '../../utils/storage';
import SiteVisit from '../../models/site_visit/site_visit';
import {getSiteByField} from '../../models/site/site.store';
import {
  saveSiteVisitByField,
  allSiteVisits,
} from '../../models/site_visit/site_visit.store';
import Option from '../../models/options/option';

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export const OccurrenceFormScreen: React.FunctionComponent<
  FormScreenProps
> = props => {
  // @ts-ignore
  const {route} = props;
  const {modulePk, sitePk} = route.params;
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [broadBiotope, setBroadBiotope] = useState('');
  const [specificBiotope, setSpecificBiotope] = useState('');
  const [substratum, setSubstratum] = useState('');
  const [samplingMethod, setSamplingMethod] = useState('');
  const [broadBiotopeOptions, setBroadBiotopeOptions] = useState<Option[]>([]);
  const [specificBiotopeOptions, setSpecificBiotopeOptions] = useState<
    Option[]
  >([]);
  const [substratumOptions, setSubstratumOptions] = useState<Option[]>([]);
  const [samplingMethodOptions, setSamplingMethodOptions] = useState<Option[]>(
    [],
  );
  const [selectedObservedTaxa, setSelectedObservedTaxa] = useState<any>([]);
  const [takingPicture, setTakingPicture] = useState(false);
  const [siteImageData, setSiteImageData] = useState<string>('');
  const [taxonQuery, setTaxonQuery] = useState('');
  const [taxaList, setTaxaList] = useState([]);
  const [observedTaxaList, setObservedTaxaList] = useState<any>([]);
  const [observedTaxaValues, setObservedTaxaValues] = useState<any>({});
  const [username, setUsername] = useState('');

  useEffect(() => {
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
    (async () => {
      const _taxonGroups = await loadTaxonGroups();
      const taxonGroup = _taxonGroups.find(
        (_taxonGroup: {id: any}) => _taxonGroup.id === modulePk,
      );
      if (taxonGroup) {
        const _options = await loadOptions(taxonGroup.id);
        const _broadBiotopeOptions = _options.filter(
          (_option: {key: string}) => _option.key === 'broad_biotope',
        );
        setBroadBiotopeOptions(_broadBiotopeOptions);
        const _specificBiotopeOptions = _options.filter(
          (_option: {key: string}) => _option.key === 'specific_biotope',
        );
        setSpecificBiotopeOptions(_specificBiotopeOptions);
        const _substratumOptions = _options.filter(
          (_option: {key: string}) => _option.key === 'substratum_biotope',
        );
        setSubstratumOptions(_substratumOptions);
        const _samplingMethodOptions = _options.filter(
          (_option: {key: string}) => _option.key === 'sampling_method',
        );
        setSamplingMethodOptions(_samplingMethodOptions);
      }
      const _taxaList = await loadTaxa(modulePk);
      setTaxaList(_taxaList);
      setUsername(await load('user'));
    })();
  }, [modulePk]);

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const submitForm = async () => {
    if (Object.keys(observedTaxaValues).length === 0) {
      Alert.alert('Error', 'You must at least add one collection data\n', [
        {
          text: 'OK',
        },
      ]);
      return;
    }
    const site = await getSiteByField('id', sitePk);
    const taxonGroup = await getTaxonGroupByField('id', parseInt(modulePk));
    const allSiteVisitsData = await allSiteVisits();
    const siteVisitData = {
      id: allSiteVisitsData.length + 1,
      site: site,
      taxonGroup: taxonGroup,
      date: date,
      siteImage: siteImageData,
      observedTaxa: observedTaxaValues,
      samplingMethod: samplingMethod,
      specificBiotope: specificBiotope,
      substratum: substratum,
      biotope: broadBiotope,
      owner: username,
      newData: true,
      synced: false,
    };
    const siteVisit = new SiteVisit(siteVisitData);
    await saveSiteVisitByField('id', siteVisit.id, siteVisit);
    props.navigation.navigate('map');
  };

  const filterTaxonList = (query: string) => {
    if (query.length <= 2) {
      return [];
    }
    let filteredTaxaList = taxaList.filter((el: any) => {
      return (
        el.canonicalName.toLowerCase().includes(query.toLowerCase()) &&
        !(el.id in observedTaxaList)
      );
    });
    if (filteredTaxaList.length > 3) {
      filteredTaxaList = filteredTaxaList.splice(0, 3);
    }
    return filteredTaxaList;
  };

  const addTaxon = (taxon: Taxon) => {
    setTaxonQuery('');
    setObservedTaxaList({...observedTaxaList, [taxon.id]: taxon});
  };

  const checkObservedTaxon = (taxon: Taxon) => {
    const newSelectedObservedTaxon = Object.assign([], selectedObservedTaxa);
    const index = selectedObservedTaxa.indexOf(taxon.id);
    if (index >= 0) {
      newSelectedObservedTaxon.splice(index, 1);
    } else {
      newSelectedObservedTaxon.push(taxon.id);
    }
    setSelectedObservedTaxa(newSelectedObservedTaxon);
  };

  const pictureTaken = (pictureData: {base64: string}) => {
    setTakingPicture(false);
    setSiteImageData(pictureData.base64);
  };

  const onChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined,
    setFieldValue: {
      (field: string, value: any, shouldValidate?: boolean | undefined): void;
      (arg0: string, arg1: number): void;
    },
  ) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    setFieldValue('datetime', Moment(currentDate).unix());
  };

  return (
    <View>
      <Header
        placement="center"
        leftComponent={{
          icon: 'chevron-left',
          type: 'font-awesome',
          color: '#fff',
          onPress: () => props.navigation.goBack(),
        }}
        centerComponent={{
          text: 'Add Record',
          style: {fontSize: 18, color: '#fff', fontWeight: 'bold'},
        }}
        containerStyle={styles.HEADER_CONTAINER}
      />
      <ScrollView style={styles.CONTAINER} keyboardShouldPersistTaps="handled">
        <Formik
          initialValues={{
            broadBiotope: '',
            specificBiotope: '',
            samplingMethod: '',
            substratum: '',
          }}
          onSubmit={submitForm}>
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            values,
          }) => (
            <View>
              {/* Date input */}
              <Text style={styles.REQUIRED_LABEL}>Date</Text>
              <TouchableWithoutFeedback onPress={() => openDatePicker()}>
                <View pointerEvents="none">
                  <TextInput
                    value={Moment(date).format('YYYY-MM-DD')}
                    style={styles.TEXT_INPUT_STYLE}
                  />
                </View>
              </TouchableWithoutFeedback>
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  is24Hour={true}
                  display="default"
                  onChange={(e, selectedDate) => {
                    onChange(e, selectedDate, setFieldValue);
                  }}
                />
              )}
              {/* Owner input */}
              <Text style={styles.REQUIRED_LABEL}>Owner</Text>
              <TextInput
                key="owner"
                editable={false}
                onChangeText={handleChange('owner')}
                onBlur={handleBlur('owner')}
                style={styles.UNEDITABLE_TEXT_INPUT_STYLE}
                value={username}
              />
              {/* Broad biotope */}
              <Text style={styles.LABEL}>Broad Biotope</Text>
              <View style={styles.TEXT_INPUT_STYLE}>
                <Picker
                  selectedValue={broadBiotope}
                  style={styles.PICKER_INPUT_STYLE}
                  onValueChange={itemValue => {
                    setBroadBiotope(itemValue);
                    values.broadBiotope = itemValue;
                  }}>
                  <Picker.Item
                    key="not_specified"
                    label="Not specified"
                    value=""
                  />
                  {broadBiotopeOptions.map(broadBiotopeOption => (
                    <Picker.Item
                      key={broadBiotopeOption.id}
                      label={broadBiotopeOption.name}
                      value={broadBiotopeOption.id}
                    />
                  ))}
                </Picker>
              </View>
              {/* Specific biotope */}
              <Text style={styles.LABEL}>Specific Biotope</Text>
              <View style={styles.TEXT_INPUT_STYLE}>
                <Picker
                  selectedValue={specificBiotope}
                  style={styles.PICKER_INPUT_STYLE}
                  onValueChange={itemValue => {
                    setSpecificBiotope(itemValue);
                    values.specificBiotope = itemValue;
                  }}>
                  <Picker.Item
                    key="not_specified"
                    label="Not specified"
                    value=""
                  />
                  {specificBiotopeOptions.map(option => (
                    <Picker.Item
                      key={option.id}
                      label={option.name}
                      value={option.id}
                    />
                  ))}
                </Picker>
              </View>
              {/* Substratum */}
              <Text style={styles.LABEL}>Substratum</Text>
              <View style={styles.TEXT_INPUT_STYLE}>
                <Picker
                  selectedValue={substratum}
                  style={styles.PICKER_INPUT_STYLE}
                  onValueChange={itemValue => {
                    setSubstratum(itemValue);
                    values.substratum = itemValue;
                  }}>
                  <Picker.Item
                    key="not_specified"
                    label="Not specified"
                    value=""
                  />
                  {substratumOptions.map(option => (
                    <Picker.Item
                      key={option.id}
                      label={option.name}
                      value={option.id}
                    />
                  ))}
                </Picker>
              </View>
              {/* Sampling Method */}
              <Text style={styles.LABEL}>Sampling Method</Text>
              <View style={styles.TEXT_INPUT_STYLE}>
                <Picker
                  selectedValue={samplingMethod}
                  style={styles.PICKER_INPUT_STYLE}
                  onValueChange={itemValue => {
                    setSamplingMethod(itemValue);
                    values.samplingMethod = itemValue;
                  }}>
                  <Picker.Item
                    key="not_specified"
                    label="Not specified"
                    value=""
                  />
                  {samplingMethodOptions.map(option => (
                    <Picker.Item
                      key={option.id}
                      label={option.name}
                      value={option.id}
                    />
                  ))}
                </Picker>
              </View>
              {/* Capture Image */}
              <View style={{marginTop: 10, marginBottom: 10}}>
                <Text style={styles.LABEL}>Site Image</Text>
                <Button
                  title={takingPicture ? 'Close Camera' : 'Capture Site Image'}
                  type="outline"
                  raised
                  containerStyle={{width: '100%'}}
                  onPress={() => {
                    setTakingPicture(!takingPicture);
                  }}
                />
                {takingPicture ? (
                  <View style={{height: 450}}>
                    <Camera pictureTaken={pictureTaken} />
                  </View>
                ) : null}
                {siteImageData ? (
                  <Image
                    source={{uri: `data:image/jpeg;base64,${siteImageData}`}}
                    style={{height: 450}}
                  />
                ) : null}
              </View>
              {/* Sampling Method */}
              <View>
                <Text style={styles.REQUIRED_LABEL}>Observed Taxa</Text>
                <View style={styles.AUTOCOMPLETE_CONTAINER}>
                  <Autocomplete
                    data={filterTaxonList(taxonQuery)}
                    placeholder={'Find species here'}
                    value={taxonQuery}
                    onChangeText={setTaxonQuery}
                    flatListProps={{
                      horizontal: false,
                      nestedScrollEnabled: true,
                      keyExtractor: (taxon: Taxon) => '' + taxon.id,
                      renderItem: (taxon: any) => {
                        taxon = taxon.item;
                        return (
                          <TouchableOpacity
                            style={styles.AUTOCOMPLETE_LIST}
                            onPress={() => addTaxon(taxon)}>
                            <Text style={styles.AUTOCOMPLETE_LIST_TEXT}>
                              {taxon.canonicalName}
                            </Text>
                          </TouchableOpacity>
                        );
                      },
                    }}
                  />
                </View>
                <View style={{marginTop: 50, marginBottom: 20}}>
                  {Object.keys(observedTaxaList).map(taxaId => (
                    <TouchableOpacity
                      key={taxaId}
                      style={styles.OBSERVED_TAXA_LIST}
                      onPress={() =>
                        checkObservedTaxon(observedTaxaList[taxaId])
                      }>
                      <CheckBox
                        disabled={false}
                        checked={selectedObservedTaxa.includes(
                          observedTaxaList[taxaId].id,
                        )}
                        onPress={() =>
                          checkObservedTaxon(observedTaxaList[taxaId])
                        }
                      />
                      <Text>{observedTaxaList[taxaId].canonicalName}</Text>
                      <TextInput
                        keyboardType={'numeric'}
                        editable={selectedObservedTaxa.includes(
                          observedTaxaList[taxaId].id,
                        )}
                        style={styles.TEXT_INPUT_TAXA}
                        value={observedTaxaValues[taxaId]}
                        onChange={e => {
                          setObservedTaxaValues({
                            ...observedTaxaValues,
                            [taxaId]: e.nativeEvent.text,
                          });
                        }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{marginBottom: 150}}>
                <Button
                  title="Submit"
                  buttonStyle={{
                    width: '100%',
                    backgroundColor: 'rgb(241, 137, 3)',
                  }}
                  onPress={() => handleSubmit()}
                />
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  );
};
