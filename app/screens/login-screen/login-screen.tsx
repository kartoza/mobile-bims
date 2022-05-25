import Axios from "axios"
import React, { useState } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase, useFocusEffect } from "@react-navigation/native"
import LoginScreen from "react-native-login-screen"
import { save, load } from "../../utils/storage"
import { API_URL } from "@env"
import { Alert, Text, View, ViewStyle, TextStyle } from "react-native"
import { securedUrl } from "../../utils/url"

const defaultImage = require("../../components/wallpaper/fbis_banner.png")

const loginScreenStyle: ViewStyle = {
  height: "100%",
}

const loginScreenText: TextStyle = {
  position: "absolute",
  zIndex: 99,
  color: "white",
  fontWeight: "bold",
  fontSize: 22,
  paddingLeft: 30,
  paddingTop: 50,
  paddingBottom: 30,
  width: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.3)",
}

export interface LoginScreenProps {
    navigation: NativeStackNavigationProp<ParamListBase>
  }

export const LoginScreenPage: React.FunctionComponent<LoginScreenProps> = props => {
  const [spinnerVisibility, setSpinnerVisibility] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const loginUrl = securedUrl(`${API_URL}/login`)

  const goToMapScreen = React.useMemo(() => () => props.navigation.navigate("map"), [props.navigation])

  useFocusEffect(() => {
    ;(async () => {
      const uuid = await load('uuid')
      if (uuid) goToMapScreen()
    })()
  })

  const login = async () => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    Axios.post(
      `${loginUrl}`,
      formData
    ).then(async response => {
      const responseData = response.data
      if (responseData) {
        await save('uuid', responseData.token)
        await save('user', responseData.user)
        goToMapScreen()
      }
      setSpinnerVisibility(false)
    }).catch(error => {
      console.log(error)
      Alert.alert(
        "Login Failed",
        "Invalid username or password"
      )
      setSpinnerVisibility(false)
    })
  }

  return (
    <View style={loginScreenStyle}>
      <Text style={loginScreenText}>
        Tracking change in South Africa’s {'\n'}Freshwater Biodiversity
      </Text>
      <LoginScreen
        spinnerEnable
        spinnerVisibility={ spinnerVisibility }
        usernameOnChangeText={(_username) => setUsername(_username)}
        passwordOnChangeText={(_password) => setPassword(_password)}
        source={ defaultImage }
        disableSignupButton
        disableSettings
        onPressLogin={() => {
          setSpinnerVisibility(true)
          setTimeout(async () => {
            // login().then(r => console.log(r))
            await save('user', {
              username: 'test'
            })
            await save('uuid', 'uuid-test')
            goToMapScreen()
          }, 500)
        }}
        signupText={''}>
      </LoginScreen>
    </View>
  )
}
