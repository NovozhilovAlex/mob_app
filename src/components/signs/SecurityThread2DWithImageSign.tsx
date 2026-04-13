import {StyleSheet, View} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import {Sign, SignRes} from "@/src";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";
import {SharedValue, useAnimatedStyle} from "react-native-reanimated";
import Animated from "react-native-reanimated";

export function SecurityThread2DWithImageSign(props: {
  sign: Sign,
  normRotationX: SharedValue<number>,
  normRotationY: SharedValue<number>,
  banknoteWidth: number,
  banknoteHeight: number
}) {
  const maxAngleX = 30;
  const maxAngleY = 30;

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

  const calculateImageSet1 = (signRes: SignRes, rotationX: number, rotationY: number):
    {
      posX1: number,
      posY1: number
    } => {
    'worklet';

    const pos_x1 = 0;
    const min_x1 = signRes.move_min_x != null ? signRes.move_min_x : 0;
    const max_x1 = signRes.move_max_x != null ? signRes.move_max_x : 0;

    const pos_y1 = 0;
    const min_y1 = signRes.move_min_y != null ? signRes.move_min_y : 0;
    const max_y1 = signRes.move_max_y != null ? signRes.move_max_y : 0;

    const posX1 = rotationX >= 0
      ? pos_x1 + max_x1 * Math.abs(rotationX / maxAngleX)
      : pos_x1 - min_x1 * Math.abs(rotationX / maxAngleX);

    const posY1 = rotationY >= 0
      ? pos_y1 - max_y1 * Math.abs(rotationY / maxAngleY)
      : pos_y1 + min_y1 * Math.abs(rotationY / maxAngleY);

    return {
      posX1: posX1 * 100 / props.banknoteWidth,
      posY1: posY1 * 100 / props.banknoteHeight
    };
  }

  const calculateImageSet2 = (signRes: SignRes, rotationX: number, rotationY: number):
    {
      posX2: number,
      posY2: number
    } => {
    'worklet';

    const pos_x2 = 0;
    const min_x2 = signRes.move_min_x != null ? signRes.move_min_x : 0;
    const max_x2 = signRes.move_max_x != null ? signRes.move_max_x : 0;

    const pos_y2 = 0;
    const min_y2 = signRes.move_min_y != null ? signRes.move_min_y : 0;
    const max_y2 = signRes.move_max_y != null ? signRes.move_max_y : 0;

    // set2
    const posX2 = rotationX >= 0
      ? pos_x2 - min_x2 * Math.abs(rotationX / maxAngleX)
      : pos_x2 + max_x2 * Math.abs(rotationX / maxAngleX);

    const posY2 = rotationY >= 0
      ? pos_y2 + min_y2 * Math.abs(rotationY / maxAngleY)
      : pos_y2 - max_y2 * Math.abs(rotationY / maxAngleY);

    return {
      posX2: posX2 * 100 / props.banknoteWidth,
      posY2: posY2 * 100 / props.banknoteHeight
    }
  }

  const calculateImagesSets = (normRotationX: number, normRotationY: number):
    {
      img1: {
        posX: number,
        posY: number
      }
      img2: {
        posX: number,
        posY: number
      }
    } => {
    'worklet';

    const rotationX = normRotationX > maxAngleX
      ? maxAngleX
      : normRotationX < -maxAngleX
        ? -maxAngleX
        : normRotationX;

    const rotationY = normRotationY > maxAngleY
      ? maxAngleY
      : normRotationY < -maxAngleY
        ? -maxAngleY
        : normRotationY;

    const imageSet1 = calculateImageSet1(signRef.current.sign_res3_data!, rotationX, rotationY);
    const imageSet2 = calculateImageSet2(signRef.current.sign_res4_data!, rotationX, rotationY);

    // if (Math.abs(rotationX / maxAngleX) > 0.5 ||
    //   Math.abs(rotationY / maxAngleY) > 0.5)
    // {
    //   HelpsController.IsActionHappen = true;
    // }

    return {
      img1: {
        posX: imageSet1.posX1,
        posY: imageSet1.posY1,
      },
      img2: {
        posX: imageSet2.posX2,
        posY: imageSet2.posY2,
      }
    };
  }

  const animatedStyleForSet1 = useAnimatedStyle(() => {
    const imagesSets = calculateImagesSets(props.normRotationX.value, props.normRotationY.value);
    const imagePos = imagesSets.img1;

    return {
      transform: [
        {translateX: `${imagePos.posX}%`},
        {translateY: `${imagePos.posY}%`}
      ]
    };
  });

  const animatedStyleForSet2 = useAnimatedStyle(() => {
    const imagesSets = calculateImagesSets(props.normRotationX.value, props.normRotationY.value);
    const imagePos = imagesSets.img2;

    return {
      transform: [
        {translateX: `${imagePos.posX}%`},
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

  console.log("SecurityThread2DWithImageSign init", signRef.current);

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