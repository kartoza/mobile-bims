import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {Button, TextInput} from 'react-native-paper';
import Abiotic from '../../models/abiotic/abiotic';
import {loadAbioticData} from '../../models/abiotic/abiotic.store';
import {styles} from '../../screens/form-screen/styles';
import {Picker} from '@react-native-picker/picker';

interface AbioticDataInterface {
  abiotic: Abiotic;
  value: string;
}

interface AbioticFormInterface {
  onChange?: (abioticData: AbioticDataInterface[]) => void;
}

export default function AbioticForm(props: AbioticFormInterface) {
  const [abioticOptions, setAbioticOptions] = useState<Abiotic[]>([]);
  const [selectedAbiotic, setSelectedAbiotic] = useState<string>('');
  const [abioticData, setAbioticData] = useState<AbioticDataInterface[]>([]);

  useEffect(() => {
    (async () => {
      const abioticList = await loadAbioticData();
      setAbioticOptions(abioticList);
    })();
  }, []);

  useEffect(() => {
    if (props.onChange) {
      props.onChange(abioticData);
    }
  }, [props, abioticData]);

  const addAbiotic = () => {
    abioticOptions.map((abioticOption: Abiotic) => {
      if (abioticOption.id === parseInt(selectedAbiotic)) {
        const newAbioticData = {
          abiotic: abioticOption,
          value: '0',
        };
        setAbioticData([...abioticData, newAbioticData]);
      }
    });
    setAbioticOptions(current =>
      current.filter(
        abioticOption => abioticOption.id !== parseInt(selectedAbiotic),
      ),
    );
  };

  return (
    <View>
      <View style={styles.TEXT_INPUT_STYLE}>
        <Picker
          selectedValue={selectedAbiotic}
          style={styles.PICKER_INPUT_STYLE}
          onValueChange={itemValue => {
            setSelectedAbiotic(itemValue);
          }}>
          <Picker.Item key="not_specified" label="Not specified" value="" />
          {abioticOptions.map(abioticOption => (
            <Picker.Item
              key={abioticOption.id}
              label={abioticOption.description}
              value={abioticOption.id}
            />
          ))}
        </Picker>
      </View>
      <Button onPress={addAbiotic}>Add Abiotic</Button>
      <View>
        {abioticData.map(abioticSingleData => (
          <TextInput
            key={abioticSingleData.abiotic.id}
            label={abioticSingleData.abiotic.description}
            keyboardType={'numeric'}
            value={abioticSingleData.value}
            onChange={e => {
              setAbioticData(current =>
                current.map(obj => {
                  if (obj.abiotic.id === abioticSingleData.abiotic.id) {
                    return {...obj, value: e.nativeEvent.text};
                  }
                  return obj;
                }),
              );
            }}
          />
        ))}
      </View>
    </View>
  );
}
