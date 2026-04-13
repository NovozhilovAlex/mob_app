import {Button, Image, Platform, StyleSheet, Text, View} from "react-native";
import * as React from "react";
import { dataCacheService } from "@/src/services/DataCacheService";
import Animated, {
  Easing, interpolate, SharedValue,
  useAnimatedStyle, useDerivedValue,
  useSharedValue, withRepeat, withTiming,
} from "react-native-reanimated";

import { findImageInMap } from "@/src/utils/imageMap";
import {KippSign} from "@/src/components/signs/KippSign";
import {useEffect, useState} from "react";
import {SignAnimations} from "@/src/animations/sign/SignAnimations";
import {OVIKippSign} from "@/src/components/signs/OVIKippSign";
import {SecurityThread4DSign} from "@/src/components/signs/SecurityThread4DSign";
import {HmcSign} from "@/src/components/signs/HmcSign";
import {SecurityThread2DSign} from "@/src/components/signs/SecurityThread2DSign";
import {SecurityThread2DWithImageSign} from "@/src/components/signs/SecurityThread2DWithImageSign";
import {SecurityThread1DWithImageSign} from "@/src/components/signs/SecurityThread1DWithImageSign";
import {OVISign} from "@/src/components/signs/OVISign";
import {RotateByXWith2ImagesSign} from "@/src/components/signs/RotateByXWith2ImagesSign";
import {RotateByXYWith4ImagesSign} from "@/src/components/signs/RotateByXYWith4ImagesSign";
import TestPage from "./testPage";
import TestSkia from "./testPage";
import OVMISign from "@/src/components/signs/OVMISign";
import {TouchSign} from "@/src/components/signs/TouchSign";
import {Accelerometer} from "expo-sensors";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";


export default function Instruction() {

  /*
  React native
  Я собираю данные с акселерометра и помещаю их в переменную
  const accelerometerData = useSharedValue({ x: 0, y: 0, z: 0 });
  Accelerometer.addListener
  accelerometerData.value = {
    x: rotX,
    y: rotY,
    z: rotZ
  };

  После чего трансформирую данные при помощи useDerivedValue
  const normRotationX = useDerivedValue(() => {
    if (isManualMode){
      return accelerometerData.value.x;
    }
  });

  Далее полученное значение я передаю в компонент через props
  normRotationX: SharedValue<number>,

  компоненте объявлен useAnimatedStyle который меняет прозрачность
  const animatedStyleForSets = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;
    const aCoffs = calculateACoffs(angleX);
    return {
      opacity: aCoffs.setACoff
    };
  });

  Стиль применен к View
  <Animated.View style={[animatedStyleForSets, styles.absoluteLayout]}>

  На android тормозит в редизной сборке
    */



  const accelerometerData = useSharedValue({ x: 0, y: 0, z: 0 });

  const accelerometerZ = useSharedValue(0);
  const accelerometerStartData = useSharedValue({ x: 0, y: 0, z: 0 }); // Начальное значение акселерометра
  const isAccelerometerEnable = useSharedValue(false); // Флаг доступности акселерометра

  const isManualMode = true;

  interface AccelerometerData {
    x: number;
    y: number;
    z: number;
  }

  useEffect(() => {
    let subscription: any = null;

    const startAccelerometer = async () => {
      // Запускаем только если:
      // - режим manual
      // - dev режим выключен
      // - нет активной анимации (ни переворот, ни панорамирование)
      if (isManualMode) {
        try {
          console.log('⚠️ startAccelerometer');

          const isAvailable = await Accelerometer.isAvailableAsync();
          if (!isAvailable) {
            console.log('⚠️ Accelerometer not available');
            isAccelerometerEnable.value = false;
            return;
          }
          isAccelerometerEnable.value = true;

          Accelerometer.setUpdateInterval(20);

          subscription = Accelerometer.addListener(data => {
            accelerometerZ.value = data.z;
            /*const localData = {
              x: Platform.OS === 'ios' ? data.x : -data.x,
              y: Platform.OS === 'ios' ? data.y : -data.y,
              z: Platform.OS === 'ios' ? data.z : -data.z, // Нужно инвертировать для Android
            }

            if (Math.abs(accelerometerStartData.value.x + accelerometerStartData.value.y + accelerometerStartData.value.z) < 0.0001)
            {
              console.log('setAccelerometerStartData', localData);
              accelerometerStartData.value = localData;
              console.log('setAccelerometerStartData complete', accelerometerStartData.value);
            }

            const rotX = getAccelerometerRotX(localData, accelerometerStartData.value);
            const rotY = getAccelerometerRotY(localData, accelerometerStartData.value);
            const rotZ = getAccelerometerRotZ(localData);

            accelerometerData.value = {
              x: rotX,
              y: rotY,
              z: rotZ
            };*/
          });
        } catch (error) {
          console.error('Error starting accelerometer:', error);
        }
      } else {
        console.log('⚠️ stopAccelerometer');
        accelerometerStartData.value = {x: 0, y:0, z:0};
      }
    };

    const getAccelerometerRotX = (accelerometer: AccelerometerData, startData: AccelerometerData): number => {
      const accelerometerY = getAccelYValueByZ(accelerometer.y, accelerometer.z);
      const startY = getStartAccelerometerPositionY(startData);

      const diff = startY - accelerometerY;
      let shiftedDiff = -diff;

      if (diff < -2) {
        shiftedDiff = -(4 + diff);
      } else if (diff > 2) {
        shiftedDiff = 4 - diff;
      }

      let acY = shiftedDiff > 0.75
        ? 0.75
        : shiftedDiff < -0.75
          ? -0.75
          : shiftedDiff;

      acY *= 2;
      const rotX = acY * 60;

      return rotX;
    };

    const getAccelerometerRotY = (accelerometer: AccelerometerData, startData: AccelerometerData): number => {
      let accelerometerX = accelerometer.x;

      // Логика расчета в зависимости от положения по оси Z
      accelerometerX = accelerometer.z < 0
        ? accelerometerX - startData.x
        : -(accelerometerX - startData.x);

      // Ограничение (Clamp) в диапазоне [-0.75, 0.75]
      let acX = accelerometerX > 0.75
        ? 0.75
        : accelerometerX < -0.75
          ? -0.75
          : accelerometerX;

      acX *= 2;

      // Итоговый угол поворота
      const rotY = -acX * 60;

      return rotY;
    };

    const getAccelerometerRotZ = (accelerometer: AccelerometerData): number => {
      const accelerometerZ = accelerometer.z;

      return accelerometerZ;
    };

    const getAccelYValueByZ = (value: number, zValue: number): number => {
      let accelerometerValue = value / 1.1;

      if (zValue > 0) {
        if (value < 0) {
          accelerometerValue = -1 - (1 + accelerometerValue);
        }

        if (value > 0) {
          accelerometerValue = 1 + (1 - accelerometerValue);
        }
      }

      return accelerometerValue;
    };

    const getStartAccelerometerPositionY = (startPos: AccelerometerData): number => {
      if (!startPos) return 0;
      return getAccelYValueByZ(startPos.y, startPos.z);
    };

    const stopAccelerometer = () => {
      if (subscription) {
        subscription.remove();
        subscription = null;
      }
      // Не сбрасываем accelerometerData, чтобы сохранить последнее значение
    };

    startAccelerometer();

    return () => {
      stopAccelerometer();
    };
  }, []);


  // Def
  const bnkWidth = 1800;
  const bnkHeight = 800;

  // 100 2018
  // const bnkWidth = 800;
  // const bnkHeight = 1840;

  //Loupe
  /*const signs = dataCacheService.getSignsWithDetails(27);
  const loupeSigns = signs.filter(s =>
    s.sign_show_type === 5 &&
    s.sign_side === 2
  );
  const filteredSigns = signs.filter(s =>
    s.sign_id === 541
  );
  const sign = filteredSigns[0];
  const bnkImage = findImageInMap('@/assets/Image/Banknotes/5000/2023/Images/5000R_23_rv.jpg');
  */

  // 5000_23
  /*const bnkImage = findImageInMap('@/assets/Image/Banknotes/5000/2023/Images/5000R_23_av.jpg');
  const signs = dataCacheService.getSignsWithDetails(27);

  const kippSign = signs.filter(s =>
    s.sign_id === 528
  )[0];

  const hmcSign = signs.filter(s =>
    s.sign_id === 531
  )[0];

  const oviKippSign = signs.filter(s =>
    s.sign_id === 532
  )[0];

  const securityThread4DSign = signs.filter(s =>
    s.sign_id === 533
  )[0];


  const sign = securityThread4DSign;*/

  // 5000_10
  // const bnkImage = findImageInMap('@/assets/Image/Banknotes/5000/2010/Images/5000R_10_av.jpg');
  //
  // const signs = dataCacheService.getSignsWithDetails(19);
  //
  // const touchSign = signs.filter(s =>
  //   s.sign_id === 18
  // )[0];
  //
  // const sign = touchSign;


  // 2000_17

  const bnkImage = findImageInMap('Image/Banknotes/2000/2017/Images/2000R_17_av.jpg');
  const signs = dataCacheService.getSignsWithDetails(17);

  const securityThread2DSignWithImage = signs.filter(s =>
    s.sign_show_type === 11
  )[0];

  const sign = securityThread2DSignWithImage;

  console.log('sign:::', sign);
  // 200_17

  // const bnkImage = findImageInMap('@/assets/Image/Banknotes/200/2017/Images/200R_17_av.jpg');
  // const signs = dataCacheService.getSignsWithDetails(9);
  //
  // const securityThread1DSignWithImage = signs.filter(s =>
  //   s.sign_show_type === 13
  // )[0];
  //
  // const sign = securityThread1DSignWithImage;

  // 500_97
  // const bnkImage = findImageInMap('@/assets/Image/Banknotes/500/1997/Images/500R_97_av.jpg');
  // const signs = dataCacheService.getSignsWithDetails(10);
  //
  // const oviSign = signs.filter(s =>
  //   s.sign_show_type === 15
  // )[0];
  //
  // const sign = oviSign;

  // 500_10
  // const bnkImage = findImageInMap('@/assets/Image/Banknotes/500/2010/Images/500R_10_av.jpg');
  // const signs = dataCacheService.getSignsWithDetails(13);
  //
  // const rotateByXWith2Images = signs.filter(s =>
  //   s.sign_show_type === 16
  // )[0];
  //
  // const sign = rotateByXWith2Images;

  // 100_18
  // const bnkImage = findImageInMap('@/assets/Image/Banknotes/100/2018/Images/100R_18_av.jpg');
  // const signs = dataCacheService.getSignsWithDetails(24, true);
  //
  // const rotateByXYWith4Images = signs.filter(s =>
  //   s.sign_show_type === 17
  // )[0];
  //
  // const ovmi1DSign1 = signs.filter(s =>
  //   s.sign_show_type === 8 && s.sign_side === 1
  // )[0];
  //
  // const ovmi1DSign2 = signs.filter(s =>
  //   s.sign_show_type === 8 && s.sign_side === 1
  // )[1];
  //
  // console.log("ovmi1DSign1:", ovmi1DSign1);
  // console.log("ovmi1DSign2:", ovmi1DSign2);
  //
  // const sign = ovmi1DSign1;


  console.log('sign:',sign);


  //react native reanimated
  const startRotZAngle = useDerivedValue(() => 0);
  const isImageStatic  = useDerivedValue(() => false);

  const progress = useSharedValue(0);

  /*
  HMCDemonstration
  HMCDemonstrationByLumen
  KippDemonstrationToLeft
  KippDemonstrationToRight
  OVIKippDemonstration
  RotateByRound
  RotateX
  RotateXByLumen
  RotateXY
   */
  const anim = SignAnimations.RotateByRound;

  // useEffect(() => {
  //   progress.value = withRepeat(
  //     withTiming(anim.endValue, {
  //       duration: anim.duration,
  //       easing: Easing.linear,
  //     }),
  //     -1, // -1 для бесконечного повтора
  //     false
  //   );
  // }, []);

  const isRotateByZ = useDerivedValue(() => anim.isRotateByZ);
  const rotationX = useDerivedValue(() => {
    return interpolate(progress.value,
      anim.rotations.x.input,
      anim.rotations.x.output);
  });
  const rotationY = useDerivedValue(() => {
    return interpolate(progress.value,
      anim.rotations.y.input,
      anim.rotations.y.output);
  });
  const rotationZ  = useDerivedValue(() => {
    return interpolate(progress.value,
      anim.rotations.z.input,
      anim.rotations.z.output);
  });

  const shiftedRotationZ  = useDerivedValue(() => {
    return rotationZ.value + startRotZAngle.value;
  });

  const normRotationX = useDerivedValue(() => {
    if (isManualMode){
      return accelerometerData.value.x;
    }

    if (!isRotateByZ.value || isImageStatic.value)
      return rotationX.value;

    let shiftByZ = -startRotZAngle.value;

    let rotZ = shiftedRotationZ.value + shiftByZ;
    while (rotZ < 0)
      rotZ += 360;

    rotZ = rotZ % 360;

    if (rotZ >= 0 && rotZ < 90) {
      return (1 - rotZ / 90) * rotationX.value;
    }
    if (rotZ >= 90 && rotZ < 180) {
      return -((rotZ - 90) / 90) * rotationX.value;
    }
    if (rotZ >= 180 && rotZ < 270) {
      return -(1 - (rotZ - 180) / 90) * rotationX.value;
    }
    if (rotZ >= 270 && rotZ < 360) {
      return ((rotZ - 270) / 90) * rotationX.value;
    }

    return rotationX.value;
  });

  const normRotationY = useDerivedValue(() => {
    if (isManualMode){
      return accelerometerData.value.y;
    }

    if (!isRotateByZ.value || isImageStatic.value)
      return rotationY.value;

    let shiftByZ = -startRotZAngle.value;

    let rotZ = shiftedRotationZ.value + shiftByZ;
    while (rotZ < 0)
      rotZ += 360;

    rotZ = rotZ % 360;

    if (rotZ >= 0 && rotZ < 90) {
      return -(rotZ / 90) * rotationX.value;
    }
    if (rotZ >= 90 && rotZ < 180) {
      return -(1 - (rotZ - 90) / 90) * rotationX.value;
    }
    if (rotZ >= 180 && rotZ < 270) {
      return ((rotZ - 180) / 90) * rotationX.value;
    }
    if (rotZ >= 270 && rotZ < 360) {
      return (1 - (rotZ - 270) / 90) * rotationX.value;
    }

    return rotationY.value;
  });

  const normRotationX45 = useDerivedValue(() => {
    if (isManualMode){
      return accelerometerData.value.x;
    }

    if (!isRotateByZ.value || isImageStatic.value)
      return rotationX.value;

    let shiftByZ = 45;

    let rotZ = shiftedRotationZ.value + shiftByZ;
    while (rotZ < 0)
      rotZ += 360;

    rotZ = rotZ % 360;

    if (rotZ >= 0 && rotZ < 90) {
      return (1 - rotZ / 90) * rotationX.value;
    }
    if (rotZ >= 90 && rotZ < 180) {
      return -((rotZ - 90) / 90) * rotationX.value;
    }
    if (rotZ >= 180 && rotZ < 270) {
      return -(1 - (rotZ - 180) / 90) * rotationX.value;
    }
    if (rotZ >= 270 && rotZ < 360) {
      return ((rotZ - 270) / 90) * rotationX.value;
    }

    return rotationX.value;
  });

  const normRotationY45 = useDerivedValue(() => {
    if (isManualMode){
      return accelerometerData.value.y;
    }


    if (!isRotateByZ.value || isImageStatic.value)
      return rotationY.value;

    let shiftByZ = 45;

    let rotZ = shiftedRotationZ.value + shiftByZ;
    while (rotZ < 0)
      rotZ += 360;

    rotZ = rotZ % 360;

    if (rotZ >= 0 && rotZ < 90) {
      return -(rotZ / 90) * rotationX.value;
    }
    if (rotZ >= 90 && rotZ < 180) {
      return -(1 - (rotZ - 90) / 90) * rotationX.value;
    }
    if (rotZ >= 180 && rotZ < 270) {
      return ((rotZ - 180) / 90) * rotationX.value;
    }
    if (rotZ >= 270 && rotZ < 360) {
      return (1 - (rotZ - 270) / 90) * rotationX.value;
    }

    return rotationY.value;
  });

  const banknoteAnimationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {perspective: 1000},
        {rotateX: `${rotationX.value}deg`},
        {rotateY: `${-rotationY.value}deg`},
        {rotateZ: `${-shiftedRotationZ.value}deg`}
      ]
    };
  });



  const signMinX = sign.sign_min_x!;
  const signMinY = sign.sign_min_y!;
  const signMaxX = sign.sign_max_x!;
  const signMaxY = sign.sign_max_y!;

  const signX = (signMinX + signMaxX) / 2;
  const signY = (signMinY + signMaxY) / 2;
  // const signX = (sign.sign_res1_data?.pivot_y!);
  // const signY = (sign.sign_res1_data?.pivot_x!);

  const signXPercent = (0.5 - signY) * 100;
  const signYPercent = -(0.5 - signX) * 100;

  const maxAngleX = 30;
  const calculateACoffs = (angleX: number):
    {
      setACoff: number,
      glossACoff: number
    } => {
    'worklet';

    let glossACoff = angleX < 0
      ? -angleX / maxAngleX
      : 0;

    glossACoff = glossACoff > 1 ? 1 : glossACoff;

    const set12aComp = 1 - glossACoff;

    return {
      setACoff: set12aComp,
      glossACoff: glossACoff
    };
  };

  const animatedStyleForGloss = useAnimatedStyle(() => {
    const zValue = accelerometerZ.value;
    //const aCoffs = calculateACoffs(angleX);
    return {
      opacity: zValue
    };
  });

  const imageW = securityThread2DSignWithImage?.sign_res5_data?.width ?? 0;
  const imageH = securityThread2DSignWithImage?.sign_res5_data?.height ?? 0;
  const imageX = securityThread2DSignWithImage?.sign_res5_data?.pos_x ?? 0;
  const imageY = securityThread2DSignWithImage?.sign_res5_data?.pos_y ?? 0;

  const bnkW = bnkWidth ?? 0;
  const bnkH = bnkHeight ?? 0;


  const imageWPercent = (imageW / bnkW) * 100;
  const imageHPercent = (imageH / bnkH) * 100;
  const imageMarginLeftPercent = ((bnkW / 2 + imageX - imageW / 2) / bnkW) * 100;
  const imageMarginTopPercent = ((bnkH / 2 - imageY - imageH / 2) / bnkH) * (bnkH / bnkW) * 100;


  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      {/*<Animated.View style={[{*/}
      {/*  position: 'absolute',*/}
      {/*  top: 0,*/}
      {/*  left: 0,*/}
      {/*  right: 0,*/}
      {/*  bottom: 0,*/}
      {/*  zIndex: -1,*/}
      {/*  justifyContent: 'center',*/}
      {/*  alignItems: 'center',*/}
      {/*  backgroundColor: 'gray',*/}
      {/*}, banknoteAnimationStyle]}>*/}

        <View style={{
          width: bnkWidth*1.25,
          height: bnkHeight*1.25,
          backgroundColor: 'orange',
          justifyContent: 'center',
          alignItems: 'center',
          transform: [
            {translateX: `${signXPercent}%`},
            {translateY: `${signYPercent}%`}
          ]
        }}>
          {/*<View style={styles.absoluteLayout}>*/}
          {/*  <Image source={bnkImage}*/}
          {/*         style={{width: '100%', height: '100%'}}></Image>*/}
          {/*</View>*/}

          {/*<SignTypeLoupe*/}
          {/*  banknoteImage={bnkImage}*/}
          {/*  banknoteWidth={bnkWidth}*/}
          {/*  banknoteHeight={bnkHeight}*/}
          {/*  sign={sign}*/}
          {/*  signs={loupeSigns}*/}
          {/*  featureMode={'animation'}/>*/}

          {/*5000_23*/}

          {/*<KippSign sign={kippSign}*/}
          {/*          normRotationX={normRotationX}*/}
          {/*          normRotationY={normRotationY}*/}
          {/*          banknoteWidth={bnkWidth}*/}
          {/*          banknoteHeight={bnkHeight}/>*/}

          {/*<HmcSign sign={hmcSign}*/}
          {/*         normRotationX={normRotationX}*/}
          {/*         banknoteWidth={bnkWidth}*/}
          {/*         banknoteHeight={bnkHeight}/>*/}

          {/*<OVIKippSign sign={oviKippSign}*/}
          {/*             normRotationX={normRotationX}*/}
          {/*             normRotationX45={normRotationX45}*/}
          {/*             normRotationY45={normRotationY45}*/}
          {/*             banknoteWidth={bnkWidth}*/}
          {/*             banknoteHeight={bnkHeight}/>*/}

          {/*<SecurityThread4DSign sign={securityThread4DSign}*/}
          {/*                      normRotationX={normRotationX}*/}
          {/*                      normRotationY={normRotationY}*/}
          {/*                      banknoteWidth={bnkWidth}*/}
          {/*                      banknoteHeight={bnkHeight}/>*/}


          {/*5000_10*/}
          {/*<SecurityThread2DSign sign={securityThread2DSign}*/}
          {/*                      normRotationX={normRotationX}*/}
          {/*                      normRotationY={normRotationY}*/}
          {/*                      banknoteWidth={bnkWidth}*/}
          {/*                      banknoteHeight={bnkHeight}/>*/}

          {/*<OVMI1DSign sign={ovmi1DSign}*/}
          {/*            normRotationX={normRotationX}*/}
          {/*            normRotationY={normRotationY}*/}
          {/*            banknoteWidth={bnkWidth}*/}
          {/*            banknoteHeight={bnkHeight}/>*/}

          {/*2000_17*/}
          {/*<SecurityThread2DWithImageSign sign={securityThread2DSignWithImage}*/}
          {/*                               normRotationX={normRotationX}*/}
          {/*                               normRotationY={normRotationY}*/}
          {/*                               banknoteWidth={bnkWidth}*/}
          {/*                               banknoteHeight={bnkHeight}/>*/}



          <View style={[styles.absoluteLayout]}>
            <Animated.View style={[animatedStyleForGloss, styles.absoluteLayout]}>
              <View
                style={{
                  backgroundColor:'red',
                  width: 100,
                  height: 700,
                  marginLeft: 270,
                  marginTop: 0,
                }}></View>
            </Animated.View>
          </View>

          {/*200_17*/}
          {/*<SecurityThread1DWithImageSign sign={securityThread1DSignWithImage}*/}
          {/*                               normRotationX={normRotationX}*/}
          {/*                               normRotationY={normRotationY}*/}
          {/*                               banknoteWidth={bnkWidth}*/}
          {/*                               banknoteHeight={bnkHeight}/>*/}

          {/*500_97*/}
          {/*<OVISign sign={oviSign}*/}
          {/*         normRotationX={normRotationX}*/}
          {/*         normRotationY={normRotationY}*/}
          {/*         banknoteWidth={bnkWidth}*/}
          {/*         banknoteHeight={bnkHeight}/>*/}

          {/*500_10*/}
          {/*<RotateByXWith2ImagesSign sign={rotateByXWith2Images}*/}
          {/*                          normRotationX={normRotationX}*/}
          {/*                          normRotationY={normRotationY}*/}
          {/*                          banknoteWidth={bnkWidth}*/}
          {/*                          banknoteHeight={bnkHeight}/>*/}

          {/*100_18*/}
          {/*<RotateByXYWith4ImagesSign sign={rotateByXYWith4Images}*/}
          {/*                           normRotationX={normRotationX}*/}
          {/*                           normRotationY={normRotationY}*/}
          {/*                           banknoteWidth={bnkWidth}*/}
          {/*                           banknoteHeight={bnkHeight}/>*/}

          {/*<OVMISign sign={ovmi1DSign1}*/}
          {/*            normRotationX={normRotationX}*/}
          {/*            normRotationY={normRotationY}*/}
          {/*            banknoteWidth={bnkWidth}*/}
          {/*            banknoteHeight={bnkHeight}/>*/}

          {/*<OVMISign sign={ovmi1DSign2}*/}
          {/*            normRotationX={normRotationX}*/}
          {/*            normRotationY={normRotationY}*/}
          {/*            banknoteWidth={bnkWidth}*/}
          {/*            banknoteHeight={bnkHeight}/>*/}

          {/*<TouchSign sign={touchSign} banknoteWidth={bnkWidth} banknoteHeight={bnkHeight}/>*/}
        </View>


      {/*</Animated.View>*/}

      <View style={[styles.absoluteLayout, {alignItems: 'flex-start'}]}>
        <Button title='CCC' onPress={() => {
          //loupeAnim.setValue(0);
          console.log('animate();');
          //animate();
        }}>

        </Button>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  maskedView: {width: 200, height: 200, justifyContent: 'center', alignItems: 'center'},
  maskContainer: {
    backgroundColor: 'transparent', // Фон должен быть прозрачным
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskText: {
    fontSize: 60,
    color: 'black', // Цвет маски не важен, важна его непрозрачность
    fontWeight: 'bold',
  },
  image: {flex: 1, height: '100%'},
  absoluteLayout: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },

  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,      // Половина размера для круга
    backgroundColor: 'black', // Непрозрачный цвет «проявляет» контент
  },
});