import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {styles} from '../../screens/form-screen/styles';

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
    <View>
      {props.label ? (
        <Text
          style={{
            fontSize: 11,
            fontWeight: 'bold',
            paddingLeft: 5,
            paddingTop: 5,
          }}>
          {props.label}
        </Text>
      ) : null}
      <View
        style={{
          width: '100%',
          height: 70,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text
          style={{
            width: '100%',
            paddingLeft: '50%',
            height: 65,
            fontSize: 18,
            color: '#000000',
          }}>
          {dropdownValue}
        </Text>
      </View>
      <Picker
        style={{position: 'absolute', top: 0, width: 200, height: 200}}
        onValueChange={(newValue: string) => {
          if (props.onValueChange) {
            props.onValueChange(newValue);
          }
          setDropdownValue(newValue);
        }}
        selectedValue={dropdownValue}>
        <Picker.Item label={''} value={''} />
        {SASSTaxaRatings.map(sassTaxaRating => (
          <Picker.Item
            label={sassTaxaRating}
            value={sassTaxaRating}
            key={sassTaxaRating}
          />
        ))}
      </Picker>
    </View>
  );
}

interface SassTaxaFormInterface {
  onValueChange?: (newValue: any) => void;
}

export function SassTaxaForm(prop: SassTaxaFormInterface) {
  const [taxaValues, setTaxaValues] = useState<any>({});
  const [siteRanking, setSiteRanking] = useState<string>('');
  const updateTaxaValues = (type: string, value: string) => {
    taxaValues[type] = value;
    setTaxaValues((taxaValue: any) => ({...taxaValue, [type]: value}));
  };

  useEffect(() => {
    let highest: string = '';
    Object.keys(taxaValues).forEach(taxaValue => {
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
    setSiteRanking(highest);
  }, [taxaValues]);

  return (
    <View style={{ backgroundColor: '#FFFFFF' }}>
      <View style={styles.SASS_TAXA_FORM}>
        <View style={styles.SASS_TAXA_DROPDOWN}>
          <SASSPicker
            label={'Stones'}
            onValueChange={newValue => updateTaxaValues('stones', newValue)}
          />
        </View>
        <View style={styles.SASS_TAXA_DROPDOWN}>
          <SASSPicker
            label={'Vegetation'}
            onValueChange={newValue => updateTaxaValues('vegetation', newValue)}
          />
        </View>
        <View style={styles.SASS_TAXA_DROPDOWN}>
          <SASSPicker
            label={'Gravel, sand, mud'}
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
              console.log('newValue', newValue);
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
