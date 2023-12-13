/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useEffect, useState} from 'react';

import * as storage from './utils/storage';
import {RootStore} from './models/root-store/root-store';
import {setupRootStore} from './models/root-store/setup-root-store';
import {useNavigationContainerRef} from '@react-navigation/native';
import {
  canExit,
  RootNavigator,
  setRootNavigation,
  useBackButtonHandler,
  useNavigationPersistence,
} from './navigation';
import {RootStoreProvider} from './models/root-store/root-store-context';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

export const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';
export const AuthContext = React.createContext({} as any);

const App = () => {
  const navigationRef = useNavigationContainerRef();
  const [rootStore, setRootStore] = useState<RootStore | undefined>(undefined);

  setRootNavigation(navigationRef);
  useBackButtonHandler(navigationRef, canExit);
  const {initialNavigationState, onNavigationStateChange} =
    useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY);

  useEffect(() => {
    const setup = async () => {
      setupRootStore().then(setRootStore);
    };
    setup().catch(err => console.log(err));
  }, []);

  // Before we show the app, we have to wait for our state to be ready.
  // In the meantime, don't render anything. This will be the background
  // color set in native by rootView's background color. You can replace
  // with your own loading component if you wish.
  if (!rootStore) {
    return null;
  }

  return (
    <RootStoreProvider value={rootStore}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <RootNavigator
          ref={navigationRef}
          theme={undefined}
          initialState={initialNavigationState}
        />
      </SafeAreaProvider>
    </RootStoreProvider>
  );
};

export default App;
