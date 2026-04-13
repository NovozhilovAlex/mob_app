import { StyleSheet, View } from "react-native";
import * as React from "react";
import { useEffect, useRef } from "react";
import { Sign } from "@/src";
import { SignImageOnBanknote } from "@/src/components/SignImageOnBanknote";
import {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

export function KippSign(props: {
  sign: Sign,
  normRotationX: SharedValue<number>,
  normRotationY: SharedValue<number>,
  featureMode?: 'animation' | 'manual',
  compassData: SharedValue<number>;
  isCompassEnable: SharedValue<boolean>;
  banknoteWidth: number,
  banknoteHeight: number,
}) {
  const signRef = useRef<Sign | null>(props.sign);
  const maxAngle = 75;

  useEffect(() => {
    signRef.current = props.sign;
  }, [props.sign]);

  const getYRotatedValue = (angle: number, delta: number): number => {
    'worklet';

    let yValue: number = NaN;

    // Группа проверок для 90 градусов
    if (angle > 90 - delta && angle < 90 + delta) yValue = angle - 90;
    if (angle > 90 - delta + 180 && angle < 90 + delta + 180) yValue = angle - 90 - 180;
    if (angle > 90 - delta + 360 && angle < 90 + delta + 360) yValue = angle - 90 - 360;
    if (angle > 90 - delta - 180 && angle < 90 + delta - 180) yValue = angle - 90 + 180;
    if (angle > 90 - delta - 360 && angle < 90 + delta - 360) yValue = angle - 90 + 360;

    // Группа проверок для -90 градусов
    if (angle > -90 - delta && angle < -90 + delta) yValue = angle + 90;
    if (angle > -90 - delta + 180 && angle < -90 + delta + 180) yValue = angle + 90 - 180;
    if (angle > -90 - delta + 360 && angle < -90 + delta + 360) yValue = angle + 90 - 360;
    if (angle > -90 - delta - 180 && angle < -90 + delta - 180) yValue = angle + 90 + 180;
    if (angle > -90 - delta - 360 && angle < -90 + delta - 360) yValue = angle + 90 + 360;

    if (isNaN(yValue)) return 0;

    yValue = Math.abs(yValue) / delta;
    yValue = 1 - yValue;

    return Math.max(0, Math.min(1, yValue));
  };

  const getXRotatedValue = (angle: number, delta: number): number => {
    'worklet';

    let xValue: number = NaN;

    if (angle > -delta && angle < delta)
      xValue = angle;

    if (angle > -delta - 180 && angle < delta - 180)
      xValue = angle + 180;

    if (angle > -delta - 360 && angle < delta - 360)
      xValue = angle + 360;

    if (angle > -delta + 180 && angle < delta + 180)
      xValue = angle - 180;

    if (angle > -delta + 360 && angle < delta + 360)
      xValue = angle - 360;

    if (isNaN(xValue))
      return 0;

    xValue = Math.abs(xValue) / delta;
    xValue = 1 - xValue;

    // Ограничиваем значение в диапазоне [0, 1]
    return Math.max(0, Math.min(1, xValue));
  };


  const animatedStyleForRes1 = useAnimatedStyle(() => {
    let aCompX = 0;
    if (props.featureMode === 'animation' ||
       !props.isCompassEnable.value) {
      let rotX = Math.abs(props.normRotationX.value) - maxAngle * 0.7;
      if (rotX < 0) rotX = 0;
      aCompX = Math.abs(rotX / (maxAngle * 0.3));
    }
    else {
      const compassValue = props.compassData.value; // -180 -> 180
      let normRotationX = props.normRotationX.value;
      if (normRotationX > 60) normRotationX = 60;
      if (normRotationX <= 0) normRotationX = 0;
      const angleValueCf = normRotationX / 60.0;
      const shiftedCompassValue = compassValue + (props.sign.sign_view_rotate_angle ?? 0); // -225 -> 135
      const delta = 40;

      const xCf = getXRotatedValue(shiftedCompassValue, delta);

      aCompX = (xCf * angleValueCf) * 2.0;
      if (aCompX > 1) aCompX = 1;
    }
    return { opacity: aCompX };
  });

  const animatedStyleForRes2 = useAnimatedStyle(() => {
    let aCompY = 0;
    if (props.featureMode === 'animation'||
       !props.isCompassEnable.value) {
      let rotY = Math.abs(props.normRotationY.value) - maxAngle * 0.7;
      if (rotY < 0) rotY = 0;
      aCompY = Math.abs(rotY / (maxAngle * 0.3));
    }
    else {
      let normRotationX = props.normRotationX.value;
      if (normRotationX > 60) normRotationX = 60;
      if (normRotationX <= 0) normRotationX = 0;
      const angleValueCf = normRotationX / 60.0;
      const compassValue = props.compassData.value; // -180 -> 180
      const shiftedCompassValue = compassValue + (props.sign.sign_view_rotate_angle ?? 0); // -225 -> 135
      const delta = 40;

      const yCf = getYRotatedValue(shiftedCompassValue, delta);

      aCompY = (yCf * angleValueCf) * 2.0;
      if (aCompY > 1) aCompY = 1;
    }
    return { opacity: aCompY };
  });

  if (!signRef.current || !signRef.current?.sign_res1_data || !signRef.current?.sign_res2_data) {
    return null;
  }

  console.log("KippSign init", signRef.current);

  return (
    <View style={styles.absoluteLayout}>

      <SignImageOnBanknote
        style={animatedStyleForRes1}
        signRes={signRef.current.sign_res1_data}
        banknoteWidth={props.banknoteWidth}
        banknoteHeight={props.banknoteHeight}
      />

      <SignImageOnBanknote
        style={animatedStyleForRes2}
        signRes={signRef.current.sign_res2_data}
        banknoteWidth={props.banknoteWidth}
        banknoteHeight={props.banknoteHeight}
      />
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