import {StyleSheet, TouchableOpacity, View} from "react-native";
import React from "react";
import AccessibilityButton from "@/src/components/AccessibilityButton";

export default function AccessibilityButtonWithMargin(props: { text: string, onPress: () => void, numberOfLines?: number}) {
  return <View style={{marginHorizontal:10, marginVertical:5}}>
    <AccessibilityButton text={props.text} onPress={props.onPress} numberOfLines={props.numberOfLines}/>
  </View>
}