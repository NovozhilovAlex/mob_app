import {StyleSheet, View} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import {Sign, SignRes} from "@/src";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";
import {SharedValue, useAnimatedStyle} from "react-native-reanimated";
import Animated from "react-native-reanimated";

export function OVISign(props: {
  sign: Sign,
  normRotationX: SharedValue<number>,
  normRotationY: SharedValue<number>,
  banknoteWidth: number,
  banknoteHeight: number
}) {
  const maxAngleX = 30;

  const signRef = useRef<Sign>(props.sign);
  useEffect(() => {
    signRef.current = props.sign;
  }, [props.sign]);

  const animatedStyleForImage = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;

    const aCompX = Math.abs(angleX / maxAngleX);

    return {
      opacity: aCompX
    };
  });

  if (!signRef.current || !signRef.current?.sign_res1_data) {
    return null;
  }

  console.log("OVISign init", signRef.current);

  return (
    <View style={[styles.absoluteLayout]}>

      <SignImageOnBanknote style={animatedStyleForImage}
                           signRes={signRef.current.sign_res1_data!}
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