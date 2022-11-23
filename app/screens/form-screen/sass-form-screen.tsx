import React, {useEffect, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import {ScrollView, Text, View} from 'react-native';
import {styles} from './styles';
import {Header} from '@rneui/themed';
import {Formik} from 'formik';
import {DatetimePicker} from '../../components/form-input/datetime-picker';
import {List, RadioButton} from 'react-native-paper';
import {BiotopeName, BiotopeObjectKey, FormInitialValues} from './sass-form';
import {SassTaxaForm} from '../../components/sass/sass-taxa-form';
import {loadSassTaxa} from '../../models/sass/sass.store';

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
  const {route} = props;
  const [sassTaxaFormOpen, setSassTaxaFormOpen] = useState<any>({});
  const [sassTaxa, setSassTaxa] = useState<any>([]);

  useEffect(() => {
    (async () => {
      const sassTaxaList = await loadSassTaxa();
      setSassTaxa(sassTaxaList);
    })();
  }, []);

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
        <Formik initialValues={FormInitialValues} onSubmit={() => {}}>
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
                onDateChange={(datetime: Date) => (values.date = datetime)}
              />
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
                          value={values[objKey]}
                          label={BiotopeName[objKey]}
                          onValueChange={newValue =>
                            setFieldValue(biotopeKey, newValue)
                          }
                        />
                      );
                    })}
                  </View>
                </List.Accordion>
              </List.Section>
              <Text style={styles.REQUIRED_LABEL}>Taxa</Text>
              <View
                style={{
                  paddingBottom: 10,
                  marginBottom: 125,
                  backgroundColor: '#FFFFFF',
                }}>
                {Object.keys(sassTaxa).map((sassTaxaParent: string) => {
                  type SassTaxaKey = keyof typeof sassTaxa;
                  const objKey = sassTaxaParent as SassTaxaKey;
                  if (sassTaxaFormOpen[sassTaxaParent] === 'undefined') {
                    setSassTaxaFormOpen((formOpen: any) => ({
                      ...formOpen,
                      [sassTaxaParent]: false,
                    }));
                  }
                  return (
                    <View
                      key={sassTaxaParent}
                      style={{backgroundColor: '#FFFFFF', marginTop: 5}}>
                      <Text
                        style={{
                          width: '100%',
                          height: 40,
                          fontSize: 15,
                          fontWeight: 'bold',
                          padding: 10,
                          borderWidth: 1,
                          borderColor: '#c4c4c4',
                          borderRadius: 3,
                          backgroundColor: sassTaxaFormOpen[sassTaxaParent]
                            ? '#eefff1'
                            : '#f1f1f1',
                        }}
                        onPress={() =>
                          setSassTaxaFormOpen((formOpen: any) => ({
                            ...formOpen,
                            [sassTaxaParent]: !sassTaxaFormOpen[sassTaxaParent],
                          }))
                        }>
                        {sassTaxaParent}
                      </Text>
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
                                }}>{sassTaxon}</Text>
                              <SassTaxaForm />
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  );
};
