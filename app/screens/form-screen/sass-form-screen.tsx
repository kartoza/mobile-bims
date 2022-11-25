import React, {useEffect, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import {Alert, Image, ScrollView, Text, TextInput, View} from 'react-native';
import {styles} from './styles';
import {Button, Header} from '@rneui/themed';
import {Formik} from 'formik';
import {DatetimePicker} from '../../components/form-input/datetime-picker';
import {List, RadioButton} from 'react-native-paper';
import {BiotopeName, BiotopeObjectKey, FormInitialValues} from './sass-form';
import {SassTaxaForm} from '../../components/sass/sass-taxa-form';
import {
  allSassSiteVisits,
  loadSassTaxa,
  saveSassSiteVisit,
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
  return (
    <View style={{marginTop: 10, height: 50}}>
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
            <Text style={styles.BIOTOPE_RADIO_LABEL}>0</Text>
            <RadioButton value={'0'} />
            <Text style={styles.BIOTOPE_RADIO_LABEL_2}>1</Text>
            <RadioButton value={'1'} />
            <Text style={styles.BIOTOPE_RADIO_LABEL_2}>2</Text>
            <RadioButton value={'2'} />
            <Text style={styles.BIOTOPE_RADIO_LABEL_2}>3</Text>
            <RadioButton value={'3'} />
            <Text style={styles.BIOTOPE_RADIO_LABEL_2}>4</Text>
            <RadioButton value={'4'} />
            <Text style={styles.BIOTOPE_RADIO_LABEL_2}>5</Text>
            <RadioButton value={'5'} />
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
  const [abioticData, setAbioticData] = useState<AbioticDataInterface[]>([]);

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
    })();
  }, [sassTaxaFormOpen]);

  const pictureTaken = (pictureData: {base64: string}) => {
    setTakingPicture(false);
    setSiteImageData(pictureData.base64);
  };

  const submitForm = async (formData: any) => {
    if (Object.keys(sassTaxaData).length === 0) {
      Alert.alert('Error', 'You must at least add one SASS taxa data\n', [
        {
          text: 'OK',
        },
      ]);
      setSubmitClicked(false);
      return;
    }
    const allSiteVisitsData = await allSassSiteVisits();
    formData.id = allSiteVisitsData.length + 1;
    formData.siteId = sitePk;
    formData.siteImage = siteImageData;
    formData.synced = false;
    formData.newData = true;
    formData.sassTaxa = sassTaxaData;
    formData.abiotic = abioticData.map(current => {
      if (current.value) {
        return {
          id: current.abiotic.id,
          value: current.value,
        };
      }
    });
    const sassSiteVisit = new SassSiteVisit(formData);
    await saveSassSiteVisit(sassSiteVisit);
    props.navigation.navigate('map');
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
          text: 'Add SASS Record',
          style: {fontSize: 18, color: '#fff', fontWeight: 'bold'},
        }}
        containerStyle={styles.HEADER_CONTAINER}
      />

      <ScrollView style={styles.CONTAINER} keyboardShouldPersistTaps="handled">
        <Formik initialValues={FormInitialValues} onSubmit={submitForm}>
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
                onDateChange={(datetime: Date) =>
                  setFieldValue('date', datetime)
                }
              />
              <Text style={styles.REQUIRED_LABEL}>Biotopes</Text>
              <List.Section>
                <List.Accordion
                  style={{
                    borderWidth: 1,
                    borderRadius: 5,
                    borderColor: '#c3c3c3',
                  }}
                  title={'Biotopes Sampled'}>
                  <View style={styles.BIOTOPE_SAMPLED_CONTAINER}>
                    {Object.keys(BiotopeName).map((biotopeKey: string) => {
                      const objKey = biotopeKey as BiotopeObjectKey;
                      return (
                        <BiotopeRadioButtons
                          key={biotopeKey}
                          value={values.biotope[biotopeKey]}
                          label={BiotopeName[objKey]}
                          onValueChange={newValue =>
                            setFieldValue('biotope', {
                              ...values.biotope,
                              ...{
                                [biotopeKey]: newValue,
                              },
                            })
                          }
                        />
                      );
                    })}
                  </View>
                </List.Accordion>
              </List.Section>
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
                  <Image
                    source={{uri: `data:image/jpeg;base64,${siteImageData}`}}
                    style={{height: 450}}
                  />
                ) : null}
              </View>

              {/* Abiotic */}
              <Text style={styles.LABEL}>Abiotic</Text>
              <AbioticForm
                onChange={_abioticData => setAbioticData(_abioticData)}
              />

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
                          backgroundColor: sassTaxaFormOpen[sassTaxaParent]
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
                      {sassTaxaFormOpen[sassTaxaParent] ? (
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
                                onValueChange={(taxaValue: any) => {
                                  // Check if empty values
                                  let empty = true;
                                  for (const i in taxaValue) {
                                    if (taxaValue[i]) {
                                      empty = false;
                                      break;
                                    }
                                  }
                                  if (empty) return;
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
                    }, 500);
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
