/**
 * This is the navigator you will modify to display the logged-in screens of your app.
 * You can use RootNavigator to also display an auth flow or other user flows.
 *
 * You'll likely spend most of your time in this file.
 */
import React from 'react';

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LoginScreenPage} from '../screens/login-screen';
import {MapScreen} from '../screens/map-screen/map-screen';
import {OccurrenceFormScreen} from '../screens/form-screen/occurrence-form-screen';
import {SiteFormScreen} from '../screens/form-screen/site-form-screen';
import {SassFormScreen} from '../screens/form-screen/sass-form-screen';
import {UnsyncedScreen} from '../screens/list-screen/unsynced';

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`. Generally speaking, we
 * recommend using your MobX-State-Tree store(s) to keep application state
 * rather than passing state through navigation params.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 */
export type PrimaryParamList = {
  map: undefined;
  form: undefined;
  login: undefined;
  occurrenceForm: undefined;
  SASSForm: undefined;
  siteForm: undefined;
  measurementList: undefined;
  UnsyncedList: undefined;
};

// Documentation: https://github.com/software-mansion/react-native-screens/tree/master/native-stack
const Stack = createNativeStackNavigator<any>();

export function PrimaryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="login" component={LoginScreenPage} />
      <Stack.Screen name="map" component={MapScreen} />
      <Stack.Screen name="OccurrenceForm" component={OccurrenceFormScreen} />
      <Stack.Screen name="SASSForm" component={SassFormScreen} />
      <Stack.Screen name="siteForm" component={SiteFormScreen} />
      <Stack.Screen name="UnsyncedList" component={UnsyncedScreen} />
    </Stack.Navigator>
  );
}

/**
 * A list of routes from which we're allowed to leave the app when
 * the user presses the back button on Android.
 *
 * Anything not on this list will be a standard `back` action in
 * react-navigation.
 *
 * `canExit` is used in ./app/app.tsx in the `useBackButtonHandler` hook.
 */
const exitRoutes = ['map'];
export const canExit = (routeName: string) => exitRoutes.includes(routeName);
