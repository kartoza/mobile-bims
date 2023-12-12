/* eslint-disable react-native/no-inline-styles */
import {Picker} from '@react-native-picker/picker';
import React from 'react';
import {ActionSheetIOS, Platform, Text, TouchableOpacity} from 'react-native';
import {styles} from '../../screens/form-screen/styles';

export const CustomPicker = (props: any) => {
  const unspecifiedLabel = props.unspecifiedLabel
    ? props.unspecifiedLabel
    : 'Unspecified';

  return Platform.OS === 'ios' ? (
    <TouchableOpacity
      style={[styles.ACTION_SHEETS_STYLE, props.iosStyle ? props.iosStyle : {}]}
      onPress={() => {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [
              'Cancel',
              ...props.options.map((option: any) => option.name),
            ],
            cancelButtonIndex: 0,
          },
          buttonIndex => {
            if (buttonIndex !== 0) {
              const selectedOption: any = props.options[buttonIndex - 1];
              props.onValueChange(selectedOption.id);
            }
          },
        );
      }}>
      <Text>
        {props.options.find(
          (_option: any) => _option.id === props.selectedValue,
        )?.name || unspecifiedLabel}
      </Text>
    </TouchableOpacity>
  ) : (
    <Picker
      selectedValue={props.selectedValue}
      style={styles.PICKER_INPUT_STYLE}
      onValueChange={itemValue => {
        props.onValueChange(itemValue);
      }}>
      <Picker.Item key="not_specified" label={unspecifiedLabel} value="" />
      {props.options.map((option: any) => (
        <Picker.Item key={option.id} label={option.name} value={option.id} />
      ))}
    </Picker>
  );
};
