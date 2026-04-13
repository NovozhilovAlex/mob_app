import {LayoutChangeEvent, View} from "react-native";
import React, {useState} from "react";
import {SignRes} from "@/src";

export function SignPartComponent(props: {
  signRes: SignRes,
  banknoteWidth: number,
  banknoteHeight: number,
  insideView: (size: {
    width: number;
    height: number;
  }) => React.ReactNode
}) {

  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const bnkW = props.banknoteWidth ?? 0;
  const bnkH = props.banknoteHeight ?? 0;

  const imageW = props.signRes.width ?? 0;
  const imageH = props.signRes.height ?? 0;
  const imageX = props.signRes.pos_x ?? 0;
  const imageY = props.signRes.pos_y ?? 0;
  const imageWPercent = (imageW / bnkW) * 100;
  const imageHPercent = (imageH / bnkH) * 100;
  const imageMarginLeftPercent = ((bnkW / 2 + imageX - imageW / 2) / bnkW) * 100;
  const imageMarginTopPercent = ((bnkH / 2 - imageY - imageH / 2) / bnkH) * (bnkH / bnkW) * 100;

  return <View onLayout={onLayout}
               style={{
                 position: "absolute",
                 width: `${imageWPercent}%`,
                 height: `${imageHPercent}%`,
                 marginLeft: `${imageMarginLeftPercent}%`,
                 marginTop: `${imageMarginTopPercent}%`
               }}>
    {props.insideView({width: size.width, height: size.height})}
  </View>;
}