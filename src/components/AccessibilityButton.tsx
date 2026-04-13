import {StyleSheet, TouchableOpacity} from "react-native";
import {Label} from "@react-navigation/elements";
import {accessibilityStrings} from "@/src/locales/accesibilityStrings";
import React from "react";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function AccessibilityButton(props: { text: string, onPress: () => void, numberOfLines?: number}) {
  const {nightMode} = useAppSettingsStore();
  const buttonColor = nightMode ? '#3A3A3C' : '#E5E5E9';
  const buttonTextColor = nightMode ? '#FFFFFF' : '#00000';

  return <TouchableOpacity onPress={props.onPress}
                           style={[styles.button, {backgroundColor: buttonColor}]}>
    <Label adjustsFontSizeToFit={true}
           numberOfLines={props.numberOfLines ?? 1}
           style={[styles.buttonText, {color: buttonTextColor}]}>
      {props.text}
    </Label>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontSize:50
  }
});