import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, Image, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useIsFocused} from "@react-navigation/native";
import {
  Camera,
  runAtTargetFps,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
  VisionCameraProxy
} from "react-native-vision-camera";
import {useSharedValue, Worklets} from 'react-native-worklets-core';
import {router, useFocusEffect} from 'expo-router';
import {useTranslation} from "react-i18next";
import {RecognizeResultParams} from "@/app/(main-app)/(camera-stack)/recognize-result";
import PageTitle from "@/src/components/PageTitle";
import {OrientationLock} from 'expo-screen-orientation';
import {activateKeepAwakeAsync, deactivateKeepAwake} from "expo-keep-awake";
import RNFS from 'react-native-fs';
import OrientationConfig from "@/src/components/OrientationConfig";
import StatusBarConfig from "@/src/components/StatusBarConfig";

export default function CameraScreen() {
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      // Включаем при фокусе
      activateKeepAwakeAsync().then();
      // Выключаем, когда уходим с экрана (размонтирование или потеря фокуса)
      return () => deactivateKeepAwake();
    }, [])
  );

  const TARGET_ID_TO_DB_MODIFICATION: Record<number, [number, string]> = {
    0: [20, '1'],
    1: [20, '2'],
    3: [23, '1'],
    4: [23, '2'],
    5: [21, '1'],
    6: [21, '2'],
    8: [3, '1'],
    9: [3, '2'],
    10: [1, '1'],
    11: [1, '2'],
    13: [4, '1'],
    14: [4, '2'],
    21: [6, '1'],
    22: [6, '2'],
    23: [9, '1'],
    24: [9, '2'],
    26: [10, '1'],
    27: [10, '2'],
    28: [13, '1'],
    29: [13, '2'],
    30: [12, '1'],
    31: [12, '2'],
    32: [15, '1'],
    33: [15, '2'],
    34: [16, '1'],
    35: [16, '2'],
    36: [14, '1'],
    37: [14, '2'],
    38: [17, '1'],
    39: [17, '2'],
    40: [18, '1'],
    41: [18, '2'],
    42: [27, '1'],
    43: [27, '2'],
    44: [19, '1'],
    45: [19, '2']
  } as const;

  // const isInit = useSharedValue(false);
  // const setIsInit = () => {
  //   isInit.value = true;
  // };

  const isProcessingEnabled = useSharedValue(true);
  const processingStartTime = useSharedValue(Date.now());
  const [isProcessingEnabledState, setIsProcessingEnabledState] = useState(true);
  useEffect(() => {
    setIsProcessingEnabledState(isProcessingEnabled.value);
  }, [isProcessingEnabled]);

  const startProcessing = () => {
    'worklet';
    //if (!isInit.value) return;
    console.log('startProcessing');
    isProcessingEnabled.value = true;
    processingStartTime.value = Date.now();
  };

  const stopProcessing = () => {
    'worklet';
    console.log('stopProcessing');
    isProcessingEnabled.value = false;
  };

  const isDetectNow = useSharedValue(false);
  const startDetect = () => {
    'worklet';
    isDetectNow.value = true;
  };

  const stopDetect = () => {
    'worklet';
    isDetectNow.value = false;
  };

  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    // Подписываемся на изменение состояния приложения
    const subscription = AppState.addEventListener('change', nextAppState => {
      // Состояние 'active' означает, что приложение на переднем плане
      let isForeground = nextAppState === 'active';
      console.log('nextAppState: ', nextAppState, isForeground);

      setIsForeground(isForeground);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const [isCanceled, setIsCanceled] = useState<boolean>(false);
  
  const openResult = async (modificationId: number, side: string) => {
    if (!isProcessingEnabled.value)
    {
      console.log('Skip openResult');
      return;
    }
    console.log('openResult', modificationId, side);
    stopProcessing();
    setResult(null);
    router.push({
      pathname: "/recognize-result",
      params: {
        type: "FindModification", //"modification", "sign-check
        modificationId: modificationId,
        side: side, // "1" or "2"
        signCheckResult: "SignsDefined" //SignsDefined, TryAgain, SignsNotDefined
      } as unknown as RecognizeResultParams
    });

  };

  useFocusEffect(
    React.useCallback(() => {
      // Код, который выполнится при входе на экран или возврате на него
      setResult(null);
      startProcessing();

      return () => {
        // Опционально: код при уходе с экрана (аналог blur)
        stopProcessing();
      };
    }, [])
  );

  // useEffect(() => {
  //   (async () => {
  //     console.log('Start init lib');
  //     if (isCanceled) {
  //       setIsCanceled(true);
  //       console.log('Stop init lib. isCanceled');
  //       return;
  //     }
  //     try {
  //       LibHolder.setPersistentDataPath();
  //       console.log('set path');
  //
  //       LibHolder.initLibAR();
  //       console.log('init libar');
  //
  //       const assets = await Asset.loadAsync([
  //         require('@/assets/Image/Resources/Targets/5R_97_av.data'),
  //         require('@/assets/Image/Resources/Targets/5R_97_rv.data'),
  //         require('@/assets/Image/Resources/Targets/10R_97_av.data'),
  //         require('@/assets/Image/Resources/Targets/10R_97_rv.data'),
  //         require('@/assets/Image/Resources/Targets/50R_97_av.data'),
  //         require('@/assets/Image/Resources/Targets/50R_97_rv.data'),
  //         require('@/assets/Image/Resources/Targets/100R_22_av.data'),
  //         require('@/assets/Image/Resources/Targets/100R_22_rv.data'),
  //         require('@/assets/Image/Resources/Targets/100R_97_av.data'),
  //         require('@/assets/Image/Resources/Targets/100R_97_rv.data'),
  //         require('@/assets/Image/Resources/Targets/200R_17_av.data'),
  //         require('@/assets/Image/Resources/Targets/200R_17_rv.data'),
  //         require('@/assets/Image/Resources/Targets/500R_97_av.data'),
  //         require('@/assets/Image/Resources/Targets/500R_97_rv.data'),
  //         require('@/assets/Image/Resources/Targets/500R_10_rv.data'),
  //         require('@/assets/Image/Resources/Targets/1000R_97_av.data'),
  //         require('@/assets/Image/Resources/Targets/1000R_97_rv.data'),
  //         require('@/assets/Image/Resources/Targets/2000R_17_av.data'),
  //         require('@/assets/Image/Resources/Targets/2000R_17_rv.data'),
  //         require('@/assets/Image/Resources/Targets/5000R_97_av.data'),
  //         require('@/assets/Image/Resources/Targets/5000R_97_rv.data'),
  //         require('@/assets/Image/Resources/Targets/5000R_23_av.data'),
  //         require('@/assets/Image/Resources/Targets/5000R_23_rv.data')
  //       ]);
  //
  //       for (const asset of assets) {
  //         if (!asset.localUri) {
  //           console.warn('Asset localUri is null, skipping');
  //           return;
  //         }
  //         const path = asset.localUri.replace('file://', '');
  //         LibHolder.addTargetFromPath(path);
  //       }
  //     } catch (e) {
  //       console.log('Native error:', e);
  //       return;
  //     }
  //     console.log('add targets');
  //
  //     try {
  //       const asset = Asset.fromModule(
  //         require('@/assets/Models/detect.onnx')
  //       );
  //       await asset.downloadAsync();
  //       if (!asset.localUri) throw new Error('Asset.localUri is null');
  //
  //       const path = asset.localUri.replace('file://', '');
  //
  //       LibHolder.initNetRectDataMatrixFromPath(path);
  //       console.log('init detect:', path);
  //     } catch (e) {
  //       console.log('Native error:', e);
  //       return;
  //     }
  //
  //     try {
  //       const asset = Asset.fromModule(
  //         require('@/assets/Models/classify.onnx')
  //       );
  //       await asset.downloadAsync();
  //       if (!asset.localUri) throw new Error('Asset.localUri is null');
  //
  //       const path = asset.localUri.replace('file://', '');
  //
  //       LibHolder.initNetClassifyDataMatrixFromPath(path);
  //       console.log('init classify:', path);
  //
  //     } catch (e) {
  //       console.log('Native error:', e);
  //       return;
  //     }
  //
  //     setIsInit();
  //     startProcessing();
  //   })()
  // }, [LibHolder]);

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  const bnkPicture = require('@/assets/Image/Resources/Icons/BnkPicture.png');
  const rubPicture = require('@/assets/Image/Resources/Icons/RubPicture.png');
  const bnkCorner = require('@/assets/Image/Resources/Icons/BnkCorner.png');

  const bnkProportion = isPortrait ? 800/1820 : 1820/800;
  const cornerDefPercent = 15;
  const cornerSecondPercentLandscape = cornerDefPercent / bnkProportion;
  const cornerSecondPercentPortrait = cornerDefPercent * bnkProportion;

  const cornerWidthPercent = isPortrait ? cornerDefPercent : cornerSecondPercentLandscape;
  const cornerHeightPercent = isPortrait ? cornerSecondPercentPortrait: cornerDefPercent;


  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // Разрешения
  const { hasPermission: isCameraPermission } = useCameraPermission();

  // // Запрос разрешений
  // useEffect(() => {
  //   const requestPermissions = async () => {
  //     if (!cameraPermission) {
  //       const result = await requestCameraPermission();
  //       if (result){
  //         isCameraAvailable = true;
  //       }
  //     }
  //     else{
  //       isCameraAvailable = true;
  //     }
  //   };
  //   requestPermissions();
  // }, []);


  const camera = useRef<Camera>(null);

  const device = useCameraDevice( 'back');

  const format = useCameraFormat(device, [
    {
      // videoResolution:
      //   {
      //     width: device?.hardwareLevel === 'full' ? 1280 : 640,
      //     height: device?.hardwareLevel === 'full' ? 720 : 480
      //   }
      videoResolution:
        {
          width: 640,
          height: 480
        }
    },
  ])

  const plugin = VisionCameraProxy.initFrameProcessorPlugin('getRectDataMatrix', {});

  interface DetectionResult {
    targetId: number | null,
    result: number | null,
    pointsArray: number[] | null,
    classesArray: number[] | null,
    scoresArray: number[] | null,
    timestamp?: number
  }

  const onError = Worklets.createRunOnJS((error: String | null) => {
    console.error('❌ FrameProcessor error:', error);
  });

  const [result, setResult] = useState<DetectionResult | null>(null);
  const onResult = Worklets.createRunOnJS((result: DetectionResult | null) => {
    console.log('targetId = ' + result?.targetId);
    console.log('result = ' + result?.result);

    setResult(result);
    if (result?.result == 1 && result?.targetId != -1 && result?.targetId != null) {
      openResult(TARGET_ID_TO_DB_MODIFICATION[result?.targetId][0], TARGET_ID_TO_DB_MODIFICATION[result?.targetId][1])
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    // Этот блок будет выполняться 1 раз в секунду
    runAtTargetFps(1, () => {
      //'worklet';


      const now = Date.now();
      const timeAfterStart = now - processingStartTime.value;
      console.log(`frameProcessor. Frame timestamp: ${frame.timestamp}, now=${now} age=${timeAfterStart}`);

      if (timeAfterStart < 1000) {
        console.log('frameProcessor skip frame by age');
        return;
      }

      if (plugin === null) {
        console.log('frameProcessor plugin null');
        return;
      }

      if (!isProcessingEnabled.value) {
        console.log('frameProcessor isProcessingEnabled:', isProcessingEnabled.value);
        return;
      }

      if (isDetectNow.value) {
        console.log('frameProcessor. Skip frame. isDetectNow:', isDetectNow.value);
        return;
      }

      // runAsync(frame, () => {
      //   'worklet';
        startDetect();

        const startTime = performance.now();

        const rawResult = plugin!.call(frame, {
          isRotated: frame.orientation == 'landscape-left',
          pixelFormat: 2,
          path: RNFS.DocumentDirectoryPath
        }) as unknown as DetectionResult;

        const endTime = performance.now();
        console.log(`⏱️ Async processing: ${(endTime - startTime).toFixed(2)}ms`);

        onResult(rawResult).then();

        stopDetect();
      });
    // });
    return;
  }, [plugin, onResult, onError]);

  return (
    <View style={[styles.flexContainer,
      {
        backgroundColor: '#000'
      }]}>
      <StatusBarConfig style={'light-text'}/>
      <OrientationConfig orientationForLock={OrientationLock.PORTRAIT_UP}/>

      <View style={styles.absoluteLayout}>
        {isCameraPermission && device != null && isProcessingEnabledState
          ? <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused && isForeground}
          frameProcessor={frameProcessor}
          format={format}
          resizeMode="cover"/>
          : <View  style={[StyleSheet.absoluteFill, {backgroundColor: 'black'}]}/>}
      </View>

      <View style={{flex: 1,
                    width:'100%',
                    height:'100%',
                    paddingLeft:insets.left,
                    paddingRight:insets.right}}>
        <View style={{flex: 1, width:'100%', height:'100%'}}>



        </View>

      </View>


      {/*UI*/}
      <View style={[styles.absoluteLayout]}>
        <View style={{
          backgroundColor:'rgba(0, 0, 0, 0.8)' ,
          width:'100%'
        }}>
          <PageTitle title={t('camera.autoDetectDescription')} isMenuEnable={false} isTransparent={true} isAlwaysNightMode={true}/>
        </View>
        <View style={{flex:1, width:'100%',
          paddingBottom:insets.bottom,
          paddingLeft:insets.left,
          paddingRight:insets.right}}>
          <View style={{flex:1, width:'100%'}}>
            <View style={{ flex: 1 }}>
              {/*Наведите камеру на банкноту*/}
              {(result === null || result?.targetId === -1 || result?.targetId === null) && (
                <View style={[styles.absoluteLayout]}>
                  <View style={{width:'50%', height:'65%', justifyContent:'center', alignItems:'center'}}>
                    <View style={{aspectRatio: 1, width:'100%', maxHeight:'100%'}}>
                      <View style={[styles.squarePercentage, {borderRadius: 30, padding:20}]}>
                        <View style={[{flex:1.4, justifyContent: 'center', alignItems: 'center'}]}>
                          <Image style={[styles.absoluteLayout,{resizeMode: 'contain', width: '100%', height: '100%'}]} source={bnkPicture}/>
                          <View style={styles.absoluteLayout}>
                            <Image style={[{
                              resizeMode: 'contain',
                              width: '100%',
                              height: '30%',
                            }]} source={rubPicture}/>
                          </View>
                        </View>
                        <View style={[{flex:1, justifyContent: 'center', alignItems: 'center'}]}>
                          {/*<Text style={[styles.headerTitle, { fontSize: 14}]}>Наведите камеру на{'\u00A0'}банкноту*/}
                          {/*</Text>*/}
                          <Text style={[styles.headerTitle, { fontSize: 14}]}>{t('camera.moveCameraOnBnk')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                </View>
              )}
              {/*Bnk corners*/}
              {!(result === null || result?.targetId === -1 || result?.targetId === null) && (
                <View style={[styles.absoluteLayout, {top: '5%', bottom: '5%'}]}>
                  <View style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width:'100%',
                    alignContent:'center',
                    aspectRatio: bnkProportion,
                  }}>
                    <View style={{
                      position:'absolute',
                      width: `${cornerWidthPercent}%`,
                      height:`${cornerHeightPercent}%`,
                    }}>
                      <Image source={bnkCorner}
                             style={[styles.cornerImage, { transform: [{ rotate: '270deg' }]}]}/>
                    </View>
                    <View style={{
                      position:'absolute',
                      width: `${cornerWidthPercent}%`,
                      height:`${cornerHeightPercent}%`,
                      left:`${100 - cornerWidthPercent}%`,
                    }}>
                      <Image source={bnkCorner}
                             style={[styles.cornerImage, { transform: [{ rotate: '0deg' }]}]}/>
                    </View>
                    <View style={{
                      position:'absolute',
                      width: `${cornerWidthPercent}%`,
                      height:`${cornerHeightPercent}%`,
                      top:`${100 - cornerHeightPercent}%`,
                    }}>
                      <Image source={bnkCorner}
                             style={[styles.cornerImage, { transform: [{ rotate: '180deg' }]}]}/>
                    </View>
                    <View style={{
                      position:'absolute',
                      width: `${cornerWidthPercent}%`,
                      height:`${cornerHeightPercent}%`,
                      top:`${100 - cornerHeightPercent}%`,
                      left:`${100 - cornerWidthPercent}%`,
                    }}>
                      <Image source={bnkCorner}
                             style={[styles.cornerImage, { transform: [{ rotate: '90deg' }]}]}/>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  absoluteLayout:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },

  cornerImage:{
    resizeMode: 'contain',
    width: '100%',
    height: '100%'
  },

  headerTitle: {
    color: 'white',
    fontWeight: 'medium',
    textAlign: 'center',
  },

  header: {
    height: 70, // Фиксированная высота
    justifyContent: 'center',
    alignItems: 'center'
  },

  squarePercentage: {
    alignContent: 'center',
    aspectRatio: 1, // Сохраняет соотношение сторон 1:1 (квадрат)
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  rightButton:{
    position: 'absolute',
    top: 0,
    width: 70,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },

});
