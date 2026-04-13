import {StyleSheet, View} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import {Sign, SignRes} from "@/src";
import {SignImageOnBanknote} from "@/src/components/SignImageOnBanknote";
import {SharedValue, useAnimatedStyle} from "react-native-reanimated";
import Animated from "react-native-reanimated";

export function SecurityThread4DSign(props: {
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

  function calculateACoffToStart(angle: number, start: number, end: number) {
    'worklet';
    const coff = 1.0 - (angle - start) / (end - start);

    if (coff < 0) return 0.0;
    if (coff > 1) return 1.0;

    return coff;
  }

  function calculateACoffToEnd(angle: number, start: number, end: number) {
    'worklet';
    const coff = (angle - start) / (end - start);

    if (coff < 0) return 0.0;
    if (coff > 1) return 1.0;

    return coff;
  }

  const calculateACoffs = (angleX: number):
    {
      topACoff: number,
      bottomACoff: number,
      glossACoff: number
    } => {
    'worklet';

    const changeLayersAngle = maxAngleX / 1.5;
    const layersAngle = (maxAngleX * 2.0 - changeLayersAngle * 2.0);

    const topCoff = 0.2;
    const topStartAngle = -maxAngleX;
    const topEndAngle = topStartAngle + layersAngle * topCoff;

    const bottomCoff = 0.78;
    const bottomStartAngle = topEndAngle + changeLayersAngle;
    const bottomEndAngle = bottomStartAngle + layersAngle * bottomCoff;

    const glossCoff = 0.02;
    const glossStartAngle = bottomEndAngle + changeLayersAngle;
    const glossEndAngle = glossStartAngle + layersAngle * glossCoff;

    let topACoff = 0.0;
    let bottomACoff = 0.0;
    let glossACoff = 0.0;

    if (angleX <= topEndAngle) {
      topACoff = 1.0;
      bottomACoff = 0.0;
      glossACoff = 0.0;
    } else if (angleX > topEndAngle && angleX < bottomStartAngle) {
      topACoff = calculateACoffToStart(angleX, topEndAngle, bottomStartAngle);
      bottomACoff = calculateACoffToEnd(angleX, topEndAngle, bottomStartAngle);
      glossACoff = 0.0;
    } else if (angleX >= bottomStartAngle && angleX <= bottomEndAngle) {
      topACoff = 0.0;
      bottomACoff = 1.0;
      glossACoff = 0.0;
    } else if (angleX > bottomEndAngle && angleX < glossStartAngle) {
      topACoff = 0.0;
      bottomACoff = calculateACoffToStart(angleX, bottomEndAngle, glossStartAngle);
      glossACoff = calculateACoffToEnd(angleX, bottomEndAngle, glossStartAngle);
    } else if (angleX >= glossStartAngle) {
      topACoff = 0.0;
      bottomACoff = 0.0;
      glossACoff = 1.0;
    }

    glossACoff = glossACoff * 0.75;

    return {
      topACoff: topACoff,
      bottomACoff: bottomACoff,
      glossACoff: glossACoff
    };
  };

  const animatedStyleForGroupSetTop = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;
    const aCoffs = calculateACoffs(angleX);
    return {
      opacity: aCoffs.topACoff
    };
  });

  const animatedStyleForGroupSetBottom = useAnimatedStyle(() => {
    const angleX = props.normRotationX.value;
    const aCoffs = calculateACoffs(angleX);
    return {
      opacity: aCoffs.bottomACoff
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

    const posX1 = rotationY >= 0
      ? pos_x1 + max_x1 * Math.abs(rotationY / maxAngleY)
      : pos_x1 - min_x1 * Math.abs(rotationY / maxAngleY);

    const posY1 = rotationX >= 0
      ? pos_y1 + max_y1 * Math.abs(rotationX / maxAngleX)
      : pos_y1 - min_y1 * Math.abs(rotationX / maxAngleX);

    return {
      posX1: posX1 * 100 / props.banknoteWidth,
      posY1: posY1 * 100 / props.banknoteHeight
    };
  }

  const calculateImagesSet1 = (rotationX: number, rotationY: number):
    {
      top1: {
        posX1: number,
        posY1: number
      },
      bottom1: {
        posX1: number,
        posY1: number
      }
    } => {
    'worklet';

    const resultTop1 = calculateImageSet1(signRef.current.sign_res3_data!, rotationX, rotationY);
    const resultBottom1 = calculateImageSet1(signRef.current.sign_res5_data!, rotationX, rotationY);

    return {
      top1: resultTop1,
      bottom1: resultBottom1
    }
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
    const posX2 = rotationY >= 0
      ? pos_x2 - min_x2 * Math.abs(rotationY / maxAngleY)
      : pos_x2 + max_x2 * Math.abs(rotationY / maxAngleY);

    const posY2 = rotationX >= 0
      ? pos_y2 - min_y2 * Math.abs(rotationX / maxAngleX)
      : pos_y2 + max_y2 * Math.abs(rotationX / maxAngleX);

    return {
      posX2: posX2 * 100 / props.banknoteWidth,
      posY2: posY2 * 100 / props.banknoteHeight
    }
  }

  const calculateImagesSet2 = (rotationX: number, rotationY: number):
    {
      top2: {
        posX2: number,
        posY2: number
      },
      bottom2: {
        posX2: number,
        posY2: number
      }
    } => {
    'worklet';

    const resultTop2 = calculateImageSet2(signRef.current.sign_res3_data!, rotationX, rotationY);
    const resultBottom2 = calculateImageSet2(signRef.current.sign_res5_data!, rotationX, rotationY);

    return {
      top2: resultTop2,
      bottom2: resultBottom2
    }
  }

  const calculateImagesSets = (normRotationX: number, normRotationY: number):
    {
      top: {
        img1: {
          posX: number,
          posY: number
        }
        img2: {
          posX: number,
          posY: number
        }
      },
      bottom: {
        img1: {
          posX: number,
          posY: number
        }
        img2: {
          posX: number,
          posY: number
        }
      },
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

    const imagesSet1 = calculateImagesSet1(rotationX, rotationY);
    const imagesSet2 = calculateImagesSet2(rotationX, rotationY);

    // if (Math.abs(rotationX / maxAngleX) > 0.5 ||
    //   Math.abs(rotationY / maxAngleY) > 0.5)
    // {
    //   HelpsController.IsActionHappen = true;
    // }

    return {
      top: {
        img1: {
          posX: imagesSet1.top1.posX1,
          posY: imagesSet1.top1.posY1,
        },
        img2: {
          posX: imagesSet2.top2.posX2,
          posY: imagesSet2.top2.posY2,
        }
      },
      bottom: {
        img1: {
          posX: imagesSet1.bottom1.posX1,
          posY: imagesSet1.bottom1.posY1,
        },
        img2: {
          posX: imagesSet2.bottom2.posX2,
          posY: imagesSet2.bottom2.posY2,
        }
      }
    };
  }

  const animatedStyleForSetTop1 = useAnimatedStyle(() => {
    const imagesSets = calculateImagesSets(props.normRotationX.value, props.normRotationY.value);
    const imagePos = imagesSets.top.img1;

    return {
      transform: [
        {translateX: `${imagePos.posX}%`},
        {translateY: `${imagePos.posY}%`}
      ]
    };
  });

  const animatedStyleForSetTop2 = useAnimatedStyle(() => {
    const imagesSets = calculateImagesSets(props.normRotationX.value, props.normRotationY.value);
    const imagePos = imagesSets.top.img2;

    return {
      transform: [
        {translateX: `${imagePos.posX}%`},
        {translateY: `${imagePos.posY}%`}
      ]
    };
  });

  const animatedStyleForSetBottom1 = useAnimatedStyle(() => {
    const imagesSets = calculateImagesSets(props.normRotationX.value, props.normRotationY.value);
    const imagePos = imagesSets.bottom.img1;

    return {
      transform: [
        {translateX: `${imagePos.posX}%`},
        {translateY: `${imagePos.posY}%`}
      ]
    };
  });

  const animatedStyleForSetBottom2 = useAnimatedStyle(() => {
    const imagesSets = calculateImagesSets(props.normRotationX.value, props.normRotationY.value);
    const imagePos = imagesSets.bottom.img2;

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
    !signRef.current?.sign_res5_data ||
    !signRef.current?.sign_res6_data ||
    !signRef.current?.sign_res7_data) {
    return null;
  }

  console.log("SecurityThread4DSign init", signRef.current);

  return (
    <View style={[styles.absoluteLayout]}>

      {/*BG*/}
      <SignImageOnBanknote signRes={signRef.current.sign_res1_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      {/*SetTop*/}
      <Animated.View style={[animatedStyleForGroupSetTop, styles.absoluteLayout]}>
        <SignImageOnBanknote style={animatedStyleForSetTop1}
                             signRes={signRef.current.sign_res3_data!}
                             banknoteWidth={props.banknoteWidth}
                             banknoteHeight={props.banknoteHeight}/>
        <SignImageOnBanknote style={animatedStyleForSetTop2}
                             signRes={signRef.current.sign_res4_data!}
                             banknoteWidth={props.banknoteWidth}
                             banknoteHeight={props.banknoteHeight}/>
      </Animated.View>

      {/*SetBottom*/}
      <Animated.View style={[animatedStyleForGroupSetBottom, styles.absoluteLayout]}>
        <SignImageOnBanknote style={animatedStyleForSetBottom1}
                             signRes={signRef.current.sign_res5_data!}
                             banknoteWidth={props.banknoteWidth}
                             banknoteHeight={props.banknoteHeight}/>
        <SignImageOnBanknote style={animatedStyleForSetBottom2}
                             signRes={signRef.current.sign_res6_data!}
                             banknoteWidth={props.banknoteWidth}
                             banknoteHeight={props.banknoteHeight}/>
      </Animated.View>

      {/*/!*<Mask>*!/*/}
      <SignImageOnBanknote signRes={signRef.current.sign_res2_data!}
                           banknoteWidth={props.banknoteWidth}
                           banknoteHeight={props.banknoteHeight}/>

      {/*/!*Gloss*!/*/}
      <SignImageOnBanknote style={animatedStyleForGloss}
                           signRes={signRef.current.sign_res7_data!}
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