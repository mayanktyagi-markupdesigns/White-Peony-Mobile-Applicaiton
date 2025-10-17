
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import HomeStackNavigator from './src/navigations/HomeStackNavigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { CommonLoader, CommonLoaderProvider } from './src/components/CommonLoader/commonLoader';
import { UserDataContextProvider, WishlistProvider } from './src/context';
import Toast from 'react-native-toast-message';

const Stack = createNativeStackNavigator();

function App() {
  const theme = useColorScheme();

  return (
    <>
      <UserDataContextProvider>
        <WishlistProvider>
        <CommonLoaderProvider>
          <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>

              <Stack.Screen
                name="HomeStackNavigator"
                component={HomeStackNavigator}
              />

            </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </CommonLoaderProvider>
        </WishlistProvider>
      </UserDataContextProvider>
    </>

  );
}

export default App;