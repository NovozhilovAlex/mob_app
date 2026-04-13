import {Stack} from "expo-router";
import {useEffect, useState} from "react";
import {AccessibilityInfo, NativeModules} from "react-native";
import {Asset} from "expo-asset";
import RNFS from 'react-native-fs';
import {useAppSettingsStore} from "@/src/services/AppSettingsService";

const { SignCheckCpp } = NativeModules;

export type AppMode = 'accessibility' | 'mainApp' | 'license';

export default function RootLayout() {
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
  const {isLicenseAgreementAccepted} = useAppSettingsStore();

  const [appStartMode, setAppStartMode] = useState<AppMode>('mainApp');
  useEffect(() => {
    if (isAccessibilityMode) {
      const currentMode: AppMode = 'accessibility';
      console.log('AppStartMode: ', currentMode);
      setAppStartMode(currentMode);
      return;
    }

    if (!isLicenseAgreementAccepted) {
      const currentMode: AppMode = 'license';
      console.log('AppStartMode: ', currentMode);
      setAppStartMode(currentMode);
      return;
    }

    const currentMode: AppMode = 'mainApp';
    console.log('AppStartMode: ', currentMode);
    setAppStartMode(currentMode);

  }, [isAccessibilityMode, isLicenseAgreementAccepted]);

  // Проверяем включено ли чтение с экрана
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then((isEnabled) => {
      console.log('setIsAccessibilityMode:' + isEnabled);
      setIsAccessibilityMode(isEnabled);
    });
  }, []);


  // Инициализация камеры
  useEffect(() => {
      (async () => {
        console.log('Start init lib');
        try {
          const path = RNFS.DocumentDirectoryPath;
          SignCheckCpp.setPersistentDataPath(path);
          console.log('set path');

          SignCheckCpp.initLibAR();
          console.log('init libar');

          const assets = await Asset.loadAsync([
            require('@/assets/Image/Resources/Targets/AllTargets.bin')
          ]);

          for (const asset of assets) {
            if (!asset.localUri) {
              console.warn('Asset localUri is null, skipping');
              return;
            }
            const path = asset.localUri.replace('file://', '');
            SignCheckCpp.addTargetFromPath(path);
          }
        } catch (e) {
          console.log('Native error:', e);
          return;
        }
        console.log('add targets');

        try {
          const asset = Asset.fromModule(
            require('@/assets/Models/detect.onnx')
          );
          await asset.downloadAsync();
          if (!asset.localUri) throw new Error('Asset.localUri is null');

          const path = asset.localUri.replace('file://', '');

          SignCheckCpp.initNetRectDataMatrixFromPath(path);
          console.log('init detect:', path);
        } catch (e) {
          console.log('Native error:', e);
          return;
        }

        try {
          const asset = Asset.fromModule(
            require('@/assets/Models/classify.onnx')
          );
          await asset.downloadAsync();
          if (!asset.localUri) throw new Error('Asset.localUri is null');

          const path = asset.localUri.replace('file://', '');

          SignCheckCpp.initNetClassifyDataMatrixFromPath(path);
          console.log('init classify:', path);

        } catch (e) {
          console.log('Native error:', e);
          return;
        }

        try {
          const asset = Asset.fromModule(
            require('@/assets/Models/modelFakeRecognitionNewSpark.onnx')
          );
          await asset.downloadAsync();
          if (!asset.localUri) throw new Error('Asset.localUri is null');

          const path = asset.localUri.replace('file://', '');

          SignCheckCpp.initSpark5k23FromPath(path);
          console.log('init spark 5k23:', path);
        } catch (e) {
          console.log('Native error:', e);
          return;
        }
      })()
    }, [SignCheckCpp]);

  console.log('Init app:', appStartMode);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/*<Stack.Screen name="(accessibility)" redirect={!isAccessibilityMode} />*/}
      {/*<Stack.Screen name="(main-app)" redirect={isAccessibilityMode} />*/}

      <Stack.Screen name="(accessibility)" redirect={appStartMode !== 'accessibility'} />
      <Stack.Screen name="(main-app)" redirect={appStartMode !== 'mainApp'} />
      <Stack.Screen name="(license-on-start)" redirect={appStartMode !== 'license'} />
    </Stack>
  );
}
