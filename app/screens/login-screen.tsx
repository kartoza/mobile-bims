import Axios from 'axios';
import Config from 'react-native-config';
import React from 'react';
import {NativeStackNavigationProp} from 'react-native-screens/native-stack';
import {ParamListBase, useFocusEffect} from '@react-navigation/native';
import LoginScreen from 'react-native-login-screen';
import {Alert, View, ViewStyle} from 'react-native';
import {load, save} from '../utils/storage';

const logo = require('../components/logo/fbis_v2_logo.png');

const loginScreenStyle: ViewStyle = {
  height: '100%',
};

const loginButtonStyle: ViewStyle = {
  backgroundColor: '#d7cd47',
};

export interface LoginScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export const LoginScreenPage: React.FunctionComponent<
  LoginScreenProps
> = props => {
  let username = '';
  let password = '';
  const loginUrl = `${Config.API_URL}/mobile/api-token-auth/`;

  console.log(loginUrl);

  const goToMapScreen = React.useMemo(
    () => () => props.navigation.navigate('map'),
    [props.navigation],
  );

  useFocusEffect(() => {
    (async () => {
      const token = await load('token');
      if (token) {
        goToMapScreen();
      }
    })();
  });

  const login = async () => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    Axios.post(loginUrl, {
      username: username,
      password: password,
    })
      .then(async response => {
        const responseData = response.data;
        if (responseData) {
          await save('token', responseData.token);
          await save('user', username);
          goToMapScreen();
        }
      })
      .catch(error => {
        console.log(error);
        Alert.alert('Login Failed', 'Invalid username or password');
      });
  };

  return (
    <View style={loginScreenStyle}>
      <LoginScreen
        emailPlaceholder={'Username'}
        onEmailChange={(_username: string) => (username = _username)}
        onPasswordChange={(_password: string) => (password = _password)}
        logoImageSource={logo}
        disableSignup={true}
        disableSocialButtons={true}
        onLoginPress={() => {
          setTimeout(async () => {
            await login();
          }, 500);
        }}
        disableDivider={true}
        signupText={''}
        loginButtonStyle={loginButtonStyle}
        onSignupPress={() => {}}
      />
    </View>
  );
};
