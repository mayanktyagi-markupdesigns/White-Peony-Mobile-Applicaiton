
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import HomeStackNavigator from './src/navigations/HomeStackNavigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { CommonLoader, CommonLoaderProvider } from './src/components/CommonLoader/commonLoader';
import { UserDataContextProvider, WishlistProvider } from './src/context';
import Toast from 'react-native-toast-message';
import NotificationService, { handleNotifeeBackgroundEvent } from './src/service/NotificationService';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { CartProvider } from './src/context/CartContext';


const Stack = createNativeStackNavigator();

function App() {
  const theme = useColorScheme();

  useEffect(() => {
    const createChannel = async () => {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
    };
    createChannel();

    NotificationService.requestUserPermission();
    NotificationService.listenToForegroundMessages();
    NotificationService.listenToBackgroundMessages();
    handleNotifeeBackgroundEvent();
  }, [])

  return (
    <>
      <CommonLoaderProvider>
        <UserDataContextProvider>
          <WishlistProvider>
            <CartProvider>
              <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack.Navigator screenOptions={{ headerShown: false }}>

                  <Stack.Screen
                    name="HomeStackNavigator"
                    component={HomeStackNavigator}
                  />

                </Stack.Navigator>
              </NavigationContainer>
              <Toast />
            </CartProvider>
          </WishlistProvider>
        </UserDataContextProvider>
      </CommonLoaderProvider>

    </>

  );
}

export default App;