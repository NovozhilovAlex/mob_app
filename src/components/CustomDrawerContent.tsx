import React from 'react';
import {
    DrawerContentComponentProps
} from '@react-navigation/drawer';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {useNavigation, useRouter, useSegments} from "expo-router";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useTranslation} from "react-i18next";
import {AppColors} from "@/src/constants/appColors";
import DrawerCustomItem from "@/src/components/DrawerCustomItem";
import {useNavigationService} from "@/src/services/NavigationService";
import {useCustomOrientation} from "@/src/hooks/useCustomOrientation";

export default function CustomDrawerContent(
    props: DrawerContentComponentProps
) {
  const insets = useSafeAreaInsets();
  const cancelIcon = require('@/assets/Image/Resources/Icons/CancelIcon.png');

  const houseIcon = require('@/assets/Image/Resources/Icons/HouseIcon.png');
  const cameraIcon = require('@/assets/Image/Resources/Icons/CameraIcon.png');
  const infoRoundIcon = require('@/assets/Image/Resources/Icons/InfoRoundIcon.png');
  const settingsIcon = require('@/assets/Image/Resources/Icons/SettingsIcon.png');

  const {nightMode} = useAppSettingsStore();
  const {t} = useTranslation();
  const orientation = useCustomOrientation();
  const navigationService = useNavigationService();

  const router = useRouter();
  const navigation = useNavigation();

  const segments = useSegments(); // ['(drawer)', 'home']

  const checkNeedRoute = (segment: string): boolean => {
    console.log('checkNeedRoute. segments:', segments);

    if (segments.length > 1 && segments[0] === segment) {
      console.log('Уже на этой странице:', segment);
      return false;
    }
    return true;
  };


  return (
    <View style={[styles.container,
      {
        paddingTop: insets.top,
        paddingLeft: insets.left,
        backgroundColor: nightMode ? AppColors.dark.bgColor : AppColors.light.bgColor
      }]}>
      <View style={{
        height: orientation === 'PORTRAIT' ? 70 : 40
      }}>
        <TouchableOpacity
          style={[styles.iconContainer]}
          onPress={() => {
            props.navigation.closeDrawer()
          }}
          activeOpacity={0.5}
        >
          <Image
            source={cancelIcon}
            style={{
              width: 20,
              height: 20,
              tintColor: nightMode ? AppColors.dark.textColor : AppColors.light.textColor
            }}
            resizeMode="contain"
          />

        </TouchableOpacity>
      </View>
      <View style={[styles.separator, {
        backgroundColor: nightMode ? AppColors.dark.borderColor : AppColors.light.borderColor
      }]}/>

      <DrawerCustomItem icon={houseIcon}
                        text={t('drawer.main')}
                        onPress={() => {
                          navigationService.openMainPage();
                          props.navigation.closeDrawer();
                        }}/>

      <View style={[styles.separator, {
        backgroundColor: nightMode ? AppColors.dark.borderColor : AppColors.light.borderColor
      }]}/>

      <DrawerCustomItem icon={cameraIcon}
                        text={t('drawer.camera')}
                        onPress={() => {
                          navigationService.openCameraPage();
                          props.navigation.closeDrawer();
                        }}/>

      <View style={[styles.separator, {
        backgroundColor: nightMode ? AppColors.dark.borderColor : AppColors.light.borderColor
      }]}/>

      <DrawerCustomItem icon={infoRoundIcon}
                        text={t('drawer.info')}
                        onPress={() => {
                          navigationService.openInfoPage();
                          props.navigation.closeDrawer();

                          /*navigation.dispatch(
                            CommonActions.navigate({
                              name: '(info-stack)', // Имя группы/папки в Drawer (например, '(tabs)' или 'settings')
                              params: {
                                screen: 'info', // Начальный экран внутри этого стека
                              },
                              // Сбрасываем внутреннее состояние этого стека
                              action: CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'info' }],
                              }),
                            })
                          );*/


                          //
                          // router.push("/(info-stack)/info");
                          // console.log('router.canDismiss(): ',router.canDismiss());
                          // //if (router.canDismiss()) {
                          //   router.dismiss(100);
                          // /*}
                          // else {
                          //   console.log("router.canDismiss() false");
                          // }*/
                          //  props.navigation.closeDrawer();


                          // 1. Получаем состояние корневого навигатора (Drawer)
                          // Если кнопка уже в Drawer, используем просто navigation
                          // Если глубоко в стеке — поднимаемся вверх через getParent()
                          // let rootNavigation = navigation;
                          // // while (rootNavigation.getParent()) {
                          // //   rootNavigation = rootNavigation.getParent()!;
                          // // }
                          //
                          // const rootState = rootNavigation.getState();
                          //
                          // // 2. Проходим по всем веткам Drawer
                          // rootState?.routes.forEach((route) => {
                          //   console.log(`Ветка: ${route.name}`);
                          //
                          //   // Если у ветки есть вложенное состояние (наш Stack)
                          //   if (route.state) {
                          //     const stackRoutes = route.state.routes;
                          //     console.log('  Экраны в стеке:', stackRoutes.map(r => r.name));
                          //
                          //     stackRoutes.forEach((route1) => {
                          //       console.log(`Ветка: ${route1.name}`);
                          //
                          //
                          //       // Если у ветки есть вложенное состояние (наш Stack)
                          //       if (route1.state) {
                          //         const stackRoutes = route1.state.routes;
                          //         console.log('  Экраны в стеке1:', stackRoutes.map(r => r.name));
                          //       } else {
                          //         console.log('  Стек еще не инициализирован1 (экран не посещался)');
                          //       }
                          //     })
                          //   } else {
                          //     console.log('  Стек еще не инициализирован (экран не посещался)');
                          //   }
                          // });

                        }}/>

      <View style={[styles.separator, {
        backgroundColor: nightMode ? AppColors.dark.borderColor : AppColors.light.borderColor
      }]}/>

      <DrawerCustomItem icon={settingsIcon}
                        text={t('drawer.settings')}
                        onPress={() => {
                          navigationService.openSettingsPage()
                          props.navigation.closeDrawer();
                        }}/>

      <View style={[styles.separator, {
        backgroundColor: nightMode ? AppColors.dark.borderColor : AppColors.light.borderColor
      }]}/>

    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 70,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    backgroundColor: '#ECECEC',
    height: 1
  },
  container: {
    flex: 1,
  }
});