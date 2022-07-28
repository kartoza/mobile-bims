import Axios from 'axios';
import Config from 'react-native-config';
import React, {useState} from 'react';
import {NativeStackNavigationProp} from 'react-native-screens/native-stack';
import {ParamListBase, useFocusEffect} from '@react-navigation/native';
import LoginScreen from 'react-native-login-screen';
import {Alert, Image, ImageStyle, Text, TextInput, View, ViewStyle} from 'react-native';
import {load, save} from '../utils/storage';
import {styles} from "./form-screen/styles";
import {Button} from "@rneui/themed";
import {Wallpaper} from "../components/wallpaper/wallpaper";
import axios from "axios";

const logo = require('../components/logo/fbis_v2_logo.png');

const loginScreenStyle: ViewStyle = {
  height: '100%',
};

const loginButtonStyle: ViewStyle = {
  backgroundColor: '#d7cd47',
  borderRadius: 5,
  marginTop: 20,
};

const logoStyle: ImageStyle = {
  width: '100%',
  height: 50
};

export interface LoginScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export const LoginScreenPage: React.FunctionComponent<
  LoginScreenProps
> = props => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const loginUrl = `${Config.API_URL}/mobile/api-token-auth/`;

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
    setLoading(true);
    const axiosClient = axios.create();
    axiosClient.defaults.timeout = 5000;
    axiosClient
      .post(loginUrl, {
        username: username,
        password: password,
      })
      .then(async response => {
        const responseData = response.data;
        setLoading(false);
        if (responseData) {
          await save('token', responseData.token);
          await save('user', username);
          goToMapScreen();
        }
      })
      .catch(error => {
        const errorMessage = '' + error;
        console.log(errorMessage);
        setLoading(false);
        if (errorMessage.includes('timeout')) {
          Alert.alert('Request Timeout', "The server can't be reached");
        } else {
          Alert.alert('Login Failed', 'Invalid username or password');
        }
      });
  };

  return (
    <View style={loginScreenStyle}>
      <Wallpaper />
      <View
        style={{
          margin: 30,
          padding: 25,
          borderRadius: 10,
          backgroundColor: '#F9F9F9',
          marginTop: 80,
        }}>
        <Image style={logoStyle} source={logo} resizeMode={'contain'} />
        <Text style={styles.REQUIRED_LABEL}>Username</Text>
        <TextInput
          editable={!loading}
          style={styles.TEXT_INPUT_STYLE}
          value={username}
          placeholder={'Username'}
          onChangeText={text => setUsername(text)}></TextInput>
        <Text style={styles.REQUIRED_LABEL}>Password</Text>
        <TextInput
          editable={!loading}
          secureTextEntry={true}
          style={styles.TEXT_INPUT_STYLE}
          value={password}
          placeholder={'Password'}
          onChangeText={text => setPassword(text)}></TextInput>
        <Button
          title="Login"
          disabled={!username || !password || loading}
          buttonStyle={loginButtonStyle}
          loading={loading}
          onPress={() => login()}
        />
      </View>
      {/*<LoginScreen*/}
      {/*  emailPlaceholder={'Username'}*/}
      {/*  onEmailChange={(_username: string) => (username = _username)}*/}
      {/*  onPasswordChange={(_password: string) => (password = _password)}*/}
      {/*  logoImageSource={logo}*/}
      {/*  disableSignup={true}*/}
      {/*  disableSocialButtons={true}*/}
      {/*  onLoginPress={() => {*/}
      {/*    setTimeout(async () => {*/}
      {/*      await login();*/}
      {/*    }, 500);*/}
      {/*  }}*/}
      {/*  disableDivider={true}*/}
      {/*  signupText={''}*/}
      {/*  loginButtonStyle={loginButtonStyle}*/}
      {/*  onSignupPress={() => {}}*/}
      {/*/>*/}
    </View>
  );
};
