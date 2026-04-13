import {Button, Image, Text, View} from "react-native";
import * as React from "react";
import {useRouter} from "expo-router";
import {useEffect, useState} from "react";
import {Accelerometer, Magnetometer} from "expo-sensors";
import {SafeAreaView} from "react-native-safe-area-context";

export default function SignCheckResult() {
    const router = useRouter();

  const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    // Установка частоты обновления (в мс)
    Accelerometer.setUpdateInterval(50);

    // Подписка на данные
    const subscriptionAcc = Accelerometer.addListener(setData);

    Magnetometer.setUpdateInterval(50);

    const subscriptionMagn = Magnetometer.addListener(data => {
      let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);

      // Корректировка, чтобы 0° всегда был сверху (Север)
      // Формула может меняться в зависимости от ориентации устройства
      let degree = angle >= 0 ? angle : 360 + angle;
      setHeading(Math.round(degree));
    });


    // Отписка при размонтировании
    return () => {
      subscriptionAcc.remove();
      subscriptionMagn.remove();
    }
  }, []);

  return (
    <SafeAreaView style={[ { alignItems:'center' , justifyContent:'center'}]}>
      <Text>X: {x.toFixed(2)} Y: {y.toFixed(2)} Z: {z.toFixed(2)}</Text>

      <Text style={{ fontSize: 40, transform: [{ rotate: `${-heading}deg` }] }}>
        ↑
      </Text>
      <Text>{heading}°</Text>

      <View>
        <Image style={{width:400, height:300}}
               source={require('@/assets/Image/Banknotes/5000/2023/Images/5000R_23_av.jpg')}></Image>
      </View>
    </SafeAreaView>

  );
}