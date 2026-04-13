import React, {useCallback, useRef} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {accessibilityStrings} from "@/src/locales/accesibilityStrings";
import {Label} from "@react-navigation/elements";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Camera, useCameraDevice, useCameraPermission, useFrameProcessor} from "react-native-vision-camera";
import {useIsFocused} from "@react-navigation/native";
import AccessibilityButton from "@/src/components/AccessibilityButton";
import * as ScreenOrientation from "expo-screen-orientation";
import {OrientationLock} from "expo-screen-orientation";
import OrientationConfig from "@/src/components/OrientationConfig";
import StatusBarConfig from "@/src/components/StatusBarConfig";



// Не убирать default!
export default function AccessibilityCameraScreen() {
  const router = useRouter();
  const {nightMode} = useAppSettingsStore();
  const insets = useSafeAreaInsets();
  const backgroundColor = nightMode ? '#1C1C1E' : '#FFFFFF';
  const buttonColor = nightMode ? '#3A3A3C' : '#E5E5E9';
  const buttonTextColor = nightMode ? '#FFFFFF' : '#00000';

  const { hasPermission: isCameraPermission } = useCameraPermission();
  const isFocused = useIsFocused();
  const camera = useRef<Camera>(null);
  const device = useCameraDevice( 'back');

  const frameProcessor = useFrameProcessor((frame) => {

  }, []);

  useFocusEffect(
    useCallback(() => {
      // 1. Блокируем ориентацию при входе на экран
      const lockOrientation = async () => {
        await ScreenOrientation.lockAsync(OrientationLock.PORTRAIT_UP);
      };
      lockOrientation().then();

      return () => {};
    }, [])
  );

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: backgroundColor,
        paddingBottom: insets.bottom
      }
    ]}>
      <OrientationConfig orientationForLock={OrientationLock.PORTRAIT_UP}/>
      <StatusBarConfig/>

      <View style={[styles.absoluteLayout, {}]}>
        {isCameraPermission && device != null ? <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused}
          //frameProcessor={frameProcessor}
          //frameProcessorFps={30}
          resizeMode="cover"/> : <View/>}
      </View>

      <View style={{
        flex: 1
      }}>
        <View style={{flex: 1, paddingBottom: 5}}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: buttonColor}]}>
            <Label adjustsFontSizeToFit={true} numberOfLines={4}
                   style={[styles.buttonText, {color: buttonTextColor}]}>
              {accessibilityStrings.res.start_recognize_button}
            </Label>
          </TouchableOpacity>
        </View>

        <View style={{
          flex: 1,
          // backgroundColor: backgroundColor
        }}>
          <Label adjustsFontSizeToFit={true}
                 style={{
                   width: '100%',
                   height: '100%',
                   fontSize: 500,
                   color: buttonTextColor
                 }}>
            {accessibilityStrings.res.str_100}
          </Label>
        </View>

        <View style={{flex: 1, gap: 5, marginVertical: 5}}>
          <AccessibilityButton
            text={accessibilityStrings.res.settings}
            onPress={() => router.push('/(accessibility)/settings')}/>

          <AccessibilityButton
            text={accessibilityStrings.res.instruction_page_name}
            onPress={() => router.push('/(accessibility)/instruction')}/>

          <AccessibilityButton
            text={accessibilityStrings.res.banknote_info_page_name}
            onPress={() => router.push('/(accessibility)/nominals')}/>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontSize:50
  },
  absoluteLayout:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  }
});