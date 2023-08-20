import {Dimensions, Platform, PixelRatio} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// based on iphone 5s's scale
const scale = SCREEN_WIDTH / 320;

export function normalize(size: number) {
  let newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    if (size < 14 && scale > 2) {
      newSize = newSize / 2;
    }
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

export const fontStyles = {
  mini: {
    fontSize: normalize(10) - 1,
  },
  small: {
    fontSize: normalize(11),
  },
  mediumSmall: {
    fontSize: normalize(13),
  },
  medium: {
    fontSize: normalize(14),
  },
  large: {
    fontSize: normalize(17),
  },
  xlarge: {
    fontSize: normalize(20),
  },
};
