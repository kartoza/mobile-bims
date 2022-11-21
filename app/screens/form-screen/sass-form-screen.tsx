import React, {useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ParamListBase} from '@react-navigation/native';
import {Platform, ScrollView, Text, TextInput, View} from 'react-native';
import {styles} from './styles';
import {Header} from '@rneui/themed';
import {Field, Formik} from 'formik';
import {DatetimePicker} from '../../components/form-input/datetime-picker';
import {List, RadioButton} from 'react-native-paper';
import {BiotopeName, BiotopeObjectKey, FormInitialValues} from './sass-form';

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

function SassTaxaForm() {
  return <View></View>
}

export const SassFormScreen: React.FunctionComponent<
  FormScreenProps
> = props => {
  const {route} = props;

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
            <View style={{ height: '100%' }}>
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
              <SassTaxaForm />
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  );
};
