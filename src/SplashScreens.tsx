import React, { useEffect } from 'react'
import { StyleSheet, Text, View, StatusBar, Platform, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'

/*
  Splash screen showing a centered PNG logo and app name below.

  Uses: src/assets/Png/splashlogo.png
*/

const SplashScreens = () => {
  // Update path if you move the image
  const logo = require('../src/assets/Png/splashlogo.png')
  const navigation = useNavigation<any>()

  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace('SelectLanguageScreen')
    }, 3000)

    return () => clearTimeout(t)
  }, [navigation])

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'}
        backgroundColor="#fff"
      />

      <Image source={logo} style={styles.logo} resizeMode="contain" />

      <View style={styles.appNameContainer}>
        {/* <Text style={styles.appName}>White Peony</Text> */}
      </View>
    </View>
  )
}

export default SplashScreens

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: '60%',
    height: undefined,
    aspectRatio: 1,
    marginBottom: 20,
  },
  appNameContainer: {
    marginTop: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
})