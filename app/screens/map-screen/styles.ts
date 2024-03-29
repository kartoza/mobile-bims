import {
  StyleSheet,
  ViewStyle,
  Platform,
  TextStyle,
  Dimensions,
} from 'react-native';
import {spacing} from '../../theme/spacing';
import {color} from '../../theme/color';
import {StatusBar} from 'react-native';
import {fontStyles} from '../../theme/font';

const ACTIVITY_INDICATOR: ViewStyle = {
  top: 10,
};
const ACTIVITY_INDICATOR_WRAPPER: ViewStyle = {
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 10,
  display: 'flex',
  height: 140,
  justifyContent: 'space-around',
  width: 140,
};
const BOTTOM_VIEW: ViewStyle = {
  alignItems: 'center',
  backgroundColor: 'white',
  bottom: 0,
  flexDirection: 'row-reverse',
  height: Platform.OS === 'ios' ? 80 : 60,
  justifyContent: 'center',
  paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  position: 'absolute',
  width: '100%',
  zIndex: 999,
};
const CONTAINER: ViewStyle = {
  height: '100%',
  backgroundColor: '#E2E8EE',
};
const SEARCH_BAR_CONTAINER: ViewStyle = {
  height: 65,
  marginTop: Platform.OS === 'ios' ? 0 : 60,
  flexDirection: 'row',
};
const MAP_VIEW_DOWNLOAD_RIVER: ViewStyle = {
  borderColor: color.primaryFBIS,
  borderWidth: 3,
};
const MAP_VIEW_CONTAINER: ViewStyle = {
  height:
    Dimensions.get('window').height -
    (Platform.OS === 'ios'
      ? 100
      : StatusBar.currentHeight
      ? StatusBar.currentHeight
      : 0) -
    65,
};
const MAP: ViewStyle = {
  height:
    Platform.OS === 'ios' ? Dimensions.get('window').height - 205 : '100%',
  marginVertical: 0,
};
const MODAL_TEXT: TextStyle = {
  fontSize: 14,
  textAlign: 'center',
};
const MODAL_BACKGROUND: ViewStyle = {
  alignItems: 'center',
  backgroundColor: '#00000040',
  flex: 1,
  flexDirection: 'column',
  justifyContent: 'space-around',
};
const LOCATE_ME_BUTTON: ViewStyle = {
  borderColor: color.secondaryFBIS,
  backgroundColor: color.secondaryFBIS,
  width: 70,
  marginBottom: 20,
  height: '100%',
};
const LOCATE_ME_CONTAINER: ViewStyle = {
  width: '30%',
  alignItems: 'center',
};
const USER_BUTTON: ViewStyle = {
  marginRight: -20,
  backgroundColor: '#ffffff',
};
const USER_BUTTON_CONTAINER: ViewStyle = {
  width: '30%',
};
const SYNC_BUTTON: ViewStyle = {
  marginLeft: -10,
  backgroundColor: '#ffffff',
};
const SYNC_BUTTON_CONTAINER: ViewStyle = {
  width: '30%',
};
const SYNC_BADGE: ViewStyle = {
  position: 'absolute',
  right: '20%',
  top: 5,
};

const MID_BOTTOM_CONTAINER: ViewStyle = {
  alignItems: 'center',
  alignContent: 'center',
  bottom: Platform.OS === 'ios' ? 100 : 80,
  paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  width: '100%',
  position: 'absolute',
  justifyContent: 'center',
  flexDirection: 'row-reverse',
};

const TOP_LEFT_CONTAINER: ViewStyle = {
  position: 'absolute',
  width: 'auto',
  borderRadius: 3,
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
  marginTop: 130,
  marginLeft: 5,
  paddingLeft: 5,
  paddingRight: 5,
  backgroundColor: 'rgba(0,0,0,0.25)',
};

const TOP_CENTER_CONTAINER: ViewStyle = {
  position: 'absolute',
  width: 200,
  minHeight: 70,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.50)',
  top: 0,
  marginTop: Platform.OS === 'ios' ? 140 : 70,
  borderRadius: 5,
  alignSelf: 'center',
  padding: 15,
};

const TOP_CENTER_TEXT: TextStyle = {
  fontSize: 13,
  color: '#FFF',
  lineHeight: 16,
  textAlign: 'center',
};

const ONLINE_STATUS: TextStyle = {
  fontSize: 10,
  marginLeft: 3,
  color: '#FFF',
};

const BOTTOM_CONTAINER: ViewStyle = {
  alignItems: 'center',
  alignContent: 'center',
  bottom: Platform.OS === 'ios' ? 0 : 0,
  paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  width: '100%',
  position: 'absolute',
  justifyContent: 'center',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  zIndex: 9999,
};

const MID_BOTTOM_CONTENTS: ViewStyle = {
  alignItems: 'center',
  alignContent: 'center',
  backgroundColor: 'white',
  paddingBottom: spacing[5],
  width: '95%',
  borderRadius: 5,
};

const MID_BOTTOM_TEXT: TextStyle = {
  padding: 18,
  fontWeight: 'bold',
  color: 'rgb(74, 74, 74)',
};

const MID_BOTTOM_SUB_TEXT: TextStyle = {
  fontSize: 12,
  color: 'rgb(74, 74, 74)',
};

const MID_BOTTOM_BUTTON: ViewStyle = {
  backgroundColor: '#3ca290',
  borderColor: '#3ca290',
  flex: 1,
  height: Platform.OS === 'ios' ? 60 : 'auto',
};

const MID_BOTTOM_BUTTON_CONTAINER = {
  width: '30%',
  display: 'flex',
  justifyContent: 'center',
};

const SASS_BUTTON: ViewStyle = {
  backgroundColor: '#aaa600',
  borderColor: '#aaa600',
};

const MODULE_TEXT_CONTAINER: ViewStyle = {
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: '#ffffff',
  paddingTop: 5,
};

const MODULE_TEXT_COLOR: TextStyle = {
  color: '#525351',
};

const MODULE_TEXT = [
  MODULE_TEXT_COLOR,
  fontStyles.medium,
  {
    textAlign: 'center',
    padding: 10,
    fontWeight: 'bold',
  },
];

const MODULE_BUTTONS_CONTAINER: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-around',
  padding: 10,
  paddingTop: 0,
  backgroundColor: '#ffffff',
  flexWrap: 'wrap',
};

const MODULE_BUTTONS: ViewStyle = {
  width: '45%',
  marginBottom: 8,
};

const CLOSE_BUTTON = {
  position: 'absolute',
  top: 15,
  right: 20,
  zIndex: 1,
};

export const styles = StyleSheet.create({
  ACTIVITY_INDICATOR,
  ACTIVITY_INDICATOR_WRAPPER,
  BOTTOM_CONTAINER,
  BOTTOM_VIEW,
  CLOSE_BUTTON,
  CONTAINER,
  LOCATE_ME_BUTTON,
  LOCATE_ME_CONTAINER,
  MAP,
  MAP_VIEW_CONTAINER,
  MAP_VIEW_DOWNLOAD_RIVER,
  MID_BOTTOM_BUTTON,
  MID_BOTTOM_BUTTON_CONTAINER,
  MID_BOTTOM_CONTAINER,
  MID_BOTTOM_CONTENTS,
  MID_BOTTOM_SUB_TEXT,
  MID_BOTTOM_TEXT,
  TOP_LEFT_CONTAINER,
  TOP_CENTER_CONTAINER,
  TOP_CENTER_TEXT,
  ONLINE_STATUS,
  MODAL_BACKGROUND,
  MODAL_TEXT,
  MODULE_BUTTONS,
  MODULE_BUTTONS_CONTAINER,
  MODULE_TEXT,
  MODULE_TEXT_CONTAINER,
  MODULE_TEXT_COLOR,
  SASS_BUTTON,
  SEARCH_BAR_CONTAINER,
  SYNC_BADGE,
  SYNC_BUTTON,
  SYNC_BUTTON_CONTAINER,
  USER_BUTTON,
  USER_BUTTON_CONTAINER,
});
