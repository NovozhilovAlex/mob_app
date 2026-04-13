import {StyleSheet, View} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import {Sign, SignRes} from "@/src";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";
import {SharedValue, useAnimatedStyle} from "react-native-reanimated";
import Animated from "react-native-reanimated";

export function RotateByXWith2ImagesSign(props: {
  sign: Sign,
  normRotationX: SharedValue<number>,
  normRotationY: SharedValue<number>,
  normRotationZ: SharedValue<number>,
  featureMode?: 'animation' | 'manual',
  banknoteWidth: number,
  banknoteHeight: number
}) {
  const maxAngleX = 30;

  const signRef = useRef<Sign>(props.sign);
  useEffect(() => {
    signRef.current = props.sign;
  }, [props.sign]);

  const calculateACoffs = (angleX: number):
    {
      imageTopACoff: number,
      imageBottomACoff: number
    } => {
    'worklet';

    const aCompX1 = angleX >= 0
      ? 0
      : Math.abs(angleX / maxAngleX);

    const aCompX2 = angleX <= 0
      ? 0
      : Math.abs(angleX / maxAngleX);

    return {
      imageTopACoff: aCompX1,
      imageBottomACoff: aCompX2
    };
  };

  const calculateCfsForLumen = (z: number): {
    imageTopACoff: number,
    imageBottomACoff: number
  } => {
    'worklet';

    let pos1AComp = 0;
    let pos2AComp = 0;

    // Растущая прозрачность первой позиции (0 -> 0.4)
    if (z > 0 && z < 0.4) {
      pos1AComp = Math.abs(z) / 0.4;
    }

    // Пик первой позиции (0.4 -> 0.6)
    if (z >= 0.4 && z <= 0.6) {
      pos1AComp = 1.0;
    }

    // Переход: затухание первой, появление второй (0.6 -> 0.9)
    if (z > 0.6 && z < 0.9) {
      pos1AComp = Math.abs(-z + 0.9) / 0.3;
      pos2AComp = Math.abs(z - 0.6) / 0.3;
    }

    // Пик второй позиции (0.9+)
    if (z >= 0.9) {
      pos2AComp = 1.0;
    }

    // Триггер "события"
    if (pos1AComp > 0.5 || pos2AComp > 0.5) {
      // HelpsController.IsActionHappen = true;
    }

    return {
      imageTopACoff: pos1AComp,
      imageBottomACoff: pos2AComp
    };
  };

  const animatedStyleForTop = useAnimatedStyle(() => {
    const isLumen = signRef.current.sign_type?.sign_type_code === 'lumen';
    let imageTopACoff = 0;

    if (props.featureMode === 'animation' ||
        !isLumen) {
      const angleX = props.normRotationX.value;
      const aCoffs = calculateACoffs(angleX);
      imageTopACoff = aCoffs.imageTopACoff;
    }
    else
    {
      const cfs = calculateCfsForLumen(props.normRotationZ.value);
      imageTopACoff = cfs.imageTopACoff;
    }
    return {
      opacity: imageTopACoff
    };
  });

  const animatedStyleForBottom = useAnimatedStyle(() => {
    const isLumen = signRef.current.sign_type?.sign_type_code === 'lumen';
    let imageBottomACoff = 0;

    if (props.featureMode === 'animation' ||
      !isLumen) {
      const angleX = props.normRotationX.value;
      const aCoffs = calculateACoffs(angleX);
      imageBottomACoff = aCoffs.imageBottomACoff;
    }
    else
    {
      const cfs = calculateCfsForLumen(props.normRotationZ.value);
      imageBottomACoff = cfs.imageBottomACoff;
    }
    return {
      opacity: imageBottomACoff
    };
  });

  if (!signRef.current ||
    !signRef.current?.sign_res1_data ||
    !signRef.current?.sign_res2_data) {
    return null;
  }

  console.log("RotateByXWith2ImagesSign init", signRef.current);

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