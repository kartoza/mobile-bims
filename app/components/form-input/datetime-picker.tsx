import React, {useEffect, useState} from 'react';
import {Pressable, Text, TextInput, View} from "react-native";
import {styles} from '../../screens/form-screen/styles';
import Moment from 'moment';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';

interface DatetimePickerInterface {
  onDateChange: (currentDate: Date) => void;
  date?: Date;
}

export function DatetimePicker(props: DatetimePickerInterface) {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [date, setDate] = useState<Date>(props.date ? props.date : new Date());

  useEffect(() => {
    if (props.date) {
      setDate(props.date);
    }
  }, [props.date]);

  const onDateChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined,
  ) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
    props.onDateChange(currentDate);
  };

  return (
    <View>
      {/* Date input */}
      <Text style={styles.REQUIRED_LABEL}>Date</Text>
      <Pressable onPress={() => setShowDatePicker(true)}>
        <View>
          <TextInput
            editable={false}
            value={Moment(date).format('YYYY-MM-DD')}
            style={styles.TEXT_INPUT_STYLE}
          />
        </View>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          is24Hour={true}
          display="default"
          onChange={(e, selectedDate) => {
            onDateChange(e, selectedDate);
          }}
        />
      )}
    </View>
  );
}
