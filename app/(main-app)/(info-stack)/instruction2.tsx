import {StyleSheet, View} from "react-native";
import * as React from "react";
import Animated, {
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  useSharedValue
} from "react-native-reanimated";

import {useEffect} from "react";
import {Accelerometer} from "expo-sensors";
import * as ScreenOrientation from "expo-screen-orientation";
import {OrientationLock} from "expo-screen-orientation";


export default function Instruction2() {

  const lockOrientation = async () => {
    await ScreenOrientation.lockAsync(OrientationLock.PORTRAIT_UP);
  };

  lockOrientation().then();

  // const accelerometerZ = useSharedValue(0);
  //
  // useEffect(() => {
  //   const startAccelerometer = async () => {
  //     Accelerometer.setUpdateInterval(20);
  //     Accelerometer.addListener(data => {
  //       accelerometerZ.value = data.z;
  //     });
  //   };
  //   startAccelerometer();
  // }, []);

  const rotation = useAnimatedSensor(SensorType.ROTATION, { interval: 20 });
  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });

  // const animatedStyleForGloss = useAnimatedStyle(() => {
  //   const rot = rotation.sensor.value.yaw;
  //   const {x, y, z} = gravity.sensor.value;
  //   // const cf = Math.sqrt(x*x + y*y + z*z);
  //   // const xDeg = Math.round(Math.asin(x / cf) * 180);
  //   // const yDeg = Math.round(Math.asin(y / cf) * 180);
  //
  //   // Вспомогательная константа
  //   const RAD_TO_DEG = 180 / Math.PI;
  //
  //   // 1. Наклон вперед-назад (Pitch)
  //   // Показывает угол относительно горизонтальной плоскости
  //   const xDeg = Math.atan2(y, Math.sqrt(x * x + z * z)) * RAD_TO_DEG;
  //
  //   // 2. Наклон влево-вправо (Roll)
  //   // Показывает, насколько завален телефон на бок
  //   const yDeg = -Math.atan2(x, Math.sqrt(y * y + z * z)) * RAD_TO_DEG;
  //
  //   // 3. Угол относительно оси Z (отклонение от "экраном вверх")
  //   // 0° — экран строго в небо, 180° — экран строго в пол
  //   const zVal = z / Math.sqrt(x * x + y * y + z * z);
  //
  //
  //   const toDeg = (rad: number) => Math.round(rad * (180 / Math.PI));
  //
  //   console.log(`Pitch: ${Math.round(pitch * (180 / Math.PI))}, Roll: ${Math.round(roll * (180 / Math.PI))}, Yaw: ${Math.round(yaw * (180 / Math.PI))}, X: ${xDeg.toFixed(2)}, Y: ${yDeg.toFixed(2)}, Z: ${zVal.toFixed(2)}`);
  //   return {
  //     opacity: zValue
  //   };
  // });

  const animatedStyleForGloss = useAnimatedStyle(() => {
    const yaw = rotation.sensor.value.yaw;
    const pitch = rotation.sensor.value.pitch;
    const roll = rotation.sensor.value.roll;
    const {x, y, z} = gravity.sensor.value;
    // const cf = Math.sqrt(x*x + y*y + z*z);
    // const xDeg = Math.round(Math.asin(x / cf) * 180);
    // const yDeg = Math.round(Math.asin(y / cf) * 180);

    // Вспомогательная константа
    const RAD_TO_DEG = 180 / Math.PI;

    // 1. Наклон вперед-назад (Pitch)
    // Показывает угол относительно горизонтальной плоскости
    const xDeg = Math.atan2(y, Math.sqrt(x * x + z * z)) * RAD_TO_DEG;

    // 2. Наклон влево-вправо (Roll)
    // Показывает, насколько завален телефон на бок
    const yDeg = -Math.atan2(x, Math.sqrt(y * y + z * z)) * RAD_TO_DEG;

    // 3. Угол относительно оси Z (отклонение от "экраном вверх")
    // 0° — экран строго в небо, 180° — экран строго в пол
    const zVal = z / Math.sqrt(x * x + y * y + z * z);

    const yawVal = Math.round(yaw * RAD_TO_DEG);

    const pitchVal = Math.round(pitch * RAD_TO_DEG);

    const rollVal = Math.round(roll * RAD_TO_DEG);

    const xx = x / Math.sqrt(y * y + z * z);
    const yy = y / Math.sqrt(x * x + z * z);

    console.log(`X: ${xx.toFixed(2)}, Y: ${yy.toFixed(2)}, Z: ${zVal.toFixed(2)}, yawVal: ${yawVal.toFixed(2)}, pitchVal: ${pitchVal.toFixed(2)}, rollVal: ${rollVal.toFixed(2)}`);
    return {
      opacity: zVal < 0 ? 0 : zVal> 1 ? 1 : zVal,
    };
  });

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Animated.View style={[animatedStyleForGloss, styles.absoluteLayout,{alignItems: 'center', justifyContent: 'center'}]}>
              <View
                style={{
                  backgroundColor:'red',
                  width: 250,
                  height: 700,
                  marginLeft: 0,
                  marginTop: 0,
                }}></View>
            </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteLayout: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
});