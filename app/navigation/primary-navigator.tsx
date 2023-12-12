/**
 * This is the navigator you will modify to display the logged-in screens of your app.
 * You can use RootNavigator to also display an auth flow or other user flows.
 *
 * You'll likely spend most of your time in this file.
 */
import React, {useEffect} from 'react';

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LoginScreenPage} from '../screens/login-screen';
import {MapScreen} from '../screens/map-screen/map-screen';
import {OccurrenceFormScreen} from '../screens/form-screen/occurrence-form-screen';
import {SiteFormScreen} from '../screens/form-screen/site-form-screen';
import {SassFormScreen} from '../screens/form-screen/sass-form-screen';
import {UnsyncedScreen} from '../screens/list-screen/unsynced';
import {load} from '../utils/storage';
import {ActivityIndicator} from 'react-native';
import {AuthContext} from '../App';

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
  OccurrenceForm: undefined;
  SASSForm: undefined;
  siteForm: undefined;
  measurementList: undefined;
  UnsyncedList: undefined;
};

// Documentation: https://github.com/software-mansion/react-native-screens/tree/master/native-stack
const Stack = createNativeStackNavigator<any>();

export function PrimaryNavigator() {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
            isLoading: false,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    },
  );

  useEffect(() => {
    // Load token from storage and then navigate to our appropriate place
    const bootstrapAsync = async () => {
      let userToken;

      try {
        userToken = await load('token');
      } catch (e) {
        // Restoring token failed
      }
      if (userToken) {
        dispatch({type: 'RESTORE_TOKEN', token: userToken});
      } else {
        dispatch({type: 'SIGN_OUT'});
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (token: string) => {
        dispatch({type: 'SIGN_IN', token: token});
      },
      signOut: () => dispatch({type: 'SIGN_OUT'}),
    }),
    [],
  );

  if (state.isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {state.userToken == null ? (
          <Stack.Screen name="login" component={LoginScreenPage} />
        ) : (
          <>
            <Stack.Screen name="map" component={MapScreen} />
            <Stack.Screen
              name="OccurrenceForm"
              component={OccurrenceFormScreen}
            />
            <Stack.Screen name="SASSForm" component={SassFormScreen} />
            <Stack.Screen name="siteForm" component={SiteFormScreen} />
            <Stack.Screen name="UnsyncedList" component={UnsyncedScreen} />
          </>
        )}
      </Stack.Navigator>
    </AuthContext.Provider>
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
