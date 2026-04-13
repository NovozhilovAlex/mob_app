import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawerContent from "@/src/components/CustomDrawerContent";
import { useAppSettingsStore } from '@/src/services/AppSettingsService';
import i18n from '@/src/locales';
import {useEffect} from "react";
import * as ScreenOrientation from 'expo-screen-orientation';

export default function MainAppLayout() {
  const { nightMode, language, getCurrentLanguage } = useAppSettingsStore();

  useEffect(() => {
    // Обновляем язык i18n при изменении настроек
    i18n.changeLanguage(getCurrentLanguage()).then();

    ScreenOrientation.unlockAsync().then();
  }, [language]);


  return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={nightMode ? DarkTheme : DefaultTheme}>
          <Drawer drawerContent={(props) => <CustomDrawerContent {...props}/>}
                  screenOptions={{
                    swipeEnabled: false, // Отключает свайп для всех экранов
                  }}>

            {/* Здесь будут ваши экраны */}
              <Drawer.Screen
                  name="(main-stack)"
                  options={{
                      headerShown: false,
                      drawerLabel: 'mainStack',
                      title: 'mainStack',
                  }}
              />

              <Drawer.Screen
                  name="(camera-stack)"
                  options={{
                      headerShown: false,
                      drawerLabel: 'cameraStack',
                      title: 'cameraStack',
                  }}
              />

              <Drawer.Screen
                  name="(info-stack)"
                  options={{
                      headerShown: false,
                      drawerLabel: 'infoStack',
                      title: 'infoStack',
                  }}
              />

              <Drawer.Screen
                  name="(settings-stack)"
                  options={{
                      headerShown: false,
                      drawerLabel: 'settingsStack',
                      title: 'settingsStack',
                  }}
              />
          </Drawer>
        </ThemeProvider>
      </GestureHandlerRootView>
  );
}
