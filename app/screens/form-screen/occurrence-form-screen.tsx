/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef} from 'react';
import RNFS from 'react-native-fs';
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
  Keyboard,
  BackHandler,
} from 'react-native';
import {Button, Header, CheckBox, Dialog, Icon} from '@rneui/themed';
import {Formik} from 'formik';
import {Picker} from '@react-native-picker/picker';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import {styles} from './styles';
import {Camera as CameraVision, useCameraDevices} from 'react-native-vision-camera';
import {
  loadTaxonGroups,
  loadTaxa,
  getTaxonGroupByField,
} from '../../models/taxon/taxon.store';
import {loadOptions} from '../../models/options/option.store';
import Taxon from '../../models/taxon/taxon';
import {load} from '../../utils/storage';
import SiteVisit, {OccurrencePhoto} from '../../models/site_visit/site_visit';
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
import {spacing} from '../../theme/spacing';
import {ButtonGroup} from '@rneui/base';

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
  const [ecosystemType, setEcosystemType] = useState<string>(
    route.params.ecosystemType || '',
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [date, setDate] = useState(new Date());
  const [broadBiotope, setBroadBiotope] = useState('');
  const [hydroperiod, setHydroperiod] = useState('');
  const [specificBiotope, setSpecificBiotope] = useState('');
  const [substratum, setSubstratum] = useState('');
  const [samplingMethod, setSamplingMethod] = useState('');
  const [recordType, setRecordType] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [sourceReferenceOptions, setSourceReferenceOptions] = useState<
    SourceReference[]
  >([]);
  const [broadBiotopeOptions, setBroadBiotopeOptions] = useState<Option[]>([]);
  const [hydroperiodOptions, setHydroperiodOptions] = useState<Option[]>([]);
  const [specificBiotopeOptions, setSpecificBiotopeOptions] = useState<
    Option[]
  >([]);
  const [substratumOptions, setSubstratumOptions] = useState<Option[]>([]);
  const [samplingMethodOptions, setSamplingMethodOptions] = useState<Option[]>(
    [],
  );
  const [siteImageData, setSiteImageData] = useState<string>('');
  const [taxonQuery, setTaxonQuery] = useState('');
  const [taxaList, setTaxaList] = useState([]);
  const [observedTaxaList, setObservedTaxaList] = useState<
    ObservedTaxonInterface[]
  >([]);
  const [username, setUsername] = useState('');
  const [abioticData, setAbioticData] = useState<AbioticDataInterface[]>([]);
  const [takingPicture, setTakingPicture] = useState<boolean>(false);
  const [capturedPhotos, setCapturedPhotos] = useState<OccurrencePhoto[]>([]);
  const [deletedPhotos, setDeletedPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [lastYPosition, setLastYPosition] = useState<number>(0);
  const [selectedTaxon, setSelectedTaxon] = useState<Taxon | null>(null);

  let scrollViewRef = useRef();
  const devices = useCameraDevices();
  const device = devices.back;
  let cameraRef = useRef<CameraVision | null>(null);

  const recordTypeOptions = [
    'Visual observation',
    'Photographic record',
    'Specimen collection',
    'Acoustic record',
    'DNA sample',
  ];

  const onScroll = (e: any) => {
    setLastYPosition(e.nativeEvent.contentOffset.y);
  };

  const handleBackPress = () => {
    if (takingPicture) {
      setTakingPicture(false);
      return true; // prevent default behavior (exit app)
    }
    if (deletedPhotos) {
      for (const deletedPhoto of deletedPhotos) {
        RNFS.unlink(deletedPhoto)
          .then(() => {
            console.log('File deleted');
          })
          .catch(err => {
            console.error('Failed to delete file:', err);
            return;
          });
      }
    }

    return false; // execute default behavior
  };

  useEffect(() => {
    if (!takingPicture) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({y: lastYPosition, animated: false});
      }
      setSelectedTaxon(null);
    }
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [takingPicture]);

  useEffect(() => {
    if (capturedPhotos.length > currentPhotoIndex + 1) {
      setCurrentPhotoIndex(capturedPhotos.length - 1);
    }
  }, [takingPicture, capturedPhotos]);

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
          setEcosystemType(_siteVisit.site.ecosystemType || '');
        }
      }
      const _taxonGroups = await loadTaxonGroups();
      const taxonGroup = _taxonGroups.find(
        (_taxonGroup: {id: any}) => _taxonGroup.id === _modulePK,
      );
      if (taxonGroup) {
        const _options = await loadOptions(taxonGroup.id);
        const _hydroperiodOptions = _options.filter(
          (_option: {key: string}) => _option.key === 'hydroperiod',
        );
        setHydroperiodOptions(_hydroperiodOptions);
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
        if (_siteVisit.hydroperiod) {
          setHydroperiod(_siteVisit.hydroperiod);
        }
        if (_siteVisit.sourceReferenceId) {
          setSourceReference(_siteVisit.sourceReferenceId);
        }
        if (_siteVisit.siteImage) {
          setSiteImageData(_siteVisit.siteImage);
        }
        if (_siteVisit.recordType) {
          setRecordType(_siteVisit.recordType);
        }
        if (_siteVisit.occurrencePhotos) {
          setCapturedPhotos(_siteVisit.occurrencePhotos);
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
      if (typeof route.params.onBack !== 'undefined') {
        route.params.onBack();
      }
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

    if (deletedPhotos) {
      for (const deletedPhoto of deletedPhotos) {
        RNFS.unlink(deletedPhoto)
          .then(() => {
            console.log('File deleted');
          })
          .catch(err => {
            console.error('Failed to delete file:', err);
            return;
          });
      }
    }

    const site = await getSiteByField('id', _sitePk);
    const taxonGroup = await getTaxonGroupByField('id', parseInt(_modulePK));
    const allSiteVisitsData = await allSiteVisits();

    let _siteVisitId = allSiteVisitsData.length + 1;
    if (siteVisit) {
      _siteVisitId = siteVisit.id;
    }

    const siteVisitData: SiteVisit = {
      id: _siteVisitId,
      site: site,
      taxonGroup: taxonGroup,
      date: date,
      siteImage: siteImageData,
      observedTaxa: observedTaxaValues,
      samplingMethod: samplingMethod,
      recordType: recordType,
      specificBiotope: specificBiotope,
      sourceReferenceId: sourceReference,
      substratum: substratum,
      biotope: broadBiotope,
      owner: username,
      abiotic: abioticDataPayload,
      occurrencePhotos: capturedPhotos,
      newData: true,
      synced: false,
      hydroperiod: hydroperiod,
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

  const blobToBase64 = (blob: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(String(reader.result));
      };
      reader.readAsDataURL(blob);
    });
  };

  const fetchImage = async (uri: string) => {
    const imageResponse = await fetch(uri);
    const imageBlob = await imageResponse.blob();
    const base64Data = await blobToBase64(imageBlob);
    setSiteImageData(base64Data.split(',')[1]);
  };

  const openCamera = async (observedTaxon: Taxon) => {
    // Open the camera
    const cameraPermission = await CameraVision.requestCameraPermission();
    if (cameraPermission === 'authorized') {
      setSelectedTaxon(observedTaxon);
      setTakingPicture(true);
    }
  };

  const capturePhoto = async () => {
    if (cameraRef !== null && cameraRef.current) {
      const _photo = await cameraRef.current.takePhoto();
      if (!selectedTaxon) {
        await fetchImage(`file://${_photo.path}`);
        await RNFS.unlink(_photo.path);
      } else {
        const photo: OccurrencePhoto = {
          path: _photo.path,
          id: new Date().getTime(),
          taxonId: selectedTaxon?.id,
          name: selectedTaxon?.canonicalName,
        };
        setCapturedPhotos(prevPhotos => [...prevPhotos, photo]);
      }
      setTakingPicture(false);
    }
  };

  const nextPhoto = () => {
    if (currentPhotoIndex < capturedPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const deletePhoto = () => {
    // Delete file from storage
    const fileUri = capturedPhotos[currentPhotoIndex].path;
    setDeletedPhotos(_deletedPhoto => [..._deletedPhoto, fileUri]);
    const newPhotos = capturedPhotos.filter(
      (_, index) => index !== currentPhotoIndex,
    );
    setCapturedPhotos(newPhotos);
    if (currentPhotoIndex >= newPhotos.length && newPhotos.length > 0) {
      setCurrentPhotoIndex(newPhotos.length - 1);
    } else {
      setCurrentPhotoIndex(0);
    }
  };

  const updatePhotoIndex = (selectedIndex: number) => {
    if (selectedIndex === 0) {
      prevPhoto();
    } else if (selectedIndex === 2) {
      nextPhoto();
    } else {
      deletePhoto();
    }
  };

  if (takingPicture && device) {
    return (
      <View style={{flex: 1}}>
        <CameraVision
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          ref={cameraRef}
          photo={true}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 16,
          }}>
          <Button title="Capture" onPress={capturePhoto} />
        </View>
      </View>
    );
  }

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
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        ref={scrollViewRef}>
        <Formik
          initialValues={{
            hydroperiod: '',
            broadBiotope: '',
            specificBiotope: '',
            samplingMethod: '',
            substratum: '',
            sourceReference: '',
            recordType: '',
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
              {ecosystemType && ecosystemType.toLowerCase() === 'wetland' ? (
                <>
                  <Text style={styles.LABEL}>Hydroperiod</Text>
                  <View style={styles.TEXT_INPUT_STYLE}>
                    <Picker
                      selectedValue={hydroperiod}
                      style={styles.PICKER_INPUT_STYLE}
                      onValueChange={itemValue => {
                        setHydroperiod(itemValue);
                        values.hydroperiod = itemValue;
                      }}>
                      <Picker.Item
                        key="not_specified"
                        label="Not specified"
                        value=""
                      />
                      {hydroperiodOptions.map(hydroperiodOption => (
                        <Picker.Item
                          key={hydroperiodOption.id}
                          label={hydroperiodOption.name}
                          value={hydroperiodOption.id}
                        />
                      ))}
                    </Picker>
                  </View>
                </>
              ) : null}
              {/* Broad biotope */}
              <Text style={styles.LABEL}>Broad Biotope / Habitat</Text>
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

              {/* Record Type */}
              <View>
                <Text style={styles.LABEL}>Record Type</Text>
                <View style={styles.TEXT_INPUT_STYLE}>
                  <Picker
                    selectedValue={recordType}
                    style={styles.PICKER_INPUT_STYLE}
                    onValueChange={itemValue => {
                      setRecordType(itemValue);
                      values.recordType = itemValue;
                    }}>
                    <Picker.Item
                      key="not_specified"
                      label="Not specified"
                      value=""
                    />
                    {recordTypeOptions.map(option => (
                      <Picker.Item key={option} label={option} value={option} />
                    ))}
                  </Picker>
                </View>
              </View>
              {/* Capture Image */}
              <View style={{marginTop: 10, marginBottom: 10}}>
                <Text style={styles.LABEL}>Site Image</Text>
                <Button
                  icon={
                    <Icon name="camera" type="font-awesome" color={'#008BE3'} />
                  }
                  title={' Capture Site Image'}
                  type="outline"
                  raised
                  containerStyle={{width: '100%'}}
                  onPress={() => {
                    setTakingPicture(true);
                  }}
                />
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

              {/* Sampling Method */}
              <View>
                <Text style={styles.REQUIRED_LABEL}>Observed Taxa</Text>
                <View style={[styles.AUTOCOMPLETE_CONTAINER, {zIndex: 2}]}>
                  <Autocomplete
                    data={filterTaxonList(taxonQuery)}
                    placeholder={'Type taxon name here'}
                    value={taxonQuery}
                    onChange={e => {
                      scrollViewRef.current?.scrollTo({
                        y: 600 + (siteImageData ? 450 : 0) + 50,
                        animated: true,
                      });
                    }}
                    onChangeText={setTaxonQuery}
                    flatListProps={{
                      horizontal: false,
                      nestedScrollEnabled: true,
                      keyboardShouldPersistTaps: 'always',
                      keyExtractor: (taxon: Taxon) => '' + taxon.id,
                      renderItem: (taxon: any) => {
                        taxon = taxon.item;
                        return (
                          <TouchableOpacity
                            style={styles.AUTOCOMPLETE_LIST}
                            onPress={() => {
                              addTaxon(taxon);
                              Keyboard.dismiss();
                            }}>
                            <Text style={styles.AUTOCOMPLETE_LIST_TEXT}>
                              {taxon.canonicalName}
                            </Text>
                          </TouchableOpacity>
                        );
                      },
                    }}
                  />
                </View>
                <View style={{marginTop: 50}}>
                  {observedTaxaList.length > 0 && (
                    <Text style={{color: 'black', textAlign: 'right'}}>
                      Abundance (Number)
                    </Text>
                  )}
                </View>
                <View>
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
                      <Button
                        buttonStyle={{
                          height: 43,
                        }}
                        containerStyle={{
                          marginRight: 5,
                          backgroundColor: 'red',
                        }}
                        onPress={async () =>
                          await openCamera(observedTaxon.taxon)
                        }
                        radius={5}>
                        <Icon
                          size={13}
                          name="camera"
                          color="white"
                          type="font-awesome"
                        />
                      </Button>
                    </TouchableOpacity>
                  ))}
                </View>
                {capturedPhotos.length > 0 ? (
                  <ScrollView style={{backgroundColor: '#FFF', borderRadius: 5, padding: 10}}>
                    <Text
                      style={{
                        textAlign: 'center',
                        marginBottom: 5,
                        fontSize: 14,
                      }}>
                      {capturedPhotos[currentPhotoIndex].name}
                    </Text>
                    <Image
                      key={currentPhotoIndex}
                      source={{
                        uri:
                          'file://' + capturedPhotos[currentPhotoIndex].path,
                      }}
                      style={{
                        height: 400,
                        resizeMode: 'contain',
                        marginBottom: 5,
                      }}
                    />
                    <Text style={{textAlign: 'center'}}>
                      {currentPhotoIndex + 1} / {capturedPhotos.length}
                    </Text>
                    <ButtonGroup
                      buttons={['<', 'Delete', '>']}
                      onPress={updatePhotoIndex}
                    />
                  </ScrollView>
                ) : null}
              </View>

              {/* Abiotic */}
              <Text style={{...styles.REQUIRED_LABEL, marginTop: 20}}>Add abiotic data</Text>
              <AbioticForm
                abioticData={abioticData}
                scrollViewRef={scrollViewRef}
                onChange={_abioticData => setAbioticData(_abioticData)}
              />

              {/* Source References */}
              <View style={{marginTop: spacing[8]}} />
              <Text style={styles.LABEL}>Source Reference</Text>
              <View
                style={{marginBottom: spacing[5], ...styles.TEXT_INPUT_STYLE}}>
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
