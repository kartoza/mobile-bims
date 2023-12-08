import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, Text, Dimensions, Keyboard} from 'react-native';
import {TextInput} from 'react-native-paper';
import Abiotic from '../../models/abiotic/abiotic';
import {loadAbioticData} from '../../models/abiotic/abiotic.store';
import {styles} from '../../screens/form-screen/styles';
import Autocomplete from 'react-native-autocomplete-input';
import {spacing} from '../../theme/spacing';

export interface AbioticDataInterface {
  abiotic: Abiotic;
  value: string;
}

interface AbioticFormInterface {
  onChange?: (abioticData: AbioticDataInterface[]) => void;
  abioticData?: any[];
  scrollViewRef?: any;
}

export default function AbioticForm(props: AbioticFormInterface) {
  const [abioticOptions, setAbioticOptions] = useState<Abiotic[]>([]);
  const [existingAbioticData, setExistingAbioticData] = useState<any[]>([]);
  const [abioticOptionList, setAbioticOptionList] = useState<Abiotic[]>([]);
  const [selectedAbiotic, setSelectedAbiotic] = useState<string>('');
  const [abioticData, setAbioticData] = useState<AbioticDataInterface[]>([]);
  const [isAddAbiotic, setIsAddAbiotic] = useState<boolean>(true);
  const [inputText, setInputText] = useState('');

  const filteredOptions = abioticOptions.filter(option =>
    option.description.toLowerCase().includes(inputText.toLowerCase()),
  );

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
      <View style={[styles.AUTOCOMPLETE_CONTAINER, {top: 0}]}>
        <Autocomplete
          data={inputText.length >= 2 ? filteredOptions : []}
          value={inputText}
          style={{ height: 'auto' }}
          placeholder={'Type parameter name'}
          onChangeText={text => setInputText(text)}
          flatListProps={{
            keyboardShouldPersistTaps: 'always',
            horizontal: false,
            nestedScrollEnabled: true,
            keyExtractor: item => item.id.toString(),
            renderItem: ({item}) => (
              <TouchableOpacity
                style={styles.AUTOCOMPLETE_LIST}
                onPress={() => {
                  const newAbioticData = {
                    abiotic: item,
                    value: '',
                  };
                  setInputText('');
                  setAbioticData([...abioticData, newAbioticData]);
                  Keyboard.dismiss();
                }}>
                <Text style={styles.AUTOCOMPLETE_LIST_TEXT}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            ),
          }}
        />
      </View>
      <View style={{ marginTop: spacing[7], marginBottom: -spacing[7] }}>
        {abioticData.map((abioticSingleData, index) => (
          <TextInput
            focusable={true}
            key={abioticSingleData.abiotic.id}
            label={`${abioticSingleData.abiotic.description} (${abioticSingleData.abiotic.unit})`}
            keyboardType={'numeric'}
            value={abioticSingleData.value}
            autoFocus={index === abioticData.length - 1}
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
