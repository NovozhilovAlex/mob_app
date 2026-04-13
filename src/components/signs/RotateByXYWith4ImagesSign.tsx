import {StyleSheet, View} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import {Sign, SignRes} from "@/src";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";
import {SharedValue, useAnimatedStyle} from "react-native-reanimated";
import Animated from "react-native-reanimated";

export function RotateByXYWith4ImagesSign(props: {
  sign: Sign,
  normRotationX: SharedValue<number>,
  normRotationY: SharedValue<number>,
  banknoteWidth: number,
  banknoteHeight: number
}) {
  const maxAngle = 30;

  const signRef = useRef<Sign>(props.sign);
  useEffect(() => {
    signRef.current = props.sign;
  }, [props.sign]);

  const calculateACoffs = (angleX: number, angleY: number):
    {
      imageTopACoff: number,
      imageBottomACoff: number,
      imageLeftACoff: number,
      imageRightACoff: number
    } => {
    'worklet';

    const aCompX1 = angleX >= 0
      ? 0
      : Math.abs(angleX / maxAngle);

    const aCompX2 = angleX <= 0
      ? 0
      : Math.abs(angleX / maxAngle);

    const aCompY1 = angleY >= 0
      ? 0
      : Math.abs(angleY / maxAngle);

    const aCompY2 = angleY <= 0
      ? 0
      : Math.abs(angleY / maxAngle);

    return {
      imageTopACoff: aCompX1,
      imageBottomACoff: aCompX2,
      imageLeftACoff: aCompY1,
      imageRightACoff: aCompY2
    };
  };

  const animatedStyleForTop = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;
    const angleY = props.normRotationY.value;

    const aCoffs = calculateACoffs(angleX, angleY);
    return {
      opacity: aCoffs.imageTopACoff
    };
  });

  const animatedStyleForBottom = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;
    const angleY = props.normRotationY.value;

    const aCoffs = calculateACoffs(angleX, angleY);
    return {
      opacity: aCoffs.imageBottomACoff
    };
  });

  const animatedStyleForLeft = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;
    const angleY = props.normRotationY.value;

    const aCoffs = calculateACoffs(angleX, angleY);
    return {
      opacity: aCoffs.imageLeftACoff
    };
  });

  const animatedStyleForRight = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;
    const angleY = props.normRotationY.value;

    const aCoffs = calculateACoffs(angleX, angleY);
    return {
      opacity: aCoffs.imageRightACoff
    };
  });

  if (!signRef.current ||
    !signRef.current?.sign_res1_data ||
    !signRef.current?.sign_res2_data ||
    !signRef.current?.sign_res3_data ||
    !signRef.current?.sign_res4_data) {
    return null;
  }

  console.log("RotateByXYWith4ImagesSign init", signRef.current);

  return (
    <View style={[styles.absoluteLayout]}>

      <SignImageOnBanknote style={animatedStyleForTop}
                           signRes={signRef.current.sign_res1_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      <SignImageOnBanknote style={animatedStyleForBottom}
                           signRes={signRef.current.sign_res2_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      <SignImageOnBanknote style={animatedStyleForLeft}
                           signRes={signRef.current.sign_res3_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      <SignImageOnBanknote style={animatedStyleForRight}
                           signRes={signRef.current.sign_res4_data!}
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