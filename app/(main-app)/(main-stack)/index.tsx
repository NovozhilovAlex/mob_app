import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NominalCarousel from "@/src/components/NominalCarouselNew";
import {appInitializer} from "@/src/services/AppInitializer";
import {useRouter} from "expo-router";
import {useCameraPermission} from "react-native-vision-camera";
import {RadialGradient} from "@/src/components/RadialGradient";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import ButtonWithIcon from "@/src/components/ButtonWithIcon";
import {useTranslation} from "react-i18next";
import {useNavigationService} from "@/src/services/NavigationService";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";
import FullScreenGradient from "@/src/components/FullScreenGradient";
import OrientationConfig from "@/src/components/OrientationConfig";
import {useIsFocused} from "@react-navigation/native";
import StatusBarConfig from "@/src/components/StatusBarConfig";

// Не убирать default!
export default function HomeScreen() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const { nightMode } = useAppSettingsStore();
  const {t} = useTranslation();
  const navigationService = useNavigationService();
  const orientation = useCustomOrientation();

  useEffect(() => {
    const initApp = async () => {
      try {
        await appInitializer.initialize();
        setIsInitializing(false);
      } catch (error: any) {
        console.error('Ошибка инициализации:', error);
        setInitializationError(error.message || 'Неизвестная ошибка');
        setIsInitializing(false);
      }
    };

    initApp();
  }, []);

  const cameraPress = async () => {
    await navigationService.openCameraPage();
  };

  const settingsPress = () => {
    navigationService.openSettingsPage();
  };

  const helpPress = () => {
    navigationService.openInfoPage();
  };

  if (isInitializing) {
    return (
        <View style={[styles.center]}>
          <FullScreenGradient/>
        </View>
    );
  }

  if (initializationError) {
    return (
      <View style={[styles.center]}>
        <FullScreenGradient/>
      </View>
    );
  }


  return (
      <View style={{ flex: 1 }}>
        <StatusBarConfig style={'light-text'}/>
        <OrientationConfig/>
          <View style={StyleSheet.absoluteFillObject}>
              <RadialGradient
                  colorList={[
                      { offset: '0%', color: nightMode ? '#224A59' : '#6DC3C7', opacity: '1' },
                      { offset: '100%', color: nightMode ? '#235162' : '#478D9C', opacity: '1' }
                  ]}
                  x="50%"
                  y="50%"
                  rx="50%"  // уже по горизонтали
                  ry="50%"  // вытянут по вертикали
              />
          </View>
        <SafeAreaView style={[
          styles.container
        ]}>
          <View style={{
            paddingTop: orientation === 'PORTRAIT' ? 24 : 0,
            paddingBottom: orientation === 'PORTRAIT' ? 8 : 0
          }}>
            <Text style={styles.headerTitle}>{t("common.appName")}</Text>
          </View>

          {/* Вертикальная карусель банкнот */}
          <View style={{
            flex: 1,
            paddingTop: orientation === 'PORTRAIT' ? 24 : 0,
            paddingBottom: orientation === 'PORTRAIT' ? 32 : 0,
          }}>
            <NominalCarousel/>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 16,
          }}>
            {/* Кнопка настроек слева */}
            <TouchableOpacity
                onPress={settingsPress}
                style={{
                  width: 70,
                  paddingVertical: 8,
                  justifyContent:'center',
                  alignItems: 'center',
                  borderRadius: 35,
                }}>
              <Image
                  source={require('@/assets/Image/Resources/Icons/SettingsIcon.png')}
                  style={{
                    width: 30,
                    height: 30,
                    tintColor: '#fff', // Если иконка черная, можно применить белый цвет
                  }}
                  resizeMode="contain"
              />
            </TouchableOpacity>

            <View style={{flex:1}}>
              <View style={{
                justifyContent:'center',
                alignItems: 'center',
                marginHorizontal:9}}>
                <ButtonWithIcon title={t('main.determineNominalBanknote')}
                                icon={require('@/assets/Image/Resources/Icons/CameraIcon.png')}
                                iconSize={24}
                                onPress={cameraPress}/>
              </View>
            </View>


            {/* Кнопка справки справа */}
            <TouchableOpacity
                onPress={helpPress}
                style={{
                  width: 70,
                  paddingVertical: 8,
                  justifyContent:'center',
                  alignItems: 'center',
                  borderRadius: 35,
                }}>
              <Image
                  source={require('@/assets/Image/Resources/Icons/InfoRoundIcon.png')}
                  style={{
                    width: 30,
                    height: 30,
                    tintColor: '#fff', // Если иконка черная, можно применить белый цвет
                  }}
                  resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    marginTop: 10,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
});
