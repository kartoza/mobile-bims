import {
  TextStyle,
  ViewStyle,
  Platform,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { white } from 'react-native-paper/lib/typescript/styles/colors';

const CONTAINER: ViewStyle = {
  height: '100%',
  backgroundColor: 'rgb(248, 248, 248)',
  paddingLeft: 20,
  paddingRight: 20,
};

const BIOTOPE_SAMPLED_CONTAINER: ViewStyle = {
  marginBottom: 10,
  backgroundColor: 'white',
  paddingLeft: 20,
  borderRadius: 5,
  paddingBottom: 10,
};

const BIOTOPE_CONTAINER: ViewStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-evenly',
  marginBottom: 10,
  marginLeft: -15,
};

const BIOTOPE_ROW: ViewStyle = {
  display: 'flex',
  alignItems: 'center',
};

const BIOTOPE_RADIO_LABEL: TextStyle = {
  marginTop: -10,
  fontSize: 11,
  fontWeight: 'bold',
};

const FORM_HEADER: TextStyle = {
  color: '#005198',
  fontWeight: 'bold',
  letterSpacing: 2,
  textAlign: 'center',
  backgroundColor: 'rgb(236, 236, 236)',
  padding: 5,
  marginTop: 10,
};

const FORM_SUB_HEADER: TextStyle = {
  color: '#000000',
  marginTop: 15,
  marginBottom: -10,
  fontWeight: 'bold',
  textAlign: 'center',
};

const CHART_CONTAINER: ViewStyle = {
  marginTop: 10,
  height: 500,
};

const EMPTY_CHART_CONTAINER: ViewStyle = {
  height: 70,
  marginTop: 10,
};

const LABEL: TextStyle = {
  color: '#000000',
  fontSize: 13,
  marginTop: 10,
  paddingBottom: 2,
};

const LABEL_IMPORTANT: TextStyle = {
  ...LABEL,
  fontWeight: 'bold',
};

const REQUIRED_LABEL: TextStyle = {
  ...LABEL,
  fontWeight: 'bold',
};

const CHART_LABEL: TextStyle = {
  ...LABEL,
  marginTop: 0,
  marginBottom: 15,
};

const TEXT_INPUT_STYLE: TextStyle = {
  minHeight: 40,
  backgroundColor: '#ffffff',
  borderRadius: 5,
  color: '#000000',
  marginTop: 5,
  paddingLeft: 10,
};

const UNEDITABLE_TEXT_INPUT_STYLE: TextStyle = {
  ...TEXT_INPUT_STYLE,
  backgroundColor: '#e1e1e1',
};

const TEXT_INPUT_TAXA: TextStyle = {
  borderWidth: 1,
  borderColor: '#BDBDBD',
  height: '80%',
  fontSize: 12,
  marginLeft: 'auto',
  marginRight: 10,
  borderRadius: 4,
  paddingTop: 0,
  paddingBottom: 0,
  width: 60,
  textAlign: 'center',
};

const PICKER_INPUT_STYLE: ViewStyle = {
  transform: [{scaleX: 0.8}, {scaleY: 0.9}],
  left: -45,
  width: '120%',
};

const ACTION_SHEETS_STYLE: ViewStyle = {
  paddingTop: 10,
};

const PICKER_SM_INPUT_STYLE: ViewStyle = {
  // transform: [{ scaleX: 0.70 }, { scaleY: 0.70 }],
  // left: 0,
};

const MULTIPLE_INPUT_STYLE: ViewStyle = {
  ...TEXT_INPUT_STYLE,
  flex: 1,
  flexDirection: 'row',
};

const HEADER_CONTAINER: ViewStyle = {
  backgroundColor: '#005198',
  height:
    80 +
    (Platform.OS === 'ios'
      ? 50
      : StatusBar.currentHeight
      ? StatusBar.currentHeight
      : 0),
  paddingTop: Platform.OS === 'ios' ? 25 : 0,
  marginTop: Platform.OS === 'ios' ? -25 : 0,
};

const SUBMIT_BUTTON: ViewStyle = {
  marginTop: 10,
};

const LAST_UPDATE_TEXT: TextStyle = {
  marginTop: 10,
  fontSize: 12,
  textAlign: 'right',
  fontStyle: 'italic',
};

const LOADING: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999999,
};

const ERROR_INPUT: TextStyle = {
  color: 'red',
  fontSize: 12,
  paddingLeft: 3,
};

const AUTOCOMPLETE_CONTAINER: ViewStyle = {
  flex: 1,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 35,
  zIndex: 10,
  backgroundColor: '#FFFFFF',
};

const AUTOCOMPLETE_LIST: ViewStyle = {
  backgroundColor: '#ffffff',
  padding: 5,
  borderBottomWidth: 0.2,
  borderBottomColor: 'rgba(0,0,0,0.21)',
};

const AUTOCOMPLETE_LIST_TEXT: TextStyle = {
  color: 'black',
  backgroundColor: '#ffffff',
  fontSize: 14,
  margin: 2
};

const OBSERVED_TAXA_LIST: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'white',
  marginBottom: 5,
};

const SASS_TAXA_FORM: ViewStyle = {
  height: 60,
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'row',
};

const SASS_TAXA_DROPDOWN: ViewStyle = {
  maxWidth: '33.33%',
  borderWidth: 1,
  borderColor: '#cccccc',
  width: '33.33%',
};

export const styles = StyleSheet.create({
  ACTION_SHEETS_STYLE,
  AUTOCOMPLETE_CONTAINER,
  AUTOCOMPLETE_LIST,
  AUTOCOMPLETE_LIST_TEXT,
  BIOTOPE_CONTAINER,
  BIOTOPE_ROW,
  BIOTOPE_RADIO_LABEL,
  BIOTOPE_SAMPLED_CONTAINER,
  CHART_CONTAINER,
  CHART_LABEL,
  CONTAINER,
  EMPTY_CHART_CONTAINER,
  ERROR_INPUT,
  FORM_HEADER,
  FORM_SUB_HEADER,
  HEADER_CONTAINER,
  LABEL,
  LABEL_IMPORTANT,
  LAST_UPDATE_TEXT,
  LOADING,
  MULTIPLE_INPUT_STYLE,
  OBSERVED_TAXA_LIST,
  PICKER_INPUT_STYLE,
  PICKER_SM_INPUT_STYLE,
  REQUIRED_LABEL,
  SASS_TAXA_DROPDOWN,
  SASS_TAXA_FORM,
  SUBMIT_BUTTON,
  TEXT_INPUT_STYLE,
  TEXT_INPUT_TAXA,
  UNEDITABLE_TEXT_INPUT_STYLE,
  chart: {
    flex: 1,
    marginBottom: 10,
    marginTop: 10,
    minHeight: 150,
  },
});
