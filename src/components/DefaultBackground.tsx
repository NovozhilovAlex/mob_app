import {useAppSettingsStore} from "@/src/services/AppSettingsService";
import {View} from "react-native";
import {AppColors} from "@/src/constants/appColors";
import React from "react";

export function DefaultBackground() {
  const {nightMode} = useAppSettingsStore();
  return <View style={[
    {
      flex: 1,
      backgroundColor: nightMode ? AppColors.dark.bgColor : AppColors.light.bgColor
    }
  ]}/>;
}