import Config from 'react-native-config';
import React, {useEffect, useState} from 'react';
import {NativeStackNavigationProp} from 'react-native-screens/native-stack';
import {ParamListBase, useFocusEffect} from '@react-navigation/native';
import {
  Alert,
  Image,
  ImageStyle,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import {load, loadEncrypted, save, saveEncrypted} from '../utils/storage';
import {styles} from './form-screen/styles';
import {Button} from '@rneui/themed';
import {Wallpaper} from '../components/wallpaper/wallpaper';
import axios from 'axios';
import {Switch} from '@rneui/base';

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
  height: 50,
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
  const [rememberMe, setRememberMe] = useState(false);
  const loginUrl = `${Config.API_URL}/mobile/api-token-auth/`;

  const goToMapScreen = React.useMemo(
    () => () => props.navigation.navigate('map'),
    [props.navigation],
  );
  useEffect(() => {
    (async () => {
      setUsername(await loadEncrypted('@username'));
      const _password = await loadEncrypted('@password');
      setPassword(_password);
      if (_password) {
        setRememberMe(true);
      }
    })();
    setLoading(false);
  }, []);

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
          if (rememberMe) {
            await saveEncrypted('@password', password);
            await saveEncrypted('@username', username);
          } else {
            await saveEncrypted('@password', '');
            await saveEncrypted('@username', '');
          }
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
          autoCapitalize={'none'}
          placeholder={'Username'}
          onChangeText={text => setUsername(text)}
        />
        <Text style={styles.REQUIRED_LABEL}>Password</Text>
        <TextInput
          editable={!loading}
          autoCapitalize={'none'}
          secureTextEntry={true}
          style={styles.TEXT_INPUT_STYLE}
          value={password}
          placeholder={'Password'}
          onChangeText={text => setPassword(text)}
        />
        <View
          style={{flexDirection: 'row', alignItems: 'center', marginTop: 10}}>
          <Switch
            value={rememberMe}
            onValueChange={newValue => setRememberMe(newValue)}
          />
          <Text style={{marginLeft: 8}}>Remember me</Text>
        </View>
        <Button
          title="Login"
          disabled={!username || !password || loading}
          buttonStyle={loginButtonStyle}
          loading={loading}
          onPress={() => login()}
        />
      </View>
    </View>
  );
};
