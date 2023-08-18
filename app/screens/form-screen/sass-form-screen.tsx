import React, {useEffect, useRef, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import {Alert, Image, ScrollView, Text, TextInput, View, Switch, TouchableOpacity} from 'react-native';
import {styles} from './styles';
import {Button, Header, Dialog} from '@rneui/themed';
import {Formik} from 'formik';
import {DatetimePicker} from '../../components/form-input/datetime-picker';
import {List, RadioButton} from 'react-native-paper';
import {
  BiotopeName,
  BiotopeObjectKey,
  FormInitialValues,
  SassFormValues,
} from './sass-form';
import {SassTaxaForm} from '../../components/sass/sass-taxa-form';
import {
  allSassSiteVisits,
  getSassSiteVisitByField,
  loadSassTaxa,
  saveSassSiteVisitByField,
} from '../../models/sass/sass.store';
import {load} from '../../utils/storage';
import {Camera} from '../../components/camera/camera';
import {Picker} from '@react-native-picker/picker';
import SourceReference from '../../models/source-reference/source-reference';
import {loadSourceReferences} from '../../models/source-reference/source-reference.store';
import SassSiteVisit from '../../models/sass/sass_site_visit';
import AbioticForm, {
  AbioticDataInterface,
} from '../../components/abiotic/abiotic-form';
import {spacing} from '../../theme/spacing';

interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

interface BiotopeRadioButtonsInterface {
  value: string;
  label: string;
  onValueChange?: (newValue: string) => void;
}

function BiotopeRadioButtons(props: BiotopeRadioButtonsInterface) {
  const [biotopeValue, setBiotopeValue] = useState<string>(props.value);

  useEffect(() => {
    if (props.value) {
      setBiotopeValue(props.value);
    }
  }, [props.value]);

  return (
    <View style={{marginTop: 10, height: 50, marginBottom: 5}}>
      <View>
        <Text>{props.label}</Text>
        <RadioButton.Group
          onValueChange={(newValue: string) => {
            setBiotopeValue(newValue);
            if (props.onValueChange) {
              props.onValueChange(newValue);
            }
          }}
          value={biotopeValue}>
          <View style={styles.BIOTOPE_CONTAINER}>
            <View style={styles.BIOTOPE_ROW}>
              <RadioButton value={'0'} />
              <Text style={styles.BIOTOPE_RADIO_LABEL}>0</Text>
            </View>
            <View style={styles.BIOTOPE_ROW}>
              <RadioButton value={'1'} />
              <Text style={styles.BIOTOPE_RADIO_LABEL}>1</Text>
            </View>
            <View style={styles.BIOTOPE_ROW}>
              <RadioButton value={'2'} />
              <Text style={styles.BIOTOPE_RADIO_LABEL}>2</Text>
            </View>
            <View style={styles.BIOTOPE_ROW}>
              <RadioButton value={'3'} />
              <Text style={styles.BIOTOPE_RADIO_LABEL}>3</Text>
            </View>
            <View style={styles.BIOTOPE_ROW}>
              <RadioButton value={'4'} />
              <Text style={styles.BIOTOPE_RADIO_LABEL}>4</Text>
            </View>
            <View style={styles.BIOTOPE_ROW}>
              <RadioButton value={'5'} />
              <Text style={styles.BIOTOPE_RADIO_LABEL}>5</Text>
            </View>
          </View>
        </RadioButton.Group>
      </View>
    </View>
  );
}

export const SassFormScreen: React.FunctionComponent<
  FormScreenProps
> = props => {
  // @ts-ignore
  const {route} = props;
  const {sitePk} = route.params;
  const [sassTaxaFormOpen, setSassTaxaFormOpen] = useState<any>({});
  const [sassTaxa, setSassTaxa] = useState<any>({});
  const [sassTaxaData, setSassTaxaData] = useState<any>({});
  const [username, setUsername] = useState('');
  const [takingPicture, setTakingPicture] = useState(false);
  const [siteImageData, setSiteImageData] = useState<string>('');
  const [sourceReference, setSourceReference] = useState('');
  const [submitClicked, setSubmitClicked] = useState(false);
  const [sourceReferenceOptions, setSourceReferenceOptions] = useState<
    SourceReference[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [abioticData, setAbioticData] = useState<AbioticDataInterface[]>([]);
  const [biotopeValues, setBiotopeValues] = useState<any>({});
  const [formInitialValues, setFormInitialValues] = useState<SassFormValues>({
    date: new Date(),
    sassTaxa: {},
    biotope: {},
    otherBiota: '',
    comments: '',
  });
  const [accredited, setAccredited] = useState<boolean>(false);
  const formikRef = useRef();

  useEffect(() => {
    if (
      formInitialValues &&
      Object.keys(formInitialValues.biotope).length > 0
    ) {
      formikRef.current?.resetForm();
    }
  }, [formInitialValues]);

  useEffect(() => {
    (async () => {
      if (route.params.sassId) {
        const sassSiteVisits = await getSassSiteVisitByField(
          'id',
          route.params.sassId,
        );
        if (sassSiteVisits.length === 0) {
          return false;
        }
        const sassSiteVisit = sassSiteVisits[0];
        setFormInitialValues({
          id: sassSiteVisit.id,
          siteId: sassSiteVisit.siteId,
          date: new Date(sassSiteVisit.date),
          sassTaxa: sassSiteVisit.sassTaxa,
          biotope: sassSiteVisit.biotope,
          otherBiota: sassSiteVisit.otherBiota,
          comments: sassSiteVisit.comments,
          accredited: sassSiteVisit.accredited,
        });
        setAccredited(sassSiteVisit.accredited);
        setBiotopeValues(sassSiteVisit.biotope);
        setAbioticData(sassSiteVisit.abiotic);
        setSourceReference(sassSiteVisit.sourceReferenceId);
        setSassTaxaData(sassSiteVisit.sassTaxa);
        if (sassSiteVisit.siteImage) {
          setSiteImageData(sassSiteVisit.siteImage);
        }
      }
    })();
  }, [route.params.sassId]);

  useEffect(() => {
    (async () => {
      const sassTaxaList = await loadSassTaxa();
      if (sassTaxaList) {
        setSassTaxa(sassTaxaList);
      }
      setUsername(await load('user'));
      const _sourceReferenceList = await loadSourceReferences();
      setSourceReferenceOptions(_sourceReferenceList);
      for (const _sassTaxa in sassTaxaList) {
        if (sassTaxaFormOpen[_sassTaxa] === 'undefined') {
          setSassTaxaFormOpen((formOpen: any) => ({
            ...formOpen,
            [_sassTaxa]: true,
          }));
        }
      }
      setLoading(false);
    })();
  }, [sassTaxaFormOpen]);

  const pictureTaken = (pictureData: {base64: string}) => {
    setTakingPicture(false);
    setSiteImageData(pictureData.base64);
  };

  const goToPreviousScreen = React.useMemo(
    () => () => {
      props.navigation.pop();
      if (typeof route.params.onBack !== 'undefined') {
        route.params.onBack();
      }
    },
    [props.navigation, route.params],
  );

  const submitForm = async (formData: any) => {
    if (Object.keys(sassTaxaData).length === 0) {
      Alert.alert('Error', 'You must at least add one SASS taxa data\n', [
        {
          text: 'OK',
          onPress: () => setSubmitClicked(false),
        },
      ]);
      return;
    }
    const allSiteVisitsData = await allSassSiteVisits();
    formData.id = formInitialValues.id
      ? formInitialValues.id
      : allSiteVisitsData.length + 1;
    formData.siteId = formInitialValues.siteId
      ? formInitialValues.siteId
      : sitePk;
    formData.siteImage = siteImageData;
    formData.synced = false;
    formData.newData = true;
    formData.sassTaxa = sassTaxaData;
    formData.biotope = biotopeValues;
    formData.accredited = accredited;
    formData.sourceReferenceId = sourceReference;
    formData.abiotic = abioticData.map(current => {
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
    const sassSiteVisit = new SassSiteVisit(formData);
    await saveSassSiteVisitByField('id', sassSiteVisit.id, sassSiteVisit);
    goToPreviousScreen();
  };

  return (
    <View>
      <Dialog
        isVisible={loading}
        overlayStyle={{backgroundColor: '#FFFFFF00', shadowColor: '#FFFFFF00'}}>
        <Dialog.Loading />
      </Dialog>
      <Header
        placement="center"
        leftComponent={{
          icon: 'chevron-left',
          type: 'font-awesome',
          color: '#fff',
          onPress: goToPreviousScreen,
        }}
        centerComponent={{
          text: route.params.title ? route.params.title : 'Add SASS Record',
          style: {fontSize: 18, color: '#fff', fontWeight: 'bold'},
        }}
        containerStyle={styles.HEADER_CONTAINER}
      />

      <ScrollView style={styles.CONTAINER} keyboardShouldPersistTaps="handled">
        <Formik
          enableReinitialize={true}
          innerRef={formikRef}
          initialValues={formInitialValues}
          onSubmit={submitForm}>
          {({
            /* eslint-disable @typescript-eslint/no-unused-vars */
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            values,
          }) => (
            <View style={{height: '100%'}}>
              <DatetimePicker
                date={values.date}
                onDateChange={(datetime: Date) =>
                  setFieldValue('date', datetime)
                }
              />
              <Text style={styles.REQUIRED_LABEL}>Biotopes</Text>
              <View style={styles.BIOTOPE_SAMPLED_CONTAINER}>
                {Object.keys(BiotopeName).map((biotopeKey: string) => {
                  const objKey = biotopeKey as BiotopeObjectKey;
                  return (
                    <BiotopeRadioButtons
                      key={biotopeKey}
                      value={values.biotope[objKey]}
                      label={BiotopeName[objKey]}
                      onValueChange={newValue =>
                        setBiotopeValues({
                          ...biotopeValues,
                          ...{
                            [biotopeKey]: newValue,
                          },
                        })
                      }
                    />
                  );
                })}
              </View>
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
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: spacing[3],
                }}>
                <Switch
                  value={accredited}
                  onValueChange={value => setAccredited(value)}
                />
                <TouchableOpacity onPress={() => setAccredited(!accredited)}>
                  <Text style={{color: '#000'}}>
                    Accredited at the time of collection
                  </Text>
                </TouchableOpacity>
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
                    setFieldValue('sourceReference', itemValue);
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
                  containerStyle={{width: '100%', marginBottom: 20}}
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
              <Text style={styles.LABEL_IMPORTANT}>Add abiotic data</Text>
              <AbioticForm
                abioticData={abioticData}
                onChange={_abioticData => setAbioticData(_abioticData)}
              />

              <View style={{marginTop: spacing[8]}} />
              <Text style={styles.REQUIRED_LABEL}>Taxa</Text>
              <View
                style={{
                  paddingBottom: 10,
                  backgroundColor: '#FFFFFF',
                }}>
                {Object.keys(sassTaxa).map((sassTaxaParent: string) => {
                  type SassTaxaKey = keyof typeof sassTaxa;
                  const objKey = sassTaxaParent as SassTaxaKey;

                  return (
                    <View
                      key={sassTaxaParent}
                      style={{backgroundColor: '#FFFFFF', marginTop: 5}}>
                      <Button
                        buttonStyle={{
                          justifyContent: 'flex-start',
                          backgroundColor:
                            sassTaxaFormOpen[sassTaxaParent] ||
                            values.sassTaxa[sassTaxaParent]
                              ? '#79d089'
                              : '#afb4bb',
                        }}
                        titleStyle={{
                          fontSize: 15,
                          fontWeight: '100',
                        }}
                        style={{
                          paddingLeft: 0,
                          justifyContent: 'flex-start',
                          alignItems: 'flex-start',
                          width: '100%',
                        }}
                        onPress={() => {
                          setSassTaxaFormOpen((formOpen: any) => ({
                            ...formOpen,
                            [sassTaxaParent]: !sassTaxaFormOpen[sassTaxaParent],
                          }));
                          if (sassTaxaFormOpen[sassTaxaParent]) {
                            if (sassTaxaParent in values.sassTaxa) {
                              delete values.sassTaxa[sassTaxaParent];
                            }
                          }
                        }}>
                        {sassTaxaParent}
                      </Button>
                      {sassTaxaFormOpen[sassTaxaParent] ||
                      values.sassTaxa[sassTaxaParent] ? (
                        <View
                          style={{
                            padding: 10,
                            paddingTop: 5,
                          }}>
                          {sassTaxa[objKey].map((sassTaxon: string) => (
                            <View key={sassTaxon}>
                              <Text
                                style={{
                                  fontWeight: 'bold',
                                  marginBottom: 5,
                                  marginTop: 10,
                                }}>
                                {sassTaxon}
                              </Text>
                              <SassTaxaForm
                                initialValue={
                                  values.sassTaxa[sassTaxaParent]
                                    ? values.sassTaxa[sassTaxaParent][sassTaxon]
                                    : {}
                                }
                                onValueChange={(taxaValue: any) => {
                                  // Check if empty values
                                  let empty = true;
                                  for (const i in taxaValue) {
                                    if (taxaValue[i]) {
                                      empty = false;
                                      break;
                                    }
                                  }
                                  if (empty) {
                                    return;
                                  }
                                  setSassTaxaData({
                                    ...sassTaxaData,
                                    ...{
                                      [sassTaxaParent]: {
                                        ...sassTaxaData[sassTaxaParent],
                                        [sassTaxon]: taxaValue,
                                      },
                                    },
                                  });
                                  return;
                                }}
                              />
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <Text style={styles.LABEL}>Other biota</Text>
              <TextInput
                value={values.otherBiota}
                multiline={true}
                style={[
                  styles.TEXT_INPUT_STYLE,
                  {height: 100, textAlignVertical: 'top'},
                ]}
                onChange={e => {
                  if (e.nativeEvent.text) {
                    setFieldValue('otherBiota', e.nativeEvent.text);
                  }
                }}
              />

              <Text style={styles.LABEL}>Comments/Observation</Text>
              <TextInput
                multiline={true}
                value={values.comments}
                style={[
                  styles.TEXT_INPUT_STYLE,
                  {height: 100, textAlignVertical: 'top', marginBottom: 10},
                ]}
                onChange={e => {
                  if (e.nativeEvent.text) {
                    setFieldValue('comments', e.nativeEvent.text);
                  }
                }}
              />

              <View style={{marginBottom: 150}}>
                <Button
                  disabled={submitClicked}
                  title="Submit"
                  buttonStyle={{
                    width: '100%',
                    backgroundColor: 'rgb(241, 137, 3)',
                  }}
                  onPress={() => {
                    setSubmitClicked(true);
                    setTimeout(() => {
                      (async () => {
                        await submitForm(values);
                      })();
                    }, 300);
                  }}
                />
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  );
};
