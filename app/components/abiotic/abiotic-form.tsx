import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {Button, TextInput} from 'react-native-paper';
import Abiotic from '../../models/abiotic/abiotic';
import {loadAbioticData} from '../../models/abiotic/abiotic.store';
import {styles} from '../../screens/form-screen/styles';
import {Picker} from '@react-native-picker/picker';

export interface AbioticDataInterface {
  abiotic: Abiotic;
  value: string;
}

interface AbioticFormInterface {
  onChange?: (abioticData: AbioticDataInterface[]) => void;
  abioticData?: any[];
}

export default function AbioticForm(props: AbioticFormInterface) {
  const [abioticOptions, setAbioticOptions] = useState<Abiotic[]>([]);
  const [existingAbioticData, setExistingAbioticData] = useState<any[]>([]);
  const [abioticOptionList, setAbioticOptionList] = useState<Abiotic[]>([]);
  const [selectedAbiotic, setSelectedAbiotic] = useState<string>('');
  const [abioticData, setAbioticData] = useState<AbioticDataInterface[]>([]);
  const [isAddAbiotic, setIsAddAbiotic] = useState<boolean>(false);

  useEffect(() => {
    if (props.abioticData && abioticData.length === 0) {
      setExistingAbioticData(props.abioticData);
      const _existingData = [];
      for (const abioticOption of abioticOptionList) {
        for (const _abioticData of props.abioticData) {
          if (_abioticData.id === abioticOption.id) {
            _existingData.push({
              abiotic: abioticOption,
              value: _abioticData.value,
            });
          }
        }
      }
      if (_existingData.length > 0) {
        setAbioticData(_existingData);
      }
    }
  }, [props]);

  useEffect(() => {
    if (abioticOptionList.length > 0) {
      setAbioticOptions(abioticOptionList);
    }
  }, [abioticOptionList]);

  useEffect(() => {
    if (abioticOptions.length === 0) {
      (async () => {
        const abioticList = await loadAbioticData();
        setAbioticOptionList(abioticList);
      })();
    }
  }, [abioticOptions.length, props]);

  useEffect(() => {
    if (props.onChange) {
      props.onChange(abioticData);
    }
    const selectedAbioticOptions = abioticData.map(
      current => current.abiotic.id,
    );
    setAbioticOptions(
      abioticOptionList.filter(
        current => selectedAbioticOptions.indexOf(current.id) <= -1,
      ),
    );
  }, [abioticData, abioticOptionList]);

  const addAbiotic = () => {
    setIsAddAbiotic(true);

  };

  const deleteAbiotic = (abioticId: number) => {
    setAbioticData(current =>
      current.filter(_abioticData => _abioticData.abiotic.id !== abioticId),
    );
  };

  return (
    <View>
      {isAddAbiotic ? (
        <View style={styles.TEXT_INPUT_STYLE}>
          <Picker
            selectedValue={selectedAbiotic}
            style={styles.PICKER_INPUT_STYLE}
            onValueChange={itemValue => {
              if (itemValue) {
                setSelectedAbiotic(itemValue);
                abioticOptions.map((abioticOption: Abiotic) => {
                  if (abioticOption.id === parseInt(itemValue)) {
                    const newAbioticData = {
                      abiotic: abioticOption,
                      value: '',
                    };
                    setIsAddAbiotic(false);
                    setAbioticData([...abioticData, newAbioticData]);
                  }
                });
              }
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
      ) : (
        <Button
          onPress={addAbiotic}
          style={{
            width: '100%',
            backgroundColor: '#3ca290',
          }}
          labelStyle={{
            color: '#ffffff',
          }}>
          Add Abiotic
        </Button>
      )}
      <View>
        {abioticData.map(abioticSingleData => (
          <TextInput
            key={abioticSingleData.abiotic.id}
            label={`${abioticSingleData.abiotic.description} (${abioticSingleData.abiotic.unit})`}
            keyboardType={'numeric'}
            value={abioticSingleData.value}
            right={
              <TextInput.Icon
                icon="delete"
                onPress={() => deleteAbiotic(abioticSingleData.abiotic.id)}
              />
            }
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
