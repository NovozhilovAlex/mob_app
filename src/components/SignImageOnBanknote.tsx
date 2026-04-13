import {Image, StyleProp, StyleSheet, View, ViewStyle} from "react-native";
import * as React from "react";
import {Sign, SignRes} from "@/src";
import {findImageInMap} from "@/src/utils/imageMap";
import Animated from "react-native-reanimated";

export function SignImageOnBanknote(props: {
  style?: StyleProp<ViewStyle>,
  signRes: SignRes,
  banknoteWidth: number,
  banknoteHeight: number
}) {
  // console.log("SignImageOnBanknote init", props);

  const signImage = findImageInMap(props.signRes.res_path);
  const imageW = props.signRes.width ?? 0;
  const imageH = props.signRes.height ?? 0;
  const imageX = props.signRes.pos_x ?? 0;
  const imageY = props.signRes.pos_y ?? 0;

  const bnkW = props.banknoteWidth ?? 0;
  const bnkH = props.banknoteHeight ?? 0;

  const imageWPercent = (imageW / bnkW) * 100;
  const imageHPercent = (imageH / bnkH) * 100;
  const imageMarginLeftPercent = ((bnkW / 2 + imageX - imageW / 2) / bnkW) * 100;
  const imageMarginTopPercent = ((bnkH / 2 - imageY - imageH / 2) / bnkH) * (bnkH / bnkW) * 100;

  return <Animated.View style={[props.style, styles.absoluteLayout]}>
    <Image source={signImage}
           style={{
             // borderColor:'black',
             // borderWidth:10,
             width: `${imageWPercent}%`,
             height: `${imageHPercent}%`,
             marginLeft: `${imageMarginLeftPercent}%`,
             marginTop: `${imageMarginTopPercent}%`,
           }}></Image>
  </Animated.View>;
}

const styles = StyleSheet.create({
  absoluteLayout:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
});