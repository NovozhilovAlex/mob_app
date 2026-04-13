import {Image, NativeModules, StatusBar, StyleSheet, TouchableOpacity, View} from "react-native";
import * as React from "react";
import {useCallback, useRef, useState} from "react";
import {useFocusEffect, useLocalSearchParams, useRouter} from "expo-router";
import * as ScreenOrientation from 'expo-screen-orientation';
import {OrientationLock} from 'expo-screen-orientation';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Camera, PhotoFile, useCameraDevice, useCameraPermission} from "react-native-vision-camera";
import {useIsFocused} from "@react-navigation/native";
import {useTranslation} from "react-i18next";
import {RecognizeResultParams} from "@/app/(main-app)/(camera-stack)/recognize-result";
import PageTitle from "@/src/components/PageTitle";
import {activateKeepAwakeAsync, deactivateKeepAwake} from "expo-keep-awake";
import RNFS from 'react-native-fs';
import OrientationConfig from "@/src/components/OrientationConfig";
import StatusBarConfig from "@/src/components/StatusBarConfig";

enum State{
  WaitTakePhotoPos1,
  WaitPhotoPos1,
  WaitTakePhotoPos2,
  WaitPhotoPos2,
  WaitResult
}

export default function SignCheck() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const params = useLocalSearchParams();
  const modificationId = Number(params.modificationId);

  const cameraButtonPos1 = require("@/assets/Image/Resources/Icons/SignCheck/TakePhotoPos1.png");
  const cameraButtonPos2 = require("@/assets/Image/Resources/Icons/SignCheck/TakePhotoPos2.png");

  const borderDefault = getBorderDefaultByModificationId(modificationId);
  //const helpImageDefault = require('@/assets/Image/Resources/Borders/5000-10-front-bnk.png');
  const borderAngle = getBorderAngleByModificationId(modificationId);
  //const helpImageAngle = require('@/assets/Image/Resources/Borders/5000-10-angle-bnk.png');

  const isTwoPositionNeed = getIsTwoPositionNeed(modificationId);
  const [currentState, setCurrentState] = useState(State.WaitTakePhotoPos1);

  const [photoPos1, setPhotoPos1] = useState<PhotoFile | null>(null);
  const [photoPos2, setPhotoPos2] = useState<PhotoFile | null>(null);

  const { SignCheckCpp } = NativeModules;

  // Разрешения
  const { hasPermission: isCameraPermission } = useCameraPermission();
  const isFocused = useIsFocused();
  const camera = useRef<Camera>(null);
  const device = useCameraDevice( 'back');

  // const openResult = async (isSignsDefined: number) => {
  //   router.push({
  //     pathname: "/sign-check-result",
  //     params: {
  //       isSignsDefined: isSignsDefined
  //     }
  //   });
  // };

  useFocusEffect(
    useCallback(() => {
      // Включаем при фокусе
      activateKeepAwakeAsync().then();

      // Выключаем, когда уходим с экрана (размонтирование или потеря фокуса)
      return () => deactivateKeepAwake();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      // Код, который выполнится при входе на экран или возврате на него
      setPhotoPos1(null);
      setPhotoPos2(null);
      setCurrentState(State.WaitTakePhotoPos1);
      return () => {
        // Опционально: код при уходе с экрана
      };
    }, [])
  );

  const openResult = async (isSignsDefined: number) => {
    const result = {
      type: "SignCheck",
      modificationId: String(modificationId),
      side: "1", // "1" or "2"
      signCheckResult: (() => {
        switch (isSignsDefined) {
          case 0: return "TryAgain";
          case 1: return "SignsDefined";
          default: return "SignsNotDefined";
        }
      })()
    } satisfies RecognizeResultParams;

    router.push({
      pathname: "/recognize-result",
      params: result as unknown as RecognizeResultParams
    });
  };

  function getBorderDefaultByModificationId(modificationId: number) {
    switch (modificationId) {
      case 16: return require('@/assets/Image/Resources/Borders/1000-10-front.png');
      case 17: return require('@/assets/Image/Resources/Borders/2000-17-front.png');
      case 19: return require('@/assets/Image/Resources/Borders/5000-10-front.png');
      case 27: return require('@/assets/Image/Resources/Borders/5000-23-front.png');
    }
    return null;
  }

  function getBorderAngleByModificationId(modificationId: number) {
    switch (modificationId) {
      case 16: return require('@/assets/Image/Resources/Borders/1000-10-angle.png');
      case 17: return require('@/assets/Image/Resources/Borders/2000-17-angle.png');
      case 19: return require('@/assets/Image/Resources/Borders/5000-10-angle.png');
      case 27: return null;
    }
    return null;
  }

  function getIsTwoPositionNeed(modificationId: number) {
    switch (modificationId) {
      case 16: return true;
      case 17: return true;
      case 19: return true;
      case 27: return false;
    }
    return false;
  }

  function getBnkTypeByModificationId(modificationId: number) {
    switch (modificationId) {
      case 16: return 'Front1000';
      case 17: return 'Front2000';
      case 19: return 'Front5000_2010';
      case 27: return 'Front5000_2023';
    }
    return null;
  }

  // Съемка фото
  const takePhoto = async (): Promise<PhotoFile | null> => {
    try {
      if (camera.current) {
        const photo: PhotoFile = await camera.current.takePhoto({
          flash: 'on',
          enableShutterSound: true
        });
		const destPath = `${RNFS.DocumentDirectoryPath}/sign_check_top_${Date.now()}.jpg`;
        await RNFS.moveFile(photo.path, destPath);
        photo.path = destPath;
        //setCapturedPhoto(`file://${photo.path}`);
        await camera.current.focus({ x: 0.5, y: 0.5 });
        console.log('Photo taken:', photo.path);
        return photo;
      }
      else {
        return null;
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      //Alert.alert('Error', 'Failed to take photo');
    }
    return null;
  };


  async function takePhotoPos1() {
    setCurrentState(State.WaitPhotoPos1);
    let photo = await takePhoto();
    if (photo === null) {
      setCurrentState(State.WaitTakePhotoPos1);
      return;
    }

    setPhotoPos1(photo)

    if (isTwoPositionNeed) {
      setCurrentState(State.WaitTakePhotoPos2);
    }
    else {
      await calcResult(photo, null);
      setCurrentState(State.WaitResult);
    }
  }


  async function takePhotoPos2() {
    setCurrentState(State.WaitPhotoPos2);
    let photo = await takePhoto();
    if (photo === null) {
      setCurrentState(State.WaitTakePhotoPos2);
      return;
    }

    setPhotoPos2(photo)

    await calcResult(photoPos1, photo);

    setCurrentState(State.WaitResult);
  }

  async function calcResult(photo1: PhotoFile | null, photo2: PhotoFile | null) {
    const result = await SignCheckCpp.signCheckFromPaths(photo1?.path, photo1?.width, photo1?.height, 3, photo1?.orientation == 'landscape-left' ? true : false, 
      photo2?.path || '', photo2?.width || 0, photo2?.height || 0, 3, photo2?.orientation == 'landscape-left' ? true : false || false,
      getBnkTypeByModificationId(modificationId), 2, RNFS.DocumentDirectoryPath
    );

    console.log(result)

    await openResult(result);
  }

  return (

  <View style={[styles.flexContainer,
      {
        backgroundColor: '#000'
      }]}>

    <StatusBarConfig style={'light-text'}/>
    <OrientationConfig orientationForLock={OrientationLock.LANDSCAPE_RIGHT}/>

    <View style={styles.absoluteLayout}>
      {isCameraPermission && device != null ? <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        photo={true}
        isActive={isFocused}
        photoQualityBalance="quality"
        resizeMode="cover"/> : <View/>}
    </View>

    <View style={{flex: 1, width:'100%', height:'100%',
          paddingLeft:insets.left, paddingRight:insets.right}}>
      <View style={{flex: 1, width:'100%', height:'100%'}}>
        {/*Рамка сверху*/}
        {(currentState === State.WaitTakePhotoPos1 ||
          currentState === State.WaitPhotoPos1)
          && (
          <View style={[styles.absoluteLayout]}
          >
            <Image
              source={borderDefault}
              style={{
                height: '100%'
              }}
              resizeMode="contain"
            />
          </View>
        )}


        {/*Рамка под углом*/}
        {(currentState === State.WaitTakePhotoPos2 ||
          currentState === State.WaitPhotoPos2)
          && (
          <View style={[styles.absoluteLayout]}>
            <Image
              source={borderAngle}
              style={{
                width: '100%'
              }}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={[styles.absoluteLayout, {alignItems: 'flex-end'}]}>
          <View style={{width:70, height:70, marginRight:5}}>

            {currentState === State.WaitTakePhotoPos1 && (
              <View style={[styles.absoluteLayout]}>
                <TouchableOpacity style={{width:'100%', height:'100%'}}
                                  onPress={takePhotoPos1}>
                  <Image style={{width:'100%', height:'100%'}}
                         source={cameraButtonPos1}/>
                </TouchableOpacity>
              </View>)}

            {currentState === State.WaitTakePhotoPos2 && (
              <View style={[styles.absoluteLayout]}>
                <TouchableOpacity style={{width:'100%', height:'100%'}}
                                  onPress={takePhotoPos2}>
                  <Image style={{width:'100%', height:'100%'}}
                         source={cameraButtonPos2}/>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </View>

    </View>


    {/*UI*/}
    <View style={[styles.absoluteLayout]}>
      <View style={{
        backgroundColor:'rgba(0, 0, 0, 0.8)' ,
        width:'100%'
      }}>
        <PageTitle title={t('signCheck.searchSignFeatures')} isMenuEnable={false} isTransparent={true} isAlwaysNightMode={true}/>
      </View>
      <View style={{flex:1, width:'100%',
        paddingBottom:insets.bottom,
        paddingLeft:insets.left,
        paddingRight:insets.right}}>
        <View style={{flex:1, width:'100%'}}/>
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
    paddingBottom: 12,
    paddingTop: 12
  },

  squarePercentage: {
    alignContent: 'center',
    width: '50%', // Прямое использование процентов
    aspectRatio: 1, // Сохраняет соотношение сторон 1:1 (квадрат)
    backgroundColor: 'rgba(0,0,0,0.8)',
  },

  // Новые стили для кнопки
  bottomControls: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  processButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  processButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#45A049',
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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