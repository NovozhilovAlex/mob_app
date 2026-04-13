import React from "react";
import {Image, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import Svg, {Defs, Rect, Stop} from "react-native-svg";
import {RadialGradient as SVGRadialGradient} from "react-native-svg/lib/typescript/elements";
import {Color, RadialGradient} from "@/src/components/RadialGradient";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
export default function FullScreenGradient() {
  const {nightMode} = useAppSettingsStore();
    return <View style={StyleSheet.absoluteFillObject}>
      <RadialGradient
        colorList={[
          {offset: '0%', color: nightMode ? '#224A59' : '#6DC3C7', opacity: '1'},
          {offset: '100%', color: nightMode ? '#235162' : '#478D9C', opacity: '1'}
        ]}
        x="50%"
        y="50%"
        rx="50%"  // уже по горизонтали
        ry="50%"  // вытянут по вертикали
      />
    </View>;
}