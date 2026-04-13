import {StatusBar, View} from "react-native";
import React, {useCallback} from "react";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {useFocusEffect} from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import {OrientationLock} from "expo-screen-orientation";
import {useIsFocused} from "@react-navigation/native";

export default function StatusBarConfig(props: {
  style?: 'dark-text' | 'light-text'
}) {

  const {nightMode} = useAppSettingsStore();
  const isFocused = useIsFocused();

  return <View style={{
    position: 'absolute'
  }}>
    {
      isFocused
        ? (<StatusBar barStyle = {props.style
          ? (
            props.style === 'dark-text'
              ? 'dark-content'
              : 'light-content'
          )
          : (
            nightMode
              ? 'light-content'
              : 'dark-content'
          )
          }/>)
        : (null)
    }
  </View>;
}
