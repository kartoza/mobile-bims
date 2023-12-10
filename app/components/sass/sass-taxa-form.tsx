/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {Text, View, StyleSheet, Platform} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {styles} from '../../screens/form-screen/styles';
import { CustomPicker } from '../form-input/custom-picker';

const pickerStyles = StyleSheet.create({
  picker: {
    ...Platform.select({
      ios: {
        backgroundColor: 'transparent',
        paddingRight: 10, // Adjust this value to align the text
      },
      android: {
        width: 100,
        marginLeft: 60,
        height: 10,
        marginTop: 10
      },
    }),
  },
});

interface SASSPickerInterface {
  label?: string;
  onValueChange?: (newValue: string) => void;
  value?: string;
}
const SASSTaxaRatings = ['1', 'A', 'B', 'C', 'D'];

function SASSPicker(props: SASSPickerInterface) {
  const [dropdownValue, setDropdownValue] = useState<string>(
    props.value ? props.value : '',
  );
  useEffect(() => {
    if (props.value) {
      setDropdownValue(props.value);
    }
  }, [props.value]);
  return (
    <View style={{display: 'flex'}}>
      {props.label ? (
        <Text
          style={{
            fontSize: 9,
            fontWeight: 'bold',
            paddingLeft: 5,
            paddingTop: 5,
            height: 20,
          }}>
          {props.label}
        </Text>
      ) : null}
      <View
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 5,
        }}>
        <CustomPicker
          iosStyle={{
            width: '100%',
            alignItems: 'center',
          }}
          selectedValue={dropdownValue}
          unspecifiedLabel={'-'}
          options={SASSTaxaRatings.map(sassTaxaRating => {
            return {
              id: sassTaxaRating,
              name: sassTaxaRating,
            };
          })}
          onValueChange={(newValue: string) => {
            if (props.onValueChange) {
              props.onValueChange(newValue);
            }
            setDropdownValue(newValue);
          }}
        />
      </View>
    </View>
  );
}

interface SassTaxaFormInterface {
  onValueChange?: (newValue: any) => void;
  initialValue?: any;
}

export function SassTaxaForm(prop: SassTaxaFormInterface) {
  const [taxaValues, setTaxaValues] = useState<any>({});
  const [siteRanking, setSiteRanking] = useState<string>('');
  const updateTaxaValues = (type: string, value: string) => {
    taxaValues[type] = value;
    setTaxaValues((taxaValue: any) => ({...taxaValue, [type]: value}));
  };

  useEffect(() => {
    if (prop.initialValue && Object.keys(taxaValues).length === 0) {
      setTaxaValues(prop.initialValue);
      setSiteRanking(prop.initialValue.site);
    }
  }, [prop.initialValue]);

  useEffect(() => {
    let highest: string = '';
    let _siteRanking = '';
    if (taxaValues.hasOwnProperty('site')) {
      _siteRanking = taxaValues.site;
    }
    Object.keys(taxaValues).forEach(taxaValue => {
      if (taxaValue === 'site' && Object.keys(taxaValues).length > 1) {
        return false;
      }
      if (!siteRanking && _siteRanking) {
        highest = _siteRanking;
      }
      if (!highest) {
        highest = taxaValues[taxaValue];
      } else {
        if (
          SASSTaxaRatings.indexOf(taxaValues[taxaValue]) >
          SASSTaxaRatings.indexOf(highest)
        ) {
          highest = taxaValues[taxaValue];
        }
      }
    });
    if (prop.onValueChange) {
      prop.onValueChange({...taxaValues, site: highest});
    }
    if (highest) {
      setSiteRanking(highest);
    } else {
      setSiteRanking(_siteRanking);
    }
  }, [taxaValues]);

  return (
    <View style={{backgroundColor: '#FFFFFF'}}>
      <View style={styles.SASS_TAXA_FORM}>
        <View style={styles.SASS_TAXA_DROPDOWN}>
          <SASSPicker
            label={'Stones'}
            value={taxaValues.stones}
            onValueChange={newValue => updateTaxaValues('stones', newValue)}
          />
        </View>
        <View style={styles.SASS_TAXA_DROPDOWN}>
          <SASSPicker
            label={'Vegetation'}
            value={taxaValues.vegetation}
            onValueChange={newValue => updateTaxaValues('vegetation', newValue)}
          />
        </View>
        <View style={styles.SASS_TAXA_DROPDOWN}>
          <SASSPicker
            label={'Gravel, sand, mud'}
            value={taxaValues.gravel_sand_mud}
            onValueChange={newValue =>
              updateTaxaValues('gravel_sand_mud', newValue)
            }
          />
        </View>
      </View>
      <View style={styles.SASS_TAXA_FORM}>
        <View
          style={[
            styles.SASS_TAXA_DROPDOWN,
            {maxWidth: '100%', width: '100%'},
          ]}>
          <SASSPicker
            label={'Site'}
            value={siteRanking}
            onValueChange={newValue => {
              if (!newValue) {
                return;
              }
              setSiteRanking(newValue);
              if (prop.onValueChange) {
                prop.onValueChange({...taxaValues, site: newValue});
              }
            }}
          />
        </View>
      </View>
    </View>
  );
}
