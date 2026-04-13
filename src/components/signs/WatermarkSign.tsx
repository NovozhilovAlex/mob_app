import { StyleSheet, View } from "react-native";
import * as React from "react";
import { useEffect, useRef } from "react";
import { Sign } from "@/src";
import { SignImageOnBanknote } from "@/src/components/SignImageOnBanknote";
import {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const SMOOTHING_FACTOR = 0.2; // Коэффициент сглаживания для manual режима

export function WatermarkSign(props: {
  sign: Sign,
  lumen?: SharedValue<number>,           // Для animation режима
  normRotationZ?: SharedValue<number>,   // Для manual режима (акселерометр Z)
  featureMode?: 'animation' | 'manual',
  banknoteWidth: number,
  banknoteHeight: number,
}) {
  const signRef = useRef<Sign>(props.sign);
  const previousOpacity = useRef(0); // Для сглаживания в manual режиме

  useEffect(() => {
    signRef.current = props.sign;
  }, [props.sign]);

  /**
   * Анимированный стиль для WatermarkSign
   * В animation режиме - используем lumen
   * В manual режиме - вычисляем opacity на основе normRotationZ (акселерометр Z)
   */
  const animatedStyle = useAnimatedStyle(() => {
    if (props.featureMode === 'animation') {
      // Animation режим: используем lumen из анимации
      return { opacity: props.lumen?.value ?? 0 };
    } else {
      // Manual режим: вычисляем opacity из normRotationZ (акселерометр Z)
      const zValue = props.normRotationZ?.value ?? 0;

      // Вычисляем rawOpacity из Z (только положительные значения)
      let rawOpacity = zValue > 0 ? Math.abs(zValue) : 0;

      // Применяем множитель 3 и ограничиваем до 1
      rawOpacity = Math.min(rawOpacity * 3, 1);

      // Сглаживание
      const smoothedOpacity = previousOpacity.current * (1 - SMOOTHING_FACTOR) + rawOpacity * SMOOTHING_FACTOR;
      previousOpacity.current = smoothedOpacity;

      // Плавная анимация прозрачности
      return { opacity: withTiming(smoothedOpacity, { duration: 50 }) };
    }
  });

  if (!signRef.current) {
    return null;
  }

  console.log("WatermarkSign init", signRef.current);

  return (
    <View style={styles.absoluteLayout}>
      {signRef.current.sign_res1_data && (
        <SignImageOnBanknote
          style={animatedStyle}
          signRes={signRef.current.sign_res1_data}
          banknoteWidth={props.banknoteWidth}
          banknoteHeight={props.banknoteHeight}
        />
      )}

      {signRef.current.sign_res2_data && (
        <SignImageOnBanknote
          style={animatedStyle}
          signRes={signRef.current.sign_res2_data}
          banknoteWidth={props.banknoteWidth}
          banknoteHeight={props.banknoteHeight}
        />
      )}

      {signRef.current.sign_res3_data && (
        <SignImageOnBanknote
          style={animatedStyle}
          signRes={signRef.current.sign_res3_data}
          banknoteWidth={props.banknoteWidth}
          banknoteHeight={props.banknoteHeight}
        />
      )}
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
