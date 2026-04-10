/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-shadow */
import React, {useEffect, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Keyboard,
  SafeAreaView,
  LogBox,
  Platform,
  TextInput,
} from 'react-native';
import Abiotic from '../../models/abiotic/abiotic';
import {loadAbioticData} from '../../models/abiotic/abiotic.store';
import {styles} from '../../screens/form-screen/styles';
import Autocomplete from 'react-native-autocomplete-input';
import {spacing} from '../../theme/spacing';
import {Icon} from '@rneui/themed';

export interface AbioticDataInterface {
  abiotic: Abiotic;
  value: string;
}

interface AbioticFormInterface {
  onChange?: (abioticData: AbioticDataInterface[]) => void;
  abioticData?: any[];
  scrollViewRef?: any;
  siteVisit: any;
}

export default function AbioticForm(props: AbioticFormInterface) {
  const [abioticOptions, setAbioticOptions] = useState<Abiotic[]>([]);
  const [abioticOptionList, setAbioticOptionList] = useState<Abiotic[]>([]);
  const [abioticData, setAbioticData] = useState<AbioticDataInterface[]>([]);
  const [isAddAbiotic, setIsAddAbiotic] = useState<boolean>(true);
  const [inputText, setInputText] = useState('');
  const [firstRender, setFirstRender] = useState<boolean>(true);

  const filteredOptions = abioticOptions.filter(option =>
    option.description.toLowerCase().includes(inputText.toLowerCase()),
  );

  useEffect(() => {
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
    if (!props.siteVisit) {
      setFirstRender(false);
    }
  }, []);

  useEffect(() => {
    if (props.abioticData && abioticData.length === 0) {
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

  const deleteAbiotic = (abioticId: number) => {
    setAbioticData(current =>
      current.filter(_abioticData => _abioticData.abiotic.id !== abioticId),
    );
  };

  useEffect(() => {
    if (abioticData.length > 0 && firstRender) {
      setFirstRender(false);
    }
  }, [abioticData]);

  return (
    <View style={{zIndex: 10}}>
      <SafeAreaView style={[styles.AUTOCOMPLETE_CONTAINER, {top: 0}]}>
        <Autocomplete
          placeholderTextColor={'#666666'}
          data={inputText.length >= 2 ? filteredOptions : []}
          value={inputText}
          style={{height: Platform.OS === 'ios' ? 30 : 'auto'}}
          placeholder={'Type parameter name'}
          onChangeText={text => setInputText(text)}
          flatListProps={{
            keyboardShouldPersistTaps: 'always',
            horizontal: false,
            nestedScrollEnabled: true,
            style: {
              maxHeight: 150,
              zIndex: 10,
            },
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
      </SafeAreaView>
      <View style={{ marginTop: spacing[7], marginBottom: -spacing[7] }}>
        {abioticData.map((abioticSingleData, index) => (
          <View
            key={abioticSingleData.abiotic.id}
            style={{
              marginTop: 8,
              marginBottom: 4,
            }}>
            <Text style={styles.LABEL}>
              {abioticSingleData.abiotic.description} (
              {abioticSingleData.abiotic.unit})
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <TextInput
                focusable={true}
                keyboardType={'numeric'}
                value={abioticSingleData.value}
                autoFocus={!firstRender && index === abioticData.length - 1}
                style={[
                  styles.TEXT_INPUT_STYLE,
                  {
                    flex: 1,
                    paddingRight: 12,
                  },
                ]}
                onChangeText={text => {
                  setAbioticData(current =>
                    current.map(obj => {
                      if (obj.abiotic.id === abioticSingleData.abiotic.id) {
                        return {...obj, value: text};
                      }
                      return obj;
                    }),
                  );
                }}
              />
              <TouchableOpacity
                style={{
                  marginLeft: 10,
                  marginTop: 5,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => deleteAbiotic(abioticSingleData.abiotic.id)}>
                <Icon
                  name="trash"
                  type="font-awesome-5"
                  size={20}
                  color="rgb(138, 151, 161)"
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
