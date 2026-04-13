import {Animated, Easing, Image, PanResponder, StyleSheet, TouchableOpacity, View} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import * as React from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import {Sign} from "@/src";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";
import {SharedValue, useAnimatedStyle} from "react-native-reanimated";

export function OVIKippSign(props: {
  sign: Sign,
  normRotationX45: SharedValue<number>,
  normRotationY45: SharedValue<number>,
  normRotationX: SharedValue<number>,
  featureMode?: 'animation' | 'manual',
  compassData: SharedValue<number>,
  isCompassEnable: SharedValue<boolean>,
  banknoteWidth: number,
  banknoteHeight: number
}) {
  //if (props.sign.sign_show_type !== 6) {return <View/>}
  const maxAngle = 50;

  const signRef = useRef<Sign>(props.sign);
  useEffect(() => {
    signRef.current = props.sign;
  }, [props.sign]);

  const calculateKippAlpha = (compassValue: number): { aCompKippLeft: number, aCompKippRight: number } => {
    'worklet';

    // 1 - ABS((compass + 45) / 45)
    const aCompKippLeft = Math.max(0, 1.0 - Math.abs((compassValue + 45.0) / 45.0));

    // 1 - ABS((compass - 45) / 45)
    const aCompKippRight = Math.max(0, 1.0 - Math.abs((compassValue - 45.0) / 45.0));

    return { aCompKippLeft, aCompKippRight };
  };

  const animatedStyleForKippLeft = useAnimatedStyle(() => {
    let aCompKippLeft = 0;
    if (props.featureMode === 'animation' ||
       !props.isCompassEnable) {
      let normRotationKippY = props.normRotationY45.value;
      let rotKippY = Math.abs(normRotationKippY) - 75 * 0.7;
      if (rotKippY < 0) rotKippY = 0;
      aCompKippLeft = Math.abs(rotKippY / (75 * 0.3));
    }
    else {
      const cfs = calculateKippAlpha(props.compassData.value);
      aCompKippLeft = cfs.aCompKippLeft;
    }
    return {
      opacity: aCompKippLeft
    };
  });

  const animatedStyleForKippRight = useAnimatedStyle(() => {
    let aCompKippRight = 0;
    if (props.featureMode === 'animation' ||
      !props.isCompassEnable) {
      let normRotationKippX = props.normRotationX45.value;
      let rotKippX = Math.abs(normRotationKippX) - 75 * 0.7;
      if (rotKippX < 0) rotKippX = 0;
      aCompKippRight = Math.abs(rotKippX / (75 * 0.3));
    }
    else {
      const cfs = calculateKippAlpha(props.compassData.value);
      aCompKippRight = cfs.aCompKippRight;
    }
    return {
      opacity: aCompKippRight
    };
  });

  const animatedStyleForOviTop = useAnimatedStyle(() => {
    let normRotationX = props.normRotationX.value;

    if (normRotationX > 30.0)
      normRotationX = 30.0;
    if (normRotationX < -30.0)
      normRotationX = -30.0;

    let aCompOviTop = (normRotationX + 30.0) / 60.0;
    if (aCompOviTop < 0) aCompOviTop = 0;
    if (aCompOviTop > 1) aCompOviTop = 1;

    return {
      opacity: aCompOviTop
    };
  });

  const animatedStyleForOviBottom = useAnimatedStyle(() => {
    let normRotationX = props.normRotationX.value;

    if (normRotationX > 30.0)
      normRotationX = 30.0;
    if (normRotationX < -30.0)
      normRotationX = -30.0;

    let aCompOviBottom = (-normRotationX + 30.0) / 60.0;
    if (aCompOviBottom < 0) aCompOviBottom = 0;
    if (aCompOviBottom > 1) aCompOviBottom = 1;

    return {
      opacity: aCompOviBottom
    };
  });

  if (!signRef.current ||
    !signRef.current?.sign_res1_data ||
    !signRef.current?.sign_res2_data ||
    !signRef.current?.sign_res3_data ||
    !signRef.current?.sign_res4_data) {
    return null;
  }

  console.log("OVIKippSign init", signRef.current);

  return (
    <View style={[styles.absoluteLayout]}>

      <SignImageOnBanknote style={animatedStyleForOviTop}
                           signRes={signRef.current.sign_res3_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      <SignImageOnBanknote style={animatedStyleForOviBottom}
                           signRes={signRef.current.sign_res4_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      <SignImageOnBanknote style={animatedStyleForKippLeft}
                           signRes={signRef.current.sign_res1_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      <SignImageOnBanknote style={animatedStyleForKippRight}
                           signRes={signRef.current.sign_res2_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>
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