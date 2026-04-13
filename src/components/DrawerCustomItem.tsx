import {Image, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {AppColors} from "@/src/constants/appColors";
import React from "react";
import {useAppSettingsStore} from "@/src/services/AppSettingsService";


export default function DrawerCustomItem(props: { onPress: () => void, icon: any, text: string }) {
  const {nightMode} = useAppSettingsStore();

  return <TouchableOpacity
    style={{
      height: 70,
      alignItems: "center",
      justifyContent: "flex-start",
      flexDirection: "row"
    }}
    onPress={props.onPress}
    activeOpacity={0.5}>

    <View style={styles.iconContainer}>
      <Image
        source={props.icon}
        tintColor={nightMode ? AppColors.dark.textColor : AppColors.light.textColor}
        style={styles.icon}
        resizeMode="contain"
      />
    </View>

    <Text style={{
      fontSize: 18,
      fontWeight: 600,
      color: nightMode ? AppColors.dark.textColor : AppColors.light.textColor,
    }}>{props.text}</Text>

  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    width: 35,
    height: 35
  }
})