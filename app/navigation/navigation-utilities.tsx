import React, {useCallback, useState, useEffect, useRef} from 'react';
import {BackHandler} from 'react-native';
import {
  PartialState,
  NavigationState,
  NavigationContainerRef,
  NavigationContainerRefWithCurrent,
} from '@react-navigation/native';

export const RootNavigation: any = {
  navigate(name: string) {
    name;
  },
  goBack() {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resetRoot(state?: PartialState<NavigationState> | NavigationState) {},
  getRootState(): NavigationState {
    return {} as any;
  },
};

export const setRootNavigation = (
  ref: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>,
) => {
  for (const method in RootNavigation) {
    RootNavigation[method] = (...args: any) => {
      if (ref.current) {
        // @ts-ignore
        return ref.current[method](...args);
      }
    };
  }
};

/**
 * Gets the current screen from any navigation state.
 */
export function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState>,
): any {
  if (!state.routes || !state.index) {
    return '';
  }
  const route = state.routes[state.index];

  // Found the active route -- return the name
  if (!route.state) {
    return route.name;
  }

  // Recursive call to deal with nested routers
  return getActiveRouteName(route.state);
}

/**
 * Hook that handles Android back button presses and forwards those on to
 * the navigation or allows exiting the app.
 */
export function useBackButtonHandler(
  ref: React.RefObject<NavigationContainerRef<any>>,
  canExit: (routeName: string) => boolean,
) {
  const canExitRef = useRef(canExit);

  useEffect(() => {
    canExitRef.current = canExit;
  }, [canExit]);

  useEffect(() => {
    // We'll fire this when the back button is pressed on Android.
    const onBackPress = () => {
      const navigation = ref.current;

      if (navigation == null) {
        return false;
      }

      // grab the current route
      const routeName = getActiveRouteName(navigation.getRootState());

      // are we allowed to exit?
      if (canExitRef.current(routeName)) {
        // let the system know we've not handled this event
        return false;
      }

      // we can't exit, so let's turn this into a back action
      if (navigation.canGoBack()) {
        navigation.goBack();

        return true;
      }

      return false;
    };

    // Subscribe when we come to life
    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    // Unsubscribe when we're done
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [ref]);
}

/**
 * Custom hook for persisting navigation state.
 */
export function useNavigationPersistence(storage: any, persistenceKey: string) {
  const [initialNavigationState, setInitialNavigationState] = useState();
  const [isRestoringNavigationState, setIsRestoringNavigationState] =
    useState(true);

  const routeNameRef = useRef();
  const onNavigationStateChange = (state: any) => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = getActiveRouteName(state);

    if (previousRouteName !== currentRouteName) {
      // track screens.
      __DEV__ && console.log(currentRouteName);
    }

    // Save the current route name for later comparision
    routeNameRef.current = currentRouteName;

    // Persist state to storage
    storage.save(persistenceKey, state);
  };

  const restoreState = useCallback(async () => {
    try {
      const state = await storage.load(persistenceKey);
      if (state) {
        setInitialNavigationState(state);
      }
    } finally {
      setIsRestoringNavigationState(false);
    }
  }, [persistenceKey, storage]);

  useEffect(() => {
    if (isRestoringNavigationState) {
      restoreState().then(() => {});
    }
  }, [isRestoringNavigationState, restoreState]);

  return {onNavigationStateChange, restoreState, initialNavigationState};
}
