import {StyleSheet, View} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import {Sign, SignRes} from "@/src";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";
import {SharedValue, useAnimatedStyle} from "react-native-reanimated";
import Animated from "react-native-reanimated";

export function SecurityThread1DWithImageSign(props: {
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

  const animatedStyleForSets = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;
    const aCoffs = calculateACoffs(angleX);
    return {
      opacity: aCoffs.setACoff
    };
  });

  const animatedStyleForGloss = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;
    const aCoffs = calculateACoffs(angleX);
    return {
      opacity: aCoffs.glossACoff
    };
  });

  const calculateImageSet1 = (signRes: SignRes, rotationX: number):
    {
      posY1: number
    } => {
    'worklet';

    const pos_y1 = 0;
    const min_y1 = signRes.move_min_y != null ? signRes.move_min_y : 0;
    const max_y1 = signRes.move_max_y != null ? signRes.move_max_y : 0;

    const posY1 = rotationX >= 0
      ? pos_y1 - max_y1 * Math.abs(rotationX / maxAngleX)
      : pos_y1 + min_y1 * Math.abs(rotationX / maxAngleX);

    return {
      posY1: posY1 * 100 / props.banknoteHeight
    };
  }

  const calculateImageSet2 = (signRes: SignRes, rotationX: number):
    {
      posY2: number
    } => {
    'worklet';

    const pos_y2 = 0;
    const min_y2 = signRes.move_min_y != null ? signRes.move_min_y : 0;
    const max_y2 = signRes.move_max_y != null ? signRes.move_max_y : 0;

    const posY2 = rotationX >= 0
      ? pos_y2 + min_y2 * Math.abs(rotationX / maxAngleX)
      : pos_y2 - max_y2 * Math.abs(rotationX / maxAngleX);

    return {
      posY2: posY2 * 100 / props.banknoteHeight
    }
  }

  const calculateImagesSets = (normRotationX: number):
    {
      img1: {
        posY: number
      }
      img2: {
        posY: number
      }
    } => {
    'worklet';

    const rotationX = normRotationX > maxAngleX
      ? maxAngleX
      : normRotationX < -maxAngleX
        ? -maxAngleX
        : normRotationX;

    const imageSet1 = calculateImageSet1(signRef.current.sign_res3_data!, rotationX);
    const imageSet2 = calculateImageSet2(signRef.current.sign_res4_data!, rotationX);

    // if (Math.abs(rotationX / maxAngleX) > 0.5 ||
    //   Math.abs(rotationY / maxAngleY) > 0.5)
    // {
    //   HelpsController.IsActionHappen = true;
    // }

    return {
      img1: {
        posY: imageSet1.posY1,
      },
      img2: {
        posY: imageSet2.posY2,
      }
    };
  }

  const animatedStyleForSet1 = useAnimatedStyle(() => {
    const imagesSets = calculateImagesSets(props.normRotationX.value);
    const imagePos = imagesSets.img1;

    return {
      transform: [
        {translateY: `${imagePos.posY}%`}
      ]
    };
  });

  const animatedStyleForSet2 = useAnimatedStyle(() => {
    const imagesSets = calculateImagesSets(props.normRotationX.value);
    const imagePos = imagesSets.img2;

    return {
      transform: [
        {translateY: `${imagePos.posY}%`}
      ]
    };
  });

  if (!signRef.current ||
    !signRef.current?.sign_res1_data ||
    !signRef.current?.sign_res2_data ||
    !signRef.current?.sign_res3_data ||
    !signRef.current?.sign_res4_data ||
    !signRef.current?.sign_res5_data) {
    return null;
  }

  console.log("SecurityThread1DWithImageSign init", signRef.current);

  return (
    <View style={[styles.absoluteLayout]}>

      {/*BG*/}
      <SignImageOnBanknote signRes={signRef.current.sign_res1_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      {/*Set*/}
      <Animated.View style={[animatedStyleForSets, styles.absoluteLayout]}>

        {/*Set1*/}
        <SignImageOnBanknote style={animatedStyleForSet1}
                             signRes={signRef.current.sign_res3_data!}
                             banknoteWidth={props.banknoteWidth}
                             banknoteHeight={props.banknoteHeight}/>
        {/*Set2*/}
        <SignImageOnBanknote style={animatedStyleForSet2}
                             signRes={signRef.current.sign_res4_data!}
                             banknoteWidth={props.banknoteWidth}
                             banknoteHeight={props.banknoteHeight}/>

      </Animated.View>

      {/*Gloss*/}
      <SignImageOnBanknote style={animatedStyleForGloss}
                           signRes={signRef.current.sign_res5_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      {/*<Mask>*/}
      <SignImageOnBanknote signRes={signRef.current.sign_res2_data!}
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