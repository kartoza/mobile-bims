/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  LogBox,
  Image,
  Alert,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {Button, Header, CheckBox, Dialog} from '@rneui/themed';
import {Formik} from 'formik';
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
  getSiteVisitsByField,
} from '../../models/site_visit/site_visit.store';
import Option from '../../models/options/option';
import SourceReference from '../../models/source-reference/source-reference';
import {loadSourceReferences} from '../../models/source-reference/source-reference.store';
import AbioticForm, {
  AbioticDataInterface,
} from '../../components/abiotic/abiotic-form';
import {DatetimePicker} from '../../components/form-input/datetime-picker';

const keyboardStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

interface ObservedTaxonInterface {
  taxon: Taxon;
  checked: boolean;
  value: string;
}

export const OccurrenceFormScreen: React.FunctionComponent<
  FormScreenProps
> = props => {
  // @ts-ignore
  const {route} = props;
  const {modulePk, sitePk} = route.params;
  const [siteVisit, setSiteVisit] = useState<SiteVisit | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [date, setDate] = useState(new Date());
  const [broadBiotope, setBroadBiotope] = useState('');
  const [specificBiotope, setSpecificBiotope] = useState('');
  const [substratum, setSubstratum] = useState('');
  const [samplingMethod, setSamplingMethod] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [sourceReferenceOptions, setSourceReferenceOptions] = useState<
    SourceReference[]
  >([]);
  const [broadBiotopeOptions, setBroadBiotopeOptions] = useState<Option[]>([]);
  const [specificBiotopeOptions, setSpecificBiotopeOptions] = useState<
    Option[]
  >([]);
  const [substratumOptions, setSubstratumOptions] = useState<Option[]>([]);
  const [samplingMethodOptions, setSamplingMethodOptions] = useState<Option[]>(
    [],
  );
  const [takingPicture, setTakingPicture] = useState(false);
  const [siteImageData, setSiteImageData] = useState<string>('');
  const [taxonQuery, setTaxonQuery] = useState('');
  const [taxaList, setTaxaList] = useState([]);
  const [observedTaxaList, setObservedTaxaList] = useState<
    ObservedTaxonInterface[]
  >([]);
  const [username, setUsername] = useState('');
  const [abioticData, setAbioticData] = useState<AbioticDataInterface[]>([]);
  let scrollViewRef = useRef();

  useEffect(() => {
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
    (async () => {
      let _modulePK = modulePk;
      let _siteVisit = null;
      if (route.params.siteVisitId) {
        const _siteVisits = await getSiteVisitsByField(
          'id',
          route.params.siteVisitId,
        );
        if (_siteVisits.length > 0) {
          _siteVisit = _siteVisits[0];
          _modulePK = _siteVisit.taxonGroup.id;
        }
      }
      const _taxonGroups = await loadTaxonGroups();
      const taxonGroup = _taxonGroups.find(
        (_taxonGroup: {id: any}) => _taxonGroup.id === _modulePK,
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
      const _taxaList = await loadTaxa(_modulePK);
      setTaxaList(_taxaList);
      setUsername(await load('user'));
      const _sourceReferenceList = await loadSourceReferences();
      setSourceReferenceOptions(_sourceReferenceList);

      if (_siteVisit) {
        if (_siteVisit.samplingMethod) {
          setSamplingMethod(_siteVisit.samplingMethod);
        }
        if (_siteVisit.specificBiotope) {
          setSpecificBiotope(_siteVisit.specificBiotope);
        }
        if (_siteVisit.substratum) {
          setSubstratum(_siteVisit.substratum);
        }
        if (_siteVisit.biotope) {
          setBroadBiotope(_siteVisit.biotope);
        }
        if (_siteVisit.sourceReferenceId) {
          setSourceReference(_siteVisit.sourceReferenceId);
        }
        if (_siteVisit.siteImage) {
          setSiteImageData(_siteVisit.siteImage);
        }
        setDate(new Date(_siteVisit.date));
        setAbioticData(_siteVisit.abiotic);
        const _observedTaxaList: any = [];
        for (const [taxonId, abundance] of Object.entries(
          _siteVisit.observedTaxa,
        )) {
          let taxon = _taxaList.find((el: any) => {
            return el.id === parseInt(taxonId, 10);
          });
          if (taxon) {
            _observedTaxaList.push({
              taxon: taxon,
              checked: true,
              value: abundance,
            });
          }
        }
        setObservedTaxaList(_observedTaxaList);
        setSiteVisit(_siteVisit);
        setTimeout(() => {
          setLoading(false);
        }, 100);
      } else {
        setLoading(false);
      }
    })();
  }, [modulePk, route.params.siteVisitId]);

  const goToPreviousScreen = React.useMemo(
    () => () => {
      props.navigation.pop();
      route.params.onBack();
    },
    [props.navigation, route.params],
  );

  const submitForm = async () => {
    const abioticDataPayload = abioticData.map(current => {
      if (current.value) {
        return {
          id:
            typeof current.abiotic === 'object'
              ? current.abiotic.id
              : current.abiotic,
          value: current.value,
        };
      }
    });

    let observedTaxaValues: any = {};
    for (const observedTaxon of observedTaxaList) {
      if (observedTaxon.checked) {
        observedTaxaValues[observedTaxon.taxon.id + ''] = observedTaxon.value;
      }
    }

    if (Object.keys(observedTaxaValues).length === 0) {
      Alert.alert('Error', 'You must at least add one collection data\n', [
        {
          text: 'OK',
        },
      ]);
      return;
    }
    let _sitePk = sitePk;
    let _modulePK = modulePk;

    if (siteVisit) {
      _sitePk = siteVisit.site.id;
      _modulePK = siteVisit.taxonGroup.id;
    }

    const site = await getSiteByField('id', _sitePk);
    const taxonGroup = await getTaxonGroupByField('id', parseInt(_modulePK));
    const allSiteVisitsData = await allSiteVisits();

    let _siteVisitId = allSiteVisitsData.length + 1;
    if (siteVisit) {
      _siteVisitId = siteVisit.id;
    }

    const siteVisitData = {
      id: _siteVisitId,
      site: site,
      taxonGroup: taxonGroup,
      date: date,
      siteImage: siteImageData,
      observedTaxa: observedTaxaValues,
      samplingMethod: samplingMethod,
      specificBiotope: specificBiotope,
      sourceReferenceId: sourceReference,
      substratum: substratum,
      biotope: broadBiotope,
      owner: username,
      abiotic: abioticDataPayload,
      newData: true,
      synced: false,
    };
    const _siteVisit = new SiteVisit(siteVisitData);
    await saveSiteVisitByField('id', _siteVisit.id, _siteVisit);
    goToPreviousScreen();
  };

  const filterTaxonList = (query: string) => {
    if (query.length <= 2) {
      return [];
    }
    const existingTaxaIds: any[] = [];
    for (const observedTaxon of observedTaxaList) {
      existingTaxaIds.push(observedTaxon.taxon.id);
    }
    let filteredTaxaList = taxaList.filter((el: any) => {
      return (
        el.canonicalName.toLowerCase().includes(query.toLowerCase()) &&
        !existingTaxaIds.includes(el.id)
      );
    });
    if (filteredTaxaList.length > 3) {
      filteredTaxaList = filteredTaxaList.splice(0, 3);
    }
    return filteredTaxaList;
  };

  const addTaxon = (_taxon: Taxon) => {
    setTaxonQuery('');
    setObservedTaxaList([
      ...observedTaxaList,
      {taxon: _taxon, checked: false, value: ''},
    ]);
  };

  const checkObservedTaxon = (taxon: Taxon) => {
    const updatedObservedTaxa = observedTaxaList.map(
      (observedTaxon: ObservedTaxonInterface) => {
        if (observedTaxon.taxon.id === taxon.id) {
          return {...observedTaxon, checked: !observedTaxon.checked};
        }
        return observedTaxon;
      },
    );
    setObservedTaxaList(updatedObservedTaxa);
  };

  const updateObservedTaxonValue = (taxon: Taxon, value: string) => {
    const updatedObservedTaxa = observedTaxaList.map(
      (observedTaxon: ObservedTaxonInterface) => {
        if (observedTaxon.taxon.id === taxon.id) {
          return {...observedTaxon, value: value};
        }
        return observedTaxon;
      },
    );
    setObservedTaxaList(updatedObservedTaxa);
  };

  const pictureTaken = (pictureData: {base64: string}) => {
    setTakingPicture(false);
    setSiteImageData(pictureData.base64);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={keyboardStyles.container}>
      <Header
        placement="center"
        leftComponent={{
          icon: 'chevron-left',
          type: 'font-awesome',
          color: '#fff',
          onPress: goToPreviousScreen,
        }}
        centerComponent={{
          text: route.params.title ? route.params.title : 'Add Record',
          style: {fontSize: 18, color: '#fff', fontWeight: 'bold'},
        }}
        containerStyle={styles.HEADER_CONTAINER}
      />
      <Dialog
        isVisible={loading}
        overlayStyle={{backgroundColor: '#FFFFFF00', shadowColor: '#FFFFFF00'}}>
        <Dialog.Loading />
      </Dialog>
      <ScrollView
        style={styles.CONTAINER}
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}>
        <Formik
          initialValues={{
            broadBiotope: '',
            specificBiotope: '',
            samplingMethod: '',
            substratum: '',
            sourceReference: '',
            abiotic: [],
          }}
          onSubmit={submitForm}>
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setFieldValue,
            values,
          }) => (
            <View>
              {/* Date input */}
              <DatetimePicker
                date={date}
                onDateChange={(datetime: Date) => setDate(datetime)}
              />

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
              {/* Source References */}
              <Text style={styles.LABEL}>Source Reference</Text>
              <View style={styles.TEXT_INPUT_STYLE}>
                <Picker
                  selectedValue={sourceReference}
                  numberOfLines={4}
                  style={styles.PICKER_INPUT_STYLE}
                  onValueChange={itemValue => {
                    setSourceReference(itemValue);
                    values.sourceReference = itemValue;
                  }}>
                  <Picker.Item
                    key="not_specified"
                    label="Not specified"
                    value=""
                  />
                  {sourceReferenceOptions.map(option => (
                    <Picker.Item
                      key={option.id}
                      label={option.label()}
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
                    if (!takingPicture) {
                      scrollViewRef?.current?.scrollTo({
                        y: 450 + 100,
                        animated: true,
                      });
                    }
                    setTakingPicture(!takingPicture);
                  }}
                />
                {takingPicture ? (
                  <View style={{height: 450, marginTop: 20, marginBottom: 20}}>
                    <Camera pictureTaken={pictureTaken} />
                  </View>
                ) : null}
                {siteImageData ? (
                  <View
                    onLayout={event => console.log(event.nativeEvent.layout)}>
                    <Image
                      source={{uri: `data:image/jpeg;base64,${siteImageData}`}}
                      style={{height: 450}}
                    />
                    <Button
                      type="solid"
                      title={'Delete Image'}
                      color="error"
                      onPress={() => setSiteImageData('')}
                    />
                  </View>
                ) : null}
              </View>

              {/* Abiotic */}
              <Text style={styles.REQUIRED_LABEL}>Add abiotic data</Text>
              <AbioticForm
                abioticData={abioticData}
                onChange={_abioticData => setAbioticData(_abioticData)}
              />

              {/* Sampling Method */}
              <View>
                <Text style={styles.REQUIRED_LABEL}>Observed Taxa</Text>
                <View style={styles.AUTOCOMPLETE_CONTAINER}>
                  <Autocomplete
                    data={filterTaxonList(taxonQuery)}
                    placeholder={'Find species here'}
                    value={taxonQuery}
                    onChange={e => {
                      scrollViewRef?.current?.scrollTo({
                        y: Dimensions.get('window').height,
                        animated: true,
                      });
                    }}
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
                  {observedTaxaList.map(observedTaxon => (
                    <TouchableOpacity
                      key={observedTaxon.taxon.id}
                      style={styles.OBSERVED_TAXA_LIST}
                      onPress={() => checkObservedTaxon(observedTaxon.taxon)}>
                      <CheckBox
                        disabled={false}
                        checked={observedTaxon.checked}
                        onPress={() => checkObservedTaxon(observedTaxon.taxon)}
                      />
                      <Text>{observedTaxon.taxon.canonicalName}</Text>
                      <TextInput
                        keyboardType={'numeric'}
                        editable={true}
                        style={styles.TEXT_INPUT_TAXA}
                        value={observedTaxon.value}
                        onChange={e => {
                          updateObservedTaxonValue(
                            observedTaxon.taxon,
                            e.nativeEvent.text,
                          );
                        }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{marginBottom: 100}}>
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
    </KeyboardAvoidingView>
  );
};
